import { useContext, useState, ChangeEvent, FormEvent } from "react";
import { AppContext } from "../../../Context/AppContext.jsx";
// Removed Firebase Imports

// --- TypeScript Interfaces ---
interface NewFamily {
  id: string;
  family_name: string;
  owner_id: string;
}

interface CreateFamilyWidgetProps {
  onSuccess?: (newFamily: NewFamily) => void;
}

export default function CreateFamilyWidget({ onSuccess }: CreateFamilyWidgetProps) {
  const { user } = useContext(AppContext);
  // Use Vite env variable or fallback
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const [familyName, setFamilyName] = useState<string>("");
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleCreateFamily = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) {
      setGeneralError("You must be logged in to perform this action.");
      return;
    }

    setGeneralError(null);
    setLoading(true);

    try {
      // 1. Prepare Payload for MongoDB
      const familyData = {
        family_name: familyName,
        owner_id: user.uid,
        member_ids: [user.uid], // Creator is automatically a member
        // created_at handled by Mongoose defaults
      };

      // 2. Send POST Request
      const response = await fetch(`${API_URL}/families`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(familyData),
      });

      if (!response.ok) {
        throw new Error('Failed to create family on server.');
      }

      const newFamilyDoc = await response.json();

      setFamilyName("");
      
      // 3. Handle Success
      if (onSuccess) {
        onSuccess({
          id: newFamilyDoc._id, // Map MongoDB '_id' to 'id'
          family_name: newFamilyDoc.family_name,
          owner_id: newFamilyDoc.owner_id,
        });
      }
    } catch (error) {
      console.error('Failed to create family:', error);
      setGeneralError('A network error occurred. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFamilyName(e.target.value);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleCreateFamily} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Family Name (e.g., Smith Household)"
            value={familyName}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
            required
          />
        </div>
        {generalError && <p className="error text-center">{generalError}</p>}
        <button type="submit" className="primary-btn w-full" disabled={loading}>
          {loading ? 'Creating...' : 'Create Family'}
        </button>
      </form>
    </div>
  );
}