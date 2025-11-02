import { useState, useContext, FormEvent } from 'react';
import { AppContext } from '../../Context/AppContext.jsx';
import { db } from '../../config/firebase-config.js';
import { doc, writeBatch, serverTimestamp, collection, increment } from 'firebase/firestore';

// Import the shared Loan type definition
import { Loan } from '../../types';

interface RecordPersonalRepaymentWidgetProps {
    loan: Loan;
    onSuccess: () => void;
}

export default function RecordPersonalRepaymentWidget({ loan, onSuccess }: RecordPersonalRepaymentWidgetProps) {
    const { user } = useContext(AppContext);
    const outstanding = (loan?.amount || 0) - (loan?.repaid_amount || 0);

    const [amount, setAmount] = useState<string>(outstanding.toFixed(2));
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleRecordRepayment = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const repaymentAmount = parseFloat(amount);

        if (!user) {
            setError("You must be logged in to perform this action.");
            return;
        }
        if (isNaN(repaymentAmount) || repaymentAmount <= 0) {
            setError("Please enter a valid, positive amount.");
            return;
        }
        if (repaymentAmount > outstanding) {
            setError(`Amount cannot exceed the outstanding balance of ₱${outstanding.toFixed(2)}.`);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const batch = writeBatch(db);
            const loanRef = doc(db, "loans", loan.id);

            // Step 1: Update the loan document to reflect the repayment.
            const newRepaidAmount = (loan.repaid_amount || 0) + repaymentAmount;
            const newStatus = newRepaidAmount >= loan.amount ? "repaid" : "outstanding";

            batch.update(loanRef, {
                repaid_amount: increment(repaymentAmount),
                status: newStatus
            });

            // Step 2: Create a personal 'income' transaction for the CREDITOR.
            // This is the key step to ensure the repayment is reflected in Eman's account.
            const transactionRef = doc(collection(db, "transactions"));
            const debtorName = loan.debtor?.full_name || loan.debtor_name || 'the borrower';
            
            const transactionData = {
                // The user_id is set to the current user's UID (Eman, the creditor).
                user_id: user.uid,
                // Since this is a personal loan, family_id must be null.
                family_id: null,
                type: 'income',
                amount: repaymentAmount,
                description: `Repayment received from ${debtorName} for: ${loan.description}`,
                created_at: serverTimestamp()
            };
            batch.set(transactionRef, transactionData);

            // Atomically commit both the loan update and the new transaction.
            await batch.commit();

            onSuccess();

        } catch (err: any) {
            console.error("Failed to record repayment:", err);
            setError("Could not record the repayment. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const debtorDisplayName = loan.debtor?.full_name || loan.debtor_name || 'Borrower';

    return (
        <form onSubmit={handleRecordRepayment} className="space-y-4">
            <div>
                <p className="text-sm text-gray-600">You are recording a repayment received from:</p>
                <p className="font-semibold text-gray-800">{debtorDisplayName}</p>
                <p className="text-lg font-bold text-red-600 mt-2">
                    Outstanding: ₱{outstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            </div>
            <hr />
            <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount Received (₱)</label>
                <input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full p-2 border border-gray-300 rounded-md"
                />
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="primary-btn w-full" disabled={loading}>
                {loading ? 'Recording...' : 'Record Repayment Received'}
            </button>
            <p className="text-xs text-center text-gray-500">This will be added to your personal balance as income.</p>
        </form>
    );
}