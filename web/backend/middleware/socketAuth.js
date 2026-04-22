// FILE: middleware/socketAuth.js
const jwt = require("jsonwebtoken");

/**
 * Socket.io authentication middleware
 * Validates JWT token from socket handshake and attaches user info to socket
 *
 * Usage:
 *   io.use(socketAuth);
 *
 * Client must send token in handshake:
 *   io('url', { auth: { token: 'jwt_token' } })
 */
module.exports = (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    console.warn(`⚠️ Socket connection attempt without token: ${socket.id}`);
    return next(new Error("Authentication required"));
  }

  try {
    // Trim token in case of whitespace
    const cleanToken = String(token).trim();
    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);

    // Validate token expiry (redundant but safe)
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      console.warn(`⚠️ Expired token for socket: ${socket.id}`);
      return next(new Error("Token expired"));
    }

    // Attach user info to socket for authorization checks
    // The token payload from auth.js uses 'id', but some parts might use 'userId'
    socket.userId = decoded.id || decoded.userId;
    socket.userRole = decoded.role;
    socket.userEmail = decoded.email || null;

    if (!socket.userId) {
      console.warn("⚠️ Authenticated socket missing userId in payload:", decoded);
      return next(new Error("Invalid token payload"));
    }

    console.log(
      `✅ Socket authenticated: ${socket.id} (User: ${socket.userId}, Role: ${socket.userRole})`,
    );
    next();
  } catch (err) {
    console.error(`❌ Socket authentication failed for ${socket.id}:`, err.message);
    // Return more specific error to client during development/debugging
    next(new Error(`Authentication failed: ${err.message}`));
  }
};
