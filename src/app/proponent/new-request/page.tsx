'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client'; // Ensure path matches your supabase client

export default function NewProcurementRequest() {
  const [projectTitle, setProjectTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Get current authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Insert initial request into procurement_requests table
    const { data, error } = await supabase
      .from('procurement_requests')
      .insert([
        { 
          project_title: projectTitle, 
          current_step: 0, 
          current_office: 'Proponent',
          proponent_id: user?.id || null,
          status: 'Draft'
        }
      ])
      .select()
      .single();

    if (error) {
      alert('Error creating request: ' + error.message);
      setLoading(false);
    } else {
      // Automatically redirect to the checklist upload page for this request
      router.push(`/proponent/requests/${data.id}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow mt-8">
      <h2 className="text-xl font-bold text-slate-800 mb-6">New Small Value Procurement Request</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Project / Activity Title</label>
          <input
            type="text"
            required
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-slate-800"
            placeholder="e.g., Training Workshop for SDO Personnel"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 disabled:bg-slate-400"
        >
          {loading ? 'Creating Request...' : 'Proceed to Document Checklist'}
        </button>
      </form>
    </div>
  );
}