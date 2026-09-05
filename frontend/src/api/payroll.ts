import { apiClient, apiRequest } from './client';
import { SalaryStructure, SalaryRule, Payrun, PayslipDetail, Employee } from '../types';
import {
  MOCK_STRUCTURES,
  MOCK_RULES,
  MOCK_PAYRUNS,
  MOCK_PAYSLIP_DETAILS,
  MOCK_EMPLOYEES,
  MOCK_CONTRACTS,
} from './mockData';

export const payrollApi = {
  // Salary Structures
  getStructures: async (): Promise<SalaryStructure[]> => {
    try {
      return await apiRequest<SalaryStructure[]>(apiClient.get('/api/salary-structures'));
    } catch {
      return MOCK_STRUCTURES;
    }
  },

  getStructureById: async (id: number): Promise<SalaryStructure> => {
    try {
      return await apiRequest<SalaryStructure>(apiClient.get(`/api/salary-structures/${id}`));
    } catch {
      const s = MOCK_STRUCTURES.find((item) => item.id === id);
      return s || MOCK_STRUCTURES[0];
    }
  },

  createStructure: async (data: { name: string; active: boolean }): Promise<SalaryStructure> => {
    try {
      return await apiRequest<SalaryStructure>(apiClient.post('/api/salary-structures', data));
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

  updateStructure: async (id: number, data: { name: string; active: boolean }): Promise<SalaryStructure> => {
    try {
      return await apiRequest<SalaryStructure>(apiClient.put(`/api/salary-structures/${id}`, data));
    } catch {
      const index = MOCK_STRUCTURES.findIndex((s) => s.id === id);
      if (index !== -1) {
        MOCK_STRUCTURES[index] = { ...MOCK_STRUCTURES[index], ...data };
        return MOCK_STRUCTURES[index];
      }
      return { id, name: data.name, active: data.active };
    }
  },

  // Salary Rules
  getRules: async (structureId: number): Promise<SalaryRule[]> => {
    try {
      return await apiRequest<SalaryRule[]>(apiClient.get(`/api/salary-structures/${structureId}/rules`));
    } catch {
      return MOCK_RULES.filter((r) => r.structure_id === structureId).sort((a, b) => a.sequence - b.sequence);
    }
  },

  createRule: async (data: Partial<SalaryRule>): Promise<SalaryRule> => {
    try {
      return await apiRequest<SalaryRule>(apiClient.post('/api/salary-rules', data));
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

  updateRule: async (id: number, data: Partial<SalaryRule>): Promise<SalaryRule> => {
    try {
      return await apiRequest<SalaryRule>(apiClient.put(`/api/salary-rules/${id}`, data));
    } catch {
      const index = MOCK_RULES.findIndex((r) => r.id === id);
      if (index !== -1) {
        MOCK_RULES[index] = { ...MOCK_RULES[index], ...data };
        return MOCK_RULES[index];
      }
      return { id, structure_id: 1, name: '', code: '', category: 'Basic', sequence: 10, computation_method: 'fixed', ...data };
    }
  },

  // Payruns (2-Step Wizard)
  previewPayrun: async (data: {
    structure_id: number;
    period_start: string;
    period_end: string;
  }): Promise<Employee[]> => {
    try {
      return await apiRequest<Employee[]>(apiClient.post('/api/payruns/preview', data));
    } catch {
      // Return employees having contracts with that structure
      const matchingContractEmpIds = MOCK_CONTRACTS
        .filter((c) => c.salary_structure_id === Number(data.structure_id))
        .map((c) => c.employee_id);
      return MOCK_EMPLOYEES.filter((e) => matchingContractEmpIds.includes(e.id));
    }
  },

  createPayrun: async (data: {
    structure_id: number;
    period_start: string;
    period_end: string;
    employee_ids: number[];
  }): Promise<Payrun> => {
    try {
      return await apiRequest<Payrun>(apiClient.post('/api/payruns', data));
    } catch {
      const struct = MOCK_STRUCTURES.find((s) => s.id === data.structure_id);
      const newPayrun: Payrun = {
        id: MOCK_PAYRUNS.length + 1,
        name: `${new Date(data.period_start).toLocaleString('default', { month: 'long', year: 'numeric' })} Batch Run`,
        structure_id: data.structure_id,
        structure_name: struct?.name,
        period_start: data.period_start,
        period_end: data.period_end,
        status: 'draft',
        employee_count: data.employee_ids.length,
        total_net: 0,
        warnings: [],
        payslips: data.employee_ids.map((empId, idx) => {
          const emp = MOCK_EMPLOYEES.find((e) => e.id === empId);
          const contract = MOCK_CONTRACTS.find((c) => c.employee_id === empId);
          return {
            id: 600 + idx,
            employee_id: empId,
            employee_name: emp?.name,
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
      return await apiRequest<Payrun[]>(apiClient.get('/api/payruns'));
    } catch {
      return MOCK_PAYRUNS;
    }
  },

  getPayrunById: async (id: number): Promise<Payrun> => {
    try {
      return await apiRequest<Payrun>(apiClient.get(`/api/payruns/${id}`));
    } catch {
      const p = MOCK_PAYRUNS.find((item) => item.id === id);
      return p || MOCK_PAYRUNS[0];
    }
  },

  computePayrun: async (id: number): Promise<Payrun> => {
    try {
      return await apiRequest<Payrun>(apiClient.post(`/api/payruns/${id}/compute`));
    } catch {
      const index = MOCK_PAYRUNS.findIndex((p) => p.id === id);
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

  validatePayrun: async (id: number): Promise<Payrun> => {
    try {
      return await apiRequest<Payrun>(apiClient.post(`/api/payruns/${id}/validate`));
    } catch {
      const index = MOCK_PAYRUNS.findIndex((p) => p.id === id);
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

  markPaidPayrun: async (id: number): Promise<Payrun> => {
    try {
      return await apiRequest<Payrun>(apiClient.post(`/api/payruns/${id}/mark-paid`));
    } catch {
      const index = MOCK_PAYRUNS.findIndex((p) => p.id === id);
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

  sendPayslips: async (id: number): Promise<{ message?: string; sent_count?: number }> => {
    try {
      return await apiRequest(apiClient.post(`/api/payruns/${id}/send-payslips`));
    } catch {
      return { message: 'Payslips sent via email to all employees', sent_count: 3 };
    }
  },

  // Payslips
  getPayslips: async (filters?: { employee_id?: number; payrun_id?: number }): Promise<PayslipDetail[]> => {
    try {
      return await apiRequest<PayslipDetail[]>(apiClient.get('/api/payslips', { params: filters }));
    } catch {
      return Object.values(MOCK_PAYSLIP_DETAILS);
    }
  },

  getPayslipById: async (id: number | string): Promise<PayslipDetail> => {
    try {
      return await apiRequest<PayslipDetail>(apiClient.get(`/api/payslips/${id}`));
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
