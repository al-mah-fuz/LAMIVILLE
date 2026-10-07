import React, { useState } from 'react';
import { X, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, Database, Key, CheckCircle2, UserPlus } from 'lucide-react';
import { signInAdmin, signUpAdmin } from '../../services/authService';
import { isSupabaseConfigured } from '../../lib/supabase';
import { getActiveSiteConfig } from '../../config/site';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  onOpenSetupGuide: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onOpenSetupGuide,
}) => {
  const config = getActiveSiteConfig();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured yet. Please check your credentials in .env.');
      return;
    }

    if (!email.trim() || !password) {
      setError('Please provide both admin email and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    if (mode === 'signup') {
      const res = await signUpAdmin(email, password);
      setLoading(false);

      if (res.error) {
        setError(res.error);
      } else if (res.session && res.user) {
        onLoginSuccess();
        onClose();
      } else {
        setSuccessNotice('Admin account registered in Supabase! If your Supabase project requires email confirmation, please check your inbox, or try signing in.');
        setMode('signin');
      }
    } else {
      const res = await signInAdmin(email, password);
      setLoading(false);

      if (res.error) {
        setError(res.error);
      } else if (res.user && res.session) {
        onLoginSuccess();
        onClose();
      } else {
        setError('Failed to verify authenticated session. Please try logging in again.');
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-login-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-[#FAF7F2] border border-[#E8DFD3] w-full max-w-md p-8 shadow-2xl z-10 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-[#6B1736] transition-colors"
          aria-label="Close login dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#6B1736] text-[#D6B36A] flex items-center justify-center shadow">
            {mode === 'signin' ? <Lock className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
          </div>
          <h2 id="admin-login-title" className="font-serif text-2xl text-[#211C1E]">
            {mode === 'signin' ? `${config.brandName} Atelier Admin` : `Create Admin Account`}
          </h2>
          <p className="text-xs text-[#6B6064] font-light">
            {mode === 'signin'
              ? 'Authenticate with your Supabase administrator account to manage products, pricing, and storage.'
              : 'Register your administrator credentials directly in Supabase Authentication.'}
          </p>
        </div>

        {/* Success Alert */}
        {successNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <div className="flex-1 leading-relaxed">{successNotice}</div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        {/* Login / Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[#6B6064] mb-1">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#D6B36A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@lamiville.com"
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-[#E8DFD3] focus:border-[#6B1736] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[#6B6064] mb-1">
              Password
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-[#D6B36A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-[#E8DFD3] focus:border-[#6B1736] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-[#D6B36A] hover:bg-[#6B1736] text-[#211C1E] hover:text-[#FAF7F2] text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm"
          >
            {loading ? (
              <span>Authenticating with Supabase...</span>
            ) : mode === 'signin' ? (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Register Admin in Supabase</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center pt-1">
          {mode === 'signin' ? (
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setSuccessNotice(null);
              }}
              className="text-xs text-[#6B6064] hover:text-[#6B1736] transition-colors"
            >
              Don't have an admin account in Supabase yet? <span className="font-semibold underline">Register here</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setSuccessNotice(null);
              }}
              className="text-xs text-[#6B6064] hover:text-[#6B1736] transition-colors"
            >
              Already registered? <span className="font-semibold underline">Sign In</span>
            </button>
          )}
        </div>

        {/* Footer info & Security status */}
        <div className="pt-4 border-t border-[#E8DFD3] flex items-center justify-between text-[11px] text-[#6B6064]">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D6B36A]" />
            <span>Secured via Supabase Auth & RLS</span>
          </div>

          <span className="text-[10px] text-neutral-400">Connected to Supabase</span>
        </div>
      </div>
    </div>
  );
};
