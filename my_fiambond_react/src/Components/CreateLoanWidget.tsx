import { useContext, useState, useEffect, ChangeEvent, FormEvent } from "react";
import { AppContext } from "../Context/AppContext.jsx";
import { db } from "../config/firebase-config";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
  documentId,
  writeBatch, // THE FIX IS HERE: Import writeBatch for atomic operations
} from "firebase/firestore";

// --- TypeScript Interfaces ---
interface Family {
  id: string; // Firestore document ID
}

interface User {
  uid: string; // Firebase Auth UID
}

interface Member {
  id: string; // The user's UID
  full_name: string;
}

interface CreateLoanWidgetProps {
  family: Family;
  onSuccess?: () => void;
}

export default function CreateLoanWidget({ family, onSuccess }: CreateLoanWidgetProps) {
  const { user } = useContext(AppContext);

  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    debtorId: "",
    deadline: "",
  });

  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Start as true for initial fetch

  // Effect to fetch family members to populate the dropdown
  useEffect(() => {
    const fetchMembers = async () => {
      if (!family.id || !user?.uid) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const familyDocRef = doc(db, "families", family.id);
        const familyDocSnap = await getDoc(familyDocRef);

        if (!familyDocSnap.exists()) {
          throw new Error("Family not found.");
        }

        const memberIds = familyDocSnap.data().member_ids || [];
        const otherMemberIds = memberIds.filter((id: string) => id !== user.uid);

        if (otherMemberIds.length === 0) {
          setMembers([]);
          setLoading(false);
          return;
        }

        const usersCollectionRef = collection(db, "users");
        const q = query(usersCollectionRef, where(documentId(), "in", otherMemberIds));
        
        const querySnapshot = await getDocs(q);
        const fetchedMembers = querySnapshot.docs.map(doc => ({
          id: doc.id,
          full_name: doc.data().full_name
        } as Member));

        setMembers(fetchedMembers);

      } catch (err) {
        console.error("Failed to fetch family members:", err);
        setError("Could not load family members. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [family.id, user?.uid]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  // --- THE FIX IS HERE: This entire function is updated to be atomic ---
  const handleLendMoney = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
        setError("You must be logged in.");
        return;
    }
    setError(null);
    setLoading(true);

    try {
        // Find the debtor's name for a more descriptive transaction
        const debtorName = members.find(m => m.id === formData.debtorId)?.full_name || 'Family Member';

        // 1. Create a new write batch to perform multiple operations atomically
        const batch = writeBatch(db);

        // 2. Define the new loan document in the 'loans' collection
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
        // Stage the loan creation in the batch
        batch.set(newLoanRef, loanData);

        // 3. Define the corresponding personal expense in the 'transactions' collection
        const newTransactionRef = doc(collection(db, "transactions"));
        const transactionData = {
            user_id: user.uid, // This expense belongs to the lender (current user)
            family_id: null,   // This is a personal transaction record
            type: "expense",
            amount: Number(formData.amount),
            description: `Loan to ${debtorName}: ${formData.description}`,
            created_at: serverTimestamp(),
        };
        // Stage the personal transaction creation in the batch
        batch.set(newTransactionRef, transactionData);

        // 4. Commit the batch. Both documents are created, or neither is.
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

  return (
    <form onSubmit={handleLendMoney} className="space-y-4">
      <div>
        <label htmlFor="debtorId" className="block text-sm font-medium text-gray-700">Lending To:</label>
        <select id="debtorId" value={formData.debtorId} onChange={handleInputChange} required disabled={loading || members.length === 0} className="w-full p-2 border border-gray-300 rounded-md">
          <option value="">
            {loading ? "Loading members..." : members.length > 0 ? "Select a family member" : "No other members in this family"}
          </option>
          {members.map(member => (
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
      <button type="submit" className="primary-btn w-full" disabled={loading || members.length === 0}>
        {loading ? 'Processing...' : 'Confirm & Lend Money'}
      </button>
    </form>
  );
}