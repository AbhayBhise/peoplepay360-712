import axios, { AxiosError } from 'axios';

// Base API instance
const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || 'http://localhost:4000';


export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor: attach Bearer token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('peoplepay_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: extract structured error message from { success: false, error: "..." }
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<any>) => {
    let errorMessage = 'An unexpected error occurred. Please try again.';

    if (error.response) {
      const data = error.response.data;
      if (data && typeof data === 'object') {
        if (data.error) {
          errorMessage = data.error;
        } else if (data.message) {
          errorMessage = data.message;
        }
      } else if (typeof data === 'string' && data.length < 200) {
        errorMessage = data;
      } else if (error.response.status === 401) {
        errorMessage = 'Invalid email or password, or session expired.';
      } else if (error.response.status === 403) {
        errorMessage = 'Access denied: You do not have permission to perform this action.';
      } else if (error.response.status === 404) {
        errorMessage = 'The requested resource was not found.';
      } else if (error.response.status === 409) {
        errorMessage = 'Conflict: A conflicting record already exists.';
      } else if (error.response.status === 422) {
        errorMessage = 'Validation error: Please check the entered data.';
      }
    } else if (error.request) {
      errorMessage = 'Unable to connect to server at ' + API_BASE_URL + '. Please ensure backend is running.';
    }

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
