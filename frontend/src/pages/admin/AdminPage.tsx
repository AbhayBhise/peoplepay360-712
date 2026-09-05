import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  ShieldCheck,
  UserX,
  UserCheck,
  Edit2,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  Search,
  RefreshCw,
  Lock,
  Mail,
  Link2,
  CheckCircle2,
} from 'lucide-react';
import { adminApi, AdminUser, RoleName, ROLE_LABELS, ALL_ROLES, ROLE_COLORS, CreateUserPayload } from '../../api/admin';
import { employeesApi } from '../../api/employees';
import { Employee } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';

// ── Role badge ────────────────────────────────────────────────────────────────
const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const colorClass = ROLE_COLORS[role as RoleName] ?? 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold border ${colorClass}`}>
      <ShieldCheck className="w-2.5 h-2.5" />
      {ROLE_LABELS[role as RoleName] ?? role}
    </span>
  );
};

// ── Create User Modal ─────────────────────────────────────────────────────────
interface CreateUserModalProps {
  employees: Employee[];
  onClose: () => void;
  onCreated: (user: AdminUser) => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ employees, onClose, onCreated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<RoleName[]>(['EMPLOYEE']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success } = useToast();

  const toggleRole = (role: RoleName) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError('Work email is required.'); return; }
    if (!password) { setError('Password is required.'); return; }
    if (selectedRoles.length === 0) { setError('Assign at least one role.'); return; }

    setLoading(true);
    try {
      const payload: CreateUserPayload = {
        email: email.trim(),
        password,
        employeeId: employeeId || null,
        roleNames: selectedRoles,
      };
      const created = await adminApi.createUser(payload);
      success(`User ${created.email} created successfully.`, 'User Created');
      onCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center">
              <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Create User Account</h2>
              <p className="text-2xs text-slate-500 dark:text-slate-400">Provision login credentials + assign role</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Email */}
          <Input
            label="Work Email"
            type="email"
            placeholder="employee@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4" />}
            required
          />

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Initial Password
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 chars, 1 uppercase, 1 number"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Link to employee */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1"><Link2 className="w-3.5 h-3.5" /> Link to Employee Record <span className="text-slate-400 font-normal">(optional)</span></span>
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="">— Not linked to an employee —</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} {emp.job_position ? `(${emp.job_position})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Role assignment */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Assign Role(s)
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {ALL_ROLES.map((role) => {
                const selected = selectedRoles.includes(role);
                const colorClass = ROLE_COLORS[role];
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selected
                        ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 dark:border-indigo-600'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${selected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600'}`}>
                      {selected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{ROLE_LABELS[role]}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-2xs font-bold border ${colorClass}`}>{role}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 text-sm cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-sm cursor-pointer" icon={<Plus className="w-4 h-4" />}>
              Create User
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Change Role Modal ─────────────────────────────────────────────────────────
interface ChangeRoleModalProps {
  user: AdminUser;
  onClose: () => void;
  onUpdated: (user: AdminUser) => void;
}

const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({ user, onClose, onUpdated }) => {
  const [selectedRoles, setSelectedRoles] = useState<RoleName[]>(user.roles as RoleName[]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success } = useToast();

  const toggleRole = (role: RoleName) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRoles.length === 0) { setError('Assign at least one role.'); return; }
    setLoading(true);
    setError(null);
    try {
      const updated = await adminApi.updateRoles(user.id, { roleNames: selectedRoles });
      success(`Roles updated for ${updated.email}`, 'Roles Updated');
      onUpdated(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update roles.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Change Role</h2>
            <p className="text-2xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <div className="grid grid-cols-1 gap-1.5">
            {ALL_ROLES.map((role) => {
              const selected = selectedRoles.includes(role);
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selected
                      ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 dark:border-indigo-600'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${selected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600'}`}>
                    {selected && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex-1">{ROLE_LABELS[role]}</span>
                  <span className={`px-2 py-0.5 rounded-full text-2xs font-bold border ${ROLE_COLORS[role]}`}>{role}</span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 text-sm cursor-pointer">Cancel</Button>
            <Button type="submit" variant="primary" isLoading={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-sm cursor-pointer" icon={<ShieldCheck className="w-4 h-4" />}>
              Save Roles
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main AdminPage ────────────────────────────────────────────────────────────
export const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { error: toastError, success } = useToast();
  const { isAdmin } = useAuth();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, empData] = await Promise.all([
        adminApi.listUsers(),
        employeesApi.getAll(),
      ]);
      setUsers(usersData);
      setEmployees(empData);
    } catch (err: any) {
      toastError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleActive = async (user: AdminUser) => {
    setActionLoading(user.id);
    try {
      const updated = user.isActive
        ? await adminApi.deactivate(user.id)
        : await adminApi.reactivate(user.id);
      setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
      success(`${updated.email} has been ${updated.isActive ? 'reactivated' : 'deactivated'}.`);
    } catch (err: any) {
      toastError(err.message || 'Action failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.employeeName ?? '').toLowerCase().includes(q) ||
      u.roles.some((r) => r.toLowerCase().includes(q))
    );
  });

  // Guard: only ADMIN can see this page
  if (!isAdmin()) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-rose-600 dark:text-rose-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Access Restricted</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
          This page is only accessible to Administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center">
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">User Management</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 ml-10">
            Create accounts, assign roles and manage access for all platform users.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchUsers}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            icon={<Plus className="w-4 h-4" />}
            className="bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 text-sm cursor-pointer"
          >
            Create User
          </Button>
        </div>
      </div>

      {/* RBAC explanation card */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {ALL_ROLES.map((role) => (
          <div
            key={role}
            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5"
          >
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold border ${ROLE_COLORS[role]}`}>
              <ShieldCheck className="w-2.5 h-2.5" />
              {ROLE_LABELS[role]}
            </span>
            <p className="text-2xs text-slate-500 dark:text-slate-400">
              {role === 'EMPLOYEE' && 'Self attendance, leave & payslips'}
              {role === 'HR_MANAGER' && 'Employees, contracts, schedules'}
              {role === 'HR_PAYROLL_USER' && 'Payruns & payslip processing'}
              {role === 'HR_PAYROLL_MANAGER' && 'Salary rules, validate payruns'}
              {role === 'ADMIN' && 'Full system access + user mgmt'}
            </p>
          </div>
        ))}
      </div>

      {/* Search + Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by email, name or role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>
          <span className="text-xs text-slate-400 shrink-0">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-500">Loading users…</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">
              {search ? 'No users match your search.' : 'No user accounts yet. Create the first one.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="text-left px-5 py-3 text-2xs font-bold uppercase tracking-wider text-slate-400">User</th>
                  <th className="text-left px-5 py-3 text-2xs font-bold uppercase tracking-wider text-slate-400">Employee</th>
                  <th className="text-left px-5 py-3 text-2xs font-bold uppercase tracking-wider text-slate-400">Roles</th>
                  <th className="text-left px-5 py-3 text-2xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="text-right px-5 py-3 text-2xs font-bold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    {/* User */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300 shrink-0">
                          {user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white text-xs">{user.email}</div>
                          <div className="text-2xs text-slate-400 font-mono">{user.id.slice(0, 8)}…</div>
                        </div>
                      </div>
                    </td>
                    {/* Employee link */}
                    <td className="px-5 py-3.5">
                      {user.employeeName ? (
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{user.employeeName}</div>
                      ) : (
                        <span className="text-2xs text-slate-400 italic">Not linked</span>
                      )}
                    </td>
                    {/* Roles */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length > 0
                          ? user.roles.map((r) => <RoleBadge key={r} role={r} />)
                          : <span className="text-2xs text-slate-400 italic">No roles</span>
                        }
                      </div>
                    </td>
                    {/* Status */}
                    <td className="px-5 py-3.5">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-2xs font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-2xs font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Inactive
                        </span>
                      )}
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditUser(user)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                          title="Change role"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          disabled={actionLoading === user.id}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
                            user.isActive
                              ? 'text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                              : 'text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                          title={user.isActive ? 'Deactivate' : 'Reactivate'}
                        >
                          {actionLoading === user.id ? (
                            <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                          ) : user.isActive ? (
                            <UserX className="w-3.5 h-3.5" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal
          employees={employees}
          onClose={() => setShowCreateModal(false)}
          onCreated={(u) => setUsers((prev) => [u, ...prev])}
        />
      )}
      {editUser && (
        <ChangeRoleModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onUpdated={(u) => setUsers((prev) => prev.map((x) => x.id === u.id ? u : x))}
        />
      )}
    </div>
  );
};

export default AdminPage;
