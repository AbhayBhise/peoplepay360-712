import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Lock, Mail, User as UserIcon, ShieldCheck, Sparkles, UserPlus, LogIn, CheckCircle2 } from 'lucide-react';
import { Role } from '../../types';

interface LoginPageProps {
  initialMode?: 'login' | 'signup';
}

export const LoginPage: React.FC<LoginPageProps> = ({ initialMode = 'login' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const modeParam = searchParams.get('mode');
  const [mode, setMode] = useState<'login' | 'signup'>(
    modeParam === 'signup' || initialMode === 'signup' ? 'signup' : 'login'
  );

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('Employee');
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { login, register } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (modeParam === 'signup') {
      setMode('signup');
    } else if (modeParam === 'login') {
      setMode('login');
    }
  }, [modeParam]);

  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setErrorMessage(null);
    setSearchParams({ mode: newMode });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (mode === 'login') {
      if (!email || !password) {
        setErrorMessage('Please enter both email and password.');
        return;
      }

      setLoading(true);
      try {
        const user = await login(email, password);
        success(`Welcome back, ${user.name || user.email}!`, 'Signed In Successfully');
        navigate('/dashboard');
      } catch (err: any) {
        setErrorMessage(err.message || 'Login failed. Please verify your credentials.');
      } finally {
        setLoading(false);
      }
    } else {
      // Sign Up Validation
      if (!name.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setErrorMessage('Please enter a valid corporate email address.');
        return;
      }
      if (!password || password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please re-enter.');
        return;
      }

      setLoading(true);
      try {
        const user = await register(name, email, password, selectedRole);
        success(`Account created! Welcome, ${user.name}!`, 'Registration Complete');
        navigate('/dashboard');
      } catch (err: any) {
        setErrorMessage(err.message || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Quick Demo Logins for evaluator convenience
  const demoAccounts = [
    { label: 'Admin', email: 'admin@peoplepay360.com', password: 'password123', role: 'Full Admin Access' },
    { label: 'HR Manager', email: 'hrmanager@peoplepay360.com', password: 'password123', role: 'HR & Employees' },
    { label: 'Payroll Manager', email: 'payrollmanager@peoplepay360.com', password: 'password123', role: 'Payruns & Salary Rules' },
    { label: 'Payroll User', email: 'payrolluser@peoplepay360.com', password: 'password123', role: 'Payruns & Payslips' },
    { label: 'Employee', email: 'employee@peoplepay360.com', password: 'password123', role: 'Self Attendance & Leaves' },
  ];

  const handleQuickFill = (accEmail: string, accPass: string) => {
    switchMode('login');
    setEmail(accEmail);
    setPassword(accPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-[#2d1829] to-[#0d2221] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full animate-fade-in my-auto">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-tr from-[#714B67] to-[#008784] text-white shadow-xl mb-3 border border-white/20">
            <span className="font-extrabold text-2xl tracking-tighter">P</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            People<span className="text-teal-400">Pay360</span>
          </h1>
          <p className="text-xs sm:text-sm text-purple-200/90 mt-1 font-medium">
            Integrated HR, Attendance & Payroll Platform
          </p>
        </div>

        {/* Auth Box Container */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/40">
          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6 border border-slate-200/80">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-[#714B67] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-[#714B67] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          <div className="mb-5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              {mode === 'login' ? 'Sign in to your account' : 'Register new workforce profile'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === 'login'
                ? 'Enter your credentials to access the PeoplePay360 platform'
                : 'Join PeoplePay360 with your corporate profile'}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2 animate-fade-in">
              <span className="text-rose-500 font-bold mt-0.5">!</span>
              <span className="flex-1 leading-snug">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <>
                <Input
                  label="Full Name"
                  placeholder="e.g. Eleanor Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  icon={<UserIcon className="w-4 h-4" />}
                  required
                />

                <Select
                  label="Organizational Role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as Role)}
                  options={[
                    { value: 'Employee', label: 'Employee (Self-service, leaves, attendance)' },
                    { value: 'HR Manager', label: 'HR Manager (Employee lifecycle, org hierarchy)' },
                    { value: 'HR Payroll User', label: 'HR Payroll User (Payrun runs & payslips)' },
                    { value: 'HR Payroll Manager', label: 'HR Payroll Manager (Salary structures & approvals)' },
                    { value: 'Admin', label: 'System Administrator (Full access)' },
                  ]}
                />
              </>
            )}

            <Input
              label="Corporate Email Address"
              type="email"
              placeholder="e.g. employee@peoplepay360.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />

            {mode === 'signup' && (
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                required
              />
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2 py-2.5 bg-[#714B67] hover:bg-[#5a3b52] font-semibold text-sm shadow-md"
              isLoading={loading}
              icon={mode === 'login' ? <ShieldCheck className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            >
              {mode === 'login' ? 'Sign In to Workspace' : 'Create & Access Account'}
            </Button>
          </form>

          {/* Alternate switch link */}
          <div className="mt-4 text-center">
            {mode === 'login' ? (
              <p className="text-xs text-slate-500">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-[#714B67] hover:text-[#5a3b52] font-bold hover:underline cursor-pointer"
                >
                  Create an account
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-[#714B67] hover:text-[#5a3b52] font-bold hover:underline cursor-pointer"
                >
                  Sign In instead
                </button>
              </p>
            )}
          </div>

          {/* Quick Demo Logins Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Demo Quick Sign-In (Click to test)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.label}
                  type="button"
                  onClick={() => handleQuickFill(acc.email, acc.password)}
                  className="p-2 text-left bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-200 rounded-lg transition-all group cursor-pointer"
                >
                  <div className="text-xs font-bold text-slate-800 group-hover:text-[#714B67]">
                    {acc.label}
                  </div>
                  <div className="text-2xs text-slate-500 truncate">{acc.email.split('@')[0]}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

