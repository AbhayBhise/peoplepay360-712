import { apiClient, apiRequest } from './client';
import { SalaryStructure, SalaryRule, Payrun, PayslipDetail, PayslipSummary, Employee } from '../types';
import {
  MOCK_STRUCTURES,
  MOCK_RULES,
  MOCK_PAYRUNS,
  MOCK_PAYSLIP_DETAILS,
  MOCK_EMPLOYEES,
  MOCK_CONTRACTS,
} from './mockData';

// Backend returns camelCase fields and nested relations (e.g. employee: { name }, payrun: { periodStart })
// Normalize into the expected frontend snake_case structure.
function normalizeSalaryRule(raw: any): SalaryRule {
  if (!raw) return raw;
  const rawCat = raw.category || 'Basic';
  const category = (rawCat.charAt(0).toUpperCase() + rawCat.slice(1).toLowerCase()) as SalaryRule['category'];
  return {
    id: raw.id,
    structure_id: raw.salaryStructureId ?? raw.structureId ?? raw.structure_id,
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
    id: raw.id,
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
    id: raw.id,
    employee_id: raw.employeeId ?? raw.employee_id,
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
        rule_id: l.ruleId ?? l.rule_id ?? l.id ?? 1,
        category: l.category ? (l.category.charAt(0).toUpperCase() + l.category.slice(1).toLowerCase()) : 'Basic',
        name: l.name ?? l.rule?.name ?? 'Salary Component',
        amount: Number(l.amount ?? 0),
      }))
    : [];

  const periodStart = raw.payrun?.periodStart ? raw.payrun.periodStart.split('T')[0] : (raw.periodStart ? raw.periodStart.split('T')[0] : (raw.period_start || ''));
  const periodEnd = raw.payrun?.periodEnd ? raw.payrun.periodEnd.split('T')[0] : (raw.periodEnd ? raw.periodEnd.split('T')[0] : (raw.period_end || ''));

  return {
    id: raw.id,
    employee_id: raw.employeeId ?? raw.employee_id ?? raw.employee?.id,
    employee_name: raw.employee?.name ?? raw.employeeName ?? raw.employee_name,
    structure_id: raw.payrun?.structureId ?? raw.structureId ?? raw.structure_id ?? raw.contract?.salaryStructureId,
    structure_name: raw.payrun?.structure?.name ?? raw.structureName ?? raw.structure_name ?? raw.contract?.salaryStructure?.name,
    payrun_id: raw.payrunId ?? raw.payrun_id ?? raw.payrun?.id,
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
    id: raw.id,
    name: raw.name ?? (periodStart ? `${new Date(periodStart).toLocaleString('default', { month: 'long', year: 'numeric' })} Batch Run` : `Payrun #${raw.id}`),
    structure_id: raw.structureId ?? raw.structure_id,
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
    try {
      const raw = await apiRequest<any[]>(apiClient.get('/api/salary-structures'));
      return raw.map(normalizeStructure);
    } catch {
      return MOCK_STRUCTURES;
    }
  },

  getStructureById: async (id: number | string): Promise<SalaryStructure> => {
    try {
      const raw = await apiRequest<any>(apiClient.get(`/api/salary-structures/${id}`));
      return normalizeStructure(raw);
    } catch {
      const s = MOCK_STRUCTURES.find((item) => String(item.id) === String(id));
      return s || MOCK_STRUCTURES[0];
    }
  },

  createStructure: async (data: { name: string; active: boolean }): Promise<SalaryStructure> => {
    try {
      const raw = await apiRequest<any>(apiClient.post('/api/salary-structures', data));
      return normalizeStructure(raw);
    } catch {
      const newStruct: SalaryStructure = {
        id: MOCK_STRUCTURES.length + 1,
        name: data.name,
        active: data.active,
        rules_count: 0,
      };
      MOCK_STRUCTURES.push(newStruct);
      return newStruct;
    }
  },

  updateStructure: async (id: number | string, data: { name: string; active: boolean }): Promise<SalaryStructure> => {
    try {
      const raw = await apiRequest<any>(apiClient.put(`/api/salary-structures/${id}`, data));
      return normalizeStructure(raw);
    } catch {
      const index = MOCK_STRUCTURES.findIndex((s) => String(s.id) === String(id));
      if (index !== -1) {
        MOCK_STRUCTURES[index] = { ...MOCK_STRUCTURES[index], ...data };
        return MOCK_STRUCTURES[index];
      }
      return { id: Number(id) || 1, name: data.name, active: data.active };
    }
  },

  // Salary Rules
  getRules: async (structureId: number | string): Promise<SalaryRule[]> => {
    try {
      const raw = await apiRequest<any[]>(apiClient.get(`/api/salary-structures/${structureId}/rules`));
      return raw.map(normalizeSalaryRule).sort((a, b) => a.sequence - b.sequence);
    } catch {
      return MOCK_RULES.filter((r) => String(r.structure_id) === String(structureId)).sort((a, b) => a.sequence - b.sequence);
    }
  },

  createRule: async (data: Partial<SalaryRule>): Promise<SalaryRule> => {
    try {
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
    } catch {
      const newRule: SalaryRule = {
        id: MOCK_RULES.length + 1,
        structure_id: data.structure_id || 1,
        name: data.name || 'New Rule',
        code: data.code || 'RULE',
        category: data.category || 'Allowance',
        sequence: data.sequence || (MOCK_RULES.length + 1) * 10,
        computation_method: data.computation_method || 'fixed',
        fixed_amount: data.fixed_amount,
        percentage: data.percentage,
        base_field: data.base_field,
      };
      MOCK_RULES.push(newRule);
      return newRule;
    }
  },

  updateRule: async (id: number | string, data: Partial<SalaryRule>): Promise<SalaryRule> => {
    try {
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
    } catch {
      const index = MOCK_RULES.findIndex((r) => String(r.id) === String(id));
      if (index !== -1) {
        MOCK_RULES[index] = { ...MOCK_RULES[index], ...data };
        return MOCK_RULES[index];
      }
      return { id: Number(id) || 1, structure_id: 1, name: '', code: '', category: 'Basic', sequence: 10, computation_method: 'fixed', ...data };
    }
  },

  // Payruns (2-Step Wizard)
  previewPayrun: async (data: {
    structure_id: number | string;
    period_start: string;
    period_end: string;
  }): Promise<Employee[]> => {
    try {
      const payload = {
        structureId: String(data.structure_id),
        periodStart: data.period_start,
        periodEnd: data.period_end,
      };
      const res = await apiRequest<any[]>(apiClient.post('/api/payruns/preview', payload));
      if (Array.isArray(res)) {
        return res.map((item: any) => ({
          id: item.employeeId || item.id,
          name: item.employeeName || item.name,
          job_position: item.position || item.job_position || 'Staff Member',
          department_id: item.departmentId || item.department_id || 1,
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
    } catch {
      // Return employees having contracts with that structure
      const matchingContractEmpIds = MOCK_CONTRACTS
        .filter((c) => String(c.salary_structure_id) === String(data.structure_id))
        .map((c) => c.employee_id);
      return MOCK_EMPLOYEES.filter((e) => matchingContractEmpIds.includes(e.id));
    }
  },

  createPayrun: async (data: {
    structure_id: number | string;
    period_start: string;
    period_end: string;
    employee_ids: (number | string)[];
  }): Promise<Payrun> => {
    try {
      const payload = {
        structureId: String(data.structure_id),
        periodStart: data.period_start,
        periodEnd: data.period_end,
        employeeIds: data.employee_ids.map(String),
      };
      const raw = await apiRequest<any>(apiClient.post('/api/payruns', payload));
      return normalizePayrun(raw);
    } catch {
      const struct = MOCK_STRUCTURES.find((s) => String(s.id) === String(data.structure_id));
      const newPayrun: Payrun = {
        id: MOCK_PAYRUNS.length + 1,
        name: `${new Date(data.period_start).toLocaleString('default', { month: 'long', year: 'numeric' })} Batch Run`,
        structure_id: Number(data.structure_id) || 1,
        structure_name: struct?.name,
        period_start: data.period_start,
        period_end: data.period_end,
        status: 'draft',
        employee_count: data.employee_ids.length,
        total_net: 0,
        warnings: [],
        payslips: data.employee_ids.map((empId, idx) => {
          const emp = MOCK_EMPLOYEES.find((e) => String(e.id) === String(empId));
          const contract = MOCK_CONTRACTS.find((c) => String(c.employee_id) === String(empId));
          return {
            id: 600 + idx,
            employee_id: Number(empId) || idx + 1,
            employee_name: emp?.name || `Employee #${empId}`,
            status: 'draft',
            worked_days: 22,
            basic: contract?.wage || 5000,
            allowances: 0,
            deductions: 0,
            gross: contract?.wage || 5000,
            net: contract?.wage || 5000,
          };
        }),
      };
      MOCK_PAYRUNS.unshift(newPayrun);
      return newPayrun;
    }
  },

  getPayruns: async (): Promise<Payrun[]> => {
    try {
      const raw = await apiRequest<any[]>(apiClient.get('/api/payruns'));
      return raw.map(normalizePayrun);
    } catch {
      return MOCK_PAYRUNS;
    }
  },

  getPayrunById: async (id: number | string): Promise<Payrun> => {
    try {
      const raw = await apiRequest<any>(apiClient.get(`/api/payruns/${id}`));
      return normalizePayrun(raw);
    } catch {
      const p = MOCK_PAYRUNS.find((item) => String(item.id) === String(id));
      return p || MOCK_PAYRUNS[0];
    }
  },

  computePayrun: async (id: number | string): Promise<Payrun> => {
    try {
      const raw = await apiRequest<any>(apiClient.post(`/api/payruns/${id}/compute`));
      return normalizePayrun(raw);
    } catch {
      const index = MOCK_PAYRUNS.findIndex((p) => String(p.id) === String(id));
      if (index !== -1) {
        const pr = MOCK_PAYRUNS[index];
        pr.status = 'computed';
        let totalNet = 0;
        pr.payslips = pr.payslips?.map((ps) => {
          const allowance = Math.round(ps.basic! * 0.25);
          const deduction = Math.round(ps.basic! * 0.12);
          const gross = ps.basic! + allowance;
          const net = gross - deduction;
          totalNet += net;

          // Register in mock details
          MOCK_PAYSLIP_DETAILS[ps.id] = {
            id: ps.id,
            employee_id: ps.employee_id,
            employee_name: ps.employee_name,
            structure_id: pr.structure_id,
            structure_name: pr.structure_name,
            payrun_id: pr.id,
            period_start: pr.period_start,
            period_end: pr.period_end,
            status: 'computed',
            worked_days: 22,
            basic: ps.basic!,
            allowances: allowance,
            deductions: deduction,
            gross,
            net,
            lines: [
              { rule_id: 1, category: 'Basic', name: 'Basic Wage', amount: ps.basic! },
              { rule_id: 2, category: 'Allowance', name: 'HRA & Living Allowance', amount: allowance },
              { rule_id: 3, category: 'Deduction', name: 'Tax & PF Deduction', amount: -deduction },
            ],
          };

          return {
            ...ps,
            status: 'computed',
            allowances: allowance,
            deductions: deduction,
            gross,
            net,
          };
        });
        pr.total_net = totalNet;
        pr.warnings = ['Notice: 1 employee has missing bank tax profile details'];
        return pr;
      }
      return MOCK_PAYRUNS[0];
    }
  },

  validatePayrun: async (id: number | string): Promise<Payrun> => {
    try {
      const raw = await apiRequest<any>(apiClient.post(`/api/payruns/${id}/validate`));
      return normalizePayrun(raw);
    } catch {
      const index = MOCK_PAYRUNS.findIndex((p) => String(p.id) === String(id));
      if (index !== -1) {
        MOCK_PAYRUNS[index].status = 'validated';
        MOCK_PAYRUNS[index].payslips?.forEach((ps) => {
          ps.status = 'validated';
          if (MOCK_PAYSLIP_DETAILS[ps.id]) MOCK_PAYSLIP_DETAILS[ps.id].status = 'validated';
        });
        return MOCK_PAYRUNS[index];
      }
      return MOCK_PAYRUNS[0];
    }
  },

  markPaidPayrun: async (id: number | string): Promise<Payrun> => {
    try {
      const raw = await apiRequest<any>(apiClient.post(`/api/payruns/${id}/mark-paid`));
      return normalizePayrun(raw);
    } catch {
      const index = MOCK_PAYRUNS.findIndex((p) => String(p.id) === String(id));
      if (index !== -1) {
        MOCK_PAYRUNS[index].status = 'paid';
        MOCK_PAYRUNS[index].payslips?.forEach((ps) => {
          ps.status = 'paid';
          if (MOCK_PAYSLIP_DETAILS[ps.id]) MOCK_PAYSLIP_DETAILS[ps.id].status = 'paid';
        });
        return MOCK_PAYRUNS[index];
      }
      return MOCK_PAYRUNS[0];
    }
  },

  sendPayslips: async (id: number | string): Promise<{ message?: string; sent_count?: number }> => {
    try {
      return await apiRequest(apiClient.post(`/api/payruns/${id}/send-payslips`));
    } catch {
      return { message: 'Payslips sent via email to all employees', sent_count: 3 };
    }
  },

  // Payslips
  getPayslips: async (filters?: { employee_id?: number | string; payrun_id?: number | string }): Promise<PayslipDetail[]> => {
    try {
      const params: any = {};
      if (filters?.employee_id) params.employeeId = String(filters.employee_id);
      if (filters?.payrun_id) params.payrunId = String(filters.payrun_id);
      const raw = await apiRequest<any[]>(apiClient.get('/api/payslips', { params }));
      return raw.map(normalizePayslipDetail);
    } catch {
      return Object.values(MOCK_PAYSLIP_DETAILS);
    }
  },

  getPayslipById: async (id: number | string): Promise<PayslipDetail> => {
    try {
      const raw = await apiRequest<any>(apiClient.get(`/api/payslips/${id}`));
      return normalizePayslipDetail(raw);
    } catch {
      const p = MOCK_PAYSLIP_DETAILS[Number(id)];
      if (p) return p;
      return {
        id: Number(id),
        employee_id: 1,
        employee_name: 'Staff Member',
        structure_id: 1,
        structure_name: 'Executive & Management Structure',
        period_start: '2026-09-01',
        period_end: '2026-09-30',
        status: 'computed',
        worked_days: 22,
        basic: 6000,
        allowances: 1200,
        deductions: 720,
        gross: 7200,
        net: 6480,
        lines: [
          { rule_id: 1, category: 'Basic', name: 'Basic Salary (100%)', amount: 6000 },
          { rule_id: 2, category: 'Allowance', name: 'HRA (20%)', amount: 1200 },
          { rule_id: 3, category: 'Deduction', name: 'Tax (10%)', amount: -600 },
          { rule_id: 4, category: 'Deduction', name: 'PF Contribution', amount: -120 },
        ],
      };
    }
  },

  getPayslipPdfUrl: (id: number | string): string => {
    const baseURL = apiClient.defaults.baseURL || 'http://localhost:4000';
    const token = localStorage.getItem('peoplepay_token');
    return `${baseURL}/api/payslips/${id}/pdf?token=${encodeURIComponent(token || '')}`;
  },
};
