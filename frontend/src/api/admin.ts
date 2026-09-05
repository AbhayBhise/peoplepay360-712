import { apiClient, apiRequest } from './client';

export interface AdminUser {
  id: string;
  email: string;
  employeeId: string | null;
  employeeName: string | null;
  isActive: boolean;
  roles: string[];
}

export const adminApi = {
  getUsers: async (): Promise<AdminUser[]> => {
    return apiRequest(apiClient.get('/api/admin/users'));
  },

  createUser: async (data: {
    email: string;
    password: string;
    roleNames: string[];
    employeeId?: string;
  }): Promise<AdminUser> => {
    return apiRequest(apiClient.post('/api/admin/users', data));
  },

  updateUserRoles: async (userId: string, roleNames: string[]): Promise<AdminUser> => {
    return apiRequest(apiClient.put(`/api/admin/users/${userId}/roles`, { roleNames }));
  },

  deactivateUser: async (userId: string): Promise<AdminUser> => {
    return apiRequest(apiClient.post(`/api/admin/users/${userId}/deactivate`));
  },

  reactivateUser: async (userId: string): Promise<AdminUser> => {
    return apiRequest(apiClient.post(`/api/admin/users/${userId}/reactivate`));
  },

  getAuditLogs: async (): Promise<any[]> => {
    return apiRequest(apiClient.get('/api/admin/audit-logs'));
  },
};
