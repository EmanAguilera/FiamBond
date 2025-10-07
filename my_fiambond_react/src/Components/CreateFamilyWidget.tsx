import { useContext, useState, ChangeEvent, FormEvent } from "react";
import { AppContext } from "../Context/AppContext.jsx";

// Define TypeScript interfaces for props and API errors
interface CreateFamilyWidgetProps {
  onSuccess?: () => void;
}

interface IApiError {
  [key: string]: string[];
}

export default function CreateFamilyWidget({ onSuccess }: CreateFamilyWidgetProps) {
  const { token } = useContext(AppContext);
  const [familyName, setFamilyName] = useState<string>("");
  const [errors, setErrors] = useState<IApiError>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleCreateFamily = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families`, {
        method: "post",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ first_name: familyName }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 422) {
          setErrors(data.errors);
        } else {
          setGeneralError(data.message || "Failed to create the family.");
        }
        return;
      }

      setFamilyName("");
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to create family:', error);
      setGeneralError('A network error occurred. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleCreateFamily} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Family Name (e.g., Smith Household)"
            value={familyName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setFamilyName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          />
          {errors.first_name && <p className="error">{errors.first_name[0]}</p>}
        </div>
        {generalError && <p className="error">{generalError}</p>}
        <button type="submit" className="primary-btn w-full" disabled={loading}>
          {loading ? 'Creating...' : 'Create Family'}
        </button>
      </form>
    </div>
  );
}