'use client';

import { useState, useContext, FormEvent, ChangeEvent } from "react";
import { AppContext } from "../../context/AppContext";
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../config/apiConfig';

// 🏎️ Simplex Move: Import your unified loader
import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";
const CLOUD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

interface Member {
    id: string;
    full_name: string;
}

interface UnifiedProps { 
    onSuccess?: () => void; 
    companyData?: any; 
    familyData?: { id: string; family_name: string }; 
    members?: Member[];
}

type TransactionType = "income" | "expense" | "payroll";
type PayrollSubtype = "salary" | "advance";

export default function CreateUnifiedTransactionWidget({ onSuccess, companyData, familyData, members = [] }: UnifiedProps) {
    const { user } = useContext(AppContext) as any;
    
    const companyId = companyData?.id || (typeof companyData === 'string' ? companyData : null);
    const realm = companyId ? 'company' : familyData ? 'family' : 'personal';

    const [form, setForm] = useState({ 
        desc: "", 
        amt: "", 
        type: "expense" as TransactionType,
        payrollSubtype: "salary" as PayrollSubtype,
        employeeId: ""
    });
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const incomeLabel = realm === 'company' ? 'Revenue' : 'Income';
    const incomePlaceholder = realm === 'company' ? "e.g. Sales" : realm === 'family' ? "e.g. Monthly Contribution" : "e.g. Salary";
    const expensePlaceholder = realm === 'company' ? "e.g. Office Rent" : realm === 'family' ? "e.g. Electricity Bill" : "e.g. Grocery";

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFile(e.target.files?.[0] || null);
    };

    const submit = async (e?: FormEvent) => {
        if (e) e.preventDefault();
        if (!user) return toast.error("Login required");
        if (!form.amt || parseFloat(form.amt) <= 0) return toast.error("Please enter a valid amount");
        if (form.type === 'payroll' && !form.employeeId) return toast.error("Please select an employee");

        setLoading(true);
        try {
            let attachment_url = null;
            const timestamp = new Date().toISOString();

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
            
            const employee = members.find(m => m.id === form.employeeId);
            const isPayroll = form.type === 'payroll';
            
            const finalDesc = isPayroll 
                ? `${form.payrollSubtype === 'salary' ? 'Salary' : 'Cash Advance'} for ${employee?.full_name || 'Employee'} - ${form.desc}`
                : form.desc;

            const transactionBody: Record<string, any> = {
                user_id: user.uid, 
                description: finalDesc,
                amount: parseFloat(form.amt), 
                type: isPayroll ? 'expense' : form.type,
                category: isPayroll ? (form.payrollSubtype === 'salary' ? 'Payroll' : 'Cash Advance') : null,
                attachment_url,
                created_at: timestamp,
                family_id: realm === 'family' ? familyData?.id : null, 
                company_id: realm === 'company' ? companyId : null,
            };

            const res = await fetch(`${API_BASE_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionBody)
            });

            if (!res.ok) throw new Error(`Failed to save record`);

            if (realm === 'family' && familyData) {
                const personalSyncBody = {
                    user_id: user.uid,
                    family_id: null,
                    description: `Family Sync (${familyData.family_name}): ${form.desc}`,
                    amount: parseFloat(form.amt),
                    type: 'expense', 
                    attachment_url,
                    created_at: timestamp
                };
                await fetch(`${API_BASE_URL}/transactions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(personalSyncBody) });
            }
            
            toast.success(isPayroll ? "Payroll Disbursed" : "Transaction Recorded");
            setForm({ desc: "", amt: "", type: "expense", payrollSubtype: "salary", employeeId: "" });
            setFile(null); 
            if (onSuccess) onSuccess();

        } catch (error: any) { 
            toast.error(error.message || "Error saving record"); 
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-5">
            <div className={`grid ${realm === 'company' ? 'grid-cols-3' : 'grid-cols-2'} gap-3 p-1 bg-slate-100 rounded-xl`}>
                <button 
                    type="button" 
                    onClick={() => setForm({ ...form, type: 'income' })}
                    className={`py-2.5 rounded-lg font-bold transition-all ${form.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                >
                    {incomeLabel}
                </button>
                <button 
                    type="button" 
                    onClick={() => setForm({ ...form, type: 'expense' })}
                    className={`py-2.5 rounded-lg font-bold transition-all ${form.type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
                >
                    Expense
                </button>
                {realm === 'company' && (
                    <button 
                        type="button" 
                        onClick={() => setForm({ ...form, type: 'payroll' })}
                        className={`py-2.5 rounded-lg font-bold transition-all ${form.type === 'payroll' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        Payroll
                    </button>
                )}
            </div>

            {form.type === 'payroll' && (
                <div className="flex gap-2 p-1 bg-indigo-50 rounded-lg border border-indigo-100">
                    <button 
                        type="button" 
                        onClick={() => setForm({ ...form, payrollSubtype: 'salary' })}
                        className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${form.payrollSubtype === 'salary' ? 'bg-indigo-600 text-white' : 'text-indigo-400'}`}
                    >
                        Salary Disburse
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setForm({ ...form, payrollSubtype: 'advance' })}
                        className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${form.payrollSubtype === 'advance' ? 'bg-indigo-600 text-white' : 'text-indigo-400'}`}
                    >
                        Cash Advance
                    </button>
                </div>
            )}

            <div className="space-y-4">
                {form.type === 'payroll' && (
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Select Employee</label>
                        <select 
                            value={form.employeeId} 
                            onChange={e => setForm({ ...form, employeeId: e.target.value })}
                            className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-500 bg-white font-medium"
                        >
                            <option value="">-- Choose Employee --</option>
                            {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                        </select>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                        {form.type === 'payroll' ? 'Disbursement Amount (₱)' : 'Amount (₱)'}
                    </label>
                    <input 
                        type="number" step="0.01" required placeholder="0.00" 
                        value={form.amt} onChange={e => setForm({ ...form, amt: e.target.value })} 
                        className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-500 text-2xl font-semibold bg-white" 
                    />
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                        {form.type === 'payroll' ? 'Notes / Period' : 'Description'}
                    </label>
                    <input 
                        type="text" required 
                        placeholder={
                            form.type === 'income' ? incomePlaceholder : 
                            form.type === 'payroll' ? "e.g. Oct 1-15 Payroll" : 
                            expensePlaceholder
                        } 
                        value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} 
                        className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 ring-indigo-500 bg-white" 
                    />
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Attachment (optional)</label>
                    <input 
                        type="file" onChange={handleFileChange} accept="image/*,.pdf"
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-dashed border-slate-300 rounded-xl p-3 bg-slate-50" 
                    />
                </div>
            </div>

            {form.type === 'payroll' && (
                <div className={`p-3 rounded-xl text-xs border ${form.payrollSubtype === 'salary' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                    {form.payrollSubtype === 'salary' 
                        ? 'Generates a payroll expense for the ledger. Exportable as a PDF invoice later.'
                        : 'Recorded as a company expense. Repayment terms should be managed externally.'}
                </div>
            )}

            {/* 🛡️ Unified Button Pattern: Provides visual feedback while loading */}
            <button 
                type="submit" disabled={loading} 
                className={`w-full py-4 text-white font-bold rounded-2xl transition-all active:scale-[0.98] disabled:opacity-70
                    ${form.type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 
                      form.type === 'payroll' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 shadow-lg' : 
                      'bg-rose-600 hover:bg-rose-700'}
                `}
            >
                {loading ? (
                    <UnifiedLoadingWidget 
                        type="inline" 
                        message="Processing..." 
                    />
                ) : (
                    form.type === 'payroll' ? 'Confirm Disbursement' : 'Save Transaction'
                )}
            </button>
        </form>
    );
}