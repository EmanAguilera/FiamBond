import { useState, useContext, FormEvent } from 'react';
import { AppContext } from '../../Context/AppContext.jsx';
import { db } from '../../config/firebase-config.js';
import { doc, writeBatch, serverTimestamp, collection } from 'firebase/firestore';

// Import the master Loan type from your central types file
import { Loan } from '../../types';

interface LoanConfirmationWidgetProps {
    loan: Loan;
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
            // Use a batch for an atomic operation
            const batch = writeBatch(db);

            // Operation 1: Update the loan's status to 'outstanding'
            const loanRef = doc(db, "loans", loan.id);
            batch.update(loanRef, {
                status: "outstanding",
                confirmed_at: serverTimestamp() // Optional: track when it was confirmed
            });

            // Operation 2: Create the corresponding 'income' transaction for the debtor (current user)
            const transactionRef = doc(collection(db, "transactions"));
            const creditorName = loan.creditor?.full_name || 'the lender';
            const transactionData = {
                user_id: user.uid, // This income transaction belongs to the debtor
                
                // --- THE FIX IS HERE ---
                // The family_id must be null for it to appear in the user's personal transactions.
                family_id: null, 
                
                type: 'income',
                amount: Number(loan.total_owed || loan.amount),
                description: `Loan received from ${creditorName}: ${loan.description}`,
                created_at: serverTimestamp()
            };
            batch.set(transactionRef, transactionData);

            // Commit both operations. They will either both succeed or both fail.
            await batch.commit();

            if (onSuccess) {
                onSuccess();
            }

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
                    <p className="text-sm text-gray-500 mt-1">From: <span className="font-medium">{loan.creditor.full_name}</span></p>
                    <p className="text-lg font-bold text-green-600 mt-2">
                        Amount: ₱{Number(loan.total_owed || loan.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>
            <hr />
            {error && <p className="error">{error}</p>}
            <button type="submit" className="primary-btn w-full" disabled={loading}>
                {loading ? 'Confirming...' : 'Confirm Funds Received'}
            </button>
            <p className="text-xs text-center text-gray-500">This will add the loan amount to your personal balance as income.</p>
        </form>
    );
}