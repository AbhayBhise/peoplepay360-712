import { apiClient, apiRequest } from './client';
import { SalaryStructure, SalaryRule, Payrun, PayslipDetail, Employee } from '../types';

export const payrollApi = {
  // Salary Structures
  getStructures: async (): Promise<SalaryStructure[]> => {
    return apiRequest<SalaryStructure[]>(apiClient.get('/api/salary-structures'));
  },

  getStructureById: async (id: number): Promise<SalaryStructure> => {
    return apiRequest<SalaryStructure>(apiClient.get(`/api/salary-structures/${id}`));
  },

  createStructure: async (data: { name: string; active: boolean }): Promise<SalaryStructure> => {
    return apiRequest<SalaryStructure>(apiClient.post('/api/salary-structures', data));
  },

  updateStructure: async (id: number, data: { name: string; active: boolean }): Promise<SalaryStructure> => {
    return apiRequest<SalaryStructure>(apiClient.put(`/api/salary-structures/${id}`, data));
  },

  // Salary Rules
  getRules: async (structureId: number): Promise<SalaryRule[]> => {
    return apiRequest<SalaryRule[]>(apiClient.get(`/api/salary-structures/${structureId}/rules`));
  },

  createRule: async (data: Partial<SalaryRule>): Promise<SalaryRule> => {
    return apiRequest<SalaryRule>(apiClient.post('/api/salary-rules', data));
  },

  updateRule: async (id: number, data: Partial<SalaryRule>): Promise<SalaryRule> => {
    return apiRequest<SalaryRule>(apiClient.put(`/api/salary-rules/${id}`, data));
  },

  // Payruns (2-Step Wizard)
  previewPayrun: async (data: {
    structure_id: number;
    period_start: string;
    period_end: string;
  }): Promise<Employee[]> => {
    return apiRequest<Employee[]>(apiClient.post('/api/payruns/preview', data));
  },

  createPayrun: async (data: {
    structure_id: number;
    period_start: string;
    period_end: string;
    employee_ids: number[];
  }): Promise<Payrun> => {
    return apiRequest<Payrun>(apiClient.post('/api/payruns', data));
  },

  getPayruns: async (): Promise<Payrun[]> => {
    return apiRequest<Payrun[]>(apiClient.get('/api/payruns'));
  },

  getPayrunById: async (id: number): Promise<Payrun> => {
    return apiRequest<Payrun>(apiClient.get(`/api/payruns/${id}`));
  },

  computePayrun: async (id: number): Promise<Payrun> => {
    return apiRequest<Payrun>(apiClient.post(`/api/payruns/${id}/compute`));
  },

  validatePayrun: async (id: number): Promise<Payrun> => {
    return apiRequest<Payrun>(apiClient.post(`/api/payruns/${id}/validate`));
  },

  markPaidPayrun: async (id: number): Promise<Payrun> => {
    return apiRequest<Payrun>(apiClient.post(`/api/payruns/${id}/mark-paid`));
  },

  sendPayslips: async (id: number): Promise<{ message?: string; sent_count?: number }> => {
    return apiRequest(apiClient.post(`/api/payruns/${id}/send-payslips`));
  },

  // Payslips
  getPayslips: async (filters?: { employee_id?: number; payrun_id?: number }): Promise<PayslipDetail[]> => {
    return apiRequest<PayslipDetail[]>(apiClient.get('/api/payslips', { params: filters }));
  },

  getPayslipById: async (id: number | string): Promise<PayslipDetail> => {
    return apiRequest<PayslipDetail>(apiClient.get(`/api/payslips/${id}`));
  },

  getPayslipPdfUrl: (id: number | string): string => {
    const baseURL = apiClient.defaults.baseURL || 'http://localhost:4000';
    const token = localStorage.getItem('peoplepay_token');
    return `${baseURL}/api/payslips/${id}/pdf?token=${encodeURIComponent(token || '')}`;
  },
};
