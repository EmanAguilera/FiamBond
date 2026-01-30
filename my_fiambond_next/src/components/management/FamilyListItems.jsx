'use client'; // Required due to the use of useState, useContext, and memo

// Components/FamilyListItem.jsx

import { useState, useContext, memo } from 'react';
import { AppContext } from '../../../Context/AppContext.jsx';
import { toast } from 'react-hot-toast'; // Client-side library

function FamilyListItem({ family, onFamilyUpdated, onFamilyDeleted }) {
  const { user } = useContext(AppContext);
  const [isEditing, setIsEditing] = useState(false);
  const [familyName, setFamilyName] = useState(family.family_name);
  const [error, setError] = useState(null);

  // ⭐️ Next.js change: Replace import.meta.env.VITE_API_URL with process.env.NEXT_PUBLIC_API_URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const isOwner = user?.uid === family.owner_id;
  const canPerformActions = isOwner;

  const getDisabledMessage = () => {
    if (!isOwner) return "Only the family owner can perform this action.";
    return "";
  };
  
  async function handleUpdate(e) {
    e.preventDefault();
    if (!canPerformActions) return;

    setError(null);
    try {
      // 1. Send PATCH request to Node.js Backend
      const response = await fetch(`${API_URL}/families/${family.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ family_name: familyName }),
      });

      if (!response.ok) {
        throw new Error('Failed to update family name on server.');
      }

      // 2. Update UI via Parent Callback
      const updatedFamily = { ...family, family_name: familyName };
      onFamilyUpdated(updatedFamily);
      setIsEditing(false);
      toast.success("Family renamed successfully!"); // Added toast

    } catch (err) {
      console.error('Failed to update family:', err);
      setError('Failed to update the family name.');
      toast.error(err.message || 'Failed to update family.'); // Added toast
    }
  }

  async function handleDelete() {
    if (!canPerformActions) return;

    if (!window.confirm(`Are you sure you want to delete the family "${family.family_name}"? This action cannot be undone.`)) {
      return;
    }
    setError(null);
    try {
      // 1. Send DELETE request to Node.js Backend
      const response = await fetch(`${API_URL}/families/${family.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete family on server.');
      }
      
      // 2. Update UI via Parent Callback
      onFamilyDeleted(family.id);
      toast.success("Family deleted successfully!"); // Added toast

    } catch (err) {
      console.error('Failed to delete family:', err);
      setError('Failed to delete the family.');
      toast.error(err.message || 'Failed to delete family.'); // Added toast
    }
  }

  // --- Inline Button Styles (Simplified for example) ---
  const primaryBtnSm = "bg-indigo-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50";
  const secondaryBtnSm = "bg-white text-slate-600 border border-slate-300 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-slate-50 transition disabled:opacity-50";
  const dangerBtnSm = "bg-rose-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-rose-700 transition disabled:opacity-50";


  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-md space-y-3">
      {isEditing ? (
        <form onSubmit={handleUpdate} className="flex items-center gap-4">
          <input
            type="text"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" className={primaryBtnSm}>Save</button>
          <button type="button" onClick={() => setIsEditing(false)} className={secondaryBtnSm}>Cancel</button>
        </form>
      ) : (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="min-w-0"> 
            <h3 className="font-semibold text-lg text-gray-700 break-words">{family.family_name}</h3>
            <p className="text-xs text-gray-500 truncate">Owner: {family.owner?.full_name || 'Loading...'}</p>
          </div>
          
          <div className="flex w-full sm:w-auto items-center gap-2 flex-shrink-0"> 
            {isOwner && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className={`${secondaryBtnSm} flex justify-center w-full sm:w-auto`}
                  disabled={!canPerformActions}
                  title={canPerformActions ? "Rename family" : getDisabledMessage()}
                >
                  Rename
                </button>
                <button
                  onClick={handleDelete}
                  className={`${dangerBtnSm} flex justify-center w-full sm:w-auto`}
                  disabled={!canPerformActions}
                  title={canPerformActions ? "Delete family" : getDisabledMessage()}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {error && <p className="error text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default memo(FamilyListItem);