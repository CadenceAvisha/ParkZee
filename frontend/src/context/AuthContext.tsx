import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types/user.types';
import { authService } from '../services/auth.service';
import { LoginFormData, RegisterFormData } from '../schemas/auth.schema';
import { getStoredUsers } from '../services/storage';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginFormData) => Promise<User>;
  register: (data: RegisterFormData) => Promise<User>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('parkzee_token');
        if (storedToken) {
          setToken(storedToken);
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          } else {
            // Default to first driver if none found
            const users = getStoredUsers();
            if (users.length > 0) {
              setUser(users[0]);
              setToken('mock-jwt-token-driver-init');
            }
          }
        } else {
          // Auto-seed default driver for convenient demo exploration if no user yet
          const users = getStoredUsers();
          const driverUser = users.find((u) => u.role === 'driver') || users[0];
          if (driverUser) {
            setUser(driverUser);
            setToken('mock-jwt-token-driver-init');
            localStorage.setItem('parkzee_token', 'mock-jwt-token-driver-init');
            localStorage.setItem('parkzee_user', JSON.stringify(driverUser));
          }
        }
      } catch (err) {
        console.error('Failed to initialize auth', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (data: LoginFormData): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await authService.login(data);
      setUser(res.user);
      setToken(res.token);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterFormData): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await authService.register(data);
      setUser(res.user);
      setToken(res.token);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  const switchDemoRole = (targetRole: UserRole) => {
    const users = getStoredUsers();
    const targetUser = users.find((u) => u.role === targetRole);
    if (targetUser) {
      const demoToken = `mock-jwt-token-${targetRole}-${Date.now()}`;
      localStorage.setItem('parkzee_token', demoToken);
      localStorage.setItem('parkzee_user', JSON.stringify(targetUser));
      setUser(targetUser);
      setToken(demoToken);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
