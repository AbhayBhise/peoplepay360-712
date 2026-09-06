import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
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
  Shield,
  Clock,
  Sparkles,
  FileText,
} from 'lucide-react';
import { adminApi, AdminUser, ROLE_LABELS, PROVISION_ROLES, ROLE_COLORS, AuditLog } from '../../api/admin';
import { employeesApi } from '../../api/employees';
import { Employee } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';
import { Select } from '../../components/common/Select';
import { Spinner } from '../../components/common/Spinner';

// ── Role badge ────────────────────────────────────────────────────────────────
const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const colorClass =
    ROLE_COLORS[role] ??
    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  const label = ROLE_LABELS[role] ?? role;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold border shadow-2xs ${colorClass}`}
    >
      <ShieldCheck className="w-2.5 h-2.5 shrink-0" />
      {label}
    </span>
  );
};

// ── Provision New User Modal ──────────────────────────────────────────────────
interface ProvisionUserModalProps {
  employees: Employee[];
  onClose: () => void;
  onCreated: (user: AdminUser) => void;
}

const ProvisionUserModal: React.FC<ProvisionUserModalProps> = ({
  employees,
  onClose,
  onCreated,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Employee']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success } = useToast();

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Corporate work email is required.');
      return;
    }
    if (!password || password.length < 8) {
      setError('Initial password must be at least 8 characters long.');
      return;
    }
    if (selectedRoles.length === 0) {
      setError('Select at least one active workforce role for this account.');
      return;
    }

    setLoading(true);
    try {
      const created = await adminApi.createUser({
        email: email.trim(),
        password,
        employeeId: employeeId || undefined,
        roleNames: selectedRoles,
      });
      success(`User account provisioned for ${created.email}`, 'User Provisioned');
      onCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to provision user account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Provision New User
              </h2>
              <p className="text-2xs text-slate-500 dark:text-slate-400">
                Create workforce credentials and assign system roles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Email */}
          <Input
            label="Corporate Work Email"
            type="email"
            placeholder="user@peoplepay360.dev"
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
                placeholder="Minimum 8 characters"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-2xs text-slate-400">User will be prompted to manage password upon signing in.</p>
          </div>

          {/* Linked Employee */}
          <div className="space-y-1.5">
            <Select
              label="Link to Workforce Employee"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              options={[
                { value: '', label: '— Unlinked System Account —' },
                ...employees.map((emp) => ({
                  value: emp.id,
                  label: `${emp.name} ${emp.job_position ? `(${emp.job_position})` : ''}`,
                })),
              ]}
              placeholder="— Unlinked System Account —"
            />
          </div>

          {/* Select Roles */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>Assign Role Permissions</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {PROVISION_ROLES.map((role) => {
                const isSelected = selectedRoles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 dark:border-indigo-600 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex-1">
                      {role}
                    </span>
                    <RoleBadge role={role} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 text-sm cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-sm cursor-pointer"
              icon={<UserPlus className="w-4 h-4" />}
            >
              Provision Account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Edit Roles Modal ──────────────────────────────────────────────────────────
interface EditRolesModalProps {
  user: AdminUser;
  onClose: () => void;
  onUpdated: (user: AdminUser) => void;
}

const EditRolesModal: React.FC<EditRolesModalProps> = ({ user, onClose, onUpdated }) => {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(() => {
    return user.roles.map((r) => ROLE_LABELS[r] ?? r);
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success } = useToast();

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRoles.length === 0) {
      setError('Assign at least one active role.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const updated = await adminApi.updateUserRoles(user.id, selectedRoles);
      success(`Roles updated for ${updated.email}`, 'Permissions Saved');
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Edit User Roles</h2>
            <p className="text-2xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2">
            {PROVISION_ROLES.map((role) => {
              const isSelected = selectedRoles.includes(role);
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 dark:border-indigo-600 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex-1">
                    {role}
                  </span>
                  <RoleBadge role={role} />
                </button>
              );
            })}
          </div>

          <div className="flex gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 text-sm cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-sm cursor-pointer"
              icon={<ShieldCheck className="w-4 h-4" />}
            >
              Update Roles
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

import { Pagination } from '../../components/common/Pagination';

// ── Main UsersPage Component ──────────────────────────────────────────────────
export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { error: toastError, success } = useToast();
  const { isAdmin } = useAuth();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, empData] = await Promise.all([
        adminApi.getUsers(),
        employeesApi.getEmployees().catch(() => []),
      ]);
      setUsers(usersData);
      setEmployees(empData);
    } catch (err: any) {
      toastError(err.message || 'Failed to retrieve workforce user registry.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleStatus = async (targetUser: AdminUser) => {
    setActionLoading(targetUser.id);
    try {
      const updated = targetUser.isActive
        ? await adminApi.deactivateUser(targetUser.id)
        : await adminApi.reactivateUser(targetUser.id);

      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      success(
        `${updated.email} has been ${updated.isActive ? 'reactivated' : 'deactivated'}.`,
        'Status Updated'
      );
    } catch (err: any) {
      toastError(err.message || 'Failed to modify user access status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenAuditLogs = async () => {
    try {
      const logs = await adminApi.getAuditLogs();
      setAuditLogs(logs || []);
      setShowAuditModal(true);
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch audit log trail.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const emailMatch = u.email.toLowerCase().includes(q);
    const nameMatch = (u.employeeName ?? '').toLowerCase().includes(q);
    const roleMatch = u.roles.some((r) => r.toLowerCase().includes(q) || (ROLE_LABELS[r] ?? '').toLowerCase().includes(q));
    return emailMatch || nameMatch || roleMatch;
  });

  // Access check
  if (!isAdmin()) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center shadow-inner">
          <Shield className="w-8 h-8 text-rose-600 dark:text-rose-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Admin Privileges Required</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
          Workforce user provisioning and role administration are restricted exclusively to Enterprise Administrators.
        </p>
      </div>
    );
  }

  const activeCount = users.filter((u) => u.isActive).length;
  const inactiveCount = users.filter((u) => !u.isActive).length;

  return (
    <div className="space-y-6 animate-fade-in text-slate-900 dark:text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Shield className="w-3 h-3 text-indigo-500" />
              Enterprise Administration
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            User Management & Role Provisioning
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Provision workforce accounts, configure multi-tier RBAC permissions, and enforce security policies.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={handleOpenAuditLogs}
            className="text-xs cursor-pointer"
            icon={<FileText className="w-3.5 h-3.5" />}
          >
            Audit Trail
          </Button>

          <Button
            variant="primary"
            onClick={() => setShowProvisionModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-xs shadow-md shadow-indigo-500/20 cursor-pointer"
            icon={<UserPlus className="w-4 h-4" />}
          >
            Provision New User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Workforce Users</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{users.length}</div>
          <div className="text-2xs text-slate-400 mt-1">Authenticated system identities</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Access</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{activeCount}</div>
          <div className="text-2xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">Can authenticate into workspace</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Deactivated</span>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">{inactiveCount}</div>
          <div className="text-2xs text-rose-600/70 dark:text-rose-400/70 mt-1">Access suspended</div>
        </div>
      </div>

      {/* Toolbar & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search email, name, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Users Registry Table */}
      {loading ? (
        <Spinner label="Loading workforce user registry..." />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-2xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-5">System Account</th>
                  <th className="py-3.5 px-5">Linked Employee</th>
                  <th className="py-3.5 px-5">Assigned Roles</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No matching workforce users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Email */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-linear-to-tr from-indigo-500 to-teal-400 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                            {u.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{u.email}</span>
                            </div>
                            <div className="text-2xs text-slate-400 font-mono">User ID: #{u.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Linked Employee */}
                      <td className="py-4 px-5 font-medium text-slate-700 dark:text-slate-200">
                        {u.employeeName ? (
                          <div className="flex items-center gap-1.5">
                            <Link2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>{u.employeeName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-2xs italic font-mono">
                            Unlinked System Account
                          </span>
                        )}
                      </td>

                      {/* Roles */}
                      <td className="py-4 px-5">
                        <div className="flex flex-wrap gap-1.5">
                          {u.roles.map((r) => (
                            <RoleBadge key={r} role={r} />
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-bold ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditUser(u)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300 hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit Roles</span>
                          </button>

                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={actionLoading === u.id}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                              u.isActive
                                ? 'text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/70'
                                : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/70'
                            }`}
                          >
                            {u.isActive ? (
                              <>
                                <UserX className="w-3.5 h-3.5" />
                                <span>Deactivate</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Reactivate</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredUsers.length / itemsPerPage)}
            totalItems={filteredUsers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(size) => {
              setItemsPerPage(size);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Modals */}
      {showProvisionModal && (
        <ProvisionUserModal
          employees={employees}
          onClose={() => setShowProvisionModal(false)}
          onCreated={(newUser) => {
            setUsers((prev) => [newUser, ...prev]);
          }}
        />
      )}

      {editUser && (
        <EditRolesModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onUpdated={(updated) => {
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
          }}
        />
      )}

      {/* Audit Log Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Administrative Audit Trail
                  </h2>
                  <p className="text-2xs text-slate-500 dark:text-slate-400">
                    Real-time security log of user creation, role changes, and system events
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {auditLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No audit trail events recorded yet.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                      <span className="flex items-center gap-2">
                        <span className="text-indigo-600 dark:text-indigo-400 uppercase tracking-wide text-2xs">
                          {log.action}
                        </span>
                        {log.module && (
                          <span className="text-slate-400 dark:text-slate-500 text-2xs">
                            · {log.module}
                          </span>
                        )}
                      </span>
                      <span className="text-2xs text-slate-400 font-mono">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 font-mono text-2xs">
                      By: {log.user?.email || log.userId || 'System'}
                      {log.ipAddress ? ` · IP: ${log.ipAddress}` : ''}
                      {log.recordId ? ` · ID: ${log.recordId.slice(0, 8)}…` : ''}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-right">
              <Button
                variant="outline"
                onClick={() => setShowAuditModal(false)}
                className="text-xs cursor-pointer"
              >
                Close Trail
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
