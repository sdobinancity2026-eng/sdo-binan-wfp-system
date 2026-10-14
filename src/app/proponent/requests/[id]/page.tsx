'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const CHECKLIST_ITEMS = [
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

export default function RequestChecklistPage() {
  const params = useParams();
  const requestId = params?.id as string;
  const router = useRouter();

  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>({});
  const [projectTitle, setProjectTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!requestId) return;

    async function loadRequestData() {
      // Fetch request details
      const { data: reqData } = await supabase
        .from('procurement_requests')
        .select('project_title')
        .eq('id', requestId)
        .single();

      if (reqData) setProjectTitle(reqData.project_title);

      // Fetch already uploaded documents
      const { data: docData } = await supabase
        .from('procurement_documents')
        .select('document_type, file_name')
        .eq('procurement_id', requestId);

      if (docData) {
        const docMap: Record<string, string> = {};
        docData.forEach((d) => {
          docMap[d.document_type] = d.file_name;
        });
        setUploadedDocs(docMap);
      }
      setLoading(false);
    }

    loadRequestData();
  }, [requestId, supabase]);

  const handleFileUpload = async (docType: string, file: File) => {
    try {
      setUploading(docType);

      const filePath = `${requestId}/${docType}_${Date.now()}_${file.name}`;

      // 1. Upload to Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('procurement-docs')
        .upload(filePath, file, { upsert: true });

      if (storageError) throw storageError;

      // 2. Insert metadata into procurement_documents table
      const { error: dbError } = await supabase
        .from('procurement_documents')
        .insert([
          {
            procurement_id: requestId,
            document_type: docType,
            file_url: storageData.path,
            file_name: file.name,
          },
        ]);

      if (dbError) throw dbError;

      setUploadedDocs((prev) => ({ ...prev, [docType]: file.name }));
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(null);
    }
  };

  const isComplete = CHECKLIST_ITEMS.every((item) => uploadedDocs[item.id]);

  const handleSubmitToRecords = async () => {
    // Forward document to Step 1 (Records Section)
    const { error: reqError } = await supabase
      .from('procurement_requests')
      .update({
        current_step: 1,
        current_office: 'Records Section',
        status: 'Pending Review',
      })
      .eq('id', requestId);

    if (reqError) {
      alert('Error forwarding request: ' + reqError.message);
      return;
    }

    // Insert into Routing Logs (Audit Trail)
    await supabase.from('document_routing_logs').insert([
      {
        procurement_id: requestId,
        step_number: 1,
        from_office: 'Proponent',
        to_office: 'Records Section',
        forwarded_at: new Date().toISOString(),
        remarks: 'Preparation phase completed with all required checklist items.',
      },
    ]);

    alert('Request successfully submitted and forwarded to Records Section (Step 1)!');
    router.push('/proponent');
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-600">Loading checklist...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow mt-8">
      <div className="border-b pb-4 mb-6">
        <span className="text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2.5 py-1 rounded">
          Preparation Phase (Step 0)
        </span>
        <h2 className="text-2xl font-bold text-slate-800 mt-2">
          {projectTitle || 'Procurement Request Checklist'}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Upload all required signed attachments before forwarding to the Records Section.
        </p>
      </div>

      <div className="space-y-4">
        {CHECKLIST_ITEMS.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 hover:bg-slate-100/80 transition"
          >
            <div>
              <p className="text-sm font-semibold text-slate-800">{item.label}</p>
              {uploadedDocs[item.id] ? (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                  ✓ Uploaded: {uploadedDocs[item.id]}
                </span>
              ) : (
                <span className="text-xs text-amber-600 mt-1 block">Pending upload</span>
              )}
            </div>

            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded text-xs font-semibold shrink-0">
              {uploading === item.id ? 'Uploading...' : uploadedDocs[item.id] ? 'Replace' : 'Upload'}
              <input
                type="file"
                className="hidden"
                disabled={uploading === item.id}
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileUpload(item.id, e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-4 border-t flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {Object.keys(uploadedDocs).length} of {CHECKLIST_ITEMS.length} required documents uploaded
        </span>
        <button
          onClick={handleSubmitToRecords}
          disabled={!isComplete}
          className={`px-5 py-2.5 rounded font-bold text-sm text-white transition ${
            isComplete
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md'
              : 'bg-slate-300 cursor-not-allowed'
          }`}
        >
          Forward to Records Section (Step 1)
        </button>
      </div>
    </div>
  );
}