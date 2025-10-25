import { useState, useContext, FormEvent } from 'react';
import { AppContext } from '../Context/AppContext.jsx';
import { db } from '../config/firebase-config';
import { doc, runTransaction, serverTimestamp, collection, Timestamp } from 'firebase/firestore';

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

    const handleRepayment = async (e: FormEvent<HTMLFormElement>) => {
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
            // Use a Firestore Transaction to ensure the loan update and the lender's
            // income transaction are created together (atomically).
            await runTransaction(db, async (transaction) => {
                const loanRef = doc(db, "loans", loan.id);
                const loanDoc = await transaction.get(loanRef);

                if (!loanDoc.exists()) {
                    throw new Error("This loan no longer exists.");
                }

                const currentData = loanDoc.data();
                const newRepaidAmount = currentData.repaid_amount + repaymentAmount;
                const newStatus = newRepaidAmount >= currentData.amount ? "repaid" : "outstanding";

                // Operation 1: Update the loan document with the new repaid amount and status.
                transaction.update(loanRef, {
                    repaid_amount: newRepaidAmount,
                    status: newStatus
                });

                // Operation 2: Create a corresponding 'income' transaction for the CREDITOR (the lender).
                // This is the key to automatically updating their personal balance.
                const newTransactionRef = doc(collection(db, "transactions"));
                const transactionData = {
                    user_id: loan.creditor_id, // The payment is INCOME for the lender.
                    family_id: null,
                    type: "income",
                    amount: repaymentAmount,
                    description: `Loan repayment from ${user.full_name || 'a family member'}: ${loan.description}`,
                    created_at: serverTimestamp(),
                };
                transaction.set(newTransactionRef, transactionData);
            });

            // If the entire transaction succeeds, call the onSuccess callback.
            onSuccess();

        } catch (err: any) {
            console.error("Repayment transaction failed:", err);
            setError("The repayment could not be processed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleRepayment} className="space-y-4">
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
                {loading ? 'Processing Payment...' : 'Confirm Repayment'}
            </button>
        </form>
    );
}