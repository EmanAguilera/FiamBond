// CreateLoanWidget.jsx
import { useContext, useState, useEffect } from "react";
import { AppContext } from "../Context/AppContext.jsx";

export default function CreateLoanWidget({ family, onSuccess }) {
  const { token, user } = useContext(AppContext);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [debtorId, setDebtorId] = useState("");
  const [members, setMembers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/${family.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          // The current user (lender) can't lend to themselves, so filter them out.
          setMembers(data.members.filter(member => member.id !== user.id));
        }
      } catch (err) {
        console.error("Failed to fetch family members:", err);
      }
    }
    fetchMembers();
  }, [family.id, token, user.id]);

  async function handleLendMoney(e) {
    e.preventDefault();
    setError(null);

    const loanDetails = {
      creditor_id: user.id,
      debtor_id: parseInt(debtorId),
      amount: parseFloat(amount),
      description,
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

      if (onSuccess) onSuccess();

    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={handleLendMoney} className="space-y-4">
      <div>
        <label htmlFor="debtor" className="block text-sm font-medium text-gray-700">Lending To:</label>
        <select id="debtor" value={debtorId} onChange={(e) => setDebtorId(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-md">
          <option value="">Select a family member</option>
          {members.map(member => (
            <option key={member.id} value={member.id}>{member.full_name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount (₱)</label>
        <input id="amount" type="number" step="0.01" placeholder="100.00" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-md" />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Reason / Description</label>
        <input id="description" type="text" placeholder="e.g., Lunch money" value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-md" />
      </div>
      {error && <p className="error">{error}</p>}
      <button type="submit" className="primary-btn w-full">Confirm & Lend Money</button>
    </form>
  );
}