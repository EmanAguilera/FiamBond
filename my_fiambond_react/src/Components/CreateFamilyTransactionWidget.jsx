import { useContext, useState } from "react";
import { AppContext } from "../Context/AppContext.jsx";

export default function CreateFamilyTransactionWidget({ family, onSuccess }) {
  const { token } = useContext(AppContext);

  const [formData, setFormData] = useState({ description: "", amount: "", type: "expense" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleCreateTransaction(e) {
    e.preventDefault();
    setErrors({});
    setFormError(null);
    setLoading(true);

    const payload = new FormData();
    payload.append('description', formData.description);
    payload.append('amount', formData.amount);
    payload.append('type', formData.type);
    payload.append('family_id', family.id); // The family_id is automatically included

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transactions`, {
        method: "post",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        body: payload,
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 422) setErrors(data.errors);
        else setFormError(data.message || "An unexpected error occurred.");
        return;
      }
      
      if (onSuccess) onSuccess();

    } catch (err) {
      // --- THIS IS THE FIX ---
      // We now log the actual error to the console for better debugging.
      console.error('Failed to create family transaction:', err);
      // --- END OF FIX ---
      setFormError('A network error occurred. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleCreateTransaction} className="space-y-6">
        <div className="flex justify-center gap-8 text-gray-700">
          <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="type" value="expense" checked={formData.type === "expense"} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="h-4 w-4 text-indigo-600"/>Expense</label>
          <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="type" value="income" checked={formData.type === "income"} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="h-4 w-4 text-indigo-600"/>Income</label>
        </div>
        <div>
          <input type="text" placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full p-2 border rounded-md"/>
          {errors.description && <p className="error">{errors.description[0]}</p>}
        </div>
        <div>
          <input type="number" placeholder="Amount" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full p-2 border rounded-md"/>
          {errors.amount && <p className="error">{errors.amount[0]}</p>}
        </div>
        {formError && <p className="error">{formError}</p>}
        <button type="submit" className="primary-btn w-full" disabled={loading}>{loading ? 'Saving...' : 'Save Transaction'}</button>
      </form>
    </div>
  );
}