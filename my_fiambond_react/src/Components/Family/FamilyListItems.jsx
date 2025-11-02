// Components/FamilyListItem.jsx

import { useState, useContext, memo } from 'react';
import { AppContext } from '../../Context/AppContext.jsx';
import { db } from '../../config/firebase-config.js'; // Adjust path
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

function FamilyListItem({ family, onFamilyUpdated, onFamilyDeleted }) {
  const { user } = useContext(AppContext);
  const [isEditing, setIsEditing] = useState(false);
  // Initialize with the correct field name from Firestore: family_name
  const [familyName, setFamilyName] = useState(family.family_name);
  const [error, setError] = useState(null);

  // Check if the current user is the owner of the family.
  const isOwner = user?.uid === family.owner_id;

  // SIMPLIFICATION: The check for existing transactions has been removed for this client-side refactor.
  // In a production app, a Cloud Function would manage a 'transaction_count' on the family document
  // to enable or disable these actions safely.
  const canPerformActions = isOwner;

  const getDisabledMessage = () => {
    if (!isOwner) return "Only the family owner can perform this action.";
    // This message can be re-enabled if you implement the transaction_count via Cloud Functions.
    // if (family.transaction_count > 0) return "Actions are disabled for families with existing transactions.";
    return "";
  };
  
  async function handleUpdate(e) {
    e.preventDefault();
    setError(null);
    try {
      // Create a reference to the specific family document in Firestore
      const familyDocRef = doc(db, "families", family.id);
      
      // Use updateDoc to change the family_name field
      await updateDoc(familyDocRef, {
        family_name: familyName
      });
      
      // The parent component needs the full updated object.
      // We can create it here to pass back in the callback.
      const updatedFamily = { ...family, family_name: familyName };
      onFamilyUpdated(updatedFamily);
      setIsEditing(false);

    } catch (err) {
      console.error('Failed to update family:', err);
      setError('Failed to update the family name.');
    }
  }

  async function handleDelete() {
    // Use the correct field name in the confirmation dialog
    if (!window.confirm(`Are you sure you want to delete the family "${family.family_name}"? This action cannot be undone.`)) {
      return;
    }
    setError(null);
    try {
      // Create a reference to the document and delete it
      const familyDocRef = doc(db, "families", family.id);
      await deleteDoc(familyDocRef);
      
      onFamilyDeleted(family.id);
    } catch (err) {
      console.error('Failed to delete family:', err);
      setError('Failed to delete the family.');
    }
  }

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-md space-y-3">
      {isEditing ? (
        <form onSubmit={handleUpdate} className="flex items-center gap-4">
          <input
            type="text"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
          <button type="submit" className="primary-btn-sm">Save</button>
          <button type="button" onClick={() => setIsEditing(false)} className="secondary-btn-sm">Cancel</button>
        </form>
      ) : (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="min-w-0"> 
            {/* Use the correct field name for display */}
            <h3 className="font-semibold text-lg text-gray-700 break-words">{family.family_name}</h3>
            {/* The parent widget is responsible for providing the enriched 'owner' object */}
            <p className="text-xs text-gray-500 truncate">Owner: {family.owner?.full_name || 'Loading...'}</p>
          </div>
          
          <div className="flex w-full sm:w-auto items-center gap-2 flex-shrink-0"> 
            {isOwner && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="secondary-btn-sm flex justify-center w-full sm:w-auto"
                  disabled={!canPerformActions}
                  title={canPerformActions ? "Rename family" : getDisabledMessage()}
                >
                  Rename
                </button>
                <button
                  onClick={handleDelete}
                  className="danger-btn-sm flex justify-center w-full sm:w-auto"
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