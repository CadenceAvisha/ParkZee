import apiClient from './api';
import { AuthResponse, User } from '../types/user.types';
import { LoginFormData, RegisterFormData } from '../schemas/auth.schema';
import { authStorage } from './authStorage';

export const authService = {
  login: async (credentials: LoginFormData, expectedRole?: User['role']): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      const authData = response.data;
      if (expectedRole && authData.user?.role !== expectedRole) {
        const roleName = authData.user?.role === 'owner' ? 'Parking Owner' : authData.user?.role === 'admin' ? 'Administrator' : 'User / Driver';
        throw new Error(`This email belongs to a ${roleName} account. Choose that account type to continue.`);
      }
      if (authData?.token && authData.refreshToken) {
        authStorage.save(authData.token, authData.refreshToken, authData.user);
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
      if (authData?.token && authData.refreshToken) {
        authStorage.save(authData.token, authData.refreshToken, authData.user);
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
    const token = authStorage.getAccessToken();
    if (!token) return null;

    try {
      const response = await apiClient.get<any>('/auth/me');
      const user = response.data?.user || response.data?.data || response.data;
      if (user) {
        authStorage.saveUser(user);
        return user;
      }
    } catch (err) {
      authStorage.clear();
      return null;
    }
    return null;
  },

  logout: () => {
    authStorage.clear();
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
