'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  ShieldCheck, UserPlus, Trash2, ArrowLeft, 
  Building, User, Mail, Lock, ShieldAlert, CheckCircle, AlertCircle, RefreshCw
} from 'lucide-react';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  office: string;
  position: string;
  username: string;
  created_at: string;
}

export default function SuperAdminUsersPage() {
  const router = useRouter();
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  const [adminList, setAdminList] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // New Admin Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [office, setOffice] = useState('Office of the Schools Division Superintendent');
  const [position, setPosition] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Check if user is logged in as Super Admin
    const savedSession = localStorage.getItem('sdo_admin_session');
    if (!savedSession) {
      router.push('/login');
      return;
    }

    try {
      const parsed = JSON.parse(savedSession);
      setCurrentAdmin(parsed);
      fetchAdmins();
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

  async function fetchAdmins() {
    setLoading(true);
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAdminList(data);
    }
    setLoading(false);
  }

  async function handleAddAdmin(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!name.trim() || !email.trim() || !username.trim() || !password.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from('admins').insert([
      {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        office: office.trim(),
        position: position.trim() || 'Division Officer',
        username: username.trim().toLowerCase(),
        password: password.trim(),
      },
    ]);

    setSubmitting(false);

    if (error) {
      setFormError(error.message || 'Failed to add administrator.');
    } else {
      setFormSuccess(`Administrator ${name} created successfully!`);
      setName('');
      setEmail('');
      setPosition('');
      setUsername('');
      setPassword('');
      fetchAdmins();
    }
  }

  async function handleDeleteAdmin(id: string, adminName: string) {
    if (adminList.length <= 1) {
      alert('Cannot delete the only remaining administrator account.');
      return;
    }

    if (!confirm(`Are you sure you want to revoke and delete admin privileges for "${adminName}"?`)) {
      return;
    }

    const { error } = await supabase.from('admins').delete().eq('id', id);

    if (error) {
      alert(`Delete failed: ${error.message}`);
    } else {
      fetchAdmins();
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-md border-b-4 border-amber-400">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="bg-blue-800 hover:bg-blue-700 text-white p-2 rounded-lg transition"
              title="Return to Main WFP Portal"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-wide flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-amber-400" /> SUPER ADMIN CONTROL CENTER
              </h1>
              <p className="text-xs text-blue-200">SDO Biñan City • User Access & Process Administration</p>
            </div>
          </div>

          {currentAdmin && (
            <div className="text-right">
              <p className="text-xs font-bold text-amber-400">{currentAdmin.name}</p>
              <p className="text-[10px] text-blue-200">{currentAdmin.position || 'Super Administrator'}</p>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Create Admin Form */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <UserPlus className="w-5 h-5 text-blue-900" />
            <h2 className="font-bold text-slate-800 text-base">Add New Administrator</h2>
          </div>

          <form onSubmit={handleAddAdmin} className="space-y-4">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{formSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Santos"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-800 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">DepEd Email *</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="e.g. maria.santos@deped.gov.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-800 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Office / Division</label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={office}
                  onChange={(e) => setOffice(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-800 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Position / Designation</label>
              <input
                type="text"
                placeholder="e.g. Chief Education Supervisor / IT Officer"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-800 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Username *</label>
                <input
                  type="text"
                  required
                  placeholder="m_santos"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-bold text-xs shadow transition mt-2 disabled:opacity-50"
            >
              {submitting ? 'Creating Administrator...' : 'Register Administrator'}
            </button>
          </form>
        </div>

        {/* Right Column: Active User List */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800">Active Division Administrators</h3>
              <p className="text-xs text-slate-500">Authorized personnel who can approve & revise WFPs</p>
            </div>
            <button
              onClick={fetchAdmins}
              className="flex items-center gap-1.5 text-xs text-blue-900 hover:text-blue-700 font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs">Loading admin records...</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {adminList.map((admin) => (
                <div key={admin.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-slate-800">{admin.name}</p>
                      <span className="text-[10px] bg-blue-100 text-blue-900 font-extrabold px-2 py-0.5 rounded">
                        @{admin.username}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{admin.email}</p>
                    <p className="text-xs text-slate-600 mt-1">
                      <span className="font-medium text-slate-700">{admin.position || 'Admin'}</span> • {admin.office}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Revoke Admin Access"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
