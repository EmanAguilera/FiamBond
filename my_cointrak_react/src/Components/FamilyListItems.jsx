import { useState, useContext, memo } from 'react'; // Import memo for performance
import { Link } from 'react-router-dom';
import { AppContext } from '../Context/AppContext.jsx';

function FamilyListItem({ family, onFamilyUpdated, onFamilyDeleted }) {
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
                <div className="flex justify-between items-center gap-4">
                    {/* --- START OF THE FIX --- */}
                    {/* 1. This wrapper is now allowed to shrink */}
                    <div className="min-w-0"> 
                        {/* 2. This text is now forced to wrap */}
                        <h3 className="font-semibold text-lg text-gray-700 break-words">{family.first_name}</h3>
                        <p className="text-xs text-gray-500 truncate">Owner: {family.owner?.full_name || 'Loading...'}</p>
                    </div>
                    
                    {/* 3. This button group is prevented from shrinking */}
                    <div className="flex items-center gap-2 flex-shrink-0"> 
                    {/* --- END OF THE FIX --- */}
                        <Link to={`/families/${family.id}`} className="primary-btn-sm">Manage</Link>
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
            {error && <p className="error text-xs text-red-600">{error}</p>}
        </div>
    );
}

// Wrap with memo for better performance on lists
export default memo(FamilyListItem);