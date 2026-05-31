import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { refreshToken as apiRefreshToken } from "../api/auth";

const AuthContext = createContext(null);

const STORAGE_KEYS = {
  ACCESS: "hrs_access",
  REFRESH: "hrs_refresh",
  USER: "hrs_user",
};

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem(STORAGE_KEYS.ACCESS));
  const [refreshTokenVal, setRefreshTokenVal] = useState(() => localStorage.getItem(STORAGE_KEYS.REFRESH));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  });

  const isAuthenticated = !!accessToken;

  /** Persist tokens + user to localStorage */
  const saveSession = useCallback((access, refresh, userData) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS, access);
    localStorage.setItem(STORAGE_KEYS.REFRESH, refresh);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    setAccessToken(access);
    setRefreshTokenVal(refresh);
    setUser(userData);
  }, []);

  /** Clear session on logout */
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS);
    localStorage.removeItem(STORAGE_KEYS.REFRESH);
    localStorage.removeItem(STORAGE_KEYS.USER);
    // Keep "remember me" email if set
    setAccessToken(null);
    setRefreshTokenVal(null);
    setUser(null);
  }, []);

  /**
   * Silently refresh the access token using the stored refresh token.
   * Called automatically when the app mounts if a refresh token exists.
   */
  const silentRefresh = useCallback(async () => {
    if (!refreshTokenVal) return;
    try {
      const data = await apiRefreshToken(refreshTokenVal);
      localStorage.setItem(STORAGE_KEYS.ACCESS, data.access);
      setAccessToken(data.access);
    } catch {
      // Refresh token expired — force logout
      logout();
    }
  }, [refreshTokenVal, logout]);

  // On first mount, attempt a silent token refresh so the session survives page reloads
  useEffect(() => {
    silentRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{ accessToken, refreshTokenVal, user, isAuthenticated, saveSession, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Hook to consume auth context */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
