import { useState, useContext, FormEvent } from 'react';
import { AppContext } from '../../Context/AppContext.jsx';
import { db } from '../../config/firebase-config.js';
import { doc, writeBatch, serverTimestamp, collection, increment, deleteField } from 'firebase/firestore';
import { Loan } from '../../types'; // Import the master Loan type

interface RepaymentConfirmationWidgetProps {
    loan: Loan;
    onSuccess: () => void;
}

export default function RepaymentConfirmationWidget({ loan, onSuccess }: RepaymentConfirmationWidgetProps) {
    const { user } = useContext(AppContext);
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
            const batch = writeBatch(db);
            const loanRef = doc(db, "loans", loan.id);
            const repaymentAmount = loan.pending_repayment.amount;

            // Operation 1: Update the loan document itself.
            const newRepaidAmount = (loan.repaid_amount || 0) + repaymentAmount;
            const newStatus = newRepaidAmount >= loan.amount ? "repaid" : "outstanding";
            
            batch.update(loanRef, {
                repaid_amount: increment(repaymentAmount),
                status: newStatus,
                pending_repayment: deleteField() // Atomically remove the pending field
            });

            // Operation 2: Create the corresponding 'income' transaction for the CREDITOR (the current user).
            const transactionRef = doc(collection(db, "transactions"));
            const debtorName = loan.debtor?.full_name || 'the borrower';
            const transactionData = {
                user_id: user.uid, // This income belongs to you, the creditor.
                family_id: null,   // Repayments credit your personal balance.
                type: 'income',
                amount: repaymentAmount,
                description: `Repayment received from ${debtorName} for: ${loan.description}`,
                created_at: serverTimestamp()
            };
            batch.set(transactionRef, transactionData);

            await batch.commit();

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
    
    // Find the debtor's name for a friendly display.
    const debtorDisplayName = loan.debtor?.full_name || 'The borrower';

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
                </div>
            </div>
            <hr />
            {error && <p className="error">{error}</p>}
            <button type="submit" className="primary-btn w-full" disabled={loading}>
                {loading ? 'Confirming...' : 'Confirm Repayment Received'}
            </button>
            <p className="text-xs text-center text-gray-500">This will add the repayment amount to your personal balance as income.</p>
        </form>
    );
}