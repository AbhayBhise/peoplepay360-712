import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Mail, ArrowLeft, ShieldCheck } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { success } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      success('If that email exists, a password reset link has been sent.', 'Email Sent');
      navigate('/login');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full animate-fade-in my-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-600 to-teal-500 text-white shadow-xl mb-3 border border-white/20">
            <span className="font-extrabold text-2xl tracking-tighter">P</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            People<span className="text-teal-400">Pay360</span>
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200/90 mt-1 font-medium">
            Password Recovery
          </p>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/40 dark:border-slate-800">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Forgot Password</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Enter your corporate email address to receive a reset link.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-medium flex items-start gap-2 animate-fade-in">
              <span className="text-rose-500 dark:text-rose-400 font-bold mt-0.5">!</span>
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

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 font-semibold text-sm shadow-md"
              isLoading={loading}
              icon={<ShieldCheck className="w-4 h-4" />}
            >
              Send Reset Link
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
