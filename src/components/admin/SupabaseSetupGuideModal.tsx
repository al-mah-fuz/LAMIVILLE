import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Database,
  Key,
  Shield,
  Radio,
  FolderUp,
  Server,
  Terminal,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { SUPABASE_SETUP_SQL } from '../../lib/supabaseSql';
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  testSupabaseConnection,
  clearStoredSupabaseConfig,
} from '../../lib/supabase';

interface SupabaseSetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated?: () => void;
}

export const SupabaseSetupGuideModal: React.FC<SupabaseSetupGuideModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
}) => {
  const currentConfig = getStoredSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [copiedSql, setCopiedSql] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'connect' | 'sql' | 'steps'>('connect');

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !anonKey.trim()) {
      setTestResult({
        success: false,
        message: 'Please provide both your Supabase Project URL and Anon Public Key.',
      });
      return;
    }

    saveStoredSupabaseConfig(supabaseUrl.trim(), anonKey.trim());
    setTesting(true);
    setTestResult(null);

    const result = await testSupabaseConnection();
    setTesting(false);
    setTestResult(result);

    if (onConfigUpdated) {
      onConfigUpdated();
    }
  };

  const handleResetToEnv = () => {
    clearStoredSupabaseConfig();
    const refreshed = getStoredSupabaseConfig();
    setSupabaseUrl(refreshed.url);
    setAnonKey(refreshed.anonKey);
    setTestResult(null);
    if (onConfigUpdated) onConfigUpdated();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="supabase-guide-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
    >
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-[#FAF7F2] border border-[#E8DFD3] w-full max-w-4xl shadow-2xl z-10 my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-[#211C1E] text-white flex items-center justify-between border-b-2 border-b-[#6B1736]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#6B1736] text-[#D6B36A] rounded">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 id="supabase-guide-title" className="font-serif text-xl sm:text-2xl text-white">
                Supabase Setup & Integration Guide
              </h2>
              <p className="text-xs text-neutral-300 font-light">
                Complete instructions to connect Database, Storage, Auth, RLS, and Realtime for LAMIVILLE.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded transition-colors"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E8DFD3] bg-white px-6">
          <button
            onClick={() => setActiveTab('connect')}
            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'connect'
                ? 'border-[#6B1736] text-[#6B1736]'
                : 'border-transparent text-[#6B6064] hover:text-[#6B1736]'
            }`}
          >
            1. Quick Connect Keys
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'sql'
                ? 'border-[#6B1736] text-[#6B1736]'
                : 'border-transparent text-[#6B6064] hover:text-[#6B1736]'
            }`}
          >
            2. Database & Storage SQL Script
          </button>
          <button
            onClick={() => setActiveTab('steps')}
            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'steps'
                ? 'border-[#6B1736] text-[#6B1736]'
                : 'border-transparent text-[#6B6064] hover:text-[#6B1736]'
            }`}
          >
            3. Full 16-Step Checklist
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* TAB 1: QUICK CONNECT KEYS */}
          {activeTab === 'connect' && (
            <div className="space-y-6 max-w-2xl">
              <div className="p-4 bg-white border border-[#E8DFD3] rounded space-y-3">
                <h3 className="font-serif text-base text-[#211C1E] font-semibold flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#D6B36A]" />
                  <span>Connect Your Supabase Project</span>
                </h3>
                <p className="text-[#6B6064] leading-relaxed">
                  Enter your Project URL and Anon Public Key from your Supabase Dashboard (<span className="font-mono text-neutral-800">Project Settings → API</span>). You can also set these in your <span className="font-mono text-neutral-800">.env</span> or Vercel Environment Variables.
                </p>

                <form onSubmit={handleSaveAndTest} className="space-y-4 pt-2">
                  <div>
                    <label className="block uppercase tracking-wider font-semibold text-[#211C1E] mb-1">
                      Project URL (VITE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL)
                    </label>
                    <input
                      type="url"
                      required
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      placeholder="https://xyzabcdefg.supabase.co"
                      className="w-full p-2.5 bg-neutral-50 border border-[#E8DFD3] focus:border-[#6B1736] font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block uppercase tracking-wider font-semibold text-[#211C1E] mb-1">
                      Anon Public Key (VITE_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)
                    </label>
                    <textarea
                      required
                      value={anonKey}
                      onChange={(e) => setAnonKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full p-2.5 bg-neutral-50 border border-[#E8DFD3] focus:border-[#6B1736] font-mono text-xs h-20"
                    />
                  </div>

                  {testResult && (
                    <div
                      className={`p-3.5 border flex items-start gap-2.5 ${
                        testResult.success
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-red-50 border-red-300 text-red-900'
                      }`}
                    >
                      {testResult.success ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-semibold">{testResult.success ? 'Connection Successful!' : 'Connection Check'}</p>
                        <p className="text-[11px] mt-0.5 leading-relaxed">{testResult.message}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={testing}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D6B36A] hover:bg-[#6B1736] text-[#211C1E] hover:text-[#FAF7F2] font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 shadow-sm"
                    >
                      <Save className="w-4 h-4" />
                      <span>{testing ? 'Testing Connection...' : 'Save & Test Connection'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetToEnv}
                      className="px-4 py-2.5 border border-[#E8DFD3] hover:bg-[#F4EDE2] text-[#6B6064] transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </form>
              </div>

              {/* Security Reminder */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 text-amber-900 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-700" />
                  <span>Crucial Security Rule (Requirement 17 & 18)</span>
                </p>
                <p className="text-[11px] leading-relaxed">
                  NEVER expose your <span className="font-mono font-semibold">service_role</span> key to the browser. Only the <span className="font-mono font-semibold">anon key</span> belongs in frontend applications. Security is strictly enforced on the database itself using Row Level Security (RLS).
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: SQL SCRIPT */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base text-[#211C1E] font-semibold">
                    Complete Database & Storage Setup Script
                  </h3>
                  <p className="text-[#6B6064] text-[11px]">
                    Creates products table, category constraints, indexes, RLS policies, Realtime publication, and storage bucket.
                  </p>
                </div>

                <button
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#D6B36A] hover:bg-[#6B1736] text-[#211C1E] hover:text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>SQL Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy All SQL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative bg-[#211C1E] text-emerald-400 p-4 font-mono text-[11px] overflow-x-auto rounded border border-neutral-800 max-h-96">
                <pre>{SUPABASE_SETUP_SQL}</pre>
              </div>

              <div className="p-3 bg-[#F4EDE2] border border-[#E8DFD3] text-[#211C1E] text-[11px] leading-relaxed">
                <strong>How to run:</strong> In your Supabase Dashboard, click <strong>SQL Editor</strong> on the left menu → click <strong>New Query</strong> → paste the SQL code above → click <strong>RUN</strong>. Everything is set up in less than 2 seconds!
              </div>
            </div>
          )}

          {/* TAB 3: FULL 16 STEPS CHECKLIST */}
          {activeTab === 'steps' && (
            <div className="space-y-4">
              <h3 className="font-serif text-base text-[#211C1E] font-semibold">
                Comprehensive 16-Step Supabase Checklist (Requirement 26)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="p-3.5 bg-white border border-[#E8DFD3] space-y-1.5">
                  <span className="font-semibold text-[#6B1736]">Step 1: Create Supabase Project</span>
                  <p className="text-[#6B6064] leading-relaxed">
                    Go to <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline font-medium text-[#211C1E]">supabase.com</a>, log in and create a new project called <strong>LAMIVILLE</strong> with a secure database password.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-[#E8DFD3] space-y-1.5">
                  <span className="font-semibold text-[#6B1736]">Step 2: Create Products Table</span>
                  <p className="text-[#6B6064] leading-relaxed">
                    Run the provided SQL script in the SQL Editor. It creates table <code className="bg-neutral-100 px-1">public.products</code> with fields: id, name, description, price, category, image_url, stock_quantity, is_available, created_at, updated_at.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-[#E8DFD3] space-y-1.5">
                  <span className="font-semibold text-[#6B1736]">Step 3: Database RLS Policies</span>
                  <p className="text-[#6B6064] leading-relaxed">
                    Row Level Security (RLS) is enabled. Public anon users can SELECT products; only authenticated admins can INSERT, UPDATE, and DELETE.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-[#E8DFD3] space-y-1.5">
                  <span className="font-semibold text-[#6B1736]">Step 4: Enable Realtime</span>
                  <p className="text-[#6B6064] leading-relaxed">
                    The script executes <code className="bg-neutral-100 px-1">ALTER PUBLICATION supabase_realtime ADD TABLE products;</code> with <code className="bg-neutral-100 px-1">REPLICA IDENTITY FULL</code> so live updates broadcast to storefronts.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-[#E8DFD3] space-y-1.5">
                  <span className="font-semibold text-[#6B1736]">Step 5: Create Storage Bucket</span>
                  <p className="text-[#6B6064] leading-relaxed">
                    The SQL script creates a public storage bucket named <code className="bg-neutral-100 px-1">product-images</code> in <code className="bg-neutral-100 px-1">storage.buckets</code>.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-[#E8DFD3] space-y-1.5">
                  <span className="font-semibold text-[#6B1736]">Step 6: Configure Storage Policies</span>
                  <p className="text-[#6B6064] leading-relaxed">
                    Policies allow public SELECT of image objects; only authenticated users can upload or delete photos in <code className="bg-neutral-100 px-1">product-images</code>.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-[#E8DFD3] space-y-1.5">
                  <span className="font-semibold text-[#6B1736]">Step 7 & 8: Create Admin Auth Account</span>
                  <p className="text-[#6B6064] leading-relaxed">
                    In Supabase Dashboard → <strong>Authentication → Users</strong> → click <strong>Add User → Create User</strong>. Enter your desired admin email and password. Confirm user is created.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-[#E8DFD3] space-y-1.5">
                  <span className="font-semibold text-[#6B1736]">Step 9 & 10: Obtain URL & Anon Key</span>
                  <p className="text-[#6B6064] leading-relaxed">
                    In Supabase Dashboard → <strong>Project Settings → API</strong>. Copy <strong>Project URL</strong> and <strong>Project API Keys → anon / public</strong>.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-[#E8DFD3] space-y-1.5">
                  <span className="font-semibold text-[#6B1736]">Step 11 & 12: Add Environment Variables</span>
                  <p className="text-[#6B6064] leading-relaxed">
                    Add to <code className="bg-neutral-100 px-1">.env</code>: <code className="bg-neutral-100 px-1">VITE_SUPABASE_URL=...</code> and <code className="bg-neutral-100 px-1">VITE_SUPABASE_ANON_KEY=...</code> (or paste into Tab 1 of this guide for immediate browser testing).
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-[#E8DFD3] space-y-1.5">
                  <span className="font-semibold text-[#6B1736]">Step 13: Test Product Uploads</span>
                  <p className="text-[#6B6064] leading-relaxed">
                    Click the <strong>+</strong> button on LAMIVILLE, sign in with your admin email and password, click <strong>Add New Product</strong>, pick an image file or URL, fill details, and click Save.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-[#E8DFD3] space-y-1.5">
                  <span className="font-semibold text-[#6B1736]">Step 14: Test Real-Time Updates</span>
                  <p className="text-[#6B6064] leading-relaxed">
                    Open the store in two tabs. In tab 1, edit a product's price from ₦8,500 to ₦9,000 in the Admin Dashboard. Watch tab 2 update instantly without refreshing!
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-[#E8DFD3] space-y-1.5">
                  <span className="font-semibold text-[#6B1736]">Step 15: Test Admin Protection</span>
                  <p className="text-[#6B6064] leading-relaxed">
                    Log out of the Admin Dashboard. Direct unauthenticated access to the dashboard is blocked, and RLS prevents unauthenticated API write mutations.
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-[#E8DFD3] space-y-1.5 md:col-span-2">
                  <span className="font-semibold text-[#6B1736]">Step 16: Deploy to Vercel</span>
                  <p className="text-[#6B6064] leading-relaxed">
                    Push to GitHub, import project into Vercel, add Environment Variables <code className="bg-neutral-100 px-1">VITE_SUPABASE_URL</code> and <code className="bg-neutral-100 px-1">VITE_SUPABASE_ANON_KEY</code> (or <code className="bg-neutral-100 px-1">NEXT_PUBLIC_...</code>), and click Deploy. Works right out of the box with zero runtime issues!
                  </p>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#E8DFD3] flex items-center justify-between">
          <span className="text-[11px] text-[#6B6064]">
            LAMIVILLE Production Backend Engine: Supabase PostgreSQL + Storage + Realtime
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#D6B36A] hover:bg-[#6B1736] text-[#211C1E] hover:text-[#FAF7F2] uppercase tracking-wider font-semibold text-xs transition-colors shadow-sm"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};
