import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { User, getToken, setToken, removeToken } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'argus_user';
const UNAUTHORIZED_EVENT = 'argus:unauthorized';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    // JWT payload uses base64url, so normalize before decoding.
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function getTokenExpiryMs(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const exp = payload.exp;
  if (typeof exp !== 'number') return null;
  return exp * 1000;
}

function isTokenExpired(token: string): boolean {
  const expMs = getTokenExpiryMs(token);
  if (!expMs) {
    // If we cannot read token expiry, consider the token invalid for safety.
    return true;
  }
  return expMs <= Date.now();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const logoutTimeoutRef = useRef<number | null>(null);

  const clearLogoutTimer = useCallback(() => {
    if (logoutTimeoutRef.current !== null) {
      window.clearTimeout(logoutTimeoutRef.current);
      logoutTimeoutRef.current = null;
    }
  }, []);

  const clearAuthState = useCallback(() => {
    removeToken();
    localStorage.removeItem(AUTH_USER_KEY);
    setUser(null);
  }, []);

  const scheduleExpiryLogout = useCallback(
    (token: string) => {
      clearLogoutTimer();

      const expMs = getTokenExpiryMs(token);
      if (!expMs) {
        clearAuthState();
        return;
      }

      const timeUntilExpiry = expMs - Date.now();
      if (timeUntilExpiry <= 0) {
        clearAuthState();
        return;
      }

      logoutTimeoutRef.current = window.setTimeout(() => {
        clearAuthState();
      }, timeUntilExpiry);
    },
    [clearAuthState, clearLogoutTimer]
  );

  useEffect(() => {
    // Restore session from storage if token is still valid.
    const token = getToken();
    const storedUser = localStorage.getItem(AUTH_USER_KEY);

    if (token && storedUser) {
      try {
        if (isTokenExpired(token)) {
          clearAuthState();
        } else {
          setUser(JSON.parse(storedUser));
          scheduleExpiryLogout(token);
        }
      } catch {
        clearAuthState();
      }
    }

    const handleUnauthorized = () => {
      clearLogoutTimer();
      clearAuthState();
    };

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);

    setIsLoading(false);
    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
      clearLogoutTimer();
    };
  }, [clearAuthState, clearLogoutTimer, scheduleExpiryLogout]);

  const login = (token: string, userData: User) => {
    clearLogoutTimer();

    if (isTokenExpired(token)) {
      clearAuthState();
      return;
    }

    setToken(token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
    setUser(userData);
    scheduleExpiryLogout(token);
  };

  const logout = () => {
    clearLogoutTimer();
    clearAuthState();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
