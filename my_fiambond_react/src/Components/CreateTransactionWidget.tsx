import { useContext, useState, useEffect, useCallback, ChangeEvent, FormEvent } from "react";
import { AppContext } from "../Context/AppContext.jsx";

// Define TypeScript interfaces for better type-checking
interface ITransactionForm {
  description: string;
  amount: string;
  type: "expense" | "income";
}

interface IApiError {
  [key: string]: string[];
}

interface IGoal {
  id: number;
  name: string;
}

interface CreateTransactionWidgetProps {
  onSuccess?: () => void;
}

// A simplified and robust conflict modal
function CoinTossModal({ goal, onAbandon, onAcknowledge }: { goal: IGoal; onAbandon: () => void; onAcknowledge: () => void; }) {
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

export default function CreateTransactionWidget({ onSuccess }: CreateTransactionWidgetProps) {
  const { token } = useContext(AppContext);

  const [formData, setFormData] = useState<ITransactionForm>({ 
    description: "", 
    amount: "", 
    type: "expense" 
  });
  
  const [attachment, setAttachment] = useState<File | null>(null);
  const [errors, setErrors] = useState<IApiError>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<IGoal | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachment(e.target.files[0]);
    } else {
      setAttachment(null);
    }
  };

  const handleCreateTransaction = async (e?: FormEvent<HTMLFormElement>, force = false) => {
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
        } else {
          setFormError(data.message || "An unexpected error occurred.");
        }
        return;
      }
      
      setFormData({ description: "", amount: "", type: "expense" });
      setAttachment(null);
      if (e) e.currentTarget.reset();

      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      console.error('Failed to create transaction:', err);
      setFormError('A network error occurred. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleAbandon = async () => {
    if (!conflict) return;
    setLoading(true);
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/goals/${conflict.id}`, {
        method: 'delete',
        headers: { Authorization: `Bearer ${token}` }
      });
      await handleCreateTransaction(undefined, true); 
    } catch (err) {
      console.error(err);
      setFormError("Could not abandon the goal. Please try again.");
    } finally {
        setConflict(null);
        setLoading(false);
    }
  };

  const handleAcknowledge = () => {
    handleCreateTransaction(undefined, true);
  };

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
              <input type="radio" name="type" value="expense" checked={formData.type === "expense"} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"/>
              Expense
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="type" value="income" checked={formData.type === "income"} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"/>
              Income
            </label>
          </div>
          <div>
            <input
              type="text"
              name="description"
              placeholder="Description (e.g., Groceries, Paycheck)"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.description && <p className="error">{errors.description[0]}</p>}
          </div>
          <div>
            <input
              type="number"
              name="amount"
              placeholder="Amount"
              step="0.01"
              value={formData.amount}
              onChange={handleInputChange}
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

          {formError && <p className="error">{formError}</p>}
          <button type="submit" className="primary-btn w-full" disabled={loading}>
            {loading ? 'Saving...' : 'Save Transaction'}
          </button>
        </form>
      </div>
    </>
  );
}