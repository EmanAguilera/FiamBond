import { useContext, useState, FormEvent } from "react";
import { AppContext } from "../../../../Context/AppContext";
import { toast } from "react-hot-toast";

const CLOUD_URL = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy"}/image/upload`;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default");
        const res = await fetch(CLOUD_URL, { method: 'POST', body: fd });
        if (res.ok) attachment_url = (await res.json()).secure_url;
      }

      const principal = parseFloat(form.amount) || 0;
      const interest = parseFloat(form.interest) || 0;

      // 1. Create Loan Record
      const loanRes = await fetch(`${API_URL}/loans`, {
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
          deadline: form.deadline ? new Date(form.deadline) : null,
          status: "outstanding",
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
    } catch (e) { toast.error("Error processing loan"); }
    setLoading(false);
  };

  const inputStyle = "w-full p-3 border rounded-lg outline-none focus:ring-2 ring-indigo-500 placeholder:text-slate-300";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Lending To (Name)</label>
        <input type="text" required placeholder="e.g. John Doe" value={form.debtorName}
          onChange={e => setForm({ ...form, debtorName: e.target.value })}
          className={inputStyle} />
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
        <input type="text" required placeholder="e.g. Emergency Cash" value={form.desc}
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

      <button disabled={loading} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition shadow-lg shadow-indigo-200">
        {loading ? 'Processing...' : 'Confirm & Lend'}
      </button>
    </form>
  );
}