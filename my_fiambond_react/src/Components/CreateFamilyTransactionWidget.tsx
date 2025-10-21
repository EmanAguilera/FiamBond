// Components/CreateFamilyTransactionWidget.tsx

import { useContext, useState, ChangeEvent, FormEvent } from "react";
import { AppContext } from "../Context/AppContext.jsx";
import { db } from "../config/firebase-config"; // Adjust path if necessary
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Define TypeScript interfaces for better type-checking
interface Family {
  id: string; // Firestore document IDs are strings
  // Include other properties of the family object if available
}

interface CreateFamilyTransactionWidgetProps {
  family: Family;
  onSuccess?: () => void;
}

interface ITransactionForm {
  description: string;
  amount: string;
  type: "expense" | "income";
}

export default function CreateFamilyTransactionWidget({ family, onSuccess }: CreateFamilyTransactionWidgetProps) {
  // Get the full user object to access user.uid
  const { user } = useContext(AppContext);

  const [formData, setFormData] = useState<ITransactionForm>({
    description: "",
    amount: "",
    type: "expense",
  });
  
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // This function can handle changes for both radio buttons and text inputs
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value as any })); // Use 'as any' for the radio button type
  };

  const handleCreateTransaction = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Guard clause: Ensure a user is logged in.
    if (!user) {
        setFormError("You must be logged in to add a transaction.");
        return;
    }

    setFormError(null);
    setLoading(true);

    try {
      // Prepare the data object to be saved in Firestore.
      // The structure must match your 'transactions' collection.
      const transactionData = {
        user_id: user.uid,
        family_id: family.id,
        description: formData.description,
        amount: Number(formData.amount), // Convert the amount string to a number
        type: formData.type,
        created_at: serverTimestamp(),
        attachment_url: null, // For now, we are not handling file uploads
      };

      // Get a reference to the 'transactions' collection and add the new document.
      const transactionsCollectionRef = collection(db, "transactions");
      await addDoc(transactionsCollectionRef, transactionData);

      // If successful, reset the form and call the onSuccess callback.
      setFormData({ description: "", amount: "", type: "expense" });
      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      console.error('Failed to create family transaction:', err);
      setFormError('A network error occurred. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleCreateTransaction} className="space-y-6">
        <div className="flex justify-center gap-8 text-gray-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="type" 
              value="expense" 
              checked={formData.type === "expense"} 
              onChange={handleInputChange} 
              className="h-4 w-4 text-indigo-600" 
              disabled={loading} 
            />
            Expense
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="type" 
              value="income" 
              checked={formData.type === "income"} 
              onChange={handleInputChange} 
              className="h-4 w-4 text-indigo-600" 
              disabled={loading} 
            />
            Income
          </label>
        </div>
        <div>
          <input 
            type="text" 
            name="description" 
            placeholder="Description" 
            value={formData.description} 
            onChange={handleInputChange} 
            className="w-full p-2 border rounded-md" 
            disabled={loading} 
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
            className="w-full p-2 border rounded-md" 
            disabled={loading} 
            required 
          />
        </div>
        {formError && <p className="error">{formError}</p>}
        <button type="submit" className="primary-btn w-full" disabled={loading}>
          {loading ? 'Saving...' : 'Save Transaction'}
        </button>
      </form>
    </div>
  );
}