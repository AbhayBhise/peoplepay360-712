import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Lock, Mail, ShieldCheck, Sparkles, LogIn } from 'lucide-react';

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
    setErrorMessage(null);

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
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Seeded Demo Logins matching live backend and demo fallback
  const demoAccounts = [
    { label: 'Admin', email: 'admin@peoplepay360.dev', password: 'Admin@123', role: 'Full Admin Access' },
    { label: 'HR Manager', email: 'hr.manager@peoplepay360.dev', password: 'Manager@123', role: 'HR & Employees' },
    { label: 'Payroll Manager', email: 'payroll.manager@peoplepay360.dev', password: 'Payroll@123', role: 'Payruns & Salary Rules' },
    { label: 'Payroll User', email: 'payroll.user@peoplepay360.dev', password: 'Payroll@123', role: 'Payruns & Payslips' },
    { label: 'Employee', email: 'employee.demo@peoplepay360.dev', password: 'Employee@123', role: 'Self Attendance & Leaves' },
  ];

  const handleQuickFill = (accEmail: string, accPass: string) => {
    setEmail(accEmail);
    setPassword(accPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full animate-fade-in my-auto">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-600 to-teal-500 text-white shadow-xl mb-3 border border-white/20">
            <span className="font-extrabold text-2xl tracking-tighter">P</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            People<span className="text-teal-400">Pay360</span>
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200/90 mt-1 font-medium">
            Integrated HR, Attendance & Payroll Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/40">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800">Sign in to your account</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter authorized workforce credentials to access PeoplePay360
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2 animate-fade-in">
              <span className="text-rose-500 font-bold mt-0.5">!</span>
              <span className="flex-1 leading-snug">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Corporate Email Address"
              type="email"
              placeholder="e.g. hr.manager@peoplepay360.dev"
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
              className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 font-semibold text-sm shadow-md"
              isLoading={loading}
              icon={<ShieldCheck className="w-4 h-4" />}
            >
              Sign In to Workspace
            </Button>
          </form>

          {/* Quick Demo Logins Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Demo Quick Sign-In (Click to select role)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.label}
                  type="button"
                  onClick={() => handleQuickFill(acc.email, acc.password)}
                  className="p-2 text-left bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 rounded-lg transition-all group cursor-pointer"
                >
                  <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">
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


