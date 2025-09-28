import { useState, useContext, memo } from 'react';
import { AppContext } from '../Context/AppContext.jsx';

function FamilyListItem({ family, onFamilyUpdated, onFamilyDeleted, onViewMembers, onViewLedger }) {
    const { token, user } = useContext(AppContext);
    const [isEditing, setIsEditing] = useState(false);
    const [familyName, setFamilyName] = useState(family.first_name);
    const [error, setError] = useState(null);

    const hasTransactions = family.transactions_count > 0;
    const isOwner = user?.id === family.owner_id;
    const canPerformActions = isOwner && !hasTransactions;

    const getDisabledMessage = () => {
        if (!isOwner) return "Only the family owner can perform this action.";
        if (hasTransactions) return "Actions are disabled for families with existing transactions.";
        return "";
    };
    
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
            setError(err.message);
        }
    }

    return (
        // --- START: MODIFIED LOGIC ---
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
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
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div className="min-w-0"> 
                            <h3 className="font-semibold text-lg text-gray-700 break-words">{family.first_name}</h3>
                            <p className="text-xs text-gray-500 truncate">Owner: {family.owner?.full_name || 'Loading...'}</p>
                        </div>
                    </div>
                    {/* Unified button group */}
                    <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 pt-4">
                        <button onClick={() => onViewMembers(family)} className="secondary-btn-sm">Manage Members</button>
                        <button onClick={() => onViewLedger(family)} className="secondary-btn-sm">View Ledger</button>
                        <div className="flex-grow sm:flex-grow-0"></div> {/* Spacer */}
                        {isOwner && (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="secondary-btn-sm"
                                    disabled={!canPerformActions}
                                    title={canPerformActions ? "Rename family" : getDisabledMessage()}
                                >
                                    Rename
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="danger-btn-sm"
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
            {error && <p className="error text-xs text-red-600 mt-2">{error}</p>}
        </div>
        // --- END: MODIFIED LOGIC ---
    );
}

export default memo(FamilyListItem);