import { useState, useContext, FormEvent } from 'react';
import { AppContext } from '../Context/AppContext.jsx';
import { db } from '../config/firebase-config';
import { doc, writeBatch, serverTimestamp, collection } from 'firebase/firestore';

// --- TypeScript Interfaces ---
interface Loan {
    id: string;
    amount: number;
    repaid_amount: number;
    creditor_id: string;
    description: string;
}

interface MakeRepaymentWidgetProps {
    loan: Loan;
    onSuccess: () => void;
}

export default function MakeRepaymentWidget({ loan, onSuccess }: MakeRepaymentWidgetProps) {
    const { user } = useContext(AppContext);
    const outstanding = loan.amount - loan.repaid_amount;

    const [amount, setAmount] = useState<string>(outstanding.toFixed(2));
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // THE FIX IS HERE: This entire function is replaced with the new atomic logic.
    const handleSubmitForConfirmation = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const repaymentAmount = parseFloat(amount);

        if (!user || !loan || !loan.id) {
            setError("Cannot process payment. Missing user or loan data.");
            return;
        }
        if (isNaN(repaymentAmount) || repaymentAmount <= 0) {
            setError("Please enter a valid, positive amount.");
            return;
        }
        if (repaymentAmount > outstanding) {
            setError(`Payment cannot exceed the outstanding amount of ₱${outstanding.toFixed(2)}.`);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Create a new write batch for atomic operations
            const batch = writeBatch(db);

            // 2. Operation 1: Update the loan document with a pending payment object.
            const loanRef = doc(db, "loans", loan.id);
            batch.update(loanRef, {
                pending_repayment: {
                    amount: repaymentAmount,
                    submitted_by: user.uid,
                    submitted_at: serverTimestamp()
                }
            });

            // 3. Operation 2: Create a personal 'expense' transaction FOR THE DEBTOR (the current user).
            const transactionRef = doc(collection(db, "transactions"));
            const transactionData = {
                user_id: user.uid, // The expense belongs to the person paying.
                family_id: null,
                type: 'expense',
                amount: repaymentAmount,
                description: `Loan repayment for: ${loan.description}`,
                created_at: serverTimestamp()
            };
            batch.set(transactionRef, transactionData);

            // 4. Commit both writes. They either both succeed or both fail.
            await batch.commit();

            onSuccess();

        } catch (err: any) {
            console.error("Failed to submit repayment for confirmation:", err);
            setError("Could not submit payment. Please check your connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmitForConfirmation} className="space-y-4">
            <div>
                <p className="text-sm text-gray-600">You are making a repayment for:</p>
                <p className="font-semibold text-gray-800">{loan.description}</p>
                <p className="text-lg font-bold text-red-600 mt-2">
                    Outstanding: ₱{outstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            </div>
            <hr />
            <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Repayment Amount (₱)</label>
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
                {loading ? 'Submitting...' : 'Submit for Confirmation'}
            </button>
            <p className="text-xs text-center text-gray-500">This will be deducted from your personal balance. The lender must confirm this payment.</p>
        </form>
    );
}