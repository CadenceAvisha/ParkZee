import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types/user.types';
import { authService } from '../services/auth.service';
import { LoginFormData, RegisterFormData } from '../schemas/auth.schema';
import { authStorage } from '../services/authStorage';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginFormData, expectedRole?: UserRole) => Promise<User>;
  register: (data: RegisterFormData) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('parkzee:session-expired', handleSessionExpired);
    const initAuth = async () => {
      try {
        const storedToken = authStorage.getAccessToken();
        if (storedToken) {
          setToken(storedToken);
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          } else {
            setUser(null);
            setToken(null);
          }
        } else {
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.error('Failed to initialize session', err);
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
    return () => window.removeEventListener('parkzee:session-expired', handleSessionExpired);
  }, []);

  const login = async (data: LoginFormData, expectedRole?: UserRole): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await authService.login(data, expectedRole);
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

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
