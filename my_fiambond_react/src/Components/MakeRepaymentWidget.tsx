import { useState, useContext, FormEvent } from 'react';
import { AppContext } from '../Context/AppContext.jsx';
import { db } from '../config/firebase-config';
// THE FIX IS HERE (Part 1): We only need updateDoc and serverTimestamp now
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

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

    // THE FIX IS HERE (Part 2): This entire function is replaced with the new "Submit for Confirmation" logic.
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
            const loanRef = doc(db, "loans", loan.id);

            // Update the loan document with a pending payment object.
            // This is the "signal" to the creditor.
            await updateDoc(loanRef, {
                pending_repayment: {
                    amount: repaymentAmount,
                    submitted_by: user.uid,
                    submitted_at: serverTimestamp()
                }
            });

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
            <p className="text-xs text-center text-gray-500">The lender will need to confirm this payment to update the balance.</p>
        </form>
    );
}