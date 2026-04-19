/**
 * VerifyOTPScreen.js — CureVirtual Mobile
 * Dedicated screen for 6-digit OTP verification.
 */

import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY } from '../../../theme/designSystem';

const logo = require('../../../assets/images/logo.png');

export default function VerifyOTPScreen({ route, navigation }) {
  const { email, userData } = route.params || {};
  const [otpToken, setOtpToken] = useState('');
  const { verifyOTP, resendOTP, loading } = useContext(AuthContext);

  useEffect(() => {
    if (!email) {
      Alert.alert('Error', 'No email provided for verification.');
      navigation.goBack();
    }
  }, [email]);

  const handleVerifyOtp = async () => {
    if (!otpToken.trim() || otpToken.length < 6) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP code.');
      return;
    }

    const result = await verifyOTP(email, otpToken, userData, false);
    
    if (!result.success) {
      Alert.alert('Verification Failed', result.error || 'Please check your OTP and try again.');
    } else {
      // AuthContext handles state change (setUser), which triggers navigation to Dashboard
      Alert.alert('✅ Verified!', 'Your account has been successfully verified.');
    }
  };

  const handleResendOtp = async () => {
    const result = await resendOTP(email);
    if (result.success || result.message) {
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
    } else {
      Alert.alert('Error', result.error || 'Failed to resend code.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.orbTopRight} />
      <View style={styles.orbBottomLeft} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Brand Header ── */}
          <View style={styles.brandContainer}>
             <View style={styles.otpLogoRow}>
                <Image source={logo} style={styles.otpLogo} resizeMode="contain" />
                <Text style={styles.otpBrandTitle}>CUREVIRTUAL</Text>
             </View>
             <Text style={styles.brandName}>
               VERIFY <Text style={styles.brandNameBlue}>ACCOUNT</Text>
             </Text>
             <Text style={styles.subtitle}>Enter the 6-digit code sent to your email.</Text>
          </View>

          {/* ── Card ── */}
          <View style={styles.card}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                OTP SENT TO {email?.toUpperCase()}
              </Text>
              <View style={styles.inputWithIcon}>
                <Text style={styles.inputIcon}>🛡️</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123456"
                  placeholderTextColor={COLORS.textPlaceholder}
                  value={otpToken}
                  onChangeText={setOtpToken}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.primaryButtonText}>VERIFY ACCOUNT →</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.resendLink}
              onPress={handleResendOtp}
              disabled={loading}
            >
              <Text style={styles.resendLinkText}>DIDN'T RECEIVE A CODE? <Text style={styles.resendActionText}>RESEND</Text></Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>ENTERED WRONG EMAIL? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.footerLink}>CHANGE EMAIL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  orbTopRight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.brandGreen,
    opacity: 0.08,
  },
  orbBottomLeft: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: COLORS.brandBlue,
    opacity: 0.07,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.xl,
  },
  brandContainer: {
    marginBottom: SPACING.xl,
    marginTop: SPACING.xl,
  },
  otpLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  otpLogo: {
    width: 28,
    height: 28,
    marginRight: 10,
  },
  otpBrandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0066FF',
    letterSpacing: 0.5,
  },
  brandName: {
    fontSize: 42,
    fontWeight: '900',
    color: '#000',
    letterSpacing: -1,
    lineHeight: 48,
  },
  brandNameBlue: {
    color: COLORS.brandGreen,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.textMuted,
    marginTop: 8,
    fontWeight: '500',
  },
  card: {
    backgroundColor: COLORS.white,
    marginTop: SPACING.md,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.brandGreen,
    letterSpacing: 1.2,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgInput,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingLeft: 16,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 18,
    color: COLORS.textMain,
    fontWeight: '700',
    letterSpacing: 2,
  },
  primaryButton: {
    backgroundColor: '#0066FF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#0066FF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  resendLink: {
    alignItems: 'center',
    marginVertical: 24,
  },
  resendLinkText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  resendActionText: {
    color: '#0066FF',
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 30,
    marginTop: 10,
  },
  footerText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  footerLink: {
    color: '#F97316',
    fontSize: 14,
    fontWeight: '900',
  },
});
