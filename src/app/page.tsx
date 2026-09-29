'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { WFPItem, Department } from '@/types/wfp';
import { CheckCircle, AlertTriangle, Clock, RefreshCw, BarChart2 } from 'lucide-react';

export default function AdminDashboard() {
  const [wfps, setWfps] = useState<WFPItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    
    const { data: deptData } = await supabase.from('departments').select('*');
    if (deptData) setDepartments(deptData);

    const { data: wfpData, error } = await supabase
      .from('wfps')
      .select('*, departments(code, name), profiles(full_name)');

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

  const filteredWfps = selectedDept === 'ALL' 
    ? wfps 
    : wfps.filter((w: WFPItem) => w.department_id === selectedDept);

  // Financial Calculations with Explicit Type Annotations
  const totalAllocated = filteredWfps.reduce((sum: number, w: WFPItem) => sum + Number(w.total_allocated || 0), 0);
  const totalObligated = filteredWfps.reduce((sum: number, w: WFPItem) => sum + Number(w.total_obligated || 0), 0);
  const totalDisbursed = filteredWfps.reduce((sum: number, w: WFPItem) => sum + Number(w.total_disbursed || 0), 0);

  const burObligation = totalAllocated > 0 ? ((totalObligated / totalAllocated) * 100).toFixed(1) : '0';
  const burDisbursement = totalObligated > 0 ? ((totalDisbursed / totalObligated) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-blue-900 text-white shadow-md border-b-4 border-amber-400">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-wide">SDO BIÑAN CITY — WFP MONITORING PORTAL</h1>
            <p className="text-xs text-blue-200">Department of Education • Region IV-A CALABARZON</p>
          </div>
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 bg-blue-800 hover:bg-blue-700 text-xs px-3 py-2 rounded-md font-medium transition"
          >
            <RefreshCw className="w-4 h-4" /> Sync Data
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-900" /> Executive Overview
          </h2>
          <select 
            className="border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-800"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="ALL">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
            ))}
          </select>
        </div>

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

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Focal Person WFP Submissions</h3>
            <span className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-semibold">
              {filteredWfps.length} Total Plans
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading WFP records...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                  <tr>
                    <th className="p-4">Program / Activity (PPA)</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">AIP Alignment</th>
                    <th className="p-4">Allocation</th>
                    <th className="p-4">Obligation Rate</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredWfps.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">No WFP records found.</td>
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
    </div>
  );
}