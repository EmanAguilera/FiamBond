import { useContext, useState, ChangeEvent, FormEvent } from "react";
import { AppContext } from "../Context/AppContext.jsx";
import { db } from "../config/firebase-config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// --- TypeScript Interfaces ---
interface NewFamily {
  id: string;
  family_name: string;
  owner_id: string;
}

interface CreateFamilyWidgetProps {
  // THE FIX IS HERE (Part 1): The onSuccess prop is updated to pass the new family object.
  onSuccess?: (newFamily: NewFamily) => void;
}

export default function CreateFamilyWidget({ onSuccess }: CreateFamilyWidgetProps) {
  const { user } = useContext(AppContext);
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
      const familyData = {
        family_name: familyName,
        owner_id: user.uid,
        member_ids: [user.uid],
        created_at: serverTimestamp(),
      };

      const familiesCollectionRef = collection(db, "families");
      // THE FIX IS HERE (Part 2): Get the reference to the newly created document.
      const newDocRef = await addDoc(familiesCollectionRef, familyData);

      setFamilyName("");
      
      // THE FIX IS HERE (Part 3): Call the onSuccess callback with the new family's data.
      if (onSuccess) {
        onSuccess({
          id: newDocRef.id,
          family_name: familyName,
          owner_id: user.uid,
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
        {generalError && <p className="error">{generalError}</p>}
        <button type="submit" className="primary-btn w-full" disabled={loading}>
          {loading ? 'Creating...' : 'Create Family'}
        </button>
      </form>
    </div>
  );
}