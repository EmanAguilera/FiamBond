import { useContext, useState, useEffect, ChangeEvent, FormEvent } from "react";
import { AppContext } from "../Context/AppContext.jsx";

// Define TypeScript interfaces for better type-checking
interface Family {
  id: number;
  // Add other family properties if available
}

interface User {
  id: number;
  // Add other user properties if available
}

interface Member {
  id: number;
  full_name: string;
}

interface CreateLoanWidgetProps {
  family: Family;
  onSuccess?: () => void;
}

export default function CreateLoanWidget({ family, onSuccess }: CreateLoanWidgetProps) {
  const { token, user } = useContext(AppContext) as { token: string; user: User };

  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    debtorId: "",
    deadline: "",
  });

  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!family.id || !token) return;

      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/${family.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          // Ensure user is not in the list of potential debtors
          setMembers(data.members.filter((member: Member) => member.id !== user.id));
        } else {
          throw new Error("Failed to fetch family members.");
        }
      } catch (err) {
        console.error("Failed to fetch family members:", err);
        setError("Could not load family members. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [family.id, token, user.id]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleLendMoney = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const loanDetails = {
      creditor_id: user.id,
      debtor_id: parseInt(formData.debtorId, 10),
      amount: parseFloat(formData.amount),
      description: formData.description,
      deadline: formData.deadline || null,
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/${family.id}/loans`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(loanDetails),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to record the loan.");
      }

      if (onSuccess) {
        onSuccess();
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLendMoney} className="space-y-4">
      <div>
        <label htmlFor="debtorId" className="block text-sm font-medium text-gray-700">Lending To:</label>
        <select id="debtorId" value={formData.debtorId} onChange={handleInputChange} required disabled={loading} className="w-full p-2 border border-gray-300 rounded-md">
          <option value="">Select a family member</option>
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
      <button type="submit" className="primary-btn w-full" disabled={loading}>
        {loading ? 'Processing...' : 'Confirm & Lend Money'}
      </button>
    </form>
  );
}