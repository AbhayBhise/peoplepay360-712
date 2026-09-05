import { apiClient, apiRequest } from './client';
import { User } from '../types';

export interface LoginResponse {
  user: User;
  token: string;
}

export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<LoginResponse> => {
    return apiRequest<LoginResponse>(apiClient.post('/api/auth/login', credentials));
  },

  logout: async (): Promise<{ message?: string }> => {
    return apiRequest(apiClient.post('/api/auth/logout'));
  },

  getMe: async (): Promise<User> => {
    return apiRequest<User>(apiClient.get('/api/auth/me'));
  },
};
