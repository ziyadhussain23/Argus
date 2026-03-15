import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, getToken, setToken, removeToken } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const token = getToken();
    const storedUser = localStorage.getItem('argus_user');
    
    if (token && storedUser) {
      try {
        // Check if JWT token is expired
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          // Token expired — clean up
          removeToken();
          localStorage.removeItem('argus_user');
        } else {
          setUser(JSON.parse(storedUser));
        }
      } catch {
        removeToken();
        localStorage.removeItem('argus_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, userData: User) => {
    setToken(token);
    localStorage.setItem('argus_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    removeToken();
    localStorage.removeItem('argus_user');
    setUser(null);
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
