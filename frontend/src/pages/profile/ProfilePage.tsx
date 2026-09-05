import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  KeyRound,
  Building2,
  Briefcase,
  Mail,
  Calendar,
  UserCheck,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { authApi, UserProfile } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';

export const ProfilePage: React.FC = () => {
  const { user: authUser, logout } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await authApi.getMe();
      setProfile(data);
    } catch (err: any) {
      error(err.message || 'Failed to retrieve profile credentials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      success('Logged out successfully.');
      navigate('/', { replace: true });
    } catch (err: any) {
      error(err.message || 'Failed to sign out.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      error('Please enter your current password.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      error('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      error('New password and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authApi.changePassword({ currentPassword, newPassword });
      success(res.message || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      error(err.message || 'Failed to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Spinner label="Loading profile credentials..." />;
  }

  const displayName = profile?.name || authUser?.name || 'Team Member';
  const displayEmail = profile?.email || authUser?.email || '';
  const displayRoles = profile?.roles || authUser?.roles || ['Employee'];
  const departmentName = profile?.department?.name || 'General';
  const managerName = profile?.manager?.name || 'Direct Leadership';
  const jobPosition = profile?.jobPosition || 'Enterprise Staff';
  const employeeId = profile?.employee_id || 'System User';
  const memberSince = profile?.memberSince ? new Date(profile.memberSince).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'September 2026';

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-linear-to-tr from-indigo-600 to-teal-400 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg border-2 border-white/20 shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight truncate">
                {displayName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Active Account
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-medium truncate flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>{displayEmail}</span>
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {displayRoles.map((role) => (
                <span
                  key={role}
                  className="px-2.5 py-0.5 rounded-md text-2xs font-semibold bg-indigo-600/30 text-indigo-200 border border-indigo-400/30"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Sign Out Button - Exclusively on Profile Page */}
        <div className="shrink-0 pt-2 sm:pt-0">
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={handleLogout}
            icon={<LogOut className="w-4 h-4" />}
            className="w-full sm:w-auto shadow-md font-bold"
          >
            Sign Out
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Identity Details Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Identity & Employment Record</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Read-only master HR registry parameters associated with your profile</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <div className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Job Position</span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{jobPosition}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <div className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-teal-500" />
                  <span>Department</span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{departmentName}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <div className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Reporting Manager</span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{managerName}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <div className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Member Since</span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{memberSince}</p>
              </div>

              <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                <div className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Employee / User Identifier</span>
                </div>
                <p className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all">{employeeId}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* 2. Security / Change Password Form */}
        <div className="space-y-6">
          <Card>
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Account Security</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Update your password credentials</p>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    minLength={8}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    minLength={8}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={submitting}
                  className="w-full justify-center"
                  icon={<KeyRound className="w-4 h-4" />}
                >
                  {submitting ? 'Updating Password...' : 'Change Password'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
