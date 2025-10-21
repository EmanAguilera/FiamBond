// Components/CreateFamilyGoalWidget.tsx

import { useContext, useState, ChangeEvent, FormEvent } from "react";
import { AppContext } from "../Context/AppContext.jsx";
import { db } from "../config/firebase-config"; // Adjust path if necessary
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";

// Define TypeScript interfaces for better type-checking
interface Family {
  id: string; // Firestore document IDs are strings
  // Add any other properties of the family object if available
  family_name?: string;
}

interface CreateFamilyGoalWidgetProps {
  family: Family;
  onSuccess?: () => void;
}

interface IGoalForm {
  name: string;
  target_amount: string;
  target_date: string;
}

// NOTE: The IApiError interface is no longer needed as Firebase client-side errors are simpler.

export default function CreateFamilyGoalWidget({ family, onSuccess }: CreateFamilyGoalWidgetProps) {
  // Get the user object from context to access the user's UID
  const { user } = useContext(AppContext);

  const [formData, setFormData] = useState<IGoalForm>({
    name: "",
    target_amount: "",
    target_date: "",
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateGoal = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Guard clause: Ensure a user is logged in before proceeding.
    if (!user) {
      setFormError("You must be logged in to create a goal.");
      return;
    }
    
    setFormError(null);
    setLoading(true);
    
    try {
      // Prepare the data object to be saved in Firestore.
      // It must match the structure of your 'goals' collection.
      const goalData = {
        user_id: user.uid,
        family_id: family.id, // Link to the family using its document ID
        name: formData.name,
        target_amount: Number(formData.target_amount), // Convert amount to a number
        target_date: Timestamp.fromDate(new Date(formData.target_date)), // Convert date string to Firestore Timestamp
        status: "active",
        created_at: serverTimestamp(),
        completed_at: null,
        completed_by_user_id: null,
      };

      // Get a reference to the 'goals' collection and add the new document.
      const goalsCollectionRef = collection(db, "goals");
      await addDoc(goalsCollectionRef, goalData);
      
      // If the operation is successful, call the onSuccess callback if it exists.
      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      console.error('Failed to create family goal:', err);
      setFormError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleCreateGoal} className="space-y-4">
        <div>
          <input
            type="text"
            name="name"
            placeholder="Goal Name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full p-2 border rounded-md"
            disabled={loading}
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="number"
              name="target_amount"
              placeholder="Target Amount"
              value={formData.target_amount}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              disabled={loading}
              required
              step="0.01" // Allow decimal values for money
            />
          </div>
          <div>
            <input
              type="date"
              name="target_date"
              value={formData.target_date}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md text-gray-500"
              disabled={loading}
              required
            />
          </div>
        </div>
        {formError && <p className="error">{formError}</p>}
        <button type="submit" className="primary-btn w-full" disabled={loading}>
          {loading ? 'Setting Goal...' : 'Set Goal'}
        </button>
      </form>
    </div>
  );
}