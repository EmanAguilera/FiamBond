import { useContext, useState, ChangeEvent, FormEvent } from "react";
import { AppContext } from "../Context/AppContext.jsx";
import { db } from "../config/firebase-config";
import { writeBatch, collection, doc, serverTimestamp, Timestamp } from "firebase/firestore";

// --- TypeScript Interfaces ---
interface Family {
  id: string;
}

interface Member {
  id: string;
  full_name: string;
}

interface CreateLoanWidgetProps {
  family: Family;
  members: Member[]; // Expects the list of members as a prop
  onSuccess?: () => void;
}

export default function CreateLoanWidget({ family, members, onSuccess }: CreateLoanWidgetProps) {
  const { user } = useContext(AppContext);

  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    debtorId: "",
    deadline: "",
  });
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // The data-fetching useEffect has been completely removed from this component.

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        const debtorName = members.find(m => m.id === formData.debtorId)?.full_name || 'Family Member';
        
        const batch = writeBatch(db);
        
        const newLoanRef = doc(collection(db, "loans"));
        const loanData = {
            family_id: family.id,
            creditor_id: user.uid,
            debtor_id: formData.debtorId,
            amount: Number(formData.amount),
            repaid_amount: 0,
            description: formData.description,
            deadline: formData.deadline ? Timestamp.fromDate(new Date(formData.deadline)) : null,
            status: "outstanding",
            created_at: serverTimestamp(),
        };
        batch.set(newLoanRef, loanData);

        const newTransactionRef = doc(collection(db, "transactions"));
        const transactionData = {
            user_id: user.uid,
            family_id: null,
            type: "expense",
            amount: Number(formData.amount),
            description: `Loan to ${debtorName}: ${formData.description}`,
            created_at: serverTimestamp(),
        };
        batch.set(newTransactionRef, transactionData);

        await batch.commit();

        if (onSuccess) {
            onSuccess();
        }

    } catch (err: any) {
        console.error("Failed to record loan and transaction:", err);
        setError("Failed to process the loan. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  // Filter out the current user from the members list passed in via props
  const otherMembers = members.filter(member => member.id !== user?.uid);

  return (
    <form onSubmit={handleLendMoney} className="space-y-4">
      <div>
        <label htmlFor="debtorId" className="block text-sm font-medium text-gray-700">Lending To:</label>
        <select id="debtorId" value={formData.debtorId} onChange={handleInputChange} required disabled={loading || otherMembers.length === 0} className="w-full p-2 border border-gray-300 rounded-md">
          <option value="">
            {otherMembers.length > 0 ? "Select a family member" : "No other members to lend to"}
          </option>
          {otherMembers.map(member => (
            <option key={member.id} value={member.id}>{member.full_name}</option>
          ))}
        </select>
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
      <button type="submit" className="primary-btn w-full" disabled={loading || otherMembers.length === 0}>
        {loading ? 'Processing...' : 'Confirm & Lend Money'}
      </button>
    </form>
  );
}