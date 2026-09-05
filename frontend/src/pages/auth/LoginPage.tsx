import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import {
  Lock,
  Mail,
  ShieldCheck,
  AlertCircle,
  Users,
  Clock,
  CalendarDays,
  CircleDollarSign,
  ChevronRight,
  Wifi,
} from 'lucide-react';

const WORKFLOW_STEPS = [
  { icon: Users, label: 'Employees', sub: 'Hire & onboard' },
  { icon: Clock, label: 'Attendance', sub: 'Track & audit' },
  { icon: CalendarDays, label: 'Time Off', sub: 'Approve & balance' },
  { icon: CircleDollarSign, label: 'Payroll', sub: 'Compute & disburse' },
];

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'credentials' | 'network' | 'validation' | null>(null);

  const { login } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (loginEmail: string, loginPassword: string) => {
    setErrorMessage(null);
    setErrorType(null);
    setLoading(true);

    try {
      const user = await login(loginEmail, loginPassword);
      success(`Welcome back, ${user.name || user.email}!`, 'Signed In');
      navigate('/dashboard');
    } catch (err: any) {
      const status = (err as any).status;
      if (status === 401) {
        setErrorType('credentials');
        setErrorMessage('Invalid email or password. Please check your credentials and try again.');
      } else if (!status || err.message?.includes('connect')) {
        setErrorType('network');
        setErrorMessage('Unable to reach the server. Please ensure the backend is running and try again.');
      } else {
        setErrorType('credentials');
        setErrorMessage(err.message || 'Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorType('validation');
      setErrorMessage('Work email is required.');
      return;
    }
    if (!password) {
      setErrorType('validation');
      setErrorMessage('Password is required.');
      return;
    }
    await handleLogin(email, password);
  };
  return (
    <div className="min-h-screen bg-slate-950 flex">

      {/* ── LEFT PANEL: Branding ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-between p-12 xl:p-16 relative overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-linear-to-br from-slate-900 via-indigo-950/80 to-slate-950" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-600/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 to-teal-500 flex items-center justify-center shadow-lg border border-white/10">
              <span className="font-black text-white text-lg tracking-tighter">P</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              People<span className="text-teal-400">Pay360</span>
            </span>
          </div>

          {/* Main headline */}
          <div className="my-auto space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                Enterprise HRMS + Payroll
              </div>
              <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight">
                Your workforce,<br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-teal-400 to-indigo-400">
                  connected.
                </span>
              </h1>
              <p className="text-slate-300 text-base leading-relaxed max-w-sm font-normal">
                Secure access to workforce operations, attendance, leave management and autonomous payroll — all in one platform.
              </p>
            </div>

            {/* Workflow visualization */}
            <div className="pt-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">End-to-end workflow</p>
              <div className="flex items-start gap-0">
                {WORKFLOW_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <React.Fragment key={step.label}>
                      <div className="flex flex-col items-center gap-2 group">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center group-hover:border-indigo-500/40 group-hover:bg-indigo-950/40 transition-all duration-300">
                          <Icon className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-bold text-slate-300">{step.label}</div>
                          <div className="text-2xs text-slate-600 mt-0.5">{step.sub}</div>
                        </div>
                      </div>
                      {idx < WORKFLOW_STEPS.length - 1 && (
                        <div className="flex items-center mt-4 px-1">
                          <ChevronRight className="w-4 h-4 text-slate-700" />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Compliance badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              {['JWT Secured', 'Role-Based Access', '5-Layer RBAC', 'Real-time Payroll'].map((badge) => (
                <span
                  key={badge}
                  className="px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/40 text-slate-400 text-2xs font-semibold"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-slate-600 text-2xs mt-auto font-mono">
            PeoplePay360 · Odoo Hackathon 2026 · All credentials validated server-side
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Auth Form ── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 bg-slate-950 lg:bg-slate-900/50">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-600 to-teal-500 flex items-center justify-center">
              <span className="font-black text-white text-base tracking-tighter">P</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              People<span className="text-teal-400">Pay360</span>
            </span>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">Authentication Gateway</h2>
            <p className="text-slate-400 text-sm mt-1">
              Sign in with your authorized work credentials to access the platform.
            </p>
          </div>

          {/* Error banner */}
          {errorMessage && (
            <div
              className={`mb-6 p-3.5 rounded-xl border text-sm flex items-start gap-3 animate-fade-in ${
                errorType === 'network'
                  ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
              }`}
            >
              {errorType === 'network' ? (
                <Wifi className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* Sign-in form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Work Email"
              type="email"
              placeholder="name@organization.dev"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrorMessage(null); }}
              icon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
            />
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-indigo-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrorMessage(null); }}
                icon={<Lock className="w-4 h-4" />}
                autoComplete="current-password"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm shadow-lg shadow-indigo-500/20 mt-2"
              isLoading={loading}
              icon={<ShieldCheck className="w-4 h-4" />}
            >
              Sign In to Workspace
            </Button>
            {/* Create account link */}
            <p className="text-center text-xs text-slate-500 mt-1">
              New to PeoplePay360?{' '}
              <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                Create an account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
