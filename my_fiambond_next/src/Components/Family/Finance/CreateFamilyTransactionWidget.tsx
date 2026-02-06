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
            {/* Conflict Modal - Replicated UI from CreateTransactionWidget */}
            {conflict && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl text-center max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold mb-4 text-slate-800">
                            Conflict: <span className="text-indigo-600">{conflict.name}</span>
                        </h2>
                        <div className="flex gap-3">
                            <button onClick={() => setConflict(null)} className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                                Cancel {/* Changed text from 'Abandon' to 'Cancel' for consistency */}
                            </button>
                            <button onClick={() => submit()} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                                Proceed
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={submit} className="space-y-5"> {/* Replicated space-y-5 */}
                {/* Type Toggle - Replicated UI from CreateTransactionWidget */}
                <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl">
                    <button 
                        type="button" 
                        onClick={() => setForm({ ...form, type: 'income' })}
                        className={`py-2.5 rounded-lg font-bold transition-all ${form.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        + Income
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setForm({ ...form, type: 'expense' })}
                        className={`py-2.5 rounded-lg font-bold transition-all ${form.type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        - Expense
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Amount Input */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Amount (₱)</label> {/* Replicated Label style */}
                        <input 
                            type="number" 
                            step="0.01" 
                            required 
                            placeholder="0.00" 
                            value={form.amt} 
                            onChange={e => setForm({ ...form, amt: e.target.value })} 
                            // Replicated Input style (p-4, rounded-xl, focus:ring-2, text-2xl font-semibold)
                            className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-500 text-2xl font-semibold bg-white placeholder:text-slate-300" 
                        />
                    </div>
                    
                    {/* Description Input */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Description</label> {/* Replicated Label style */}
                        <input 
                            type="text" 
                            required 
                            placeholder={form.type === 'income' ? "e.g. Monthly Contribution" : "e.g. Electricity Bill"} 
                            value={form.desc} 
                            onChange={e => setForm({ ...form, desc: e.target.value })} 
                            // Replicated Input style (p-4, rounded-xl, focus:ring-2)
                            className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-500 bg-white placeholder:text-slate-300" 
                        />
                    </div>
                    
                    {/* File Input */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                            Receipt <span className="text-slate-400 font-normal lowercase">(optional)</span> {/* Replicated Label style */}
                        </label>
                        <input 
                            type="file" 
                            key={file ? "has-file" : "no-file"} 
                            onChange={handleFileChange} 
                            accept="image/*,.pdf"
                            // Replicated File Input style
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-dashed border-slate-300 rounded-xl p-3 bg-slate-50" 
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <button 
                    type="submit"
                    disabled={loading} 
                    // Replicated Button style (py-4, rounded-2xl, shadow-lg, active:scale-[0.98])
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-[0.98] shadow-lg shadow-indigo-100"
                >
                    {loading ? 'Processing Sync...' : 'Save & Sync Transaction'}
                </button>

                {/* Ledger Sync Info */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-center text-slate-400 leading-relaxed italic">
                        <span className="font-bold uppercase not-italic">Ledger Sync:</span> This action records the transaction in the Family account and simultaneously creates an <span className="text-slate-600 font-semibold">expense</span> entry in your personal wallet.
                    </p>
                </div>
            </form>
        </>
    );
}