'use client'; // Required due to the use of hooks and browser APIs

import { useState, useContext, FormEvent } from 'react';
import { AppContext } from '@/src/Context/AppContext';
import { API_BASE_URL } from '@/src/config/apiConfig';
import { toast } from "react-hot-toast";

interface Member { id: string; full_name: string; }
interface CreateLoanWidgetProps { family: { id: string }; members: Member[]; onSuccess?: () => void; }

// Next.js Cloudinary Environment Variables
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";
const CLOUD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export default function CreateLoanWidget({ family, members, onSuccess }: CreateLoanWidgetProps) {
  const { user } = useContext(AppContext);
  const [form, setForm] = useState({ amount: "", interest: "", desc: "", debtorId: "", deadline: "" });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter out the current user so they don't lend to themselves
  const otherMembers = (members || []).filter(m => String(m.id) !== String(user?.uid));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Login required");

    setLoading(true);
    try {
      let attachment_url = null;
      
      // 1. Upload to Cloudinary if a file exists
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        const res = await fetch(CLOUD_URL, { method: 'POST', body: fd });
        if (res.ok) attachment_url = (await res.json()).secure_url;
      }

      const debtorName = members.find(m => String(m.id) === String(form.debtorId))?.full_name || 'Member';
      const principal = parseFloat(form.amount) || 0;
      const interest = parseFloat(form.interest) || 0;

      // 2. Create Loan Record (status: pending_confirmation)
      const loanRes = await fetch(`${API_BASE_URL}/loans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_id: family.id,
          creditor_id: user.uid,
          debtor_id: form.debtorId,
          debtor_name: debtorName,
          amount: principal,
          interest_amount: interest,
          total_owed: principal + interest,
          repaid_amount: 0,
          description: form.desc,
          deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
          status: "pending_confirmation",
          attachment_url
        })
      });

      if (!loanRes.ok) throw new Error("Loan creation failed");

      // 3. Record Personal Expense for the Creditor
      await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          family_id: null, 
          type: "expense",
          amount: principal,
          description: `Loan to ${debtorName}: ${form.desc}`,
          attachment_url,
          created_at: new Date().toISOString()
        })
      });

      toast.success("Loan Request Sent to Debtor");
      setForm({ amount: "", interest: "", desc: "", debtorId: "", deadline: "" });
      setFile(null);
      onSuccess?.();
    } catch (e) { 
      console.error(e);
      toast.error("Error processing loan"); 
    }
    setLoading(false);
  };

  const inputStyle = "w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-500 placeholder:text-slate-300 transition-all font-medium text-slate-700";

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Lending To</label>
        <select 
          required 
          value={form.debtorId} 
          onChange={e => setForm({ ...form, debtorId: e.target.value })}
          className={`${inputStyle} bg-white appearance-none cursor-pointer`}
        >
          <option value="">{otherMembers.length > 0 ? "Select Family Member" : "No other members available"}</option>
          {otherMembers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Principal (₱)</label>
          <input 
            type="number" 
            step="0.01" 
            required 
            placeholder="0.00" 
            value={form.amount}
            onChange={e => setForm({ ...form, amount: e.target.value })}
            className={`${inputStyle} font-mono`} 
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Interest (Optional)</label>
          <input 
            type="number" 
            step="0.01" 
            placeholder="0.00" 
            value={form.interest}
            onChange={e => setForm({ ...form, interest: e.target.value })}
            className={`${inputStyle} font-mono text-emerald-600`} 
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Purpose / Description</label>
        <input 
          type="text" 
          required 
          placeholder="e.g. Shared grocery expense" 
          value={form.desc}
          onChange={e => setForm({ ...form, desc: e.target.value })}
          className={inputStyle} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Due Date</label>
          <input 
            type="date" 
            value={form.deadline} 
            onChange={e => setForm({ ...form, deadline: e.target.value })}
            className={inputStyle} 
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Proof of Transfer</label>
          <input 
            type="file" 
            onChange={e => setFile(e.target.files?.[0] || null)} 
            accept="image/*,.pdf"
            className="block w-full text-xs text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-dashed border-slate-200 rounded-xl p-2.5" 
          />
        </div>
      </div>

      <button 
        disabled={loading || otherMembers.length === 0} 
        className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-sm"
      >
        {loading ? 'Processing...' : 'Confirm & Create Loan'}
      </button>
      
      <p className="text-[10px] text-center text-slate-400 font-medium">
        This will deduct the principal from your balance immediately. The borrower must confirm receipt for the loan to become active.
      </p>
    </form>
  );
}