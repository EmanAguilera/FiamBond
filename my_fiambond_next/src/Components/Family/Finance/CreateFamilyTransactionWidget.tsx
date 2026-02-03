'use client';

import { useState, useContext, FormEvent, ChangeEvent } from "react";
import { AppContext } from "../../../Context/AppContext";
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from "@/src/config/apiConfig";

// Cloudinary Config (Env vars preferred)
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";
const CLOUD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

interface Props { 
    family: { id: string; family_name: string }; 
    onSuccess?: () => void; 
}

export default function CreateFamilyTransactionWidget({ family, onSuccess }: Props) {
    const { user } = useContext(AppContext);
    
    const [form, setForm] = useState({ 
        desc: "", 
        amt: "", 
        type: "expense" as "income" | "expense" 
    });
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [conflict, setConflict] = useState<{ name: string } | null>(null);

    const submit = async (e?: FormEvent) => {
        if (e) e.preventDefault();
        if (!user) return toast.error("Login required");

        setLoading(true);
        try {
            let attachment_url = null;

            // 1. Upload to Cloudinary if file exists
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

            const timestamp = new Date().toISOString();
            const amountVal = parseFloat(form.amt);

            // 2. Record Family Transaction via API_BASE_URL
            const famRes = await fetch(`${API_BASE_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.uid,
                    family_id: family.id,
                    description: form.desc,
                    amount: amountVal,
                    type: form.type,
                    attachment_url,
                    created_at: timestamp
                })
            });

            if (!famRes.ok) throw new Error("Failed to save family record");

            // 3. Record Corresponding Personal Transaction (Sync Logic)
            const personalDesc = `Family ${form.type === 'income' ? 'Contribution' : 'Expense'} (${family.family_name}): ${form.desc}`;
            const perRes = await fetch(`${API_BASE_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.uid,
                    family_id: null, // Personal Transaction marker
                    description: personalDesc,
                    amount: amountVal,
                    type: 'expense', // Always an expense from the personal perspective
                    attachment_url,
                    created_at: timestamp
                })
            });

            if (!perRes.ok) throw new Error("Personal sync failed");
            
            toast.success("Transaction Recorded & Synced");
            setForm({ desc: "", amt: "", type: "expense" });
            setFile(null); 
            setConflict(null);
            if (onSuccess) onSuccess();

        } catch (e: any) { 
            console.error("Transaction Error:", e);
            toast.error(e.message || "Error saving transaction"); 
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFile(e.target.files?.[0] || null);
    };

    return (
        <>
            {/* Conflict Modal */}
            {conflict && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl text-center max-w-sm shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Conflict: <span className="text-indigo-600">{conflict.name}</span></h2>
                        <div className="flex gap-3">
                            <button onClick={() => setConflict(null)} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-colors">Abandon</button>
                            <button onClick={() => submit()} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors">Proceed</button>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        type="button" 
                        onClick={() => setForm({ ...form, type: 'income' })}
                        className={`py-3 rounded-xl font-bold border-2 transition-all active:scale-95 ${form.type === 'income' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}>
                        + Income
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setForm({ ...form, type: 'expense' })}
                        className={`py-3 rounded-xl font-bold border-2 transition-all active:scale-95 ${form.type === 'expense' ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}>
                        - Expense
                    </button>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Amount (₱)</label>
                    <input 
                        type="number" 
                        step="0.01" 
                        required 
                        placeholder="0.00" 
                        value={form.amt} 
                        onChange={e => setForm({ ...form, amt: e.target.value })} 
                        className="w-full p-3 border-2 border-slate-100 rounded-xl outline-none focus:border-indigo-500 text-xl font-mono placeholder:text-slate-200 transition-all" 
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                    <input 
                        type="text" 
                        required 
                        placeholder={form.type === 'income' ? "e.g. Monthly Contribution" : "e.g. Electricity Bill"} 
                        value={form.desc} 
                        onChange={e => setForm({ ...form, desc: e.target.value })} 
                        className="w-full p-3 border-2 border-slate-100 rounded-xl outline-none focus:border-indigo-500 placeholder:text-slate-200 transition-all" 
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Receipt <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <input 
                        type="file" 
                        key={file ? "has-file" : "no-file"} 
                        onChange={handleFileChange} 
                        accept="image/*,.pdf"
                        className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border-2 border-slate-100 border-dashed rounded-xl p-2" 
                    />
                </div>

                <button 
                    disabled={loading} 
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                >
                    {loading ? 'Processing Sync...' : 'Save & Sync Transaction'}
                </button>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-center text-slate-400 leading-relaxed italic">
                        <span className="font-bold uppercase not-italic">Ledger Sync:</span> This action records the transaction in the Family account and simultaneously creates an <span className="text-slate-600 font-semibold">expense</span> entry in your personal wallet.
                    </p>
                </div>
            </form>
        </>
    );
}