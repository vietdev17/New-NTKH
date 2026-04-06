import api from '@/lib/api';
import type { AuthResponse, LoginCredentials, RegisterData, User } from '@/types';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/login', credentials);
    // BE returns { user, tokens: { accessToken, refreshToken } }
    return {
      user: data.user,
      accessToken: data.tokens?.accessToken ?? data.accessToken,
      refreshToken: data.tokens?.refreshToken ?? data.refreshToken,
    };
  },
  register: async (data_: RegisterData): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/register', data_);
    return {
      user: data.user,
      accessToken: data.tokens?.accessToken ?? data.accessToken,
      refreshToken: data.tokens?.refreshToken ?? data.refreshToken,
    };
  },
  getMe: async (): Promise<User> => {
    const { data } = await api.get('/auth/me');
    return data;
  },
  refreshToken: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const { data } = await api.post('/auth/refresh', { refreshToken });
    return data;
  },
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },
  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const { data } = await api.post('/auth/reset-password', { token, password });
    return data;
  },
  googleLogin: async (idToken: string): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/google', { idToken });
    return data;
  },
};
