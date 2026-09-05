import {
  User,
  Employee,
  Department,
  Contract,
  WorkingSchedule,
  Attendance,
  TimeOffType,
  TimeOffAllocation,
  TimeOffRequest,
  SalaryStructure,
  SalaryRule,
  Payrun,
  PayslipDetail,
  DashboardSummary,
  SalaryByDepartment,
  NetSalaryTrend,
  AttendanceOverview,
} from '../types';

// DEMO USERS (Supports both live backend seed logins and .com demo logins)
export const MOCK_USERS: Record<string, { user: User; token: string }> = {
  // Live backend seed accounts
  'admin@peoplepay360.dev': {
    user: { id: '1', email: 'admin@peoplepay360.dev', name: 'System Administrator', roles: ['Admin'] },
    token: 'mock-jwt-admin-token-xyz',
  },
  'hr.manager@peoplepay360.dev': {
    user: { id: '2', employee_id: '1', email: 'hr.manager@peoplepay360.dev', name: 'Rahul Verma', roles: ['HR Manager'] },
    token: 'mock-jwt-hrm-token-xyz',
  },
  'payroll.manager@peoplepay360.dev': {
    user: { id: '3', employee_id: '2', email: 'payroll.manager@peoplepay360.dev', name: 'Ananya Iyer', roles: ['HR Payroll Manager'] },
    token: 'mock-jwt-hrpm-token-xyz',
  },
  'payroll.user@peoplepay360.dev': {
    user: { id: '4', employee_id: '3', email: 'payroll.user@peoplepay360.dev', name: 'Priya Sharma', roles: ['HR Payroll User'] },
    token: 'mock-jwt-hrpu-token-xyz',
  },
  'employee.demo@peoplepay360.dev': {
    user: { id: '5', employee_id: '4', email: 'employee.demo@peoplepay360.dev', name: 'Arjun Mehta', roles: ['Employee'] },
    token: 'mock-jwt-emp-token-xyz',
  },

  // Alternate .com accounts
  'admin@peoplepay360.com': {
    user: { id: '1', email: 'admin@peoplepay360.com', name: 'System Administrator', roles: ['Admin'] },
    token: 'mock-jwt-admin-token-xyz',
  },
  'hrmanager@peoplepay360.com': {
    user: { id: '2', employee_id: '1', email: 'hrmanager@peoplepay360.com', name: 'Rahul Verma', roles: ['HR Manager'] },
    token: 'mock-jwt-hrm-token-xyz',
  },
  'payrollmanager@peoplepay360.com': {
    user: { id: '3', employee_id: '2', email: 'payrollmanager@peoplepay360.com', name: 'Ananya Iyer', roles: ['HR Payroll Manager'] },
    token: 'mock-jwt-hrpm-token-xyz',
  },
  'payrolluser@peoplepay360.com': {
    user: { id: '4', employee_id: '3', email: 'payrolluser@peoplepay360.com', name: 'Priya Sharma', roles: ['HR Payroll User'] },
    token: 'mock-jwt-hrpu-token-xyz',
  },
  'employee@peoplepay360.com': {
    user: { id: '5', employee_id: '4', email: 'employee@peoplepay360.com', name: 'Arjun Mehta', roles: ['Employee'] },
    token: 'mock-jwt-emp-token-xyz',
  },
};

// DEPARTMENTS
export let MOCK_DEPARTMENTS: Department[] = [
  { id: '1', name: 'Executive Leadership', parent_department_id: null, head_employee_id: '1' },
  { id: '2', name: 'Human Resources', parent_department_id: '1', head_employee_id: '1' },
  { id: '3', name: 'Engineering & Product', parent_department_id: '1', head_employee_id: '4' },
  { id: '4', name: 'Finance & Payroll', parent_department_id: '1', head_employee_id: '2' },
  { id: '5', name: 'Sales & Customer Success', parent_department_id: '1', head_employee_id: '5' },
];

// WORKING SCHEDULES
export let MOCK_SCHEDULES: WorkingSchedule[] = [
  {
    id: '1',
    name: 'Standard 40h (Mon-Fri)',
    type: 'Full Time',
    weekly_hours: 40,
    lines: [
      { day: 'Monday', start_time: '09:00', end_time: '17:00', break: 0 },
      { day: 'Tuesday', start_time: '09:00', end_time: '17:00', break: 0 },
      { day: 'Wednesday', start_time: '09:00', end_time: '17:00', break: 0 },
      { day: 'Thursday', start_time: '09:00', end_time: '17:00', break: 0 },
      { day: 'Friday', start_time: '09:00', end_time: '17:00', break: 0 },
    ],
  },
  {
    id: '2',
    name: 'Part-Time 24h (Mon-Wed)',
    type: 'Part Time',
    weekly_hours: 24,
    lines: [
      { day: 'Monday', start_time: '09:00', end_time: '17:00', break: 0 },
      { day: 'Tuesday', start_time: '09:00', end_time: '17:00', break: 0 },
      { day: 'Wednesday', start_time: '09:00', end_time: '17:00', break: 0 },
    ],
  },
];

// SALARY STRUCTURES & SEQUENCED RULES
export let MOCK_STRUCTURES: SalaryStructure[] = [
  { id: '1', name: 'Executive & Management Structure', active: true, rules_count: 5 },
  { id: '2', name: 'Standard Engineering Structure', active: true, rules_count: 5 },
  { id: '3', name: 'Sales Commission Structure', active: true, rules_count: 4 },
];

export let MOCK_RULES: SalaryRule[] = [
  { id: '1', structure_id: '1', sequence: 10, name: 'Basic Salary', code: 'BASIC', category: 'Basic', computation_method: 'percentage', percentage: 100, base_field: 'wage' },
  { id: '2', structure_id: '1', sequence: 20, name: 'House Rent Allowance (HRA)', code: 'HRA', category: 'Allowance', computation_method: 'percentage', percentage: 20, base_field: 'wage' },
  { id: '3', structure_id: '1', sequence: 30, name: 'Executive Special Allowance', code: 'EXEC_ALLOW', category: 'Allowance', computation_method: 'fixed', fixed_amount: 800 },
  { id: '4', structure_id: '1', sequence: 40, name: 'Income Tax Deduction (TDS)', code: 'TAX', category: 'Deduction', computation_method: 'percentage', percentage: 10, base_field: 'wage' },
  { id: '5', structure_id: '1', sequence: 50, name: 'Provident Fund (PF)', code: 'PF', category: 'Deduction', computation_method: 'fixed', fixed_amount: 200 },

  { id: '6', structure_id: '2', sequence: 10, name: 'Basic Salary', code: 'BASIC', category: 'Basic', computation_method: 'percentage', percentage: 100, base_field: 'wage' },
  { id: '7', structure_id: '2', sequence: 20, name: 'Tech & Internet Allowance', code: 'TECH_ALLOW', category: 'Allowance', computation_method: 'fixed', fixed_amount: 300 },
  { id: '8', structure_id: '2', sequence: 30, name: 'Medical Allowance', code: 'MED', category: 'Allowance', computation_method: 'fixed', fixed_amount: 250 },
  { id: '9', structure_id: '2', sequence: 40, name: 'Tax Deduction', code: 'TAX', category: 'Deduction', computation_method: 'percentage', percentage: 8, base_field: 'wage' },
  { id: '10', structure_id: '2', sequence: 50, name: 'PF Contribution', code: 'PF', category: 'Deduction', computation_method: 'fixed', fixed_amount: 150 },
];

// EMPLOYEES
export let MOCK_EMPLOYEES: Employee[] = [
  {
    id: '1',
    name: 'Sophia Chen',
    email: 'hrmanager@peoplepay360.com',
    department_id: '2',
    department_name: 'Human Resources',
    manager_id: null,
    manager_name: undefined,
    job_position: 'Director of Human Resources',
    status: 'active',
    working_schedule_id: '1',
    working_schedule_name: 'Standard 40h (Mon-Fri)',
    contracts_count: 1,
    attendance_count: 24,
    time_off_count: 2,
    payslips_count: 3,
  },
  {
    id: '2',
    name: 'Marcus Vance',
    email: 'payrollmanager@peoplepay360.com',
    department_id: '4',
    department_name: 'Finance & Payroll',
    manager_id: '1',
    manager_name: 'Sophia Chen',
    job_position: 'Payroll Manager',
    status: 'active',
    working_schedule_id: '1',
    working_schedule_name: 'Standard 40h (Mon-Fri)',
    contracts_count: 1,
    attendance_count: 22,
    time_off_count: 1,
    payslips_count: 3,
  },
  {
    id: '3',
    name: 'Elena Rostova',
    email: 'payrolluser@peoplepay360.com',
    department_id: '4',
    department_name: 'Finance & Payroll',
    manager_id: '2',
    manager_name: 'Marcus Vance',
    job_position: 'Payroll Specialist',
    status: 'active',
    working_schedule_id: '1',
    working_schedule_name: 'Standard 40h (Mon-Fri)',
    contracts_count: 1,
    attendance_count: 25,
    time_off_count: 1,
    payslips_count: 2,
  },
  {
    id: '4',
    name: 'David Miller',
    email: 'employee@peoplepay360.com',
    department_id: '3',
    department_name: 'Engineering & Product',
    manager_id: '1',
    manager_name: 'Sophia Chen',
    job_position: 'Senior Software Engineer',
    status: 'active',
    working_schedule_id: '1',
    working_schedule_name: 'Standard 40h (Mon-Fri)',
    contracts_count: 2,
    attendance_count: 28,
    time_off_count: 3,
    payslips_count: 4,
  },
  {
    id: '5',
    name: 'Priya Sharma',
    email: 'priya.sharma@peoplepay360.com',
    department_id: '5',
    department_name: 'Sales & Customer Success',
    manager_id: '1',
    manager_name: 'Sophia Chen',
    job_position: 'Account Executive',
    status: 'active',
    working_schedule_id: '1',
    working_schedule_name: 'Standard 40h (Mon-Fri)',
    contracts_count: 1,
    attendance_count: 20,
    time_off_count: 1,
    payslips_count: 2,
  },
  {
    id: '6',
    name: 'Liam Johnson',
    email: 'liam.johnson@peoplepay360.com',
    department_id: '3',
    department_name: 'Engineering & Product',
    manager_id: '4',
    manager_name: 'David Miller',
    job_position: 'Frontend Engineer',
    status: 'active',
    working_schedule_id: '1',
    working_schedule_name: 'Standard 40h (Mon-Fri)',
    contracts_count: 1,
    attendance_count: 23,
    time_off_count: 0,
    payslips_count: 2,
  },
];

// CONTRACTS
export let MOCK_CONTRACTS: Contract[] = [
  {
    id: '101',
    employee_id: '1',
    employee_name: 'Sophia Chen',
    department_id: '2',
    department_name: 'Human Resources',
    position: 'Director of Human Resources',
    wage: 8500,
    salary_structure_id: '1',
    salary_structure_name: 'Executive & Management Structure',
    start_date: '2025-01-01',
    end_date: null,
    status: 'active',
    is_active_for_today: true,
  },
  {
    id: '102',
    employee_id: '2',
    employee_name: 'Marcus Vance',
    department_id: '4',
    department_name: 'Finance & Payroll',
    position: 'Payroll Manager',
    wage: 7200,
    salary_structure_id: '1',
    salary_structure_name: 'Executive & Management Structure',
    start_date: '2025-01-01',
    end_date: null,
    status: 'active',
    is_active_for_today: true,
  },
  {
    id: '103',
    employee_id: '3',
    employee_name: 'Elena Rostova',
    department_id: '4',
    department_name: 'Finance & Payroll',
    position: 'Payroll Specialist',
    wage: 5400,
    salary_structure_id: '1',
    salary_structure_name: 'Executive & Management Structure',
    start_date: '2025-02-01',
    end_date: null,
    status: 'active',
    is_active_for_today: true,
  },
  {
    id: '104',
    employee_id: '4',
    employee_name: 'David Miller',
    department_id: '3',
    department_name: 'Engineering & Product',
    position: 'Senior Software Engineer',
    wage: 6800,
    salary_structure_id: '2',
    salary_structure_name: 'Standard Engineering Structure',
    start_date: '2025-01-15',
    end_date: null,
    status: 'active',
    is_active_for_today: true,
  },
  {
    id: '105',
    employee_id: '5',
    employee_name: 'Priya Sharma',
    department_id: '5',
    department_name: 'Sales & Customer Success',
    position: 'Account Executive',
    wage: 6000,
    salary_structure_id: '3',
    salary_structure_name: 'Sales Commission Structure',
    start_date: '2025-03-01',
    end_date: null,
    status: 'active',
    is_active_for_today: true,
  },
  {
    id: '106',
    employee_id: '6',
    employee_name: 'Liam Johnson',
    department_id: '3',
    department_name: 'Engineering & Product',
    position: 'Frontend Engineer',
    wage: 5000,
    salary_structure_id: '2',
    salary_structure_name: 'Standard Engineering Structure',
    start_date: '2025-03-01',
    end_date: null,
    status: 'active',
    is_active_for_today: true,
  },
];

// ATTENDANCE
export let MOCK_ATTENDANCE: Attendance[] = [
  { id: '201', employee_id: '4', employee_name: 'David Miller', check_in: '2026-09-05 09:02', check_out: '2026-09-05 17:35', worked_hours: 8.5, status: 'checked_out', exception: 'none' },
  { id: '202', employee_id: '1', employee_name: 'Sophia Chen', check_in: '2026-09-05 08:55', check_out: '2026-09-05 17:00', worked_hours: 8.1, status: 'checked_out', exception: 'none' },
  { id: '203', employee_id: '2', employee_name: 'Marcus Vance', check_in: '2026-09-05 10:15', check_out: '2026-09-05 18:30', worked_hours: 8.2, status: 'checked_out', exception: 'late' },
  { id: '204', employee_id: '3', employee_name: 'Elena Rostova', check_in: '2026-09-05 09:00', check_out: null, worked_hours: 6.2, status: 'checked_in', exception: 'missing_checkout' },
  { id: '205', employee_id: '5', employee_name: 'Priya Sharma', check_in: '2026-09-05 09:10', check_out: '2026-09-05 17:40', worked_hours: 8.5, status: 'checked_out', exception: 'none' },
];

// TIME OFF
export let MOCK_TIME_OFF_TYPES: TimeOffType[] = [
  { id: '1', name: 'Paid Annual Leave', unit: 'days', requires_allocation: true, payroll_integration: true },
  { id: '2', name: 'Sick Leave', unit: 'days', requires_allocation: true, payroll_integration: true },
  { id: '3', name: 'Unpaid Leave', unit: 'days', requires_allocation: false, payroll_integration: true },
  { id: '4', name: 'Compensatory Off', unit: 'hours', requires_allocation: true, payroll_integration: false },
];

export let MOCK_ALLOCATIONS: TimeOffAllocation[] = [
  { id: '1', employee_id: '4', employee_name: 'David Miller', type_id: '1', type_name: 'Paid Annual Leave', allocated: 20, taken: 4, remaining: 16, status: 'validate', valid_from: '2026-01-01', valid_to: '2026-12-31' },
  { id: '2', employee_id: '4', employee_name: 'David Miller', type_id: '2', type_name: 'Sick Leave', allocated: 10, taken: 2, remaining: 8, status: 'validate', valid_from: '2026-01-01', valid_to: '2026-12-31' },
  { id: '3', employee_id: '1', employee_name: 'Sophia Chen', type_id: '1', type_name: 'Paid Annual Leave', allocated: 25, taken: 5, remaining: 20, status: 'validate', valid_from: '2026-01-01', valid_to: '2026-12-31' },
  { id: '4', employee_id: '2', employee_name: 'Marcus Vance', type_id: '1', type_name: 'Paid Annual Leave', allocated: 20, taken: 3, remaining: 17, status: 'validate', valid_from: '2026-01-01', valid_to: '2026-12-31' },
];

export let MOCK_REQUESTS: TimeOffRequest[] = [
  { id: '1', employee_id: '4', employee_name: 'David Miller', type_id: '1', type_name: 'Paid Annual Leave', date_from: '2026-09-15', date_to: '2026-09-18', duration: 4, status: 'validate', reason: 'Family trip' },
  { id: '2', employee_id: '5', employee_name: 'Priya Sharma', type_id: '2', type_name: 'Sick Leave', date_from: '2026-09-08', date_to: '2026-09-09', duration: 2, status: 'draft', reason: 'Doctor appointment' },
  { id: '3', employee_id: '3', employee_name: 'Elena Rostova', type_id: '1', type_name: 'Paid Annual Leave', date_from: '2026-09-22', date_to: '2026-09-23', duration: 2, status: 'draft', reason: 'Personal errands' },
];

// PAYRUNS & PAYSLIPS
export let MOCK_PAYRUNS: Payrun[] = [
  {
    id: '1',
    name: 'August 2026 Regular Payrun',
    structure_id: '1',
    structure_name: 'Executive & Management Structure',
    period_start: '2026-08-01',
    period_end: '2026-08-31',
    status: 'paid',
    employee_count: 3,
    total_net: 18900,
    warnings: [],
    payslips: [
      { id: '501', employee_id: '1', employee_name: 'Sophia Chen', status: 'paid', worked_days: 22, basic: 8500, allowances: 2500, deductions: 1050, gross: 11000, net: 9950 },
      { id: '502', employee_id: '2', employee_name: 'Marcus Vance', status: 'paid', worked_days: 22, basic: 7200, allowances: 2240, deductions: 920, gross: 9440, net: 8520 },
    ],
  },
  {
    id: '2',
    name: 'September 2026 Engineering Payrun',
    structure_id: '2',
    structure_name: 'Standard Engineering Structure',
    period_start: '2026-09-01',
    period_end: '2026-09-30',
    status: 'computed',
    employee_count: 2,
    total_net: 11500,
    warnings: ['Elena Rostova: 1 attendance punch without check-out'],
    payslips: [
      { id: '503', employee_id: '4', employee_name: 'David Miller', status: 'computed', worked_days: 22, basic: 6800, allowances: 550, deductions: 694, gross: 7350, net: 6656 },
      { id: '504', employee_id: '6', employee_name: 'Liam Johnson', status: 'computed', worked_days: 22, basic: 5000, allowances: 550, deductions: 550, gross: 5550, net: 5000 },
    ],
  },
];

export let MOCK_PAYSLIP_DETAILS: Record<string, PayslipDetail> = {
  '501': {
    id: '501',
    employee_id: '1',
    employee_name: 'Sophia Chen',
    structure_id: '1',
    structure_name: 'Executive & Management Structure',
    payrun_id: '1',
    period_start: '2026-08-01',
    period_end: '2026-08-31',
    status: 'paid',
    worked_days: 22,
    basic: 8500,
    allowances: 2500,
    deductions: 1050,
    gross: 11000,
    net: 9950,
    lines: [
      { rule_id: '1', category: 'Basic', name: 'Basic Salary (100% Wage)', amount: 8500 },
      { rule_id: '2', category: 'Allowance', name: 'House Rent Allowance (20%)', amount: 1700 },
      { rule_id: '3', category: 'Allowance', name: 'Executive Special Allowance', amount: 800 },
      { rule_id: '4', category: 'Deduction', name: 'Income Tax Deduction (10%)', amount: -850 },
      { rule_id: '5', category: 'Deduction', name: 'Provident Fund (PF)', amount: -200 },
    ],
  },
  '503': {
    id: '503',
    employee_id: '4',
    employee_name: 'David Miller',
    structure_id: '2',
    structure_name: 'Standard Engineering Structure',
    payrun_id: '2',
    period_start: '2026-09-01',
    period_end: '2026-09-30',
    status: 'computed',
    worked_days: 22,
    basic: 6800,
    allowances: 550,
    deductions: 694,
    gross: 7350,
    net: 6656,
    lines: [
      { rule_id: '6', category: 'Basic', name: 'Basic Salary (100% Wage)', amount: 6800 },
      { rule_id: '7', category: 'Allowance', name: 'Tech & Internet Allowance', amount: 300 },
      { rule_id: '8', category: 'Allowance', name: 'Medical Allowance', amount: 250 },
      { rule_id: '9', category: 'Deduction', name: 'Tax Deduction (8%)', amount: -544 },
      { rule_id: '10', category: 'Deduction', name: 'PF Contribution', amount: -150 },
    ],
  },
};

// DASHBOARD SUMMARY STATS
export let MOCK_DASHBOARD: DashboardSummary = {
  total_net_paid: 48900,
  payslips_generated: 12,
  average_salary: 6500,
  approved_time_off_count: 4,
  attendance_health_pct: 96,
};

// SALARY BY DEPARTMENT (Chart)
export let MOCK_SALARY_BY_DEPT: SalaryByDepartment[] = [
  { department_id: '1', department_name: 'Executive Leadership', headcount: 1, total_salary: 8500 },
  { department_id: '2', department_name: 'Human Resources', headcount: 1, total_salary: 8500 },
  { department_id: '3', department_name: 'Engineering & Product', headcount: 2, total_salary: 11800 },
  { department_id: '4', department_name: 'Finance & Payroll', headcount: 2, total_salary: 12600 },
  { department_id: '5', department_name: 'Sales & Customer Success', headcount: 1, total_salary: 6000 },
];

// NET SALARY TREND (6-Month Chart)
export let MOCK_SALARY_TREND: NetSalaryTrend[] = [
  { month: 'Apr 2026', net_total: 28500 },
  { month: 'May 2026', net_total: 29000 },
  { month: 'Jun 2026', net_total: 29500 },
  { month: 'Jul 2026', net_total: 30000 },
  { month: 'Aug 2026', net_total: 18900 },
  { month: 'Sep 2026', net_total: 30400 },
];

// ATTENDANCE OVERVIEW (Donut Chart)
export let MOCK_ATTENDANCE_OVERVIEW: AttendanceOverview = {
  present: 4,
  late: 1,
  absent: 1,
  overtime: 0,
  missing_checkouts: 1,
  manual_edits: 0,
  coverage_pct: 94,
};
