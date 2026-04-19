/**
 * AuthContext.js — Global authentication state for CureVirtual Mobile
 *
 * Provides:
 *   - user       → current logged-in user object (includes role, name, id)
 *   - loading    → true while checking localStorage or during auth action
 *   - login()    → Supabase + backend sync
 *   - register() → Supabase signup + backend profile creation
 *   - logout()   → clear all state and storage
 *
 * Also registers the logout function with the API interceptor so that
 * a 401 response from any API call auto-logs the user out.
 */

import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  loginWithEmail, 
  registerUser, 
  logoutSupabase, 
  extractError, 
  verifySignupOTP, 
  resendOTP as resendOTPApi,
  updateUserProfile 
} from '../services/authService';
import { registerLogoutHandler } from '../services/api';
import socketService from '../services/socket';
import { getDeviceTimezone } from '../utils/timezones';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [userTimezone, setUserTimezone] = useState('auto'); // Preference ('auto' or IANA string)
  const [synced, setSynced] = useState(false);

  // Memoized resolved timezone (if 'auto' -> use device TZ, else use preference)
  const resolvedTimezone = useMemo(() => {
    if (userTimezone === 'auto' || !userTimezone) {
      return getDeviceTimezone();
    }
    return userTimezone;
  }, [userTimezone]);

  // Helper to init socket
  const initSocketFlow = (u) => {
    if (u?.id && u?.role) {
      socketService.connect(u.id, u.role, u.name || `${u.firstName} ${u.lastName}`);
    }
  };

  // ─────────────────────────────────────────────────────────
  // On mount: restore session from AsyncStorage
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedUser = await AsyncStorage.getItem('userData');

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          initSocketFlow(parsedUser);
        }

        const storedTz = await AsyncStorage.getItem('userTimezone');
        if (storedTz) {
          setUserTimezone(storedTz);
        }
      } catch (error) {
        console.error('[AuthContext] Failed to load stored session:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    loadStorageData();
  }, []);

  // ─────────────────────────────────────────────────────────
  // ✅ AUTO-SYNC TIMEZONE: 
  // If user is logged in but their TZ is still 'UTC' (the default),
  // we try to sync it with their device timezone automatically.
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const syncTimezone = async () => {
      if (!user?.id || loading || isInitializing || synced) return;
      
      // Set flag immediately to prevent re-entrant calls
      setSynced(true);

      // If user timezone is explicitly 'UTC' or missing, it's likely the default.
      // We should detect device timezone and sync it.
      // Force sync if the timezone is specifically 'UTC' or missing
      // Force sync if the timezone is specifically 'UTC' or missing
      if (userTimezone === 'UTC' || !userTimezone) {
        const deviceTz = getDeviceTimezone();
        
        if (deviceTz !== 'UTC' || userTimezone === 'UTC') { 
          console.log(`[AuthContext] 🕒 Auto-syncing TZ from '${userTimezone || 'NONE'}' to '${deviceTz}'`);
          await updateUserTimezone(deviceTz);
          console.log('[AuthContext] Timezone successfully synced to backend.');
        }
      }
    };

    // Delay slightly to ensure user object is fully populated from storage
    const timer = setTimeout(syncTimezone, 2000);
    return () => clearTimeout(timer);
  }, [user?.id, userTimezone, isInitializing, loading, user, user?.role, synced, updateUserTimezone]);

  // ─────────────────────────────────────────────────────────
  // Register logout handler with API interceptor once
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    registerLogoutHandler(() => {
      setUser(null);
      socketService.disconnect();
      console.log('[AuthContext] Auto-logout triggered by 401 response');
    });
  }, []);

  // ─────────────────────────────────────────────────────────
  // Login
  // ─────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      const { user: loggedInUser, token } = await loginWithEmail(email, password);

      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      initSocketFlow(loggedInUser);

      // ✅ Pick up timezone preference from backend profile
      if (loggedInUser.timezone) {
        setUserTimezone(loggedInUser.timezone);
        await AsyncStorage.setItem('userTimezone', loggedInUser.timezone);
      }

      console.log('[AuthContext] Login successful:', loggedInUser.role);
      return { success: true };
    } catch (error) {
      const message = extractError(error);
      console.error('[AuthContext] Login failed:', message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      const result = await registerUser(userData);

      if (result.token && result.user) {
        await AsyncStorage.setItem('userToken', result.token);
        await AsyncStorage.setItem('userData', JSON.stringify(result.user));
        setUser(result.user);
        initSocketFlow(result.user);
      }

      if (result.requiresVerification) {
        return {
          success: true,
          requiresVerification: true,
          message: 'Registration successful! Please check your email to verify your account.',
        };
      }

      console.log('[AuthContext] Registration successful:', result.user?.role);
      return { success: true };
    } catch (error) {
      const message = extractError(error);
      console.error('[AuthContext] Registration failed:', message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOTP = useCallback(async (email, otp, userData, skipAutoLogin = false) => {
    try {
      setLoading(true);
      const result = await verifySignupOTP(email, otp, userData);
      
      if (!skipAutoLogin && result.token && result.user) {
        await AsyncStorage.setItem('userToken', result.token);
        await AsyncStorage.setItem('userData', JSON.stringify(result.user));
        setUser(result.user);
        initSocketFlow(result.user);
      }
      return { success: true };
    } catch (error) {
      const message = extractError(error);
      console.error('[AuthContext] Verification failed:', message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const resendOTP = useCallback(async (email) => {
    try {
      setLoading(true);
      await resendOTPApi(email);
      return { success: true };
    } catch (error) {
      const message = extractError(error);
      console.error('[AuthContext] Resend OTP failed:', message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await logoutSupabase();
      await AsyncStorage.multiRemove(['userToken', 'userData', 'userTimezone']);
      setUser(null);
      setUserTimezone('auto');
      socketService.disconnect();
      console.log('[AuthContext] Logout successful');
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
      setUser(null);
      socketService.disconnect();
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Sync a partial or full user object to state and storage.
   * Useful when profile is updated in other screens.
   */
  const updateUser = useCallback(async (updates) => {
    if (!user) return;
    try {
      // 🛡️ SECURITY: Prevent profile-level IDs from overwriting the global User ID
      // backend updates often return an object with its own 'id' (the Profile ID).
      const { id, role, ...safeUpdates } = updates;
      
      const newUser = { ...user, ...safeUpdates };

      // Optional: Log if someone tried to shadow the ID
      if (id && id !== user.id) {
        console.log('[AuthContext] 🛡️ Guarded against ID shadowing. User ID:', user.id, 'Target ID:', id);
      }

      setUser(newUser);
      await AsyncStorage.setItem('userData', JSON.stringify(newUser));

      // Also sync timezone preference if it's in the update
      if (updates.timezone) {
        setUserTimezone(updates.timezone);
        await AsyncStorage.setItem('userTimezone', updates.timezone);
      }
      return newUser;
    } catch (err) {
      console.error('[AuthContext] updateUser failed:', err);
    }
  }, [user]);

  const updateUserTimezone = useCallback(async (tz, skipBackendSync = false) => {
    try {
      setUserTimezone(tz);
      await AsyncStorage.setItem('userTimezone', tz);

      // SYNC: Ensure the main user object also reflects this change immediately
      if (user) {
        await updateUser({ timezone: tz });
      }
      
      // If logged in, also update the backend profile unless skipped (e.g. already saved by profile update)
      if (!skipBackendSync && user?.id && user?.role) {
        await updateUserProfile(user.id, { timezone: tz }, user.role);
        console.log('[AuthContext] Timezone synced to backend:', tz);
      }
    } catch (err) {
      console.error('[AuthContext] Failed to sync timezone:', err.message);
    }
  }, [user, updateUser]);

  const contextValue = useMemo(() => ({
    user,
    loading,
    isInitializing,
    login,
    register,
    verifyOTP,
    resendOTP,
    logout,
    userTimezone,
    resolvedTimezone,
    updateUser,
    updateUserTimezone
  }), [user, loading, isInitializing, login, register, verifyOTP, resendOTP, logout, userTimezone, resolvedTimezone, updateUser, updateUserTimezone]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Simple custom hook to use the AuthContext
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

