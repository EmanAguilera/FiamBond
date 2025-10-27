import { useContext, useState, FormEvent, ChangeEvent } from "react";
import { AppContext } from "../Context/AppContext.jsx";
import { db } from "../config/firebase-config";
import { collection, doc, writeBatch, serverTimestamp, Timestamp } from "firebase/firestore";

interface CreatePersonalLoanWidgetProps {
    onSuccess: () => void;
}

export default function CreatePersonalLoanWidget({ onSuccess }: CreatePersonalLoanWidgetProps) {
    const { user } = useContext(AppContext);

    const [formData, setFormData] = useState({
        amount: "",
        description: "",
        debtorName: "", // Text input for the person's name
        deadline: "",
    });

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleLendMoney = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) {
            setError("You must be logged in.");
            return;
        }
        setError(null);
        setLoading(true);

        try {
            const batch = writeBatch(db);

            // 1. Define the personal loan document
            const newLoanRef = doc(collection(db, "loans"));
            const loanData = {
                family_id: null, // This is the key for a personal loan
                creditor_id: user.uid,
                debtor_id: null, // No user ID for the debtor
                debtor_name: formData.debtorName, // Store the name as a string
                amount: Number(formData.amount),
                repaid_amount: 0,
                description: formData.description,
                deadline: formData.deadline ? Timestamp.fromDate(new Date(formData.deadline)) : null,
                status: "outstanding",
                created_at: serverTimestamp(),
            };
            batch.set(newLoanRef, loanData);

            // 2. Define the corresponding personal expense transaction
            const newTransactionRef = doc(collection(db, "transactions"));
            const transactionData = {
                user_id: user.uid,
                family_id: null,
                type: "expense",
                amount: Number(formData.amount),
                description: `Personal loan to ${formData.debtorName}: ${formData.description}`,
                created_at: serverTimestamp(),
            };
            batch.set(newTransactionRef, transactionData);

            // 3. Commit both writes atomically
            await batch.commit();

            if (onSuccess) {
                onSuccess();
            }

        } catch (err: any) {
            console.error("Failed to record personal loan:", err);
            setError("Failed to record the loan. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleLendMoney} className="space-y-4">
            <div>
                <label htmlFor="debtorName" className="block text-sm font-medium text-gray-700">Lending To (Full Name):</label>
                <input id="debtorName" type="text" placeholder="e.g., John Doe" value={formData.debtorName} onChange={handleInputChange} required disabled={loading} className="w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount (₱)</label>
                <input id="amount" type="number" step="0.01" placeholder="100.00" value={formData.amount} onChange={handleInputChange} required disabled={loading} className="w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Reason / Description</label>
                <input id="description" type="text" placeholder="e.g., Lunch money" value={formData.description} onChange={handleInputChange} required disabled={loading} className="w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">Repayment Deadline (Optional)</label>
                <input id="deadline" type="date" value={formData.deadline} onChange={handleInputChange} disabled={loading} className="w-full p-2 border border-gray-300 rounded-md" />
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="primary-btn w-full" disabled={loading}>
                {loading ? 'Processing...' : 'Confirm & Lend Money'}
            </button>
        </form>
    );
}