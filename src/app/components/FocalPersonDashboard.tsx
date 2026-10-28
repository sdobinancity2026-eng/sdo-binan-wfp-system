'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, Clock, CheckCircle2, Layers, Building2, Eye, Plus, RefreshCw 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { WFPItem } from '@/types/wfp';

export default function FocalPersonDashboard({ 
  wfps,
  currentUser,
  onOpenSubmitModal 
}: { 
  wfps?: WFPItem[];
  currentUser: any;
  onOpenSubmitModal?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'active_tracker' | 'all_submissions'>('active_tracker');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchAllSubmissions() {
      setLoading(true);
      // Fetch procurement requests and join/fetch related data
      const { data, error } = await supabase
        .from('procurement_requests')
        .select(`
          *,
          procurement_documents(document_type, file_name)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRequests(data);
      }
      setLoading(false);
    }

    fetchAllSubmissions();
  }, [supabase]);

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
            Track activity status, monitor workflow routing, and view complete procurement & WFP records.
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
              <Clock className="w-4 h-4" /> Workflow & Activity Tracker ({requests.length})
            </button>
            <button
              onClick={() => setActiveTab('all_submissions')}
              className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition ${
                activeTab === 'all_submissions'
                  ? 'bg-blue-900 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" /> All Submitted Requests ({requests.length})
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

      {/* UNIFIED SUBMISSIONS TABLE */}
      {(activeTab === 'active_tracker' || activeTab === 'all_submissions') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-900" />
              {activeTab === 'active_tracker' 
                ? 'Workflow & Activity Tracker — Active Procurement Packages' 
                : 'All Submitted Procurement Requests & Document Checklists'}
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Total Records: <strong className="text-blue-900">{requests.length}</strong>
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">Loading records from Supabase...</div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No procurement requests or WFP submissions found in Supabase. Click **Submit WFP** to start a new request.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 uppercase text-[10px] font-bold">
                    <th className="p-3">Project / Activity Title</th>
                    <th className="p-3">Current Office Location</th>
                    <th className="p-3">Workflow Step</th>
                    <th className="p-3">Uploaded Documents</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((req) => {
                    const uploadedCount = req.procurement_documents?.length || 0;

                    return (
                      <tr key={req.id} className="hover:bg-slate-50 transition">
                        <td className="p-3">
                          <p className="font-bold text-slate-800 text-sm">{req.project_title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">ID: {req.id.slice(0, 8)}...</p>
                        </td>
                        <td className="p-3 font-semibold text-slate-700">
                          <span className="bg-blue-50 text-blue-900 px-2.5 py-1 rounded-md border border-blue-200">
                            {req.current_office || 'Proponent'}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-800">
                          Step {req.current_step || 0} of 15
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {uploadedCount} / 9 Uploaded
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded uppercase inline-block ${
                            req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            req.status === 'Pending Review' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            'bg-slate-100 text-slate-700 border border-slate-300'
                          }`}>
                            {req.status || 'Draft'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <a
                            href={`/proponent/requests/${req.id}`}
                            className="bg-blue-900 hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Checklist
                          </a>
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