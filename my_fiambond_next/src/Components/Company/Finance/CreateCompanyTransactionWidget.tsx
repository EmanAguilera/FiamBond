'use client';

import { useState, useContext, FormEvent } from "react";
import { AppContext } from "../../../Context/AppContext";
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '@/src/config/apiConfig';

// Cloudinary Config
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";
const CLOUD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

interface Props { 
    company: { id: string | number }; 
    onSuccess?: () => void; 
}

export default function CreateCompanyTransactionWidget({ company, onSuccess }: Props) {
    const { user } = useContext(AppContext);
    const [form, setForm] = useState({ desc: "", amt: "", type: "expense" as "income" | "expense" });
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [conflict, setConflict] = useState<{ name: string } | null>(null);

    const submit = async (e?: FormEvent) => {
        if (e) e.preventDefault();
        if (!user) return toast.error("Login required");

        setLoading(true);
        try {
            let attachment_url = null;
            
            // 1. Handle File Upload to Cloudinary
            if (file) {
                const fd = new FormData();
                fd.append('file', file);
                fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                const cloudRes = await fetch(CLOUD_URL, { method: 'POST', body: fd });
                if (cloudRes.ok) {
                    const cloudData = await cloudRes.json();
                    attachment_url = cloudData.secure_url;
                }
            }

            // 2. Save Transaction to MongoDB via API_BASE_URL
            const res = await fetch(`${API_BASE_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.uid, 
                    company_id: company.id, 
                    description: form.desc,
                    amount: parseFloat(form.amt), 
                    type: form.type, 
                    attachment_url,
                    created_at: new Date().toISOString()
                })
            });

            if (!res.ok) throw new Error("Failed to save transaction");
            
            toast.success(`${form.type === 'income' ? 'Revenue' : 'Expense'} Recorded`);
            
            // Reset Form
            setForm({ desc: "", amt: "", type: "expense" });
            setFile(null); 
            setConflict(null);
            if (onSuccess) onSuccess();

        } catch (error: any) { 
            console.error(error);
            toast.error(error.message || "Error saving record"); 
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {conflict && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl text-center max-w-sm shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Conflict: <span className="text-indigo-600">{conflict.name}</span></h2>
                        <div className="flex gap-3">
                            <button onClick={() => setConflict(null)} className="flex-1 bg-rose-50 text-rose-700 py-2 rounded-lg font-bold hover:bg-rose-100 transition-all">Abandon</button>
                            <button onClick={() => submit()} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition-all">Proceed</button>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <button type="button" onClick={() => setForm({ ...form, type: 'income' })}
                        className={`py-3 rounded-lg font-bold border transition-all ${form.type === 'income' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                        + Revenue
                    </button>
                    <button type="button" onClick={() => setForm({ ...form, type: 'expense' })}
                        className={`py-3 rounded-lg font-bold border transition-all ${form.type === 'expense' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                        - Expense
                    </button>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Amount (₱)</label>
                    <input type="number" step="0.01" required placeholder="0.00" value={form.amt} 
                        onChange={e => setForm({ ...form, amt: e.target.value })} 
                        className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 ring-indigo-500 text-lg font-mono text-slate-800 placeholder:text-slate-300" />
                </div>
                
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                    <input type="text" required placeholder={form.type === 'income' ? "e.g. Sales" : "e.g. Office Rent"} value={form.desc} 
                        onChange={e => setForm({ ...form, desc: e.target.value })} 
                        className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 ring-indigo-500 text-slate-800 placeholder:text-slate-300" />
                </div>
                
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Receipt <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input type="file" key={file ? "has-file" : "no-file"} onChange={e => setFile(e.target.files?.[0] || null)} accept="image/*,.pdf"
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 rounded-lg p-2" />
                </div>

                <button disabled={loading} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100">
                    {loading ? 'Saving Record...' : 'Save Transaction'}
                </button>
            </form>
        </>
    );
}