import axios, { AxiosError } from 'axios';
import { logger } from '../utils/logger';

// Base API instance
const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || 'http://localhost:4000';


export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Never let a request body reach the console with its secrets intact — this is a
// dev-only debug log, but the field names it would print (password, token, etc.)
// are exactly the ones that must never appear in devtools, screen recordings, or a
// support/error-reporting tool that scrapes console output.
const SENSITIVE_FIELDS = ['password', 'newPassword', 'currentPassword', 'token', 'confirmPassword'];

function redactSensitive(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  const clone: Record<string, unknown> = { ...(data as Record<string, unknown>) };
  for (const key of Object.keys(clone)) {
    if (SENSITIVE_FIELDS.includes(key)) clone[key] = '[REDACTED]';
  }
  return clone;
}

// Request interceptor: attach Bearer token and JSON headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('peoplepay_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const method = config.method?.toLowerCase();
    if (['post', 'put', 'patch'].includes(method || '')) {
      if (config.headers) {
        config.headers['Content-Type'] = 'application/json';
      }
      if (config.data === undefined) {
        config.data = {};
      }
    }
    logger.debug(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, redactSensitive(config.data) || '');
    return config;
  },
  (error) => {
    logger.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

function formatErrorMessage(rawError: string): string {
  if (!rawError) return 'An unexpected error occurred. Please try again.';

  let msg = rawError.trim();

  // Handle contract overlap technical error
  if (msg.includes('contract: overlaps with active contract')) {
    const datesMatch = msg.match(/\((.*?)\)/);
    const dateRange = datesMatch ? ` (${datesMatch[1]})` : '';
    return `This employee already has an active contract${dateRange}. An employee can only have one active contract at a time. Please end or expire the current active contract first, or save this contract in Draft status.`;
  }

  // Remove internal UUIDs (e.g. #144e034f-bae8-4a4e-98ef-a90984845265)
  msg = msg.replace(/#[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, '');

  // Strip technical field prefixes (e.g. "employeeId: no employee..." -> "No employee found...")
  msg = msg.replace(/^(contract|employeeId|departmentId|salaryStructureId|user|auth|prisma):\s*/i, '');

  // Capitalize first letter
  return msg.charAt(0).toUpperCase() + msg.slice(1);
}

// Response interceptor: extract structured error message from { success: false, error: "..." }
apiClient.interceptors.response.use(
  (response) => {
    logger.debug(`[API Response ${response.status}] ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error: AxiosError<any>) => {
    let errorMessage = 'An unexpected error occurred. Please try again.';

    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('peoplepay_token');
        localStorage.removeItem('peoplepay_user');
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      const data = error.response.data;
      if (data && typeof data === 'object') {
        if (data.error) {
          errorMessage = formatErrorMessage(data.error);
        } else if (data.message) {
          errorMessage = formatErrorMessage(data.message);
        }
      } else if (typeof data === 'string' && data.length < 200) {
        errorMessage = formatErrorMessage(data);
      } else if (error.response.status === 401) {
        errorMessage = 'Invalid email or password, or session expired.';
      } else if (error.response.status === 403) {
        errorMessage = 'Access denied: You do not have permission to perform this action.';
      } else if (error.response.status === 404) {
        errorMessage = 'The requested resource was not found.';
      } else if (error.response.status === 409) {
        errorMessage = 'Conflict: A conflicting active record already exists.';
      } else if (error.response.status === 422) {
        errorMessage = 'Validation error: Please check the entered data.';
      }
    } else if (error.request) {
      errorMessage = 'Unable to connect to server at ' + API_BASE_URL + '. Please ensure backend is running.';
    }

    logger.warn(`[API Error ${error.response?.status || 'NETWORK'}] ${error.config?.method?.toUpperCase()} ${error.config?.url}: ${errorMessage}`);

    const enhancedError = new Error(errorMessage);
    (enhancedError as any).status = error.response?.status;
    (enhancedError as any).originalError = error;
    return Promise.reject(enhancedError);
  }
);

// Generic wrapper to handle { success: true, data: T }
export async function apiRequest<T>(requestPromise: Promise<any>): Promise<T> {
  const response = await requestPromise;
  if (response.data && response.data.success !== undefined) {
    if (response.data.success) {
      return response.data.data !== undefined ? response.data.data : response.data;
    } else {
      throw new Error(response.data.error || 'Request failed');
    }
  }
  return response.data as T;
}
