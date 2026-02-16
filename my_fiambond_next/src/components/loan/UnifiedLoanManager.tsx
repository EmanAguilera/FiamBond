'use client';

import React, { useState, useContext, FormEvent } from 'react';
import { AppContext } from '../../context/AppContext';
import { LoanService } from '../services/LoanService';
import { toast } from 'react-hot-toast';
import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";

// --- 1. LOAN CONFIRMATION WIDGET ---
export function LoanConfirmationWidget({ loan, onSuccess }: any) {
    const context = useContext(AppContext) as any || {};
    const user = context.user;
    const [loading, setLoading] = useState(false);

    const handleConfirm = async (e: FormEvent) => {
        e.preventDefault();
        if (!user?.uid) return toast.error("User session not found.");
        
        setLoading(true);
        try {
            await LoanService.updateLoan(loan.id, { status: "outstanding", confirmed_at: new Date().toISOString() });
            await LoanService.createTransaction({
                user_id: user.uid, type: 'income', amount: Number(loan.amount),
                description: `Loan received from ${loan.creditor?.full_name || 'the lender'}: ${loan.description}`
            });
            toast.success("Funds confirmed.");
            if (onSuccess) await onSuccess(); 
        } catch (err: any) { toast.error("Failed to confirm."); } finally { setLoading(false); }
    };

    // Fix: Changed type from "button" to "section" based on your TS error
    if (loading) return <UnifiedLoadingWidget type="section" message="Confirming funds..." />;

    return (
        <form onSubmit={handleConfirm} className="space-y-6">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Loan Details</p>
                <h3 className="font-bold text-slate-800 text-lg leading-tight">{loan.description}</h3>
                <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-baseline">
                        <span className="text-sm text-slate-500">Amount:</span>
                        <span className="text-2xl font-black text-emerald-600">₱{Number(loan.amount).toLocaleString()}</span>
                    </div>
                </div>
            </div>
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98]">
                Confirm Funds Received
            </button>
        </form>
    );
}

// --- 2. MAKE REPAYMENT WIDGET ---
export function MakeRepaymentWidget({ loan, onSuccess }: any) {
    const context = useContext(AppContext) as any || {};
    const user = context.user;
    const outstanding = (loan.total_owed || loan.amount) - (loan.repaid_amount || 0);
    const [amount, setAmount] = useState(outstanding.toFixed(2));
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user?.uid) return toast.error("User session not found.");

        setLoading(true);
        try {
            const url = file ? await LoanService.uploadToCloudinary(file) : null;
            await LoanService.updateLoan(loan.id, {
                pending_repayment: { 
                    amount: parseFloat(amount), 
                    submitted_by: user.uid, 
                    submitted_at: new Date().toISOString(), 
                    receipt_url: url 
                }
            });
            await LoanService.createTransaction({
                user_id: user.uid, type: 'expense', amount: parseFloat(amount),
                description: `Loan repayment: ${loan.description}`, attachment_url: url
            });
            toast.success("Repayment submitted!");
            if (onSuccess) await onSuccess();
        } catch (err) { toast.error("Submission failed."); } finally { setLoading(false); }
    };

    if (loading) return <UnifiedLoadingWidget type="section" message="Submitting repayment..." />;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p className="font-bold text-slate-800 text-lg">{loan.description}</p>
                <div className="mt-3 flex items-center justify-between">
                    <span className="text-xl font-black text-rose-600">₱{outstanding.toLocaleString()}</span>
                </div>
            </div>
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-4 border border-slate-200 rounded-xl font-bold" />
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-indigo-50 file:text-indigo-700 border border-dashed border-slate-200 rounded-xl p-4" />
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2">
                Submit for Confirmation
            </button>
        </form>
    );
}

// --- 3. RECORD PERSONAL REPAYMENT WIDGET ---
export function RecordPersonalRepaymentWidget({ loan, onSuccess }: any) {
    const context = useContext(AppContext) as any || {};
    const user = context.user;
    const outstanding = (loan.total_owed || loan.amount) - (loan.repaid_amount || 0);
    const [amount, setAmount] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleRecord = async (e: FormEvent) => {
        e.preventDefault();
        if (!user?.uid) return toast.error("User session not found.");

        setLoading(true);
        try {
            const val = parseFloat(amount);
            const url = file ? await LoanService.uploadToCloudinary(file) : null;
            const newRepaid = (loan.repaid_amount || 0) + val;
            const sanitizedReceipts = LoanService.sanitizeReceipts(loan.repayment_receipts);

            await LoanService.updateLoan(loan.id, {
                repaid_amount: newRepaid,
                status: newRepaid >= (loan.total_owed || loan.amount) - 0.01 ? "repaid" : "outstanding",
                repayment_receipts: [...sanitizedReceipts, { url, amount: val, recorded_at: new Date().toISOString() }]
            });

            await LoanService.createTransaction({ user_id: user.uid, type: 'income', amount: val, description: `Repayment from ${loan.debtor_name}` });
            toast.success("Recorded successfully!");
            if (onSuccess) await onSuccess();
        } catch (err) { toast.error("Error recording repayment."); } finally { setLoading(false); }
    };

    if (loading) return <UnifiedLoadingWidget type="section" message="Recording repayment..." />;

    return (
        <form onSubmit={handleRecord} className="space-y-6">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p className="font-bold text-slate-800 text-lg">{loan.debtor_name || 'Borrower'}</p>
                <p className="text-xl font-black text-rose-600">₱{outstanding.toLocaleString()}</p>
            </div>
            <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full p-4 border rounded-xl font-bold" />
            <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full border border-dashed rounded-xl p-4" />
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2">
                Confirm & Record Repayment
            </button>
        </form>
    );
}

// --- 4. REPAYMENT CONFIRMATION WIDGET ---
export function RepaymentConfirmationWidget({ loan, onSuccess }: any) {
    const context = useContext(AppContext) as any || {};
    const user = context.user;
    const [loading, setLoading] = useState(false);

    const handleConfirm = async (e: FormEvent) => {
        e.preventDefault();
        if (!user?.uid) return toast.error("User session not found.");

        setLoading(true);
        try {
            const pending = loan.pending_repayment;
            const newRepaid = (loan.repaid_amount || 0) + parseFloat(pending.amount);
            const sanitizedReceipts = LoanService.sanitizeReceipts(loan.repayment_receipts);

            await LoanService.updateLoan(loan.id, {
                repaid_amount: newRepaid,
                status: newRepaid >= (loan.total_owed || loan.amount) - 0.01 ? "repaid" : "outstanding",
                pending_repayment: null,
                repayment_receipts: [...sanitizedReceipts, { url: pending.receipt_url, amount: pending.amount, recorded_at: new Date().toISOString() }]
            });

            await LoanService.createTransaction({ user_id: user.uid, type: 'income', amount: pending.amount, description: `Confirmed repayment: ${loan.description}` });
            toast.success("Repayment confirmed!");
            if (onSuccess) await onSuccess();
        } catch (err) { toast.error("Process failed."); } finally { setLoading(false); }
    };

    // Fix: Changed type from "button" to "section" based on your TS error
    if (loading) return <UnifiedLoadingWidget type="section" message="Confirming repayment..." />;

    return (
        <form onSubmit={handleConfirm} className="space-y-6">
            <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 text-center">
                <p className="text-3xl font-black text-emerald-700">₱{Number(loan.pending_repayment?.amount).toLocaleString()}</p>
                <p className="text-sm italic text-slate-500">From {loan.debtor_name}</p>
            </div>
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2">
                Confirm & Add to Balance
            </button>
        </form>
    );
}