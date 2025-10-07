import { useContext, useState, ChangeEvent, FormEvent } from "react";
import { AppContext } from "../Context/AppContext.jsx";

// Define TypeScript interfaces for better type-checking
interface Family {
  id: number;
  // Add any other properties of the family object if available
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

interface IApiError {
  [key: string]: string[];
}

export default function CreateFamilyGoalWidget({ family, onSuccess }: CreateFamilyGoalWidgetProps) {
  const { token } = useContext(AppContext) as { token: string };

  const [formData, setFormData] = useState<IGoalForm>({
    name: "",
    target_amount: "",
    target_date: "",
  });

  const [formErrors, setFormErrors] = useState<IApiError>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateGoal = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});
    setFormError(null);
    setLoading(true);
    
    const bodyPayload = { ...formData, family_id: family.id };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/goals`, {
        method: "post",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 422) {
          setFormErrors(data.errors);
        } else {
          setFormError(data.message || "An unexpected error occurred.");
        }
        return;
      }
      
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
          />
          {formErrors.name && <p className="error">{formErrors.name[0]}</p>}
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
            />
            {formErrors.target_amount && <p className="error">{formErrors.target_amount[0]}</p>}
          </div>
          <div>
            <input
              type="date"
              name="target_date"
              value={formData.target_date}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md text-gray-500"
              disabled={loading}
            />
            {formErrors.target_date && <p className="error">{formErrors.target_date[0]}</p>}
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