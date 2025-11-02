// Components/CreateGoalWidget.tsx

import { useContext, useState, ChangeEvent, FormEvent } from "react";
import { AppContext } from "../../Context/AppContext.jsx";
import { db } from "../../config/firebase-config.js"; // Adjust path if necessary
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";

// --- TypeScript interfaces ---
interface IGoalForm {
  name: string;
  target_amount: string;
  target_date: string;
}

interface CreateGoalWidgetProps {
  onSuccess?: () => void;
}

export default function CreateGoalWidget({ onSuccess }: CreateGoalWidgetProps) {
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
    
    if (!user) {
      setFormError("You must be logged in to create a goal.");
      return;
    }

    setFormError(null);
    setLoading(true);

    try {
      const goalData = {
        user_id: user.uid,
        family_id: null,
        name: formData.name,
        target_amount: Number(formData.target_amount),
        target_date: Timestamp.fromDate(new Date(formData.target_date)),
        status: "active",
        created_at: serverTimestamp(),
        completed_at: null,
        completed_by_user_id: null,
      };

      const goalsCollectionRef = collection(db, "goals");
      await addDoc(goalsCollectionRef, goalData);

      setFormData({ name: "", target_amount: "", target_date: "" });
      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      console.error('Failed to create goal:', err);
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
            placeholder="Goal Name (e.g., Vacation Fund)"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              step="0.01"
            />
          </div>
          <div>
            <input
              type="date"
              name="target_date"
              value={formData.target_date}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-500"
              required
            />
          </div>
        </div>
        {formError && <p className="error">{formError}</p>}
        
        {/* THE FIX IS HERE: Ensured the button has a proper closing tag */}
        <button type="submit" className="primary-btn w-full" disabled={loading}>
          {loading ? 'Setting Goal...' : 'Set Goal'}
        </button>

      </form>
    </div>
  );
}