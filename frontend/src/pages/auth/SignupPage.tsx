import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  Wifi,
} from 'lucide-react';

// Password strength checker
function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-rose-500' };
  if (score === 2) return { score, label: 'Fair', color: 'bg-amber-500' };
  if (score === 3) return { score, label: 'Good', color: 'bg-indigo-500' };
  return { score, label: 'Strong', color: 'bg-emerald-500' };
}

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
];

export const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'validation' | 'conflict' | 'network' | null>(null);

  const { login } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setErrorType(null);

    // Client-side validation
    if (!name.trim() || name.trim().length < 2) {
      setErrorType('validation');
      setErrorMessage('Full name must be at least 2 characters.');
      return;
    }
    if (!email.trim()) {
      setErrorType('validation');
      setErrorMessage('Work email is required.');
      return;
    }
    if (password.length < 8) {
      setErrorType('validation');
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorType('validation');
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // Call real POST /api/auth/register
      const result = await authApi.register({ name: name.trim(), email: email.trim(), password });

      // Store JWT using the same AuthContext flow as login
      // We manually set because register returns same shape as login
      await login(email.trim(), password); // re-use existing login to initialize AuthContext cleanly
      success(`Welcome to PeoplePay360, ${result.user.name || result.user.email}! You've been signed in.`, 'Account Created');
      navigate('/dashboard');
    } catch (err: any) {
      const status = (err as any).status;
      if (status === 409) {
        setErrorType('conflict');
        setErrorMessage('An account with this email already exists. Sign in instead.');
      } else if (!status || err.message?.includes('connect')) {
        setErrorType('network');
        setErrorMessage('Unable to reach the server. Make sure the backend is running.');
      } else {
        setErrorType('validation');
        setErrorMessage(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">

      {/* ── LEFT PANEL: Branding ── */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between p-12 xl:p-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-slate-900 via-indigo-950/80 to-slate-950" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-teal-600/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 w-fit">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 to-teal-500 flex items-center justify-center shadow-lg border border-white/10">
              <span className="font-black text-white text-lg tracking-tighter">P</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              People<span className="text-teal-400">Pay360</span>
            </span>
          </Link>

          {/* Message */}
          <div className="my-auto space-y-6">
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight">
              Join your<br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-teal-400 to-indigo-400">
                organisation.
              </span>
            </h1>
            <p className="text-slate-300 text-base leading-relaxed max-w-sm">
              Create your employee account to access attendance tracking, leave management, and your payslips — all in one place.
            </p>

            {/* Access info cards */}
            <div className="space-y-3 pt-2">
              {[
                { icon: '📋', title: 'Employee Access', desc: 'Self-service attendance, leave & payslips' },
                { icon: '🔒', title: 'Secure by Default', desc: 'JWT authentication, role-based access control' },
                { icon: '⚡', title: 'Instant Access', desc: 'Signed in immediately after registration' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/40">
                  <span className="text-lg leading-none mt-0.5">{item.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-slate-200">{item.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-500">
              Need HR Manager or Payroll access?{' '}
              <span className="text-slate-400">Contact your Administrator — higher roles are assigned by Admin only.</span>
            </p>
          </div>

          <div className="text-slate-600 text-2xs font-mono mt-auto">
            PeoplePay360 · Odoo Hackathon 2026
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Signup Form ── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 bg-slate-950 lg:bg-slate-900/50">
        <div className="w-full max-w-md">

          {/* Back to login */}
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-8 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Sign In
          </Link>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-600 to-teal-500 flex items-center justify-center">
              <span className="font-black text-white text-base tracking-tighter">P</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              People<span className="text-teal-400">Pay360</span>
            </span>
          </div>

          {/* Form header */}
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-white tracking-tight">Create your account</h2>
            <p className="text-slate-400 text-sm mt-1">
              Register to access the employee self-service portal.
            </p>
          </div>

          {/* Error banner */}
          {errorMessage && (
            <div
              className={`mb-5 p-3.5 rounded-xl border text-sm flex items-start gap-3 animate-fade-in ${
                errorType === 'network'
                  ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                  : errorType === 'conflict'
                  ? 'bg-indigo-950/40 border-indigo-800/60 text-indigo-200'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
              }`}
            >
              {errorType === 'network' ? (
                <Wifi className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-current opacity-70 shrink-0 mt-0.5" />
              )}
              <span className="leading-snug">{errorMessage}</span>
              {errorType === 'conflict' && (
                <Link to="/login" className="ml-auto text-indigo-300 underline text-xs shrink-0">Sign in</Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name */}
            <Input
              label="Full Name"
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrorMessage(null); }}
              icon={<User className="w-4 h-4" />}
              autoComplete="name"
              required
            />

            {/* Work Email */}
            <Input
              label="Work Email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrorMessage(null); }}
              icon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
            />

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMessage(null); }}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-700 bg-slate-800/60 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {password && (
                <div className="space-y-1.5 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                        style={{ width: `${(strength.score / 4) * 100}%` }}
                      />
                    </div>
                    <span className={`text-2xs font-bold ${
                      strength.score <= 1 ? 'text-rose-400' :
                      strength.score === 2 ? 'text-amber-400' :
                      strength.score === 3 ? 'text-indigo-400' : 'text-emerald-400'
                    }`}>{strength.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {PASSWORD_RULES.map((rule) => {
                      const ok = rule.test(password);
                      return (
                        <span key={rule.label} className={`flex items-center gap-1 text-2xs transition-colors ${ok ? 'text-emerald-400' : 'text-slate-600'}`}>
                          <CheckCircle2 className={`w-2.5 h-2.5 ${ok ? 'text-emerald-400' : 'text-slate-700'}`} />
                          {rule.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Confirm Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrorMessage(null); }}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-sm text-white placeholder:text-slate-500 bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-rose-600'
                      : confirmPassword && password === confirmPassword
                      ? 'border-emerald-600'
                      : 'border-slate-700'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-2xs text-rose-400 animate-fade-in">Passwords do not match</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-2xs text-emerald-400 flex items-center gap-1 animate-fade-in">
                  <CheckCircle2 className="w-3 h-3" /> Passwords match
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm shadow-lg shadow-indigo-500/20 mt-2"
              isLoading={loading}
              icon={<ShieldCheck className="w-4 h-4" />}
            >
              Create Account
            </Button>
          </form>

          {/* Sign in link */}
          <p className="text-center text-xs text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Sign In
            </Link>
          </p>

          {/* Role notice */}
          <div className="mt-6 p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-2xs text-slate-500 leading-relaxed">
              Self-registration grants <span className="text-slate-400 font-semibold">Employee</span> access only.
              HR Manager, Payroll, and Admin roles are provisioned by your Administrator via the Admin panel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
