'use client'; // Required due to the use of hooks and browser APIs

import { useState, useContext, FormEvent } from 'react';
import { AppContext } from '@/src/Context/AppContext';
import { API_BASE_URL } from '@/src/config/apiConfig';
import { toast } from "react-hot-toast";

interface LoanConfirmationWidgetProps {
    loan: any; 
    onSuccess: () => void;
}

export default function LoanConfirmationWidget({ loan, onSuccess }: LoanConfirmationWidgetProps) {
    const { user } = useContext(AppContext);
    
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirmReceipt = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!user || !loan || !loan.id) {
            setError("Cannot process confirmation. Critical data is missing.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Update Loan Status to "outstanding"
            const loanResponse = await fetch(`${API_BASE_URL}/loans/${loan.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: "outstanding",
                    confirmed_at: new Date().toISOString()
                })
            });

            if (!loanResponse.ok) throw new Error("Failed to update loan status.");

            // 2. Create Income Transaction for Debtor
            const creditorName = loan.creditor?.full_name || 'the lender';
            
            const transactionData = {
                user_id: user.uid, 
                family_id: null, 
                type: 'income',
                amount: Number(loan.amount),
                description: `Loan received from ${creditorName}: ${loan.description}`,
                created_at: new Date().toISOString()
            };

            const txResponse = await fetch(`${API_BASE_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData)
            });

            if (!txResponse.ok) throw new Error("Loan confirmed, but failed to record income transaction.");

            toast.success("Funds confirmed and balance updated.");
            if (onSuccess) onSuccess();

        } catch (err: any) {
            console.error("Loan confirmation error:", err);
            setError("Could not confirm receipt. Please check your connection.");
            toast.error("Failed to confirm receipt.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleConfirmReceipt} className="space-y-6">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Loan Details</p>
                
                <h3 className="font-bold text-slate-800 text-lg leading-tight">{loan.description}</h3>
                
                <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">From Lender:</span>
                        <span className="font-bold text-slate-700">{loan.creditor?.full_name || 'Lender'}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-sm text-slate-500">Amount:</span>
                        <span className="text-2xl font-black text-emerald-600">
                            ₱{Number(loan.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex gap-3">
                <div className="text-blue-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p className="text-xs text-blue-700 leading-relaxed font-medium">
                    Confirming receipt will automatically record this amount as **Income** in your personal ledger and set the loan status to **Outstanding**.
                </p>
            </div>
            
            {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-center">
                    <p className="text-xs font-bold text-rose-600">{error}</p>
                </div>
            )}
            
            <button 
                type="submit" 
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50" 
                disabled={loading}
            >
                {loading ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Confirming Receipt...
                    </>
                ) : 'Confirm Funds Received'}
            </button>
        </form>
    );
}