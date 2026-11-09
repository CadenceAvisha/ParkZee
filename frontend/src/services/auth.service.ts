import apiClient from './api';
import { AuthResponse, User } from '../types/user.types';
import { LoginFormData, RegisterFormData } from '../schemas/auth.schema';

export const authService = {
  login: async (credentials: LoginFormData): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      const authData = response.data;
      if (authData?.token) {
        localStorage.setItem('parkzee_token', authData.token);
        localStorage.setItem('parkzee_user', JSON.stringify(authData.user));
      }
      return authData;
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Invalid email or password. Please check your credentials.';
      throw new Error(msg);
    }
  },

  register: async (formData: RegisterFormData): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', formData);
      const authData = response.data;
      if (authData?.token) {
        localStorage.setItem('parkzee_token', authData.token);
        localStorage.setItem('parkzee_user', JSON.stringify(authData.user));
      }
      return authData;
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Registration failed. Please check your details.';
      throw new Error(msg);
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    const token = localStorage.getItem('parkzee_token');
    if (!token) return null;

    try {
      const response = await apiClient.get<any>('/auth/me');
      const user = response.data?.user || response.data?.data || response.data;
      if (user) {
        localStorage.setItem('parkzee_user', JSON.stringify(user));
        return user;
      }
    } catch (err) {
      localStorage.removeItem('parkzee_token');
      localStorage.removeItem('parkzee_user');
      return null;
    }
    return null;
  },

  logout: () => {
    localStorage.removeItem('parkzee_token');
    localStorage.removeItem('parkzee_user');
  },

  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      return response.data;
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Unable to process password reset request.';
      throw new Error(msg);
    }
  },

  resetPassword: async (
    token: string,
    password: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.post('/auth/reset-password', { token, password });
      return response.data;
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Unable to update password with provided token.';
      throw new Error(msg);
    }
  },
};
