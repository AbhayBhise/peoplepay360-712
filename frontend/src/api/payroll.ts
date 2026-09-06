import { apiClient, apiRequest } from './client';
import { SalaryStructure, SalaryRule, Payrun, PayslipDetail, PayslipSummary, Employee } from '../types';

// Backend returns camelCase fields and nested relations (e.g. employee: { name }, payrun: { periodStart })
// Normalize into the expected frontend snake_case structure.
function normalizeSalaryRule(raw: any): SalaryRule {
  if (!raw) return raw;
  const rawCat = raw.category || 'Basic';
  const category = (rawCat.charAt(0).toUpperCase() + rawCat.slice(1).toLowerCase()) as SalaryRule['category'];
  return {
    id: String(raw.id),
    structure_id: String(raw.salaryStructureId ?? raw.structureId ?? raw.structure_id),
    name: raw.name,
    code: raw.code,
    category,
    sequence: raw.sequence ?? 10,
    computation_method: raw.computationMethod ?? raw.computation_method ?? 'fixed',
    fixed_amount: raw.fixedAmount !== undefined ? Number(raw.fixedAmount) : (raw.fixed_amount !== undefined ? Number(raw.fixed_amount) : undefined),
    percentage: raw.percentage !== undefined ? Number(raw.percentage) : undefined,
    base_field: raw.baseField ?? raw.base_field,
    formula: raw.formula,
  };
}

function normalizeStructure(raw: any): SalaryStructure {
  if (!raw) return raw;
  return {
    id: String(raw.id),
    name: raw.name,
    active: raw.active,
    rules_count: raw._count?.rules ?? raw.rules_count ?? raw.rulesCount ?? (Array.isArray(raw.rules) ? raw.rules.length : 0),
    employees_count: raw._count?.contracts ?? raw.employees_count ?? raw.employeesCount,
    rules: Array.isArray(raw.rules) ? raw.rules.map(normalizeSalaryRule) : undefined,
  };
}

function normalizePayslipSummary(raw: any): PayslipSummary {
  if (!raw) return raw;
  return {
    id: String(raw.id),
    employee_id: String(raw.employeeId ?? raw.employee_id),
    employee_name: raw.employee?.name ?? raw.employeeName ?? raw.employee_name,
    status: raw.status,
    worked_days: raw.workedDays !== undefined ? Number(raw.workedDays) : (raw.worked_days !== undefined ? Number(raw.worked_days) : 0),
    basic: raw.basic !== undefined ? Number(raw.basic) : 0,
    allowances: raw.allowances !== undefined ? Number(raw.allowances) : 0,
    deductions: raw.deductions !== undefined ? Number(raw.deductions) : 0,
    gross: raw.gross !== undefined ? Number(raw.gross) : 0,
    net: raw.net !== undefined ? Number(raw.net) : 0,
  };
}

function normalizePayslipDetail(raw: any): PayslipDetail {
  if (!raw) return raw;
  const lines = Array.isArray(raw.lines)
    ? raw.lines.map((l: any) => ({
        rule_id: String(l.ruleId ?? l.rule_id ?? l.id ?? 1),
        category: l.category ? (l.category.charAt(0).toUpperCase() + l.category.slice(1).toLowerCase()) : 'Basic',
        name: l.name ?? l.rule?.name ?? 'Salary Component',
        amount: Number(l.amount ?? 0),
      }))
    : [];

  const periodStart = raw.payrun?.periodStart ? raw.payrun.periodStart.split('T')[0] : (raw.periodStart ? raw.periodStart.split('T')[0] : (raw.period_start || ''));
  const periodEnd = raw.payrun?.periodEnd ? raw.payrun.periodEnd.split('T')[0] : (raw.periodEnd ? raw.periodEnd.split('T')[0] : (raw.period_end || ''));

  return {
    id: String(raw.id),
    employee_id: String(raw.employeeId ?? raw.employee_id ?? raw.employee?.id),
    employee_name: raw.employee?.name ?? raw.employeeName ?? raw.employee_name,
    structure_id: String(raw.payrun?.structureId ?? raw.structureId ?? raw.structure_id ?? raw.contract?.salaryStructureId ?? '1'),
    structure_name: raw.payrun?.structure?.name ?? raw.structureName ?? raw.structure_name ?? raw.contract?.salaryStructure?.name,
    payrun_id: String(raw.payrunId ?? raw.payrun_id ?? raw.payrun?.id),
    period_start: periodStart,
    period_end: periodEnd,
    status: raw.status,
    worked_days: raw.workedDays !== undefined ? Number(raw.workedDays) : (raw.worked_days !== undefined ? Number(raw.worked_days) : 0),
    basic: raw.basic !== undefined ? Number(raw.basic) : 0,
    allowances: raw.allowances !== undefined ? Number(raw.allowances) : 0,
    deductions: raw.deductions !== undefined ? Number(raw.deductions) : 0,
    gross: raw.gross !== undefined ? Number(raw.gross) : 0,
    net: raw.net !== undefined ? Number(raw.net) : 0,
    lines,
  };
}

function normalizePayrun(raw: any): Payrun {
  if (!raw) return raw;
  const payslips = Array.isArray(raw.payslips) ? raw.payslips.map(normalizePayslipSummary) : [];
  const periodStart = raw.periodStart ? raw.periodStart.split('T')[0] : (raw.period_start || '');
  const periodEnd = raw.periodEnd ? raw.periodEnd.split('T')[0] : (raw.period_end || '');
  const totalNet = raw.total_net ?? (raw.totalNet !== undefined ? Number(raw.totalNet) : payslips.reduce((acc, p) => acc + (p.net || 0), 0));
  const employeeCount = raw.employee_count ?? raw.employeeCount ?? raw._count?.payslips ?? payslips.length;

  return {
    id: String(raw.id),
    name: raw.name ?? (periodStart ? `${new Date(periodStart).toLocaleString('default', { month: 'long', year: 'numeric' })} Batch Run` : `Payrun #${raw.id}`),
    structure_id: String(raw.structureId ?? raw.structure_id),
    structure_name: raw.structure?.name ?? raw.structureName ?? raw.structure_name,
    period_start: periodStart,
    period_end: periodEnd,
    status: raw.status,
    computed_by: raw.computedBy ?? raw.computed_by,
    validated_by: raw.validatedBy ?? raw.validated_by,
    employee_count: employeeCount,
    total_net: totalNet,
    warnings: raw.warnings ?? [],
    payslips,
    created_at: raw.createdAt ?? raw.created_at,
  };
}

export const payrollApi = {
  // Salary Structures
  getStructures: async (): Promise<SalaryStructure[]> => {
    const raw = await apiRequest<any[]>(apiClient.get('/api/salary-structures'));
    return Array.isArray(raw) ? raw.map(normalizeStructure) : [];
  },

  getStructureById: async (id: number | string): Promise<SalaryStructure> => {
    const raw = await apiRequest<any>(apiClient.get(`/api/salary-structures/${id}`));
    return normalizeStructure(raw);
  },

  createStructure: async (data: { name: string; active: boolean }): Promise<SalaryStructure> => {
    const raw = await apiRequest<any>(apiClient.post('/api/salary-structures', data));
    return normalizeStructure(raw);
  },

  updateStructure: async (id: number | string, data: { name: string; active: boolean }): Promise<SalaryStructure> => {
    const raw = await apiRequest<any>(apiClient.put(`/api/salary-structures/${id}`, data));
    return normalizeStructure(raw);
  },

  // Salary Rules
  getRules: async (structureId: number | string): Promise<SalaryRule[]> => {
    const raw = await apiRequest<any[]>(apiClient.get(`/api/salary-structures/${structureId}/rules`));
    return Array.isArray(raw) ? raw.map(normalizeSalaryRule).sort((a, b) => a.sequence - b.sequence) : [];
  },

  createRule: async (data: Partial<SalaryRule>): Promise<SalaryRule> => {
    const payload = {
      salaryStructureId: data.structure_id ? String(data.structure_id) : undefined,
      name: data.name,
      code: data.code,
      category: data.category?.toLowerCase(),
      sequence: data.sequence,
      computationMethod: data.computation_method,
      fixedAmount: data.fixed_amount,
      percentage: data.percentage,
      baseField: data.base_field,
      formula: data.formula,
    };
    const raw = await apiRequest<any>(apiClient.post('/api/salary-rules', payload));
    return normalizeSalaryRule(raw);
  },

  updateRule: async (id: number | string, data: Partial<SalaryRule>): Promise<SalaryRule> => {
    const payload = {
      name: data.name,
      code: data.code,
      category: data.category?.toLowerCase(),
      sequence: data.sequence,
      computationMethod: data.computation_method,
      fixedAmount: data.fixed_amount,
      percentage: data.percentage,
      baseField: data.base_field,
      formula: data.formula,
    };
    const raw = await apiRequest<any>(apiClient.put(`/api/salary-rules/${id}`, payload));
    return normalizeSalaryRule(raw);
  },

  // Payruns (2-Step Wizard)
  previewPayrun: async (data: {
    structure_id: number | string;
    period_start: string;
    period_end: string;
  }): Promise<Employee[]> => {
    const payload = {
      structureId: String(data.structure_id),
      periodStart: data.period_start,
      periodEnd: data.period_end,
    };
    const res = await apiRequest<any[]>(apiClient.post('/api/payruns/preview', payload));
    if (Array.isArray(res)) {
      return res.map((item: any) => ({
        id: String(item.employeeId || item.id),
        name: item.employeeName || item.name,
        job_position: item.position || item.job_position || 'Staff Member',
        department_id: item.departmentId || item.department_id ? String(item.departmentId || item.department_id) : undefined,
        department_name: item.departmentName || item.department_name,
        wage: item.wage !== undefined ? Number(item.wage) : 0,
        status: 'active',
        contracts_count: 1,
        attendance_count: 22,
        time_off_count: 0,
        payslips_count: 0,
      }));
    }
    return [];
  },

  createPayrun: async (data: {
    structure_id: number | string;
    period_start: string;
    period_end: string;
    employee_ids: (number | string)[];
  }): Promise<Payrun> => {
    const payload = {
      structureId: String(data.structure_id),
      periodStart: data.period_start,
      periodEnd: data.period_end,
      employeeIds: data.employee_ids.map(String),
    };
    const raw = await apiRequest<any>(apiClient.post('/api/payruns', payload));
    return normalizePayrun(raw);
  },

  getPayruns: async (): Promise<Payrun[]> => {
    const raw = await apiRequest<any[]>(apiClient.get('/api/payruns'));
    return Array.isArray(raw) ? raw.map(normalizePayrun) : [];
  },

  getPayrunById: async (id: number | string): Promise<Payrun> => {
    const raw = await apiRequest<any>(apiClient.get(`/api/payruns/${id}`));
    return normalizePayrun(raw);
  },

  computePayrun: async (id: number | string): Promise<Payrun> => {
    const raw = await apiRequest<any>(apiClient.post(`/api/payruns/${id}/compute`));
    return normalizePayrun(raw);
  },

  validatePayrun: async (id: number | string): Promise<Payrun> => {
    const raw = await apiRequest<any>(apiClient.post(`/api/payruns/${id}/validate`));
    return normalizePayrun(raw);
  },

  markPaidPayrun: async (id: number | string): Promise<Payrun> => {
    const raw = await apiRequest<any>(apiClient.post(`/api/payruns/${id}/mark-paid`));
    return normalizePayrun(raw);
  },

  sendPayslips: async (id: number | string): Promise<{ message?: string; sent_count?: number }> => {
    return apiRequest(apiClient.post(`/api/payruns/${id}/send-payslips`));
  },

  // Payslips
  getPayslips: async (filters?: { employee_id?: number | string; payrun_id?: number | string }): Promise<PayslipDetail[]> => {
    const params: any = {};
    if (filters?.employee_id) params.employeeId = String(filters.employee_id);
    if (filters?.payrun_id) params.payrunId = String(filters.payrun_id);
    const raw = await apiRequest<any[]>(apiClient.get('/api/payslips', { params }));
    return Array.isArray(raw) ? raw.map(normalizePayslipDetail) : [];
  },

  getPayslipById: async (id: number | string): Promise<PayslipDetail> => {
    const raw = await apiRequest<any>(apiClient.get(`/api/payslips/${id}`));
    return normalizePayslipDetail(raw);
  },

  getPayslipPdfUrl: (id: number | string): string => {
    const baseURL = apiClient.defaults.baseURL || 'http://localhost:4000';
    const token = localStorage.getItem('peoplepay_token');
    return `${baseURL}/api/payslips/${id}/pdf?token=${encodeURIComponent(token || '')}`;
  },
};
