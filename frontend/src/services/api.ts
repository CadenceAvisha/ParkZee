import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { authStorage } from './authStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error reporting
let refreshInFlight: Promise<string | null> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as (InternalAxiosRequestConfig & { _authRetry?: boolean }) | undefined;
    if (error.response?.status === 401 && config && !config._authRetry && !config.url?.includes('/auth/refresh')) {
      const refreshToken = authStorage.getRefreshToken();
      if (refreshToken) {
        config._authRetry = true;
        try {
          if (!refreshInFlight) {
            refreshInFlight = axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken }, {
              headers: { 'Content-Type': 'application/json' },
              timeout: 10000,
            }).then((response) => {
              const result = response.data?.data ?? response.data;
              if (!result?.token || !result?.refreshToken) throw new Error('Invalid refresh response');
              authStorage.saveTokens(result.token, result.refreshToken);
              return result.token as string;
            }).catch(() => {
              authStorage.clear();
              return null;
            }).finally(() => { refreshInFlight = null; });
          }
          const token = await refreshInFlight;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            return apiClient(config);
          }
        } catch {
          authStorage.clear();
        }
      }
      if (!refreshToken) authStorage.clear();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
