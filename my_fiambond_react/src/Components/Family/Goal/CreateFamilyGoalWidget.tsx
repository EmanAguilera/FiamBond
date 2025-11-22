// Components/CreateFamilyGoalWidget.tsx

import { useContext, useState, ChangeEvent, FormEvent } from "react";
import { AppContext } from "../../../Context/AppContext.jsx";
// Removed Firebase Imports

// Define TypeScript interfaces
interface Family {
  id: string;
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

export default function CreateFamilyGoalWidget({ family, onSuccess }: CreateFamilyGoalWidgetProps) {
  const { user } = useContext(AppContext);
  
  // Use Vite env variable or fallback to localhost
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
      // Prepare the payload for the Node.js Backend
      // Matches the Mongoose GoalSchema
      const payload = {
        user_id: user.uid,
        family_id: family.id, // IMPORTANT: Links this goal to the family
        name: formData.name,
        target_amount: Number(formData.target_amount),
        target_date: new Date(formData.target_date), // Send standard JS Date
        status: "active",
        // created_at is handled automatically by Mongoose default: Date.now
      };

      // Send POST request
      const response = await fetch(`${API_URL}/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create goal on server');
      }
      
      // Reset form
      setFormData({ name: "", target_amount: "", target_date: "" });

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
            placeholder="Goal Name (e.g. Family Vacation)"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
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
              className="w-full p-2 border border-gray-300 rounded-md text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
              required
            />
          </div>
        </div>
        {formError && <p className="error text-center">{formError}</p>}
        <button type="submit" className="primary-btn w-full" disabled={loading}>
          {loading ? 'Setting Goal...' : 'Set Family Goal'}
        </button>
      </form>
    </div>
  );
}