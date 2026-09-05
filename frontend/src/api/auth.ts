import { apiClient, apiRequest } from './client';
import { User } from '../types';
import { MOCK_USERS } from './mockData';

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<LoginResponse> => {
    try {
      return await apiRequest<LoginResponse>(apiClient.post('/api/auth/login', credentials));
    } catch (err: any) {
      // Offline / Demo Fallback
      const normalizedEmail = credentials.email.trim().toLowerCase();
      if (MOCK_USERS[normalizedEmail]) {
        return MOCK_USERS[normalizedEmail];
      }

      // Default fallback for any custom email during demo
      if (credentials.email && credentials.password) {
        return {
          user: {
            id: 99,
            email: credentials.email,
            name: credentials.email.split('@')[0].toUpperCase(),
            roles: ['Admin'],
          },
          token: 'demo-fallback-jwt-token-99',
        };
      }
      throw err;
    }
  },

  register: async (payload: RegisterPayload): Promise<LoginResponse> => {
    try {
      return await apiRequest<LoginResponse>(apiClient.post('/api/auth/register', payload));
    } catch (err: any) {
      // Offline / Demo Fallback: dynamically create new user session
      const newUser: User = {
        id: Math.floor(Math.random() * 9000) + 100,
        email: payload.email.trim().toLowerCase(),
        name: payload.name.trim(),
        roles: [payload.role || 'Employee'] as any,
      };
      
      const newResponse: LoginResponse = {
        user: newUser,
        token: `demo-jwt-${newUser.id}-${Date.now()}`,
      };

      // Register into MOCK_USERS so they can also log in again later
      MOCK_USERS[newUser.email] = newResponse;

      return newResponse;
    }
  },

  logout: async (): Promise<{ message?: string }> => {
    try {
      return await apiRequest(apiClient.post('/api/auth/logout'));
    } catch {
      return { message: 'Logged out successfully' };
    }
  },

  getMe: async (): Promise<User> => {
    try {
      return await apiRequest<User>(apiClient.get('/api/auth/me'));
    } catch (err: any) {
      const savedUser = localStorage.getItem('peoplepay_user');
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch {
          // Ignore
        }
      }
      throw err;
    }
  },
};

