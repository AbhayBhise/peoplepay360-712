import { apiClient } from './client';

export interface ReportFilters {
  period_start?: string;
  period_end?: string;
  department_id?: string;
  employee_type?: string;
}

export const reportsApi = {
  downloadPayrollPdf: async (filters?: ReportFilters, filename = 'payroll-report.pdf'): Promise<void> => {
    const response = await apiClient.get('/api/reports/payroll/pdf', {
      params: filters,
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  downloadPayrollCsv: async (filters?: ReportFilters, filename = 'payroll-report.csv'): Promise<void> => {
    const response = await apiClient.get('/api/reports/payroll/csv', {
      params: filters,
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
