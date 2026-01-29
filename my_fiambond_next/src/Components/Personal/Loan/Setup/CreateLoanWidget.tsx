'use client'; // Required due to the use of useState, useContext, and browser APIs (fetch, FormData, File)

import { useState, useContext, FormEvent } from 'react';
import { AppContext } from '../../../../Context/AppContext.jsx';
import { toast } from "react-hot-toast";

// Removed Firebase Imports
// import { Loan } from '../../../../types/index.js'; // Optional if using TS

interface Member { id: string; full_name: string; }
interface CreateLoanWidgetProps { family: { id: string }; members: Member[]; onSuccess?: () => void; }

// ⭐️ Next.js change: Replace import.meta.env with process.env.NEXT_PUBLIC_
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";
const CLOUD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
// ⭐️ Next.js change: Replace import.meta.env.VITE_API_URL with process.env.NEXT_PUBLIC_API_URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function CreateLoanWidget({ family, members, onSuccess }: CreateLoanWidgetProps) {
  const { user } = useContext(AppContext);
  const [form, setForm] = useState({ amount: "", interest: "", desc: "", debtorId: "", deadline: "" });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter out current user
  const otherMembers = (members || []).filter(m => String(m.id) !== String(user?.uid));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Login required");

    setLoading(true);
    try {
      let attachment_url = null;
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

      // 1. Create Loan Record
      const loanRes = await fetch(`${API_URL}/loans`, {
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
          deadline: form.deadline ? new Date(form.deadline) : null,
          status: "pending_confirmation",
          attachment_url
        })
      });

      if (!loanRes.ok) throw new Error("Loan creation failed");

      // 2. Record Transaction (Expense)
      await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          family_id: null, // Personal expense (from creditor)
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
    } catch (e) { toast.error("Error processing loan"); }
    setLoading(false);
  };

  const inputStyle = "w-full p-3 border rounded-lg outline-none focus:ring-2 ring-indigo-500 placeholder:text-slate-300";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Lending To</label>
        <select required value={form.debtorId} onChange={e => setForm({ ...form, debtorId: e.target.value })}
          className={`${inputStyle} bg-white`}>
          <option value="">{otherMembers.length > 0 ? "Select Family Member" : "No other members"}</option>
          {otherMembers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Amount (₱)</label>
          <input type="number" step="0.01" required placeholder="0.00" value={form.amount}
            onChange={e => setForm({ ...form, amount: e.target.value })}
            className={`${inputStyle} text-lg font-mono`} />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Interest (Optional)</label>
          <input type="number" step="0.01" placeholder="0.00" value={form.interest}
            onChange={e => setForm({ ...form, interest: e.target.value })}
            className={`${inputStyle} text-lg font-mono`} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
        <input type="text" required placeholder="e.g. Lunch money" value={form.desc}
          onChange={e => setForm({ ...form, desc: e.target.value })}
          className={inputStyle} />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Deadline <span className="text-gray-400 font-normal">(Optional)</span></label>
        <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })}
          className={inputStyle} />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Receipt <span className="text-gray-400 font-normal">(Optional)</span></label>
        <input type="file" key={file ? "has-file" : "no-file"} onChange={e => setFile(e.target.files?.[0] || null)} accept="image/*,.pdf"
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 rounded-lg p-2" />
      </div>

      <button disabled={loading || otherMembers.length === 0} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition shadow-lg shadow-indigo-200">
        {loading ? 'Processing...' : 'Confirm & Lend'}
      </button>
    </form>
  );
}