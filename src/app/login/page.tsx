'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Lock, User, AlertCircle, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(''); // Accepts username or email
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const cleanIdentifier = identifier.trim();

    // 1. Fetch user_role along with other columns from Supabase
    const { data: admin, error } = await supabase
      .from('admins')
      .select('id, name, email, office, position, username, user_role')
      .or(`username.eq.${cleanIdentifier},email.eq.${cleanIdentifier}`)
      .eq('password', password)
      .maybeSingle();

    if (error || !admin) {
      setErrorMsg('Invalid Username/Email or Password. Please try again.');
      setLoading(false);
      return;
    }

    // 2. Dynamically store the user_role from Supabase into localStorage
    const userRole = admin.user_role || 'admin';

    localStorage.setItem('sdo_admin_session', JSON.stringify({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      office: admin.office,
      position: admin.position,
      username: admin.username,
      user_role: userRole,
      role: userRole,
      loggedInAt: new Date().toISOString()
    }));

    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="bg-blue-900 text-white p-6 text-center border-b-4 border-amber-400">
          <div className="w-12 h-12 bg-amber-400 text-blue-950 rounded-full flex items-center justify-center mx-auto mb-3 font-black">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold tracking-wide">SDO BIÑAN CITY</h1>
          <p className="text-xs text-blue-200 mt-1">Administrator Portal</p>
        </div>

        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Username or Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                placeholder="sdo_admin or admin@deped.gov.ph"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition shadow disabled:opacity-50 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In as Administrator'}
          </button>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-center text-slate-500 space-y-1">
            <p className="font-semibold text-slate-600">Default Credentials:</p>
            <p>Username: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-900">sdo_admin</code></p>
            <p>Password: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-900">Admin@Biñan2026</code></p>
          </div>
        </form>
      </div>
    </div>
  );
}