import { apiClient, apiRequest } from './client';
import { User, Role } from '../types';
import { MOCK_USERS } from './mockData';

export interface LoginResponse {
  user: User;
  token: string;
}

// Backend returns roles as UPPER_SNAKE_CASE (docs/02_API_CONTRACTS.md) and identity fields
// as employeeId/employeeName; the rest of the frontend (AuthContext.hasRole, Sidebar, etc.)
// was built expecting display-format role strings and a flat `name` field. Normalize here,
// once, at the API boundary, rather than touching every consumer.
const ROLE_MAP: Record<string, Role> = {
  EMPLOYEE: 'Employee',
  HR_MANAGER: 'HR Manager',
  HR_PAYROLL_USER: 'HR Payroll User',
  HR_PAYROLL_MANAGER: 'HR Payroll Manager',
  ADMIN: 'Admin',
};

function normalizeUser(raw: any): User {
  const roles: Role[] = Array.isArray(raw?.roles)
    ? raw.roles.map((r: string) => ROLE_MAP[r] ?? (r as Role))
    : [];
  return {
    id: raw?.id,
    employee_id: raw?.employeeId ?? raw?.employee_id,
    email: raw?.email,
    name: raw?.employeeName ?? raw?.name ?? raw?.email,
    roles,
  };
}

export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<LoginResponse> => {
    const result = await apiRequest<{ user: any; token: string }>(
      apiClient.post('/api/auth/login', credentials)
    );
    return { user: normalizeUser(result.user), token: result.token };
  },

  logout: async (): Promise<{ message?: string }> => {
    try {
      return await apiRequest(apiClient.post('/api/auth/logout'));
    } catch {
      return { message: 'Logged out successfully' };
    }
  },

  forgotPassword: async (email: string): Promise<{ message?: string }> => {
    return await apiRequest(apiClient.post('/api/auth/forgot-password', { email }));
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message?: string }> => {
    return await apiRequest(apiClient.post('/api/auth/reset-password', { token, newPassword }));
  },

  getMe: async (): Promise<User> => {
    try {
      const raw = await apiRequest<any>(apiClient.get('/api/auth/me'));
      return normalizeUser(raw);
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

