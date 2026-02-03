'use client'; // Required for hooks and interactivity

import { useState, useContext, FormEvent } from 'react';
import { AppContext } from '@/src/Context/AppContext';
import { API_BASE_URL } from '@/src/config/apiConfig';
import { toast } from 'react-hot-toast';

interface RepaymentConfirmationWidgetProps {
    loan: any; 
    onSuccess: () => void;
}

export default function RepaymentConfirmationWidget({ loan, onSuccess }: RepaymentConfirmationWidgetProps) {
    const { user } = useContext(AppContext);
    
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const pendingAmount = loan.pending_repayment?.amount || 0;
    const debtorDisplayName = loan.debtor?.full_name || loan.debtor_name || 'The borrower';

    const handleConfirmRepayment = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!user || !loan || !loan.id || !loan.pending_repayment) {
            setError("Critical data is missing. Cannot confirm.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const repaymentAmount = parseFloat(loan.pending_repayment.amount);
            const currentRepaid = parseFloat(loan.repaid_amount || 0);
            const totalOwed = parseFloat(loan.total_owed || loan.amount);

            // 1. Calculate logic for state update
            const newRepaidAmount = currentRepaid + repaymentAmount;
            const newStatus = newRepaidAmount >= (totalOwed - 0.01) ? "repaid" : "outstanding";

            // 2. Prepare receipt history
            let updatedReceipts = [...(loan.repayment_receipts || [])];
            if (loan.pending_repayment.receipt_url) {
                updatedReceipts.push({
                    url: loan.pending_repayment.receipt_url,
                    amount: repaymentAmount,
                    recorded_at: new Date().toISOString()
                });
            }

            // 3. PATCH: Update Loan and CLEAR the pending flag
            const loanRes = await fetch(`${API_BASE_URL}/loans/${loan.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    repaid_amount: newRepaidAmount,
                    status: newStatus,
                    pending_repayment: null, // Clear the pending request
                    repayment_receipts: updatedReceipts
                })
            });

            if (!loanRes.ok) throw new Error("Failed to update loan status.");

            // 4. POST: Record Income for the Lender
            await fetch(`${API_BASE_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.uid,
                    type: 'income',
                    amount: repaymentAmount,
                    description: `Confirmed repayment from ${debtorDisplayName}: ${loan.description}`,
                    attachment_url: loan.pending_repayment.receipt_url || null,
                    created_at: new Date().toISOString()
                })
            });

            toast.success("Repayment confirmed!");
            onSuccess();

        } catch (err: any) {
            console.error(err);
            setError("Confirmation failed. Please try again.");
            toast.error("Process failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleConfirmRepayment} className="space-y-6">
            <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3 text-center">Payment Verification</p>
                
                <div className="text-center space-y-1 mb-4">
                    <p className="text-sm text-slate-500 italic">Received from {debtorDisplayName}</p>
                    <p className="text-3xl font-black text-emerald-700">
                        ₱{Number(pendingAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                </div>

                <div className="bg-white/60 rounded-xl p-3 border border-emerald-100/50">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">For Loan:</p>
                    <p className="text-sm font-semibold text-slate-700 line-clamp-1">{loan.description}</p>
                </div>

                {loan.pending_repayment?.receipt_url && (
                    <div className="mt-4">
                        <a 
                            href={loan.pending_repayment.receipt_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 py-2 px-4 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Attached Receipt
                        </a>
                    </div>
                )}
            </div>

            <hr className="border-slate-100" />
            
            {error && <p className="text-center text-rose-600 text-xs font-bold bg-rose-50 p-2 rounded-lg">{error}</p>}
            
            <button 
                type="submit" 
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50" 
                disabled={loading}
            >
                {loading ? 'Processing...' : 'Confirm & Add to Balance'}
            </button>
            
            <p className="text-[10px] text-center text-slate-400 font-medium leading-relaxed">
                By confirming, you acknowledge receipt of funds. This will update the loan status and record this amount as **Income** in your ledger.
            </p>
        </form>
    );
}