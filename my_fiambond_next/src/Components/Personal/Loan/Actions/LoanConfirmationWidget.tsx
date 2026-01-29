'use client'; // Required due to the use of useState, useContext, and browser APIs (fetch)

import { useState, useContext, FormEvent } from 'react';
import { AppContext } from '../../../../Context/AppContext.jsx';
import { toast } from "react-hot-toast";

interface LoanConfirmationWidgetProps {
    loan: any; // Use 'any' or your Loan interface
    onSuccess: () => void;
}

export default function LoanConfirmationWidget({ loan, onSuccess }: LoanConfirmationWidgetProps) {
    const { user } = useContext(AppContext);
    // ⭐️ Next.js change: Replace import.meta.env.VITE_API_URL with process.env.NEXT_PUBLIC_API_URL
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
    // State typing retained from original .tsx
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Function typing retained from original .tsx
    const handleConfirmReceipt = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!user || !loan || !loan.id) {
            setError("Cannot process confirmation. Critical data is missing.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Update Loan Status (PATCH)
            const loanResponse = await fetch(`${API_URL}/loans/${loan.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: "outstanding",
                    confirmed_at: new Date() // JS Date
                })
            });

            if (!loanResponse.ok) throw new Error("Failed to update loan status.");

            // 2. Create Income Transaction for Debtor (POST)
            const creditorName = loan.creditor?.full_name || 'the lender';
            
            const transactionData = {
                user_id: user.uid, 
                family_id: null, // Personal income
                type: 'income',
                amount: Number(loan.amount),
                description: `Loan received from ${creditorName}: ${loan.description}`,
                // created_at handled by backend
            };

            const txResponse = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData)
            });

            if (!txResponse.ok) throw new Error("Loan confirmed, but failed to record income transaction.");

            toast.success("Loan funds confirmed and added to your balance.");
            if (onSuccess) onSuccess();

        } catch (err: any) {
            console.error("Failed to confirm loan receipt:", err);
            setError("Could not confirm receipt. Please check your connection and try again.");
            toast.error("Failed to confirm receipt.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleConfirmReceipt} className="space-y-4">
            <div>
                <p className="text-sm text-gray-600">Please confirm you have received the funds for the following loan:</p>
                <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                    <p className="font-semibold text-gray-800">{loan.description}</p>
                    <p className="text-sm text-gray-500 mt-1">From: <span className="font-medium">{loan.creditor?.full_name || 'Lender'}</span></p>
                    <p className="text-lg font-bold text-green-600 mt-2">
                        Amount: ₱{Number(loan.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>
            <hr />
            {error && <p className="error text-center text-rose-600 text-sm">{error}</p>}
            <button type="submit" className="primary-btn w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50" disabled={loading}>
                {loading ? 'Confirming...' : 'Confirm Funds Received'}
            </button>
            <p className="text-xs text-center text-gray-500">This will add the loan amount to your personal balance as income.</p>
        </form>
    );
}