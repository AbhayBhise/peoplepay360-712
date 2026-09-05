import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Role } from '../types';
import { authApi } from '../api/auth';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  hasRole: (requiredRole: Role | Role[]) => boolean;
  isHRMPlus: () => boolean;
  isHRPUPlus: () => boolean;
  isHRPMPlus: () => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'peoplepay_token';
const USER_KEY = 'peoplepay_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate session on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        try {
          const currentUser = await authApi.getMe();
          setUser(currentUser);
          localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
        } catch {
          // Token invalid or backend restarted
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await authApi.login({ email, password });
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    return res.user;
  };

  const logout = async () => {
    try {
      if (token) {
        await authApi.logout();
      }
    } catch {
      // Ignore error on logout
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  };

  const hasRole = useCallback(
    (requiredRoles: Role | Role[]): boolean => {
      if (!user || !user.roles) return false;
      const rolesToCheck = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      if (user.roles.includes('Admin')) return true;
      return rolesToCheck.some((r) => user.roles.includes(r));
    },
    [user]
  );

  const isHRMPlus = useCallback(() => {
    return hasRole(['Admin', 'HR Payroll Manager', 'HR Payroll User', 'HR Manager']);
  }, [hasRole]);

  const isHRPUPlus = useCallback(() => {
    return hasRole(['Admin', 'HR Payroll Manager', 'HR Payroll User']);
  }, [hasRole]);

  const isHRPMPlus = useCallback(() => {
    return hasRole(['Admin', 'HR Payroll Manager']);
  }, [hasRole]);

  const isAdmin = useCallback(() => {
    return hasRole('Admin');
  }, [hasRole]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        hasRole,
        isHRMPlus,
        isHRPUPlus,
        isHRPMPlus,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
