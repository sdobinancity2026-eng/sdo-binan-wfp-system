'use client';

import { useState } from 'react';
import { 
  FileText, Clock, CheckCircle2, Layers, Building2, Eye 
} from 'lucide-react';
import { WFPItem } from '@/types/wfp';

export default function FocalPersonDashboard({ 
  wfps, 
  currentUser 
}: { 
  wfps: WFPItem[]; 
  currentUser: any 
}) {
  // Tab switch state: 'active_tracker' | 'all_submissions'
  const [activeTab, setActiveTab] = useState<'active_tracker' | 'all_submissions'>('active_tracker');

  // Filter WFPs belonging to the logged-in focal person's office/department
  const userWfps = wfps.filter(
    (wfp) => 
      !currentUser?.office || 
      (wfp.departments?.name || wfp.departments?.code || '')
        .toLowerCase()
        .includes(currentUser.office.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Focal Dashboard Header & Navigation Buttons */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-900 font-bold text-lg">
            <Building2 className="w-5 h-5 text-amber-500" />
            <span>Focal Person Portal — {currentUser?.office || 'Department Unit'}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Track activity status, monitor workflow routing, and view complete WFP records.
          </p>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('active_tracker')}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition ${
              activeTab === 'active_tracker'
                ? 'bg-blue-900 text-white shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" /> Workflow & Activity Tracker
          </button>
          <button
            onClick={() => setActiveTab('all_submissions')}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition ${
              activeTab === 'all_submissions'
                ? 'bg-blue-900 text-white shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" /> All Submitted WFPs ({userWfps.length})
          </button>
        </div>
      </div>

      {/* TAB 1: WORKFLOW & ACTIVITY STATUS TRACKER */}
      {activeTab === 'active_tracker' && (
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Currently Submitted WFPs — Activity Status & Workflow Stage
          </h3>

          {userWfps.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
              No active Work and Financial Plan submissions found for your office.
            </div>
          ) : (
            userWfps.map((wfp) => {
              const allocated = Number(wfp.total_allocated || 0);

              return (
                <div key={wfp.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* WFP Overview Bar */}
                  <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <span className="text-[10px] bg-blue-100 text-blue-900 font-extrabold px-2.5 py-1 rounded-md uppercase">
                        AIP Alignment: {wfp.aip_code || 'AIP-Aligned'}
                      </span>
                      <h4 className="font-bold text-slate-800 text-base mt-1">{wfp.title}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Allocation</p>
                      <p className="font-extrabold text-blue-900 text-sm">₱{allocated.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Workflow Stepper / Stage Tracker */}
                  <div className="p-4 bg-blue-950/5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-700 mb-3">Overall Process Location:</p>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-emerald-100 text-emerald-800 border border-emerald-300 p-2 rounded-lg font-bold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> 1. Focal Person Draft
                      </div>
                      <div className={`p-2 rounded-lg font-bold flex items-center justify-center gap-1.5 border ${
                        wfp.status === 'For Review' 
                          ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        <Clock className="w-4 h-4" /> 2. Division Review
                      </div>
                      <div className={`p-2 rounded-lg font-bold flex items-center justify-center gap-1.5 border ${
                        wfp.status === 'Approved' 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}>
                        <CheckCircle2 className="w-4 h-4" /> 3. Final Approval
                      </div>
                    </div>
                  </div>

                  {/* Activity Status Table */}
                  <div className="p-4">
                    <p className="text-xs font-bold text-slate-700 uppercase mb-2">Activities Breakdown Status</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 uppercase text-[10px]">
                            <th className="p-2.5">Program / Activity (PPA)</th>
                            <th className="p-2.5">Allocation</th>
                            <th className="p-2.5">Current Activity Process Location</th>
                            <th className="p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-800">{wfp.title}</td>
                            <td className="p-2.5 font-semibold text-slate-700">₱{allocated.toLocaleString()}</td>
                            <td className="p-2.5">
                              <span className="bg-slate-200 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded">
                                Division Review Section
                              </span>
                            </td>
                            <td className="p-2.5">
                              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded uppercase ${
                                wfp.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                                wfp.status === 'Needs Revision' ? 'bg-rose-100 text-rose-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {wfp.status || 'For Review'}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: ALL SUBMITTED WFP LIST */}
      {activeTab === 'all_submissions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-900" />
              All Submitted Work and Financial Plans
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 uppercase text-[10px] font-bold">
                  <th className="p-3">Title / Activity</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">AIP Code</th>
                  <th className="p-3">Allocation</th>
                  <th className="p-3">Overall Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userWfps.map((wfp) => (
                  <tr key={wfp.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-800">{wfp.title}</td>
                    <td className="p-3 font-semibold text-slate-600">
                      {wfp.departments?.code || wfp.departments?.name || '-'}
                    </td>
                    <td className="p-3">
                      <span className="bg-blue-50 text-blue-900 font-bold px-2 py-0.5 rounded border border-blue-200">
                        {wfp.aip_code || 'AIP-Aligned'}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      ₱{Number(wfp.total_allocated || 0).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded uppercase ${
                        wfp.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                        wfp.status === 'Needs Revision' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {wfp.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => setActiveTab('active_tracker')}
                        className="text-blue-900 hover:text-blue-700 font-bold flex items-center gap-1 justify-end ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Process
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}