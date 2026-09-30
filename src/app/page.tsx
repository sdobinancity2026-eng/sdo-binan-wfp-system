'use client';

import { useEffect, useState, FormEvent, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { WFPItem, Department } from '@/types/wfp';
import { RefreshCw, BarChart2, Plus, X, CheckCircle, AlertCircle, Search, Filter, RotateCcw, Download, CheckCircle2, Clock, FileText, ChevronRight, AlertTriangle, LogOut, ShieldAlert, UserCheck } from 'lucide-react';
import FocalPersonDashboard from './components/FocalPersonDashboard';

export default function AdminDashboard() {
  const router = useRouter();
  const [wfps, setWfps] = useState<WFPItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  
  // User Auth & Role State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [minBudget, setMinBudget] = useState<string>('');
  const [maxBudget, setMaxBudget] = useState<string>('');

  // Submit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Tracking Modal State
  const [selectedWfpForTracking, setSelectedWfpForTracking] = useState<WFPItem | null>(null);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [aipCode, setAipCode] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [allocatedBudget, setAllocatedBudget] = useState('');
  const [evidenceOfSuccess, setEvidenceOfSuccess] = useState('');
  const [kpi, setKpi] = useState('');
  const [leadingIndicator, setLeadingIndicator] = useState('');
  const [laggingIndicator, setLaggingIndicator] = useState('');
  const [target, setTarget] = useState('');

  useEffect(() => {
    checkSessionAndFetchData();
  }, []);

  // Replace the checkSessionAndFetchData function in src/app/page.tsx with this:
async function checkSessionAndFetchData() {
  setLoading(true);

  // 1. Check custom admin session in localStorage & set specific role
  const savedSession = localStorage.getItem('sdo_admin_session');
  if (savedSession) {
    try {
      const adminData = JSON.parse(savedSession);
      setCurrentUser(adminData);
      // Read specific role stored during login ('super_admin', 'division_admin', or 'focal_person')
      setUserRole(adminData.role || 'division_admin');
    } catch (e) {
      localStorage.removeItem('sdo_admin_session');
      setCurrentUser(null);
      setUserRole(null);
    }
  } else {
    setCurrentUser(null);
    setUserRole(null);
  }

  // 2. Fetch departments
  const { data: deptData } = await supabase.from('departments').select('*');
  if (deptData) {
    setDepartments(deptData);
    if (deptData.length > 0 && !departmentId) {
      setDepartmentId(deptData[0].id);
    }
  }

  // 3. Fetch WFPs
  const { data: wfpData, error } = await supabase
    .from('wfps')
    .select('*, departments(code, name)')
    .order('created_at', { ascending: false });

  if (!error && wfpData) {
    setWfps(wfpData as WFPItem[]);
  }
  setLoading(false);
}

// Update sign out logic
function handleSignOut() {
  localStorage.removeItem('sdo_admin_session');
  setCurrentUser(null);
  setUserRole(null);
  router.refresh();
}

  async function handleStatusChange(id: string, newStatus: string) {
    if (userRole !== 'admin') {
      alert('Unauthorized Action: Only Division Administrators can approve or update submission statuses.');
      return;
    }

    const { error } = await supabase
      .from('wfps')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      alert(`Update failed: ${error.message}`);
    } else {
      checkSessionAndFetchData();
      if (selectedWfpForTracking && selectedWfpForTracking.id === id) {
        setSelectedWfpForTracking((prev) => prev ? { ...prev, status: newStatus } : null);
      }
    }
  }

  async function handleCreateWFP(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!title.trim() || !aipCode.trim() || !departmentId || !allocatedBudget) {
      setFormError('Please fill in all required fields.');
      return;
    }

    const budgetValue = parseFloat(allocatedBudget);
    if (isNaN(budgetValue) || budgetValue <= 0) {
      setFormError('Please enter a valid allocation budget greater than zero.');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from('wfps').insert([
      {
        title: title.trim(),
        aip_code: aipCode.trim().toUpperCase(),
        department_id: departmentId,
        total_allocated: budgetValue,
        total_obligated: 0,
        total_disbursed: 0,
        status: 'For Review',
        evidence_of_success: evidenceOfSuccess.trim(),
        kpi: kpi.trim(),
        leading_indicator: leadingIndicator.trim(),
        lagging_indicator: laggingIndicator.trim(),
        target: target.trim(),
        user_id: currentUser?.id || null,
      },
    ]);

    setSubmitting(false);

    if (error) {
      setFormError(error.message || 'Failed to submit WFP item.');
    } else {
      setFormSuccess('WFP Submission added successfully!');
      setTitle('');
      setAipCode('');
      setAllocatedBudget('');
      setEvidenceOfSuccess('');
      setKpi('');
      setLeadingIndicator('');
      setLaggingIndicator('');
      setTarget('');
      checkSessionAndFetchData();
      
      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess(null);
      }, 1200);
    }
  }

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDept('ALL');
    setSelectedStatus('ALL');
    setMinBudget('');
    setMaxBudget('');
  };

  const filteredWfps = useMemo(() => {
    return wfps.filter((wfp) => {
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesTitle = wfp.title?.toLowerCase().includes(query);
        const matchesAip = wfp.aip_code?.toLowerCase().includes(query);
        const matchesFocal = wfp.profiles?.full_name?.toLowerCase().includes(query);
        const matchesKpi = wfp.kpi?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesAip && !matchesFocal && !matchesKpi) return false;
      }

      if (selectedDept !== 'ALL' && wfp.department_id !== selectedDept) {
        return false;
      }

      if (selectedStatus !== 'ALL' && wfp.status !== selectedStatus) {
        return false;
      }

      const budget = Number(wfp.total_allocated || 0);
      if (minBudget !== '' && budget < parseFloat(minBudget)) {
        return false;
      }
      if (maxBudget !== '' && budget > parseFloat(maxBudget)) {
        return false;
      }

      return true;
    });
  }, [wfps, searchQuery, selectedDept, selectedStatus, minBudget, maxBudget]);

  const handleExportCSV = () => {
    if (filteredWfps.length === 0) return;

    const headers = [
      'PPA Title', 'Department Code', 'Department Name', 'AIP Code',
      'Focal Person', 'Allocated Budget (PHP)', 'Obligated Budget (PHP)',
      'Disbursed Budget (PHP)', 'BUR Obligation Rate (%)', 'Status',
      'Evidence of Success', 'KPI', 'Leading Indicator', 'Lagging Indicator', 'Target', 'Created Date'
    ];

    const rows = filteredWfps.map((wfp) => {
      const allocated = Number(wfp.total_allocated || 0);
      const obligated = Number(wfp.total_obligated || 0);
      const disbursed = Number(wfp.total_disbursed || 0);
      const burRate = allocated > 0 ? ((obligated / allocated) * 100).toFixed(1) : '0';

      return [
        `"${(wfp.title || '').replace(/"/g, '""')}"`,
        `"${wfp.departments?.code || ''}"`,
        `"${(wfp.departments?.name || '').replace(/"/g, '""')}"`,
        `"${wfp.aip_code || ''}"`,
        `"${(wfp.profiles?.full_name || 'Unassigned').replace(/"/g, '""')}"`,
        allocated, obligated, disbursed, `${burRate}%`,
        `"${wfp.status || ''}"`,
        `"${(wfp.evidence_of_success || '').replace(/"/g, '""')}"`,
        `"${(wfp.kpi || '').replace(/"/g, '""')}"`,
        `"${(wfp.leading_indicator || '').replace(/"/g, '""')}"`,
        `"${(wfp.lagging_indicator || '').replace(/"/g, '""')}"`,
        `"${(wfp.target || '').replace(/"/g, '""')}"`,
        `"${wfp.created_at ? new Date(wfp.created_at).toLocaleDateString() : ''}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `SDO_Binan_WFP_Report_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalAllocated = filteredWfps.reduce((sum: number, w: WFPItem) => sum + Number(w.total_allocated || 0), 0);
  const totalObligated = filteredWfps.reduce((sum: number, w: WFPItem) => sum + Number(w.total_obligated || 0), 0);
  const totalDisbursed = filteredWfps.reduce((sum: number, w: WFPItem) => sum + Number(w.total_disbursed || 0), 0);

  const burObligation = totalAllocated > 0 ? ((totalObligated / totalAllocated) * 100).toFixed(1) : '0';
  const burDisbursement = totalObligated > 0 ? ((totalDisbursed / totalObligated) * 100).toFixed(1) : '0';

  const getTimelineSteps = (status: string) => {
    const isNeedsRevision = status === 'Needs Revision';
    const isApproved = status === 'Approved';

    return [
      { id: 1, title: 'Draft Submitted', description: 'WFP Proposal submitted by Focal Person', completed: true, current: false },
      { id: 2, title: 'Division Review', description: 'Under review by Section Chief & Admin', completed: isApproved || status === 'For Review' || isNeedsRevision, current: status === 'For Review', failed: isNeedsRevision, failedMsg: 'Returned for Revision' },
      { id: 3, title: 'AIP & Budget Verification', description: 'Checked against Annual Implementation Plan & Local School Board Budget', completed: isApproved, current: false },
      { id: 4, title: 'Superintendent Final Approval', description: 'Signed & Approved by Division Schools Superintendent', completed: isApproved, current: false },
      { id: 5, title: 'Obligation & Disbursement', description: 'Implementation phase & financial liquidation', completed: isApproved && Number(selectedWfpForTracking?.total_disbursed || 0) > 0, current: isApproved && Number(selectedWfpForTracking?.total_disbursed || 0) === 0 }
    ];
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
    {/* Header */}
<header className="bg-blue-900 text-white shadow-md border-b-4 border-amber-400">
  <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
    <div>
      <h1 className="text-xl font-bold tracking-wide">SDO BIÑAN CITY — WFP MONITORING PORTAL</h1>
      <p className="text-xs text-blue-200">Department of Education • Region IV-A CALABARZON</p>
    </div>
    <div className="flex items-center gap-3">
      {currentUser ? (
        <div className="flex items-center gap-3 bg-blue-950 px-3 py-1.5 rounded-lg border border-blue-800">
          <div className="text-right">
            <p className="text-xs font-bold text-amber-400 flex items-center justify-end gap-1">
              <UserCheck className="w-3.5 h-3.5" /> {currentUser.name || currentUser.email}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-blue-300 font-bold">
              Role: <span className="text-emerald-400">{userRole ? userRole.replace('_', ' ') : 'Admin'}</span>
            </p>
          </div>

          {/* Control Center Button: STRICTLY for super_admin ONLY */}
          {userRole === 'super_admin' && (
            <button
              onClick={() => router.push('/admin/users')}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-blue-950 font-extrabold text-xs px-2.5 py-1 rounded shadow transition"
              title="Open Super Admin User Management"
            >
              <ShieldAlert className="w-3.5 h-3.5" /> Control Center
            </button>
          )}

          <button
            onClick={handleSignOut}
            title="Sign Out"
            className="bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded transition ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => router.push('/login')}
          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-blue-950 font-bold text-xs px-3.5 py-2 rounded-md shadow transition"
        >
          Admin Sign In
        </button>
      )}

      <button 
        onClick={handleExportCSV}
        disabled={filteredWfps.length === 0}
        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-3 py-2 rounded-md shadow transition"
      >
        <Download className="w-4 h-4" /> Export CSV
      </button>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-1.5 bg-blue-800 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-md shadow transition border border-blue-700"
      >
        <Plus className="w-4 h-4 stroke-[3]" /> Submit WFP
      </button>
      <button 
        onClick={checkSessionAndFetchData}
        className="flex items-center gap-2 bg-blue-800 hover:bg-blue-700 text-xs px-3 py-2 rounded-md font-medium transition"
      >
        <RefreshCw className="w-4 h-4" /> Sync
      </button>
    </div>
  </div>
</header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* CONDITIONAL SWITCH: If user is Focal Person, show Focal Dashboard */}
        {currentUser && userRole === 'focal_person' ? (
          <FocalPersonDashboard wfps={wfps} currentUser={currentUser} />
        ) : (
          /* OTHERWISE: Render existing Executive Overview / Admin Dashboard */
          <>
            {!currentUser && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>
                    <strong>Public View Mode:</strong> You are currently viewing public WFP tracking data. Only authenticated <strong>Division Administrators</strong> can approve or revise submission statuses.
                  </span>
                </div>
                <button
                  onClick={() => router.push('/login')}
                  className="px-3 py-1.5 bg-amber-600 text-white rounded font-bold text-xs hover:bg-amber-700 transition"
                >
                  Admin Login
                </button>
              </div>
            )}

            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-900" /> Executive Overview
              </h2>
            </div>

            {/* Overview Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase">Total Allocation</p>
                <p className="text-2xl font-black text-slate-800 mt-1">₱{totalAllocated.toLocaleString()}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase">Total Obligated</p>
                <p className="text-2xl font-black text-blue-900 mt-1">₱{totalObligated.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">BUR: <span className="font-bold text-blue-800">{burObligation}%</span></p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase">Total Disbursed</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">₱{totalDisbursed.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">Disbursement Rate: <span className="font-bold text-emerald-700">{burDisbursement}%</span></p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase">Pending Review</p>
                <p className="text-2xl font-black text-amber-600 mt-1">
                  {filteredWfps.filter((w: WFPItem) => w.status === 'For Review').length}
                </p>
                <p className="text-xs text-slate-500 mt-1">Requires Admin Action</p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Filter className="w-4 h-4 text-blue-900" /> Search & Filter Submissions
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-4 relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search by PPA title, AIP code, or KPI..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>

                <div className="md:col-span-3">
                  <select 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                  >
                    <option value="ALL">All Departments</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <select 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="For Review">For Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Needs Revision">Needs Revision</option>
                  </select>
                </div>

                <div className="md:col-span-2 flex items-center gap-1.5">
                  <input 
                    type="number"
                    placeholder="Min ₱"
                    value={minBudget}
                    onChange={(e) => setMinBudget(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                  <span className="text-slate-400 text-xs">-</span>
                  <input 
                    type="number"
                    placeholder="Max ₱"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>

                <div className="md:col-span-1 flex justify-end">
                  <button
                    onClick={resetFilters}
                    className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </button>
                </div>
              </div>
            </div>

            {/* WFP Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Focal Person WFP Submissions</h3>
                <span className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-semibold">
                  Showing {filteredWfps.length} of {wfps.length} Total Plans
                </span>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-500">Loading WFP records...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                      <tr>
                        <th className="p-4">Program / Activity (PPA)</th>
                        <th className="p-4">Department</th>
                        <th className="p-4">AIP Alignment</th>
                        <th className="p-4">Allocation</th>
                        <th className="p-4">Obligation Rate</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Evidence of Success</th>
                        <th className="p-4">KPI</th>
                        <th className="p-4">Leading Indicator</th>
                        <th className="p-4">Lagging Indicator</th>
                        <th className="p-4">Target</th>
                        <th className="p-4 text-center">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredWfps.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="p-6 text-center text-slate-400">
                            No WFP records match your current filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredWfps.map((wfp: WFPItem) => {
                          const oblRate = wfp.total_allocated > 0 
                            ? ((wfp.total_obligated / wfp.total_allocated) * 100).toFixed(0) 
                            : 0;

                          return (
                            <tr key={wfp.id} className="hover:bg-slate-50 transition">
                              <td className="p-4">
                                <button
                                  onClick={() => setSelectedWfpForTracking(wfp)}
                                  className="text-left group focus:outline-none"
                                >
                                  <p className="font-bold text-blue-900 group-hover:text-amber-600 group-hover:underline flex items-center gap-1.5 transition">
                                    {wfp.title} <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-amber-600" />
                                  </p>
                                  <p className="text-xs text-slate-500">Focal: {wfp.profiles?.full_name || 'Unassigned'} • <span className="text-amber-600 font-semibold hover:underline">Track Submission</span></p>
                                </button>
                              </td>
                              <td className="p-4 font-medium text-slate-700">{wfp.departments?.code || '-'}</td>
                              <td className="p-4">
                                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {wfp.aip_code || 'AIP-Aligned'}
                                </span>
                              </td>
                              <td className="p-4 font-semibold text-slate-800">₱{Number(wfp.total_allocated).toLocaleString()}</td>
                              <td className="p-4">
                                <div className="w-24 bg-slate-200 rounded-full h-2 mt-1">
                                  <div 
                                    className="bg-blue-800 h-2 rounded-full" 
                                    style={{ width: `${Math.min(Number(oblRate), 100)}%` }} 
                                  />
                                </div>
                                <span className="text-xs text-slate-500 font-medium">{oblRate}% Obligated</span>
                              </td>
                              <td className="p-4">
                                <span className={`text-xs px-2.5 py-1 rounded-md font-bold ${
                                  wfp.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                                  wfp.status === 'For Review' ? 'bg-amber-100 text-amber-800' :
                                  wfp.status === 'Needs Revision' ? 'bg-rose-100 text-rose-800' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {wfp.status}
                                </span>
                              </td>
                              <td className="p-4 text-xs text-slate-600 max-w-xs truncate">{wfp.evidence_of_success || '-'}</td>
                              <td className="p-4 text-xs text-slate-600 max-w-xs truncate">{wfp.kpi || '-'}</td>
                              <td className="p-4 text-xs text-slate-600 max-w-xs truncate">{wfp.leading_indicator || '-'}</td>
                              <td className="p-4 text-xs text-slate-600 max-w-xs truncate">{wfp.lagging_indicator || '-'}</td>
                              <td className="p-4 text-xs text-slate-600 max-w-xs truncate">{wfp.target || '-'}</td>
                              <td className="p-4 text-center">
                                {userRole === 'admin' || userRole === 'division_admin' || userRole === 'super_admin' ? (
                                  <div className="flex justify-center gap-1">
                                    <button 
                                      onClick={() => handleStatusChange(wfp.id, 'Approved')}
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-sm transition"
                                    >
                                      Approve
                                    </button>
                                    <button 
                                      onClick={() => handleStatusChange(wfp.id, 'Needs Revision')}
                                      className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow-sm transition"
                                    >
                                      Revise
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic">Admin Login Required</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Shopee-style Tracking Modal */}
      {selectedWfpForTracking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-gradient-to-r from-orange-600 to-amber-500 text-white px-6 py-4 flex justify-between items-center shadow-md">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6" />
                <div>
                  <h3 className="font-extrabold text-base tracking-wide">WFP SUBMISSION TRACKER</h3>
                  <p className="text-xs text-amber-100">Ref ID: {selectedWfpForTracking.id.substring(0, 8).toUpperCase()}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedWfpForTracking(null)}
                className="bg-white/20 hover:bg-white/30 text-white transition p-1.5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-slate-50 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                    {selectedWfpForTracking.departments?.code || 'SDO'} Department
                  </span>
                  <h4 className="font-bold text-slate-800 text-base mt-1.5">{selectedWfpForTracking.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">AIP Code: <span className="font-semibold text-slate-700">{selectedWfpForTracking.aip_code}</span></p>
                  <p className="text-xs text-slate-500">Focal: <span className="font-semibold text-slate-700">{selectedWfpForTracking.profiles?.full_name || 'Unassigned'}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase">Allocated Budget</p>
                  <p className="text-lg font-black text-emerald-700 mt-0.5">₱{Number(selectedWfpForTracking.total_allocated).toLocaleString()}</p>
                  <span className={`inline-block text-[11px] font-extrabold px-2.5 py-0.5 rounded-md mt-2 ${
                    selectedWfpForTracking.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                    selectedWfpForTracking.status === 'For Review' ? 'bg-amber-100 text-amber-800' :
                    'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedWfpForTracking.status}
                  </span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h5 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-orange-500" /> Submission Progress Timeline
                </h5>

                <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {getTimelineSteps(selectedWfpForTracking.status).map((step) => (
                    <div key={step.id} className="relative flex items-start gap-4 group">
                      <div className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white ${
                        step.failed
                          ? 'bg-rose-600 text-white'
                          : step.completed
                          ? 'bg-orange-500 text-white'
                          : step.current
                          ? 'bg-amber-500 text-white animate-pulse'
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        {step.failed ? <X className="w-3.5 h-3.5 stroke-[3]" /> : step.completed ? <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" /> : step.id}
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-baseline">
                          <h6 className={`text-sm font-bold ${
                            step.failed ? 'text-rose-600' : step.completed || step.current ? 'text-slate-800' : 'text-slate-400'
                          }`}>
                            {step.title}
                          </h6>
                          {step.current && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                              Current Status
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
                        {step.failed && (
                          <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 font-semibold flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-rose-600" /> {step.failedMsg}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons protected by role */}
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-slate-500">Submitted Date: {selectedWfpForTracking.created_at ? new Date(selectedWfpForTracking.created_at).toLocaleDateString() : 'N/A'}</span>
                
                {userRole === 'admin' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusChange(selectedWfpForTracking.id, 'Approved')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                    >
                      Mark Approved
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedWfpForTracking.id, 'Needs Revision')}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                    >
                      Request Revision
                    </button>
                  </div>
                ) : (
                  <span className="text-xs bg-slate-200 text-slate-600 px-3 py-1 rounded font-semibold">
                    Viewing as Guest / Focal Person
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WFP Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center border-b-2 border-amber-400">
              <div>
                <h3 className="font-bold text-lg">Submit New WFP Item</h3>
                <p className="text-xs text-blue-200">Local School Board / Division Work & Financial Plan</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-blue-200 hover:text-white transition p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWFP} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
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
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Program / Project / Activity (PPA) Title *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. ARAL Program Learning Recovery Workshop"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Department / Division *
                  </label>
                  <select
                    required
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    AIP Code Alignment *
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. AIP-2026-CID-001"
                    value={aipCode}
                    onChange={(e) => setAipCode(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Allocated Budget (PHP ₱) *
                </label>
                <input 
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="e.g. 150000"
                  value={allocatedBudget}
                  onChange={(e) => setAllocatedBudget(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
                />
              </div>

              {/* Indicator Fields */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-blue-900 uppercase mb-3">Performance Indicators & Monitoring</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Evidence of Success</label>
                    <input 
                      type="text"
                      placeholder="e.g. Activity Completion Report"
                      value={evidenceOfSuccess}
                      onChange={(e) => setEvidenceOfSuccess(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Key Performance Indicator (KPI)</label>
                    <input 
                      type="text"
                      placeholder="e.g. % of participants trained"
                      value={kpi}
                      onChange={(e) => setKpi(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Leading Indicator</label>
                    <input 
                      type="text"
                      placeholder="e.g. Module pre-test scores"
                      value={leadingIndicator}
                      onChange={(e) => setLeadingIndicator(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Lagging Indicator</label>
                    <input 
                      type="text"
                      placeholder="e.g. Annual reading literacy rate"
                      value={laggingIndicator}
                      onChange={(e) => setLaggingIndicator(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target</label>
                  <input 
                    type="text"
                    placeholder="e.g. 100% of target teachers proficient"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit WFP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
