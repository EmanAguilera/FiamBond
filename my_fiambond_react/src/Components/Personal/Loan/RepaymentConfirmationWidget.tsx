import { useState, useContext, FormEvent } from 'react';
import { AppContext } from '../../../Context/AppContext.jsx';
// Removed Firebase Imports
import { Loan } from '../../../types/index.js'; 

interface RepaymentConfirmationWidgetProps {
    loan: any; // using any for flexibility with MongoDB _id
    onSuccess: () => void;
}

export default function RepaymentConfirmationWidget({ loan, onSuccess }: RepaymentConfirmationWidgetProps) {
    const { user } = useContext(AppContext);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // The repayment object should exist if this widget is being rendered.
    const pendingAmount = loan.pending_repayment?.amount || 0;

    const handleConfirmRepayment = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!user || !loan || !loan.id || !loan.pending_repayment) {
            setError("Cannot process confirmation. Critical data is missing.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const repaymentAmount = parseFloat(loan.pending_repayment.amount);
            const currentRepaid = parseFloat(loan.repaid_amount || 0);
            const totalOwed = parseFloat(loan.total_owed || loan.amount);

            // 1. Calculate New Values
            const newRepaidAmount = currentRepaid + repaymentAmount;
            // Check if fully paid (allow for tiny floating point differences)
            const newStatus = newRepaidAmount >= (totalOwed - 0.01) ? "repaid" : "outstanding";

            // 2. Preserve Receipt: Move it from 'pending' to 'history'
            let updatedReceipts = loan.repayment_receipts || [];
            if (loan.pending_repayment.receipt_url) {
                updatedReceipts = [...updatedReceipts, {
                    url: loan.pending_repayment.receipt_url,
                    amount: repaymentAmount,
                    recorded_at: new Date() // Save current time
                }];
            }

            // 3. PATCH Loan: Update amounts, status, receipts, and CLEAR pending_repayment
            const loanUpdatePayload = {
                repaid_amount: newRepaidAmount,
                status: newStatus,
                pending_repayment: null, // Setting to null removes it in Mongoose
                repayment_receipts: updatedReceipts
            };

            const loanResponse = await fetch(`${API_URL}/loans/${loan.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loanUpdatePayload)
            });

            if (!loanResponse.ok) throw new Error("Failed to update loan status.");

            // 4. POST Transaction: Record Income for Creditor
            const debtorName = loan.debtor?.full_name || loan.debtor_name || 'the borrower';
            const transactionData = {
                user_id: user.uid, // Income for YOU (Creditor)
                family_id: null,   // Personal balance
                type: 'income',
                amount: repaymentAmount,
                description: `Repayment received from ${debtorName} for: ${loan.description}`,
                attachment_url: loan.pending_repayment.receipt_url || null
                // created_at handled by backend
            };

            const txResponse = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData)
            });

            if (!txResponse.ok) throw new Error("Loan updated, but failed to record income transaction.");

            if (onSuccess) {
                onSuccess();
            }

        } catch (err: any) {
            console.error("Failed to confirm repayment:", err);
            setError("Could not confirm repayment. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    
    const debtorDisplayName = loan.debtor?.full_name || loan.debtor_name || 'The borrower';

    return (
        <form onSubmit={handleConfirmRepayment} className="space-y-4">
            <div>
                <p className="text-sm text-gray-600">Please confirm you have received the following repayment:</p>
                <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                    <p className="font-semibold text-gray-800">{loan.description}</p>
                    <p className="text-sm text-gray-500 mt-1">From: <span className="font-medium">{debtorDisplayName}</span></p>
                    <p className="text-lg font-bold text-green-600 mt-2">
                        Amount: ₱{Number(pendingAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    
                    {loan.pending_repayment?.receipt_url && (
                        <div className="mt-2 pt-2 border-t border-blue-200">
                            <a 
                                href={loan.pending_repayment.receipt_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 underline hover:text-blue-800"
                            >
                                View Attached Receipt
                            </a>
                        </div>
                    )}
                </div>
            </div>
            <hr />
            {error && <p className="error text-center">{error}</p>}
            <button type="submit" className="primary-btn w-full" disabled={loading}>
                {loading ? 'Confirming...' : 'Confirm Repayment Received'}
            </button>
            <p className="text-xs text-center text-gray-500">This will add the repayment amount to your personal balance as income.</p>
        </form>
    );
}