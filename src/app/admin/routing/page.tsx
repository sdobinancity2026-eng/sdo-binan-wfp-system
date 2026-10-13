'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

// Define the 15-step workflow offices based on the procurement matrix
const OFFICE_STEPS: Record<number, { office: string; title: string }> = {
  1: { office: 'Records Section', title: 'Affix tracking number and route documents' },
  2: { office: 'Procurement Unit', title: 'Assign PR Number and consolidate documents' },
  3: { office: 'ASDS Office', title: 'Recommending approval' },
  4: { office: 'SDS Office (HOPE)', title: 'Approve Activity Proposal and PR' },
  5: { office: 'Procurement Unit', title: 'Secure required approvals and issue Purchase Order' },
  6: { office: 'BAC', title: 'Conduct procurement and issue BAC Resolution' },
  7: { office: 'HOPE', title: 'Sign Notice of Award, Purchase Order and NTP' },
  8: { office: 'Budget Section', title: 'Obligate ORS' },
  9: { office: 'Accounting Section', title: 'Final pre-audit and contract review' },
  10: { office: 'Supply', title: 'Check completeness & Issue Inspection Order' },
  11: { office: 'Inspectorate Committee / PSU', title: 'Inspect delivery & prepare IAR, RIS, DR, SI' },
  12: { office: 'Procurement Unit / SMME', title: 'Consolidate documents & update PMR/M&E' },
  13: { office: 'Accounting Section', title: 'Submit complete documents for payment (DV)' },
  14: { office: 'SDS Office', title: 'Approve DV' },
  15: { office: 'Cashier', title: 'Payment of the Procurement' },
};

export default function OfficeRoutingDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<string>('Records Section');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const officesList = [
    'Records Section',
    'Procurement Unit',
    'ASDS Office',
    'SDS Office (HOPE)',
    'BAC',
    'HOPE',
    'Budget Section',
    'Accounting Section',
    'Supply',
    'Inspectorate Committee / PSU',
    'SMME',
    'SDS Office',
    'Cashier',
  ];

  useEffect(() => {
    fetchRequests();
  }, [selectedOffice]);

  async function fetchRequests() {
    setLoading(true);
    const { data, error } = await supabase
      .from('procurement_requests')
      .select('*')
      .eq('current_office', selectedOffice);

    if (error) {
      console.error('Error fetching requests:', error.message);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  }

  async function openRequestDetails(req: any) {
    setSelectedRequest(req);
    const { data } = await supabase
      .from('procurement_documents')
      .select('*')
      .eq('procurement_id', req.id);

    setDocuments(data || []);
  }

  async function forwardToNextStep(req: any) {
    const nextStep = req.current_step + 1;
    const nextOfficeInfo = OFFICE_STEPS[nextStep];

    if (!nextOfficeInfo) {
      alert('This request is already at the final step!');
      return;
    }

    const { error: updateError } = await supabase
      .from('procurement_requests')
      .update({
        current_step: nextStep,
        current_office: nextOfficeInfo.office,
        status: nextStep >= 15 ? 'Completed' : 'In Progress',
      })
      .eq('id', req.id);

    if (updateError) {
      alert('Failed to forward: ' + updateError.message);
      return;
    }

    // Log the routing history
    await supabase.from('document_routing_logs').insert([
      {
        procurement_id: req.id,
        step_number: nextStep,
        from_office: req.current_office,
        to_office: nextOfficeInfo.office,
        forwarded_at: new Date().toISOString(),
        remarks: `Forwarded to ${nextOfficeInfo.office} for Step ${nextStep}: ${nextOfficeInfo.title}`,
      },
    ]);

    alert(`Successfully forwarded to ${nextOfficeInfo.office} (Step ${nextStep})!`);
    setSelectedRequest(null);
    fetchRequests();
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Office Routing Dashboard</h1>
          <p className="text-sm text-slate-500">Track and process incoming procurement workflows per office.</p>
        </div>

        {/* Office Switcher Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-700">Filter Office:</label>
          <select
            value={selectedOffice}
            onChange={(e) => setSelectedOffice(e.target.value)}
            className="border rounded-md px-3 py-1.5 text-sm bg-white text-slate-800 font-medium shadow-sm"
          >
            {officesList.map((office) => (
              <option key={office} value={office}>
                {office}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow border p-4">
          <h2 className="text-md font-semibold text-slate-800 mb-3 flex items-center justify-between">
            <span>Incoming Queue</span>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-bold">
              {requests.length}
            </span>
          </h2>

          {loading ? (
            <p className="text-sm text-slate-500 text-center py-6">Loading queue...</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No pending documents for this office.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  onClick={() => openRequestDetails(req)}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    selectedRequest?.id === req.id
                      ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      Step {req.current_step}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 line-clamp-1">{req.project_title}</h3>
                  <p className="text-xs text-slate-500 mt-1">Status: <span className="font-medium text-amber-600">{req.status}</span></p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Request Inspection & Action Panel */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow border p-6">
          {selectedRequest ? (
            <div>
              <div className="border-b pb-4 mb-4">
                <span className="text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                  Current Step {selectedRequest.current_step}: {selectedRequest.current_office}
                </span>
                <h2 className="text-xl font-bold text-slate-800 mt-2">{selectedRequest.project_title}</h2>
                <p className="text-xs text-slate-500 mt-1">Request ID: {selectedRequest.id}</p>
              </div>

              <h3 className="text-sm font-semibold text-slate-800 mb-3">Attached Documents for Verification</h3>
              {documents.length === 0 ? (
                <p className="text-sm text-slate-400 italic mb-6">No documents uploaded yet.</p>
              ) : (
                <div className="space-y-2 mb-6">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded border text-sm">
                      <span className="font-medium text-slate-700 capitalize">{doc.document_type.replace('_', ' ')}</span>
                      <span className="text-xs text-slate-500 truncate max-w-xs">{doc.file_name}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => forwardToNextStep(selectedRequest)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded text-sm font-semibold shadow transition"
                >
                  Forward to Next Office Step ➔
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 text-slate-400">
              <p className="text-base font-medium">Select a procurement request from the queue to review documents and route.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}