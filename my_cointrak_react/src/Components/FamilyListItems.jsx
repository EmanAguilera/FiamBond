import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../Context/AppContext.jsx';

export default function FamilyListItem({ family, onFamilyUpdated, onFamilyDeleted }) {
    const { token, user } = useContext(AppContext);
    const [isEditing, setIsEditing] = useState(false);
    const [familyName, setFamilyName] = useState(family.first_name);
    const [error, setError] = useState(null);

    // --- START OF THE FIX ---

    // 1. Check if the family has existing transactions.
    const hasTransactions = family.transactions_count > 0;

    // 2. Check if the currently logged-in user is the owner of the family.
    const isOwner = user?.id === family.owner_id;

    // 3. Combine checks: Actions are only allowed if the user is the owner AND there are no transactions.
    const canPerformActions = isOwner && !hasTransactions;

    // 4. Create a dynamic message to explain why buttons might be disabled.
    const getDisabledMessage = () => {
        if (!isOwner) {
            return "Only the family owner can perform this action.";
        }
        if (hasTransactions) {
            return "Actions are disabled for families with existing transactions.";
        }
        return ""; // No message needed if actions are enabled.
    };
    
    // --- END OF THE FIX ---

    async function handleUpdate(e) {
        e.preventDefault();
        setError(null);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/${family.id}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ first_name: familyName }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to update family.');
            onFamilyUpdated(data);
            setIsEditing(false);
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleDelete() {
        if (!window.confirm(`Are you sure you want to delete the family "${family.first_name}"? This action cannot be undone.`)) {
            return;
        }
        setError(null);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/${family.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to delete family.');
            }
            onFamilyDeleted(family.id);
        } catch (err) {
            // Use the state for errors to display it cleanly, instead of an alert.
            setError(err.message);
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
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-semibold text-lg text-gray-700">{family.first_name}</h3>
                        {/* --- FIX: Added a safety check for owner in case it's not loaded --- */}
                        <p className="text-xs text-gray-500">Owner: {family.owner?.full_name || 'Loading...'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link to={`/families/${family.id}`} className="primary-btn-sm">Manage</Link>
                        {/* Only show Rename and Delete buttons if the user is the owner */}
                        {isOwner && (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="secondary-btn-sm"
                                    // --- FIX: Button is disabled if actions are not allowed ---
                                    disabled={!canPerformActions}
                                    title={canPerformActions ? "Rename family" : getDisabledMessage()}
                                >
                                    Rename
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="danger-btn-sm"
                                    // --- FIX: Button is disabled if actions are not allowed ---
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
            {/* Display any error messages at the bottom */}
            {error && <p className="error text-xs text-red-600">{error}</p>}
        </div>
    );
}