import { apiClient, apiRequest } from './client';

export interface AdminUser {
  id: string;
  email: string;
  employeeId: string | null;
  employeeName: string | null;
  isActive: boolean;
  roles: string[]; // e.g. ["EMPLOYEE"], ["HR_MANAGER"]
}

export type RoleName =
  | 'EMPLOYEE'
  | 'HR_MANAGER'
  | 'HR_PAYROLL_USER'
  | 'HR_PAYROLL_MANAGER'
  | 'ADMIN';

const ROLE_NAME_MAP: Record<string, string> = {
  Admin: 'ADMIN',
  ADMIN: 'ADMIN',
  'HR Manager': 'HR_MANAGER',
  HR_MANAGER: 'HR_MANAGER',
  'HR Payroll Manager': 'HR_PAYROLL_MANAGER',
  HR_PAYROLL_MANAGER: 'HR_PAYROLL_MANAGER',
  'HR Payroll User': 'HR_PAYROLL_USER',
  HR_PAYROLL_USER: 'HR_PAYROLL_USER',
  Employee: 'EMPLOYEE',
  EMPLOYEE: 'EMPLOYEE',
};

function normalizeRoleNames(roles: string[]): string[] {
  return roles.map((r) => ROLE_NAME_MAP[r] || r.toUpperCase().replace(/\s+/g, '_'));
}

export interface CreateUserPayload {
  email: string;
  password: string;
  employeeId?: string | null;
  roleNames: string[];
}

export interface UpdateRolesPayload {
  roleNames: string[];
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  details?: any;
  ipAddress?: string | null;
  createdAt: string;
}

export const adminApi = {
  /** GET /api/admin/users — List all workforce users */
  getUsers: async (): Promise<AdminUser[]> => {
    return apiRequest<AdminUser[]>(apiClient.get('/api/admin/users'));
  },

  /** Alias for backwards-compatibility */
  listUsers: async (): Promise<AdminUser[]> => {
    return apiRequest<AdminUser[]>(apiClient.get('/api/admin/users'));
  },

  /** POST /api/admin/users — provision new user */
  createUser: async (data: {
    email: string;
    password: string;
    roleNames: string[];
    employeeId?: string | null;
  }): Promise<AdminUser> => {
    const payload = {
      ...data,
      employeeId: data.employeeId || null,
      roleNames: normalizeRoleNames(data.roleNames),
    };
    return apiRequest<AdminUser>(apiClient.post('/api/admin/users', payload));
  },

  /** PUT /api/admin/users/:userId/roles — update user roles */
  updateUserRoles: async (userId: string, roleNames: string[]): Promise<AdminUser> => {
    return apiRequest<AdminUser>(
      apiClient.put(`/api/admin/users/${userId}/roles`, {
        roleNames: normalizeRoleNames(roleNames),
      })
    );
  },

  /** Alias for backwards-compatibility */
  updateRoles: async (userId: string, payload: UpdateRolesPayload): Promise<AdminUser> => {
    return apiRequest<AdminUser>(
      apiClient.put(`/api/admin/users/${userId}/roles`, {
        roleNames: normalizeRoleNames(payload.roleNames),
      })
    );
  },

  /** POST /api/admin/users/:userId/deactivate */
  deactivateUser: async (userId: string): Promise<AdminUser> => {
    return apiRequest<AdminUser>(apiClient.post(`/api/admin/users/${userId}/deactivate`));
  },

  /** Alias for backwards-compatibility */
  deactivate: async (userId: string): Promise<AdminUser> => {
    return apiRequest<AdminUser>(apiClient.post(`/api/admin/users/${userId}/deactivate`));
  },

  /** POST /api/admin/users/:userId/reactivate */
  reactivateUser: async (userId: string): Promise<AdminUser> => {
    return apiRequest<AdminUser>(apiClient.post(`/api/admin/users/${userId}/reactivate`));
  },

  /** Alias for backwards-compatibility */
  reactivate: async (userId: string): Promise<AdminUser> => {
    return apiRequest<AdminUser>(apiClient.post(`/api/admin/users/${userId}/reactivate`));
  },

  /** GET /api/admin/audit-logs */
  getAuditLogs: async (): Promise<AuditLog[]> => {
    return apiRequest<AuditLog[]>(apiClient.get('/api/admin/audit-logs'));
  },
};

// Human-readable labels for role names
export const ROLE_LABELS: Record<string, string> = {
  EMPLOYEE: 'Employee',
  HR_MANAGER: 'HR Manager',
  HR_PAYROLL_USER: 'HR Payroll User',
  HR_PAYROLL_MANAGER: 'HR Payroll Manager',
  ADMIN: 'Admin',
  Employee: 'Employee',
  'HR Manager': 'HR Manager',
  'HR Payroll User': 'HR Payroll User',
  'HR Payroll Manager': 'HR Payroll Manager',
  Admin: 'Admin',
};

export const ALL_ROLES: RoleName[] = [
  'EMPLOYEE',
  'HR_MANAGER',
  'HR_PAYROLL_USER',
  'HR_PAYROLL_MANAGER',
  'ADMIN',
];

export const PROVISION_ROLES: string[] = [
  'Admin',
  'HR Manager',
  'HR Payroll Manager',
  'HR Payroll User',
  'Employee',
];

// Role badge colours
export const ROLE_COLORS: Record<string, string> = {
  EMPLOYEE: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  HR_MANAGER: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  HR_PAYROLL_USER: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  HR_PAYROLL_MANAGER: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  ADMIN: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600',
  Employee: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  'HR Manager': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  'HR Payroll User': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  'HR Payroll Manager': 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  Admin: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600',
};
