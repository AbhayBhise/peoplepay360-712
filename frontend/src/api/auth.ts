import { apiClient, apiRequest } from './client';
import { User, Role } from '../types';

export interface UserProfile extends User {
  jobPosition?: string;
  status?: string;
  department?: { id: string; name: string } | null;
  manager?: { id: string; name: string } | null;
  memberSince?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

const ROLE_MAP: Record<string, Role> = {
  EMPLOYEE: 'Employee',
  HR_MANAGER: 'HR Manager',
  HR_PAYROLL_USER: 'HR Payroll User',
  HR_PAYROLL_MANAGER: 'HR Payroll Manager',
  ADMIN: 'Admin',
};

function normalizeUser(raw: any): UserProfile {
  const roles: Role[] = Array.isArray(raw?.roles)
    ? raw.roles.map((r: string) => ROLE_MAP[r] ?? (r as Role))
    : [];
  return {
    id: raw?.id,
    employee_id: raw?.employeeId ?? raw?.employee_id,
    email: raw?.email,
    name: raw?.employeeName ?? raw?.name ?? raw?.email,
    roles,
    jobPosition: raw?.jobPosition,
    status: raw?.status,
    department: raw?.department,
    manager: raw?.manager,
    memberSince: raw?.memberSince,
  };
}

export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<LoginResponse> => {
    const result = await apiRequest<{ user: any; token: string }>(
      apiClient.post('/api/auth/login', credentials)
    );
    return { user: normalizeUser(result.user), token: result.token };
  },

  register: async (payload: { name: string; email: string; password: string }): Promise<LoginResponse> => {
    const result = await apiRequest<{ user: any; token: string }>(
      apiClient.post('/api/auth/register', payload)
    );
    return { user: normalizeUser(result.user), token: result.token };
  },

  logout: async (): Promise<{ message?: string }> => {
    return apiRequest(apiClient.post('/api/auth/logout'));
  },

  getMe: async (): Promise<UserProfile> => {
    const raw = await apiRequest<any>(apiClient.get('/api/auth/me'));
    return normalizeUser(raw);
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(apiClient.post('/api/auth/change-password', data));
  },
};
