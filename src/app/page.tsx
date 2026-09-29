'use client';

import { useEffect, useState, FormEvent, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { WFPItem, Department } from '@/types/wfp';
import { RefreshCw, BarChart2, Plus, X, CheckCircle, AlertCircle, Search, Filter, RotateCcw, Download } from 'lucide-react';

export default function AdminDashboard() {
  const [wfps, setWfps] = useState<WFPItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [minBudget, setMinBudget] = useState<string>('');
  const [maxBudget, setMaxBudget] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

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
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    
    const { data: deptData } = await supabase.from('departments').select('*');
    if (deptData) {
      setDepartments(deptData);
      if (deptData.length > 0 && !departmentId) {
        setDepartmentId(deptData[0].id);
      }
    }

    const { data: wfpData, error } = await supabase
      .from('wfps')
      .select('*, departments(code, name), profiles(full_name)')
      .order('created_at', { ascending: false });

    if (!error && wfpData) {
      setWfps(wfpData as WFPItem[]);
    }
    setLoading(false);
  }

  async function handleStatusChange(id: string, newStatus: string) {
    const { error } = await supabase
      .from('wfps')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      fetchData();
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
      fetchData();
      
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

  // Filtered WFP Calculation
  const filteredWfps = useMemo(() => {
    return wfps.filter((wfp) => {
      // 1. Search Query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesTitle = wfp.title?.toLowerCase().includes(query);
        const matchesAip = wfp.aip_code?.toLowerCase().includes(query);
        const matchesFocal = wfp.profiles?.full_name?.toLowerCase().includes(query);
        const matchesKpi = wfp.kpi?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesAip && !matchesFocal && !matchesKpi) return false;
      }

      // 2. Department Filter
      if (selectedDept !== 'ALL' && wfp.department_id !== selectedDept) {
        return false;
      }

      // 3. Status Filter
      if (selectedStatus !== 'ALL' && wfp.status !== selectedStatus) {
        return false;
      }

      // 4. Budget Range Filter
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

  // Export Filtered Table to CSV
  const handleExportCSV = () => {
    if (filteredWfps.length === 0) return;

    const headers = [
      'PPA Title',
      'Department Code',
      'Department Name',
      'AIP Code',
      'Focal Person',
      'Allocated Budget (PHP)',
      'Obligated Budget (PHP)',
      'Disbursed Budget (PHP)',
      'BUR Obligation Rate (%)',
      'Status',
      'Evidence of Success',
      'KPI',
      'Leading Indicator',
      'Lagging Indicator',
      'Target',
      'Created Date'
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
        allocated,
        obligated,
        disbursed,
        `${burRate}%`,
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
            <button 
              onClick={handleExportCSV}
              disabled={filteredWfps.length === 0}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-3 py-2 rounded-md shadow transition"
            >
              <Download className="w-4 h-4" /> Export Report (CSV)
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-blue-950 font-bold text-xs px-3.5 py-2 rounded-md shadow transition"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Submit New WFP
            </button>
            <button 
              onClick={fetchData}
              className="flex items-center gap-2 bg-blue-800 hover:bg-blue-700 text-xs px-3 py-2 rounded-md font-medium transition"
            >
              <RefreshCw className="w-4 h-4" /> Sync Data
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
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

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-blue-900" /> Search & Filter Submissions
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Keyword Search */}
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

            {/* Department Selector */}
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

            {/* Status Filter */}
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

            {/* Budget Range Inputs */}
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

            {/* Reset Button */}
            <div className="md:col-span-1 flex justify-end">
              <button
                onClick={resetFilters}
                title="Reset Filters"
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
                    <th className="p-4 text-center">Action</th>
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
                        <tr key={wfp.id} className="hover:bg-slate-50">
                          <td className="p-4">
                            <p className="font-semibold text-slate-800">{wfp.title}</p>
                            <p className="text-xs text-slate-500">Focal: {wfp.profiles?.full_name || 'Unassigned'}</p>
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
                            <div className="flex justify-center gap-1">
                              <button 
                                onClick={() => handleStatusChange(wfp.id, 'Approved')}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => handleStatusChange(wfp.id, 'Needs Revision')}
                                className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold"
                              >
                                Revise
                              </button>
                            </div>
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
      </main>

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
