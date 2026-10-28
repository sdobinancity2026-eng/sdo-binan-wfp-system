'use client';

import { useState } from 'react';
import { 
  FileText, Clock, CheckCircle2, Layers, Building2, Eye, Plus 
} from 'lucide-react';
import { WFPItem } from '@/types/wfp';

export default function FocalPersonDashboard({ 
  wfps, 
  currentUser,
  onOpenSubmitModal 
}: { 
  wfps: WFPItem[]; 
  currentUser: any;
  onOpenSubmitModal?: () => void;
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
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('active_tracker')}
              className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition ${
                activeTab === 'active_tracker'
                  ? 'bg-blue-900 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-4 h-4" /> Workflow & Activity Tracker ({userWfps.length})
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

          {onOpenSubmitModal && (
            <button
              onClick={onOpenSubmitModal}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-blue-950 px-3.5 py-2 rounded-xl text-xs font-extrabold transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> Submit WFP
            </button>
          )}
        </div>
      </div>

      {/* TAB 1 & TAB 2: UNIFIED COMPREHENSIVE ACTIVITY & WFP TABLE */}
      {(activeTab === 'active_tracker' || activeTab === 'all_submissions') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              {activeTab === 'active_tracker' ? (
                <>
                  <Clock className="w-4 h-4 text-amber-500" />
                  Workflow & Activity Tracker — Office Submissions
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-blue-900" />
                  All Submitted Work and Financial Plans & Document Checklist Status
                </>
              )}
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Total Records: <strong className="text-blue-900">{userWfps.length}</strong>
            </span>
          </div>

          {userWfps.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No active Work and Financial Plan submissions found for your office. Click **Submit WFP** to start a new request.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 uppercase text-[10px] font-bold">
                    <th className="p-3">Program / Project / Activity (PPA) Title</th>
                    <th className="p-3">Department / Division</th>
                    <th className="p-3">AIP Code</th>
                    <th className="p-3">Total Allocation</th>
                    <th className="p-3">Workflow Stage / Location</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userWfps.map((wfp) => {
                    const allocated = Number(wfp.total_allocated || 0);

                    return (
                      <tr key={wfp.id} className="hover:bg-slate-50 transition">
                        <td className="p-3">
                          <p className="font-bold text-slate-800 text-sm">{wfp.title}</p>
                          {wfp.kpi && (
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                              <span className="font-semibold text-slate-600">Eligible Items:</span> {wfp.kpi}
                            </p>
                          )}
                        </td>
                        <td className="p-3 font-semibold text-slate-600">
                          {wfp.departments?.code || wfp.departments?.name || currentUser?.office || '-'}
                        </td>
                        <td className="p-3">
                          <span className="bg-blue-50 text-blue-900 font-bold px-2 py-0.5 rounded border border-blue-200 text-[10px]">
                            {wfp.aip_code || 'AIP-Aligned'}
                          </span>
                        </td>
                        <td className="p-3 font-extrabold text-blue-900">
                          ₱{allocated.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3">
                          <span className="bg-slate-200 text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded">
                            {wfp.status === 'Approved' ? 'Final Approval Phase' : 'Division Review Section'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded uppercase inline-block ${
                            wfp.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            wfp.status === 'Needs Revision' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                            'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                          }`}>
                            {wfp.status || 'For Review'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`/proponent/requests/${wfp.id}`}
                              className="bg-blue-900 hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Checklist
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}