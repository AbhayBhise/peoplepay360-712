export type Role = 'Employee' | 'HR Manager' | 'HR Payroll User' | 'HR Payroll Manager' | 'Admin';

export interface User {
  id: number | string;
  employee_id?: number | string;
  email: string;
  name?: string;
  roles: Role[];
}

export interface Department {
  id: number;
  name: string;
  parent_department_id?: number | null;
  parent_department_name?: string;
  head_employee_id?: number | null;
  head_employee_name?: string;
  employee_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface WorkingScheduleLine {
  day: string; // 'Monday' | 'Tuesday' etc.
  start_time: string; // '09:00'
  end_time: string; // '17:00'
  break: number; // in minutes or hours
}

export interface WorkingSchedule {
  id: number;
  name: string;
  type: string;
  weekly_hours: number;
  lines?: WorkingScheduleLine[];
}

export interface Employee {
  id: number;
  name: string;
  email?: string;
  department_id?: number;
  department_name?: string;
  manager_id?: number | null;
  manager_name?: string;
  job_position: string;
  status: 'active' | 'inactive';
  working_schedule_id?: number;
  working_schedule_name?: string;
  hire_date?: string;
  wage?: number;
  // Smart button live counts from GET /api/employees/:id
  contracts_count?: number;
  contractsCount?: number;
  attendance_count?: number;
  attendanceCount?: number;
  time_off_count?: number;
  timeOffCount?: number;
  payslips_count?: number;
  payslipsCount?: number;
}

export interface Contract {
  id: number;
  employee_id: number;
  employee_name?: string;
  department_id?: number;
  department_name?: string;
  position: string;
  wage: number;
  salary_structure_id: number;
  salary_structure_name?: string;
  start_date: string;
  end_date?: string | null;
  status: 'active' | 'draft' | 'closed' | 'expired';
  is_active_for_today?: boolean;
}

export interface Attendance {
  id: number;
  employee_id: number;
  employee_name?: string;
  check_in: string;
  check_out?: string | null;
  worked_hours?: number;
  status?: string;
  exception?: 'missing_checkout' | 'late' | 'none' | null;
  note?: string;
}

export interface TimeOffType {
  id: number;
  name: string;
  unit: 'days' | 'hours';
  requires_allocation: boolean;
  payroll_integration?: boolean;
}

export interface TimeOffAllocation {
  id: number;
  employee_id: number;
  employee_name?: string;
  type_id: number;
  type_name?: string;
  allocated: number;
  taken?: number;
  remaining?: number;
  status: 'draft' | 'validate' | 'refused';
  valid_from: string;
  valid_to: string;
}

export interface TimeOffRequest {
  id: number;
  employee_id: number;
  employee_name?: string;
  type_id: number;
  type_name?: string;
  date_from: string;
  date_to: string;
  duration?: number;
  status: 'draft' | 'validate' | 'refused';
  reason?: string;
}

export interface SalaryRule {
  id: number;
  structure_id: number;
  name: string;
  code: string;
  category: 'Basic' | 'Allowance' | 'Deduction' | 'Gross' | 'Net';
  sequence: number;
  computation_method: 'fixed' | 'percentage' | 'formula';
  fixed_amount?: number;
  percentage?: number;
  base_field?: string;
  formula?: string;
}

export interface SalaryStructure {
  id: number;
  name: string;
  active: boolean;
  rules_count?: number;
  employees_count?: number;
  rules?: SalaryRule[];
}

export interface Payrun {
  id: number;
  name?: string;
  structure_id: number;
  structure_name?: string;
  period_start: string;
  period_end: string;
  status: 'draft' | 'computed' | 'validated' | 'paid';
  computed_by?: string | number;
  validated_by?: string | number;
  employee_count?: number;
  total_net?: number;
  warnings?: string[];
  payslips?: PayslipSummary[];
  created_at?: string;
}

export interface PayslipSummary {
  id: number;
  employee_id: number;
  employee_name?: string;
  status: string;
  worked_days?: number;
  basic?: number;
  allowances?: number;
  deductions?: number;
  gross?: number;
  net?: number;
}

export interface PayslipLine {
  rule_id: number;
  category: string;
  name: string;
  amount: number;
}

export interface PayslipDetail {
  id: number;
  employee_id: number;
  employee_name?: string;
  structure_id: number;
  structure_name?: string;
  payrun_id?: number;
  period_start: string;
  period_end: string;
  status: string;
  worked_days: number;
  basic: number;
  allowances: number;
  deductions: number;
  gross: number;
  net: number;
  lines: PayslipLine[];
}

export interface DashboardSummary {
  total_net_paid: number;
  payslips_generated: number;
  average_salary: number;
  approved_time_off_count: number;
  attendance_health_pct: number;
}

export interface SalaryByDepartment {
  department_id: number;
  department_name: string;
  headcount: number;
  total_salary: number;
}

export interface NetSalaryTrend {
  month: string;
  net_total: number;
}

export interface AttendanceOverview {
  present: number;
  late: number;
  absent: number;
  overtime: number;
  missing_checkouts: number;
  manual_edits: number;
  coverage_pct: number;
}

export interface EmployeeDashboard {
  attendanceThisMonth: {
    present: number;
    late: number;
    missingCheckouts: number;
    totalDays: number;
  };
  leaveBalances: Array<{
    typeName: string;
    allocated: number;
    taken: number;
    remaining: number;
  }>;
  recentTimeOffRequests: Array<{
    typeName: string;
    dateFrom: string;
    dateTo: string;
    duration: number;
    status: string;
  }>;
  recentPayslips: Array<{
    id: number | string;
    net: number | string;
    status: string;
    createdAt?: string;
  }>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
