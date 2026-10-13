'use client';
import { useState } from 'react';

const REQUIRED_DOCS = [
  { id: 'activity_proposal', label: 'Activity Proposal (Signed by End-User, Chief, Budget, Accountant)' },
  { id: 'purchase_request', label: 'a) Request Letter for Procurement / Purchase Request' },
  { id: 'mode_procurement', label: 'b) Letter for Mode Procurement' },
  { id: 'market_scoping', label: 'c) Market Scoping' },
  { id: 'rfq', label: 'd) Prepare and issue RFQ to prospective suppliers' },
  { id: 'saro', label: 'e) Source of Fund: SARO / Request for Budget Approval' },
  { id: 'ppmp', label: 'f) Signed PPMP (PMIS Generated)' },
  { id: 'wfp', label: 'g) Signed WFP (PMIS Generated)' },
  { id: 'app', label: 'h) Signed APP / Supp APP' },
];

export default function PreparationChecklist({ procurementId }: { procurementId: string }) {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, boolean>>({});

  const allComplete = REQUIRED_DOCS.every(doc => uploadedFiles[doc.id]);

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">
        Preparation Phase: Complete Request Package
      </h3>
      <p className="text-sm text-slate-500 mb-6">
        Upload all required signed documents to proceed to Step 1 (Records Section).
      </p>

      <div className="space-y-4">
        {REQUIRED_DOCS.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded border">
            <span className="text-sm font-medium text-slate-700">{doc.label}</span>
            <label className="cursor-pointer bg-blue-600 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-700">
              {uploadedFiles[doc.id] ? 'Replace File' : 'Upload File'}
              <input 
                type="file" 
                className="hidden" 
                onChange={() => setUploadedFiles(prev => ({ ...prev, [doc.id]: true }))} 
              />
            </label>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          disabled={!allComplete}
          className={`px-4 py-2 rounded text-sm font-semibold text-white ${
            allComplete ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-300 cursor-not-allowed'
          }`}
        >
          Submit to Records Section (Step 1)
        </button>
      </div>
    </div>
  );
}