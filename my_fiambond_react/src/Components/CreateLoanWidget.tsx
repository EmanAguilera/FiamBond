// Components/CreateLoanWidget.tsx

import { useContext, useState, useEffect, ChangeEvent, FormEvent } from "react";
import { AppContext } from "../Context/AppContext.jsx";
import { db } from "../config/firebase-config"; // Adjust path
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp,
  documentId,
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
  // Use the user object from context. Note: your context might provide 'user.id', ensure it maps to 'user.uid'
  const { user } = useContext(AppContext);

  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    debtorId: "",
    deadline: "",
  });

  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Effect to fetch family members to populate the dropdown
  useEffect(() => {
    const fetchMembers = async () => {
      if (!family.id || !user?.uid) return;

      setLoading(true);
      setError(null);
      try {
        // 1. Get the family document to find member IDs
        const familyDocRef = doc(db, "families", family.id);
        const familyDocSnap = await getDoc(familyDocRef);

        if (!familyDocSnap.exists()) {
          throw new Error("Family not found.");
        }

        const memberIds = familyDocSnap.data().member_ids || [];
        // Filter out the current user so they can't lend to themselves
        const otherMemberIds = memberIds.filter((id: string) => id !== user.uid);

        if (otherMemberIds.length === 0) {
          setMembers([]); // No other members to lend to
          return;
        }

        // 2. Get the user documents for the other members
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

  const handleLendMoney = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(!user) {
        setError("You must be logged in.");
        return;
    }
    setError(null);
    setLoading(true);

    try {
        const loanData = {
            family_id: family.id,
            creditor_id: user.uid,
            debtor_id: formData.debtorId,
            amount: Number(formData.amount),
            repaid_amount: 0, // Loans start with 0 repaid
            description: formData.description,
            deadline: formData.deadline ? Timestamp.fromDate(new Date(formData.deadline)) : null,
            status: "outstanding", // New loans are always 'outstanding'
            created_at: serverTimestamp(),
        };

        const loansCollectionRef = collection(db, "loans");
        await addDoc(loansCollectionRef, loanData);

        if (onSuccess) {
            onSuccess();
        }

    } catch (err: any) {
        console.error("Failed to record loan:", err);
        setError("Failed to record the loan. Please try again.");
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
            {members.length > 0 ? "Select a family member" : "No other members in this family"}
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