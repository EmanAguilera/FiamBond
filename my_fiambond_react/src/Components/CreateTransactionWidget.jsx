import { useContext, useState, useEffect, useCallback } from "react";
import { AppContext } from "../Context/AppContext.jsx";

// This is the conflict modal, it is fully included here.
function CoinTossModal({ goal, onAbandon, onAcknowledge }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl text-center w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">A Choice Must Be Made</h2>
        <p className="mb-6 text-slate-700">
          This action conflicts with your goal: <span className="font-bold text-indigo-600">"{goal.name}"</span>.
          You have introduced a variable. You must call it.
        </p>
        <div className="space-y-4">
          <button onClick={onAbandon} className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-md hover:bg-red-700 transition-colors">
            [ Abandon Goal ]
          </button>
          <button onClick={onAcknowledge} className="w-full bg-slate-600 text-white font-bold py-3 px-4 rounded-md hover:bg-slate-700 transition-colors">
            [ Acknowledge Consequence ]
          </button>
        </div>
      </div>
    </div>
  );
}

// The component now accepts an `onSuccess` prop to signal completion.
export default function CreateTransactionWidget({ onSuccess }) {
  const { token } = useContext(AppContext);

  const [formData, setFormData] = useState({ 
    description: "", amount: "", type: "expense", family_id: ""
  });
  
  // State to hold the selected file
  const [attachment, setAttachment] = useState(null);

  const [deductImmediately, setDeductImmediately] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [conflict, setConflict] = useState(null);
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(false);

  const getFamilies = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Could not load families.');
      const data = await res.json();
      setFamilies(data.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    if (token) getFamilies();
  }, [token, getFamilies]);
  
  const showDeductCheckbox = formData.type === 'income' && formData.family_id !== '';

  useEffect(() => {
    if (!showDeductCheckbox) setDeductImmediately(false);
  }, [showDeductCheckbox]);

  // Function to handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachment(e.target.files[0]);
    } else {
      setAttachment(null);
    }
  };

  // The main submission logic using FormData for file uploads
  async function handleCreateTransaction(e, force = false) {
    if (e) e.preventDefault();
    setErrors({});
    setFormError(null);
    setLoading(true);

    const payload = new FormData();
    payload.append('description', formData.description);
    payload.append('amount', formData.amount);
    payload.append('type', formData.type);
    
    if (force) {
      payload.append('force_creation', 'true');
    }
    if (formData.family_id) {
      payload.append('family_id', formData.family_id);
    }
    if (showDeductCheckbox && deductImmediately) {
      payload.append('deduct_immediately', 'true');
    }
    if (attachment) {
      payload.append('attachment', attachment);
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transactions`, {
        method: "post",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: payload,
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setConflict(data.goal);
        } else if (res.status === 422) {
          setErrors(data.errors);
          setConflict(null);
        } else {
          setFormError(data.message || "An unexpected error occurred.");
        }
        return;
      }
      
      setFormData({ description: "", amount: "", type: "expense", family_id: "" });
      setAttachment(null);
      if (e) e.target.reset();

      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      console.error('Failed to create transaction:', err);
      setFormError('A network error occurred. Please check your connection.');
    } finally {
        setLoading(false);
    }
  }

  async function handleAbandon() {
    setLoading(true);
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/goals/${conflict.id}`, {
        method: 'delete',
        headers: { Authorization: `Bearer ${token}` }
      });
      handleCreateTransaction(null, true); 
    } catch (err) {
      console.error(err);
      setFormError("Could not abandon the goal. Please try again.");
      setConflict(null);
      setLoading(false);
    }
  }

  function handleAcknowledge() {
    handleCreateTransaction(null, true);
  }

  return (
    <>
      {conflict && (
        <CoinTossModal 
            goal={conflict}
            onAbandon={handleAbandon}
            onAcknowledge={handleAcknowledge}
        />
      )}

      <div className="w-full">
        <form onSubmit={handleCreateTransaction} className="space-y-6">
          <div className="flex justify-center gap-8 text-gray-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="type" value="expense" checked={formData.type === "expense"} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"/>
              Expense
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="type" value="income" checked={formData.type === "income"} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"/>
              Income
            </label>
          </div>
          <div>
            <select
                value={formData.family_id}
                onChange={(e) => setFormData({ ...formData, family_id: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
                <option value="">-- Personal Transaction --</option>
                {families.map((family) => (<option key={family.id} value={family.id}>For Family: {family.first_name}</option>))}
            </select>
            {errors.family_id && <p className="error">{errors.family_id[0]}</p>}
          </div>
          <div>
            <input
              type="text"
              placeholder="Description (e.g., Groceries, Paycheck)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.description && <p className="error">{errors.description[0]}</p>}
          </div>
          <div>
            <input
              type="number"
              placeholder="Amount"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.amount && <p className="error">{errors.amount[0]}</p>}
          </div>

          <div>
            <label htmlFor="attachment" className="block text-sm font-medium text-gray-700 mb-1">Attach Receipt (Optional)</label>
            <input
              id="attachment"
              type="file"
              onChange={handleFileChange}
              className="w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100"
            />
            {errors.attachment && <p className="error">{errors.attachment[0]}</p>}
          </div>

          {showDeductCheckbox && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-md transition-all">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" checked={deductImmediately} onChange={(e) => setDeductImmediately(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"/>
                <span className="text-sm text-gray-800">
                  Deduct this amount from your personal balance.
                  <p className="text-xs text-gray-500 mt-1">This will add income to the family and create a matching 'expense' in your personal ledger.</p>
                </span>
              </label>
            </div>
          )}

          {formError && <p className="error">{formError}</p>}
          <button type="submit" className="primary-btn w-full" disabled={loading}>
            {loading ? 'Saving...' : 'Save Transaction'}
          </button>
        </form>
      </div>
    </>
  );
}