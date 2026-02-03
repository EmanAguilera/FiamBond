'use client'; // Required for hooks and browser APIs

import { useContext, useState, FormEvent } from "react";
import { AppContext } from "@/src/Context/AppContext";
import { API_BASE_URL } from "@/src/config/apiConfig";
import { toast } from "react-hot-toast";

// Next.js Cloudinary Environment Variables
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";
const CLOUD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export default function CreatePersonalLoanWidget({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useContext(AppContext);
  const [form, setForm] = useState({ amount: "", interest: "", desc: "", debtorName: "", deadline: "" });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Login required");

    setLoading(true);
    try {
      let attachment_url = null;
      
      // 1. Upload to Cloudinary
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        const res = await fetch(CLOUD_URL, { method: 'POST', body: fd });
        if (res.ok) {
            const data = await res.json();
            attachment_url = data.secure_url;
        }
      }

      const principal = parseFloat(form.amount) || 0;
      const interest = parseFloat(form.interest) || 0;

      // 2. Create Loan Record (Status: outstanding)
      const loanRes = await fetch(`${API_BASE_URL}/loans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_id: null, 
          creditor_id: user.uid,
          debtor_id: null, 
          debtor_name: form.debtorName,
          amount: principal,
          interest_amount: interest,
          total_owed: principal + interest,
          repaid_amount: 0,
          description: form.desc,
          deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
          status: "outstanding", 
          attachment_url
        })
      });

      if (!loanRes.ok) throw new Error("Loan creation failed");

      // 3. Record Transaction (Expense for the lender)
      await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          family_id: null,
          type: "expense",
          amount: principal,
          description: `Personal loan to ${form.debtorName}: ${form.desc}`,
          attachment_url,
          created_at: new Date().toISOString()
        })
      });

      toast.success("Personal Loan Created");
      setForm({ amount: "", interest: "", desc: "", debtorName: "", deadline: "" });
      setFile(null);
      onSuccess?.();
    } catch (e: any) { 
      console.error(e);
      toast.error("Error processing loan"); 
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-500 placeholder:text-slate-300 transition-all font-medium text-slate-700";

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-2">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">External Loan Tracking</p>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Borrower's Name</label>
        <input 
          type="text" 
          required 
          placeholder="Who are you lending to?" 
          value={form.debtorName}
          onChange={e => setForm({ ...form, debtorName: e.target.value })}
          className={inputStyle} 
        />
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
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Interest</label>
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
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Notes / Description</label>
        <input 
          type="text" 
          required 
          placeholder="e.g. Rent assistance" 
          value={form.desc}
          onChange={e => setForm({ ...form, desc: e.target.value })}
          className={inputStyle} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Expected Repayment</label>
          <input 
            type="date" 
            value={form.deadline} 
            onChange={e => setForm({ ...form, deadline: e.target.value })}
            className={inputStyle} 
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Upload Receipt</label>
          <input 
            type="file" 
            onChange={e => setFile(e.target.files?.[0] || null)} 
            accept="image/*,.pdf"
            className="block w-full text-xs text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-dashed border-slate-200 rounded-xl p-2.5" 
          />
        </div>
      </div>

      <button 
        disabled={loading} 
        className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-sm"
      >
        {loading ? 'Recording...' : 'Record Personal Loan'}
      </button>

      <p className="text-[10px] text-center text-slate-400 font-medium leading-relaxed">
        This records an external debt. Since the borrower isn't on the platform, you will need to manually record their repayments using the **Record Repayment** button later.
      </p>
    </form>
  );
}