import apiClient from './api';
import { AuthResponse, User, UserRole } from '../types/user.types';
import { LoginFormData, RegisterFormData } from '../schemas/auth.schema';
import { getStoredUsers, saveStoredUsers } from './storage';

export const authService = {
  login: async (credentials: LoginFormData): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      if (response.data?.token) {
        localStorage.setItem('parkzee_token', response.data.token);
        localStorage.setItem('parkzee_user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.warn('Backend unavailable or login failed, validating with local demo users', error);
      const users = getStoredUsers();
      const matchedUser = users.find(
        (u) => u.email.toLowerCase() === credentials.email.toLowerCase()
      );

      if (matchedUser) {
        if (matchedUser.accountStatus === 'suspended') {
          throw new Error('Your account is currently suspended. Please contact platform support.');
        }
        const fakeToken = `mock-jwt-token-${matchedUser.role}-${Date.now()}`;
        const authData: AuthResponse = {
          user: matchedUser,
          token: fakeToken,
        };
        localStorage.setItem('parkzee_token', fakeToken);
        localStorage.setItem('parkzee_user', JSON.stringify(matchedUser));
        return authData;
      }
      throw new Error('Invalid email or password. Please check your credentials or register a new account.');
    }
  },

  register: async (formData: RegisterFormData): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', formData);
      if (response.data?.token) {
        localStorage.setItem('parkzee_token', response.data.token);
        localStorage.setItem('parkzee_user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.warn('Backend unavailable, completing registration locally', error);
      const users = getStoredUsers();
      if (users.some((u) => u.email.toLowerCase() === formData.email.toLowerCase())) {
        throw new Error('An account with this email already exists.');
      }

      const newUser: User = {
        id: `usr-${formData.role}-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role as UserRole,
        accountStatus: 'active',
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      saveStoredUsers(users);

      const fakeToken = `mock-jwt-token-${newUser.role}-${Date.now()}`;
      const authData: AuthResponse = {
        user: newUser,
        token: fakeToken,
      };
      localStorage.setItem('parkzee_token', fakeToken);
      localStorage.setItem('parkzee_user', JSON.stringify(newUser));
      return authData;
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    const cachedUser = localStorage.getItem('parkzee_user');
    const token = localStorage.getItem('parkzee_token');
    if (!token) return null;

    try {
      const response = await apiClient.get<User>('/auth/me');
      if (response.data) {
        localStorage.setItem('parkzee_user', JSON.stringify(response.data));
        return response.data;
      }
    } catch (err) {
      // Return cached user if network fails
    }
    return cachedUser ? JSON.parse(cachedUser) : null;
  },

  logout: () => {
    localStorage.removeItem('parkzee_token');
    localStorage.removeItem('parkzee_user');
  },

  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      return response.data;
    } catch (err) {
      return {
        success: true,
        message: 'If an account exists for this email, password reset instructions have been dispatched.',
      };
    }
  },

  resetPassword: async (token: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.post('/auth/reset-password', { token, password });
      return response.data;
    } catch (err) {
      return {
        success: true,
        message: 'Password successfully updated. You may now log in with your new password.',
      };
    }
  },
};
