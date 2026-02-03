'use client'; // Required due to the use of useState, useContext, and browser APIs (fetch)

import { useContext, useState, ChangeEvent, FormEvent } from "react";
import { AppContext } from "../../../Context/AppContext.jsx";
import { API_BASE_URL } from '@/src/config/apiConfig';
import { toast } from 'react-hot-toast'; // Client-side library

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

  const [familyName, setFamilyName] = useState<string>("");
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleCreateFamily = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) {
      setGeneralError("You must be logged in to perform this action.");
      toast.error("Login required.");
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
      };

      // 2. Send POST Request
      const response = await fetch(`${API_BASE_URL}/families`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(familyData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errorData.message || 'Failed to create family on server.');
      }

      const newFamilyDoc = await response.json();

      setFamilyName("");
      toast.success(`Family '${newFamilyDoc.family_name}' created!`);
      
      // 3. Handle Success
      if (onSuccess) {
        onSuccess({
          id: newFamilyDoc._id, // Map MongoDB '_id' to 'id'
          family_name: newFamilyDoc.family_name,
          owner_id: newFamilyDoc.owner_id,
        });
      }
    } catch (error: any) {
      console.error('Failed to create family:', error);
      const errorMessage = error instanceof Error ? error.message : 'A network error occurred.';
      setGeneralError(errorMessage);
      toast.error(errorMessage);
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
          <label className="block text-sm font-bold text-slate-700 mb-1">New Family Name</label>
          <input
            type="text"
            placeholder="e.g., Smith Household"
            value={familyName}
            onChange={handleInputChange}
            className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            disabled={loading}
            required
          />
        </div>
        
        {generalError && (
          <p className="error text-center text-rose-600 text-sm font-medium animate-pulse">
            {generalError}
          </p>
        )}

        <button 
          type="submit" 
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md" 
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Family'}
        </button>
      </form>
    </div>
  );
}