// Components/CreateFamilyWidget.tsx

import { useContext, useState, ChangeEvent, FormEvent } from "react";
import { AppContext } from "../Context/AppContext.jsx";
import { db } from "../config/firebase-config"; // Adjust path if necessary
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// FIX #1: Define an interface for the component's props
interface CreateFamilyWidgetProps {
  onSuccess?: () => void; // 'onSuccess' is an optional function that returns nothing
}

export default function CreateFamilyWidget({ onSuccess }: CreateFamilyWidgetProps) {
  const { user } = useContext(AppContext);
  const [familyName, setFamilyName] = useState<string>("");
  
  // FIX #3: Specify that the state can be a string OR null
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // FIX #2: Add the correct event type for a form submission
  const handleCreateFamily = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) {
      // This is now valid because generalError can be a string
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
      await addDoc(familiesCollectionRef, familyData);

      setFamilyName("");
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to create family:', error);
      // This is also now valid
      setGeneralError('A network error occurred. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Add the correct event type for an input change
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
            onChange={handleInputChange} // Use the new typed handler
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