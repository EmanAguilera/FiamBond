import { useContext, useState, ChangeEvent, FormEvent } from "react";
import { AppContext } from "../Context/AppContext.jsx";

// Define TypeScript interfaces for better type-checking
interface Family {
  id: number;
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

interface IApiError {
  [key: string]: string[];
}

export default function CreateFamilyTransactionWidget({ family, onSuccess }: CreateFamilyTransactionWidgetProps) {
  const { token } = useContext(AppContext) as { token: string };

  const [formData, setFormData] = useState<ITransactionForm>({
    description: "",
    amount: "",
    type: "expense",
  });
  
  const [errors, setErrors] = useState<IApiError>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateTransaction = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setFormError(null);
    setLoading(true);

    const payload = new FormData();
    payload.append('description', formData.description);
    payload.append('amount', formData.amount);
    payload.append('type', formData.type);
    payload.append('family_id', String(family.id)); // Ensure family_id is a string for FormData

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
        if (res.status === 422) {
          setErrors(data.errors);
        } else {
          setFormError(data.message || "An unexpected error occurred.");
        }
        return;
      }
      
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
            <input type="radio" name="type" value="expense" checked={formData.type === "expense"} onChange={handleInputChange} className="h-4 w-4 text-indigo-600" disabled={loading} />
            Expense
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="type" value="income" checked={formData.type === "income"} onChange={handleInputChange} className="h-4 w-4 text-indigo-600" disabled={loading} />
            Income
          </label>
        </div>
        <div>
          <input type="text" name="description" placeholder="Description" value={formData.description} onChange={handleInputChange} className="w-full p-2 border rounded-md" disabled={loading} />
          {errors.description && <p className="error">{errors.description[0]}</p>}
        </div>
        <div>
          <input type="number" name="amount" placeholder="Amount" step="0.01" value={formData.amount} onChange={handleInputChange} className="w-full p-2 border rounded-md" disabled={loading} />
          {errors.amount && <p className="error">{errors.amount[0]}</p>}
        </div>
        {formError && <p className="error">{formError}</p>}
        <button type="submit" className="primary-btn w-full" disabled={loading}>
          {loading ? 'Saving...' : 'Save Transaction'}
        </button>
      </form>
    </div>
  );
}