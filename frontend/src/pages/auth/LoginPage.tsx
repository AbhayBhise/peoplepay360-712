import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { login } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const user = await login(email, password);
      success(`Welcome back, ${user.name || user.email}!`, 'Signed in');
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Logins for evaluator convenience
  const demoAccounts = [
    { label: 'Admin', email: 'admin@peoplepay360.com', password: 'password123', role: 'Full Admin Access' },
    { label: 'HR Manager', email: 'hrmanager@peoplepay360.com', password: 'password123', role: 'HR Operations & Employees' },
    { label: 'Payroll Manager', email: 'payrollmanager@peoplepay360.com', password: 'password123', role: 'Payruns & Salary Rules' },
    { label: 'Payroll User', email: 'payrolluser@peoplepay360.com', password: 'password123', role: 'Payruns & Payslips' },
    { label: 'Employee', email: 'employee@peoplepay360.com', password: 'password123', role: 'Self Attendance & Time Off' },
  ];

  const handleQuickFill = (accEmail: string, accPass: string) => {
    setEmail(accEmail);
    setPassword(accPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-[#3d2136] to-[#122b2a] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full animate-fade-in">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-tr from-[#714B67] to-[#008784] text-white shadow-xl mb-3 border border-white/20">
            <span className="font-extrabold text-2xl tracking-tighter">P</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            People<span className="text-teal-400">Pay360</span>
          </h1>
          <p className="text-sm text-purple-200 mt-1">
            Enterprise Integrated HR & Payroll Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/40">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">Sign in to your account</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your credentials to access the live PeoplePay360 platform
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2 animate-fade-in">
              <span className="text-rose-500 font-bold mt-0.5">!</span>
              <span className="flex-1 leading-snug">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. admin@peoplepay360.com"
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

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2 py-2.5 bg-[#714B67] hover:bg-[#5a3b52] font-semibold text-sm shadow-md"
              isLoading={loading}
              icon={<ShieldCheck className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Logins Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Demo Quick Sign-In (Click to fill)</span>
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
