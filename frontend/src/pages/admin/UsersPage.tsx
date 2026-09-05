import React, { useState, useEffect } from 'react';
import { adminApi, AdminUser } from '../../api/admin';
import { employeesApi } from '../../api/employees';
import { Employee } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';
import { UserPlus, ShieldCheck, UserX, UserCheck, Key, RefreshCw, FileText } from 'lucide-react';

const AVAILABLE_ROLES = [
  { id: 'ADMIN', label: 'Admin', color: 'rose' },
  { id: 'HR_MANAGER', label: 'HR Manager', color: 'teal' },
  { id: 'HR_PAYROLL_MANAGER', label: 'HR Payroll Manager', color: 'emerald' },
  { id: 'HR_PAYROLL_USER', label: 'HR Payroll User', color: 'indigo' },
  { id: 'EMPLOYEE', label: 'Employee', color: 'blue' },
];

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['EMPLOYEE']);
  const [submitting, setSubmitting] = useState(false);

  // Edit Roles Modal State
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editRolesList, setEditRolesList] = useState<string[]>([]);
  const [savingRoles, setSavingRoles] = useState(false);

  const { success, error } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [uList, eList] = await Promise.all([
        adminApi.getUsers(),
        employeesApi.getEmployees().catch(() => []),
      ]);
      setUsers(uList);
      setEmployees(eList);
    } catch (err: any) {
      error(err.message || 'Failed to load user management data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleRole = (roleId: string, isEdit = false) => {
    if (isEdit) {
      setEditRolesList((prev) =>
        prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
      );
    } else {
      setSelectedRoles((prev) =>
        prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
      );
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) {
      error('Email and Password are required');
      return;
    }
    if (selectedRoles.length === 0) {
      error('Select at least one role for the user');
      return;
    }

    setSubmitting(true);
    try {
      const created = await adminApi.createUser({
        email: newEmail,
        password: newPassword,
        roleNames: selectedRoles,
        employeeId: selectedEmployeeId || undefined,
      });
      success(`User ${created.email} provisioned successfully!`);
      setShowCreateModal(false);
      setNewEmail('');
      setNewPassword('');
      setSelectedRoles(['EMPLOYEE']);
      setSelectedEmployeeId('');
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to provision user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (editRolesList.length === 0) {
      error('A user must have at least one role assigned');
      return;
    }

    setSavingRoles(true);
    try {
      await adminApi.updateUserRoles(editingUser.id, editRolesList);
      success(`Roles updated for ${editingUser.email}`);
      setEditingUser(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to update user roles');
    } finally {
      setSavingRoles(false);
    }
  };

  const handleToggleActive = async (userObj: AdminUser) => {
    try {
      if (userObj.isActive) {
        await adminApi.deactivateUser(userObj.id);
        success(`Account ${userObj.email} deactivated`);
      } else {
        await adminApi.reactivateUser(userObj.id);
        success(`Account ${userObj.email} reactivated`);
      }
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to update account status');
    }
  };

  const handleOpenAudit = async () => {
    try {
      const logs = await adminApi.getAuditLogs();
      setAuditLogs(logs);
      setShowAuditModal(true);
    } catch (err: any) {
      error(err.message || 'Failed to fetch audit logs');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight">Workforce User Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              Admin Provisioning
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Provision workforce accounts, assign enterprise roles, and manage active status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleOpenAudit}
            icon={<FileText className="w-4 h-4" />}
          >
            Audit Trail
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            icon={<UserPlus className="w-4 h-4" />}
          >
            Provision New User
          </Button>
        </div>
      </div>

      {/* User Registry Table */}
      {loading ? (
        <Spinner label="Fetching workforce user directory..." />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-2xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">User Account</th>
                  <th className="py-3 px-4">Linked Employee</th>
                  <th className="py-3 px-4">Assigned Roles</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {u.email}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {u.employeeName ? (
                        <span className="font-medium">{u.employeeName}</span>
                      ) : (
                        <span className="text-slate-400 italic">Unlinked</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => {
                          const conf = AVAILABLE_ROLES.find((ar) => ar.id === r || ar.label === r);
                          return (
                            <span
                              key={r}
                              className="px-2 py-0.5 rounded-md text-2xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                            >
                              {conf?.label || r}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {u.isActive ? (
                        <Badge variant="active">Active</Badge>
                      ) : (
                        <Badge variant="danger">Deactivated</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setEditRolesList(u.roles);
                          }}
                          className="px-2.5 py-1 text-2xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
                        >
                          Edit Roles
                        </button>
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`px-2.5 py-1 text-2xs font-semibold rounded-lg transition-colors ${
                            u.isActive
                              ? 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 hover:bg-rose-100'
                              : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                          }`}
                        >
                          {u.isActive ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Provision New User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Provision New Workforce User"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Corporate Work Email *"
            type="email"
            placeholder="e.g. john.doe@peoplepay360.dev"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />

          <Input
            label="Initial Password *"
            type="password"
            placeholder="Minimum 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Link Existing Employee (Optional)
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Select Employee Record --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.email || emp.job_position || 'Staff'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Assign User Roles *
            </label>
            <div className="space-y-2">
              {AVAILABLE_ROLES.map((r) => (
                <label
                  key={r.id}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-indigo-50/50"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(r.id)}
                    onChange={() => handleToggleRole(r.id)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {r.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={submitting}>
              Provision Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Roles Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Edit Roles for ${editingUser?.email}`}
      >
        <form onSubmit={handleUpdateRoles} className="space-y-4">
          <div className="space-y-2">
            {AVAILABLE_ROLES.map((r) => (
              <label
                key={r.id}
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-indigo-50/50"
              >
                <input
                  type="checkbox"
                  checked={editRolesList.includes(r.id) || editRolesList.includes(r.label)}
                  onChange={() => handleToggleRole(r.id, true)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {r.label}
                </span>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={savingRoles}>
              Save Roles
            </Button>
          </div>
        </form>
      </Modal>

      {/* Audit Log Modal */}
      <Modal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        title="Workforce Security & Administrative Audit Trail"
      >
        <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500">No audit log entries recorded yet.</p>
          ) : (
            auditLogs.map((log: any) => (
              <div
                key={log.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1"
              >
                <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                  <span>{log.module} &bull; {log.action}</span>
                  <span className="text-2xs font-mono text-slate-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-2xs font-mono text-slate-500">
                  Record ID: {log.recordId || 'N/A'} | IP: {log.ipAddress || '127.0.0.1'}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};

export default UsersPage;
