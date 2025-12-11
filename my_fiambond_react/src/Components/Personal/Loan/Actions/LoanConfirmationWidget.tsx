import { useState, useContext, FormEvent } from 'react';
import { AppContext } from '../../../../Context/AppContext.jsx';
// Removed Firebase Imports
// import { Loan } from '../../types'; // Optional if using TS

interface LoanConfirmationWidgetProps {
    loan: any; // Use 'any' or your Loan interface
    onSuccess: () => void;
}

export default function LoanConfirmationWidget({ loan, onSuccess }: LoanConfirmationWidgetProps) {
    const { user } = useContext(AppContext);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    
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
                amount: Number(loan.total_owed || loan.amount),
                description: `Loan received from ${creditorName}: ${loan.description}`,
                // created_at handled by backend
            };

            const txResponse = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData)
            });

            if (!txResponse.ok) throw new Error("Loan confirmed, but failed to record income transaction.");

            if (onSuccess) onSuccess();

        } catch (err: any) {
            console.error("Failed to confirm loan receipt:", err);
            setError("Could not confirm receipt. Please check your connection and try again.");
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
                        Amount: ₱{Number(loan.total_owed || loan.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>
            <hr />
            {error && <p className="error text-center">{error}</p>}
            <button type="submit" className="primary-btn w-full" disabled={loading}>
                {loading ? 'Confirming...' : 'Confirm Funds Received'}
            </button>
            <p className="text-xs text-center text-gray-500">This will add the loan amount to your personal balance as income.</p>
        </form>
    );
}