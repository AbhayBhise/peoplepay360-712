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
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Link to Workforce Employee</span>
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            >
              <option value="">— Unlinked System Account —</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} {emp.job_position ? `(${emp.job_position})` : ''}
                </option>
              ))}
            </select>
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
    // Map normalized backend names to UI names if needed
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
          <div className="text-2xs text-slate-400 mt-1">Authorized to sign in</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Suspended / Inactive</span>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">{inactiveCount}</div>
          <div className="text-2xs text-slate-400 mt-1">Access revoked</div>
        </div>
      </div>

      {/* Search & Actions Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by email, name, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Users Table */}
      {loading ? (
        <Spinner label="Loading workforce user registry..." />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-2xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3.5 px-5">User Account / Email</th>
                  <th className="py-3.5 px-5">Employee Name</th>
                  <th className="py-3.5 px-5">Active Roles</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="w-8 h-8 opacity-40" />
                        <p className="font-semibold text-sm">No workforce users found</p>
                        <p className="text-2xs">Try adjusting your search criteria or provision a new user.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isRowActionLoading = actionLoading === u.id;
                    const initials = (u.employeeName || u.email).substring(0, 2).toUpperCase();

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Email & Avatar */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-indigo-600 to-teal-500 text-white font-bold flex items-center justify-center text-xs shadow-2xs shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 dark:text-white block truncate">
                                {u.email}
                              </span>
                              <span className="text-2xs text-slate-400 font-mono">
                                ID: {u.id.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Employee Name */}
                        <td className="py-3.5 px-5">
                          {u.employeeName ? (
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {u.employeeName}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-2xs text-slate-400 italic">
                              Unlinked
                            </span>
                          )}
                        </td>

                        {/* Active Roles */}
                        <td className="py-3.5 px-5">
                          <div className="flex flex-wrap gap-1.5">
                            {u.roles.map((role) => (
                              <RoleBadge key={role} role={role} />
                            ))}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-5">
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Quick Actions */}
                        <td className="py-3.5 px-5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Edit Roles */}
                            <button
                              onClick={() => setEditUser(u)}
                              disabled={isRowActionLoading}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-2xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer disabled:opacity-50"
                              title="Edit user role assignments"
                            >
                              <Edit2 className="w-3 h-3 text-indigo-500" />
                              <span>Edit Roles</span>
                            </button>

                            {/* Deactivate / Reactivate Account */}
                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={isRowActionLoading}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-2xs font-bold border transition cursor-pointer disabled:opacity-50 ${
                                u.isActive
                                  ? 'text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                  : 'text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                              }`}
                              title={u.isActive ? 'Deactivate account' : 'Reactivate account'}
                            >
                              {isRowActionLoading ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : u.isActive ? (
                                <UserX className="w-3 h-3" />
                              ) : (
                                <UserCheck className="w-3 h-3" />
                              )}
                              <span>{u.isActive ? 'Deactivate' : 'Reactivate'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Provision User Modal */}
      {showProvisionModal && (
        <ProvisionUserModal
          employees={employees}
          onClose={() => setShowProvisionModal(false)}
          onCreated={(newUser) => {
            setUsers((prev) => [newUser, ...prev]);
          }}
        />
      )}

      {/* Edit Roles Modal */}
      {editUser && (
        <EditRolesModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onUpdated={(updatedUser) => {
            setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
          }}
        />
      )}

      {/* Audit Trail Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-indigo-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Administrative Audit Trail
                </h2>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1 text-xs">
              {auditLogs.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No audit events recorded yet.</p>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-2xs">
                        {log.action}
                      </span>
                      <span className="text-2xs text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {log.entityType && (
                      <div className="text-2xs text-slate-500 dark:text-slate-400">
                        Target: {log.entityType} ({log.entityId || 'N/A'})
                      </div>
                    )}
                    {log.details && (
                      <pre className="text-2xs bg-slate-950/10 dark:bg-slate-950/60 p-2 rounded-lg font-mono overflow-x-auto text-slate-700 dark:text-slate-300">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-right">
              <Button
                variant="outline"
                onClick={() => setShowAuditModal(false)}
                className="text-xs cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
