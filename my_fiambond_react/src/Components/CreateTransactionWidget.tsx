// Components/CreateTransactionWidget.tsx

import { useContext, useState, ChangeEvent, FormEvent, useRef } from "react";
import { AppContext } from "../Context/AppContext.jsx";
import { db } from "../config/firebase-config"; // No storage import needed
import { collection, addDoc, doc, deleteDoc, serverTimestamp } from "firebase/firestore";

// --- TypeScript Interfaces ---
interface ITransactionForm {
  description: string;
  amount: string;
  type: "expense" | "income";
}

interface IGoal {
  id: string; // Firestore IDs are strings
  name: string;
}

interface CreateTransactionWidgetProps {
  onSuccess?: () => void;
}

// --- CoinTossModal Component (Remains unchanged) ---
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
  const { user } = useContext(AppContext);
  const formRef = useRef<HTMLFormElement>(null);

  const [formData, setFormData] = useState<ITransactionForm>({ description: "", amount: "", type: "expense" });
  // The 'attachment' state is no longer needed
  const [formError, setFormError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<IGoal | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value as any }));
  };

  // The 'handleFileChange' function is no longer needed

  const handleCreateTransaction = async (e?: FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!user) {
        setFormError("You must be logged in.");
        return;
    }

    setFormError(null);
    setLoading(true);

    try {
      // The file upload step is completely removed.
      
      // Prepare the data and save it to Firestore.
      const transactionData = {
        user_id: user.uid,
        family_id: null,
        description: formData.description,
        amount: Number(formData.amount),
        type: formData.type,
        attachment_url: null, // Always null as we are ignoring storage
        created_at: serverTimestamp(),
      };

      await addDoc(collection(db, "transactions"), transactionData);
      
      // Reset the form and call the success handler
      setFormData({ description: "", amount: "", type: "expense" });
      formRef.current?.reset();
      if (onSuccess) onSuccess();

    } catch (err) {
      console.error('Failed to create transaction:', err);
      setFormError('A network error occurred. Please check your connection.');
    } finally {
      setLoading(false);
      setConflict(null);
    }
  };

  const handleAbandon = async () => {
    if (!conflict) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "goals", conflict.id));
      await handleCreateTransaction();
    } catch (err) {
      console.error(err);
      setFormError("Could not abandon the goal. Please try again.");
      setLoading(false);
    }
  };

  const handleAcknowledge = () => {
    handleCreateTransaction();
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
        <form ref={formRef} onSubmit={handleCreateTransaction} className="space-y-6">
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
              required
            />
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
              required
            />
          </div>

          {/* The entire file input section has been removed */}

          {formError && <p className="error">{formError}</p>}
          <button type="submit" className="primary-btn w-full" disabled={loading}>
            {loading ? 'Saving...' : 'Save Transaction'}
          </button>
        </form>
      </div>
    </>
  );
}