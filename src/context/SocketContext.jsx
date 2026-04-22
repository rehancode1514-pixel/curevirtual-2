import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

import { SocketContext } from "./useSocket";
import api from "../Lib/api";
import { supabase } from "../Lib/supabase";

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState("disconnected"); // 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Derive socket URL from API base URL (strip /api suffix)
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
  const backendUrl = apiBaseUrl.replace(/\/api\/?$/, "");

  useEffect(() => {
    // Get user info from localStorage
    const userId = localStorage.getItem("userId");
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("userName") || localStorage.getItem("name") || "User";
    const token = localStorage.getItem("token"); // JWT token for authentication

    if (!userId || !role || !token) {
      console.warn("⚠️ No user credentials or token found. Socket connection delayed.");
      return;
    }

    setConnectionState("connecting");

    // Initialize socket connection with JWT auth
    const newSocket = io(backendUrl, {
      withCredentials: true,
      transports: ["websocket"], // 👈 FORCE WEBSOCKET
      auth: {
        token: token, // JWT authentication
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: maxReconnectAttempts,
    });

    // Connection successful
    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
      setIsConnected(true);
      setConnectionState("connected");
      reconnectAttempts.current = 0;

      // Register user with the server
      newSocket.emit("user_online", {
        userId,
        role,
        name,
      });
    });

    // Connection error
    newSocket.on("connect_error", async (error) => {
      console.error("❌ Socket connection error:", error.message);

      // Handle JWT Expiration
      if (error.message === "jwt expired" || error.message === "Authentication required") {
        console.log("🔄 Socket token expired, attempting refresh...");

        try {
          // 1. Get fresh Supabase session
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (sessionError || !session) {
            console.error("❌ Supabase session lost. Redirecting to login.");
            localStorage.clear();
            window.location.href = "/login";
            return;
          }

          // 2. Sync with backend to get a new legacy JWT
          const userEmail = localStorage.getItem("email");
          const res = await api.post("/auth/login-sync", {
            email: userEmail,
            supabaseId: session.user.id,
            supabaseAccessToken: session.access_token,
          });

          const newToken = res.data.token;

          if (newToken) {
            console.log("✅ Socket token refreshed successfully. Reconnecting...");
            localStorage.setItem("token", newToken);

            // 3. Update socket auth and manually reconnect
            newSocket.auth.token = newToken;
            newSocket.connect();
            return; // Exit to avoid setting state to reconnecting prematurely
          }
        } catch (refreshErr) {
          console.error("❌ Failed to refresh socket token:", refreshErr);
          // If refresh fails, we might want to logout
        }
      }

      setIsConnected(false);
      setConnectionState("reconnecting");
    });

    // Reconnect attempt
    newSocket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}/${maxReconnectAttempts}`);
      setConnectionState("reconnecting");
      reconnectAttempts.current = attemptNumber;
    });

    // Reconnect successful
    newSocket.on("reconnect", (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      setConnectionState("connected");
      reconnectAttempts.current = 0;

      // Re-register user
      newSocket.emit("user_online", {
        userId,
        role,
        name,
      });
    });

    // Reconnect failed
    newSocket.on("reconnect_failed", () => {
      console.error("❌ Reconnection failed after maximum attempts");
      setIsConnected(false);
      setConnectionState("disconnected");
    });

    // Disconnected
    newSocket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      setIsConnected(false);
      if (reason === "io server disconnect") {
        // Server disconnected us, need to manually reconnect
        newSocket.connect();
      }
      setConnectionState("disconnected");
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [backendUrl]);

  const contextValue = {
    socket,
    isConnected,
    connectionState,
  };

  return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>;
};
