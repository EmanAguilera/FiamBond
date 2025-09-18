import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../Context/AppContext.jsx';

export default function FamilyListItem({ family, onFamilyUpdated, onFamilyDeleted }) {
    const { token, user } = useContext(AppContext);
    const [isEditing, setIsEditing] = useState(false);
    const [familyName, setFamilyName] = useState(family.first_name);
    const [error, setError] = useState(null);

    // Determines if the current user is the owner of this family.
    const isOwner = user?.id === family.owner_id;

    // A family can be renamed only if the current user is the owner AND is the only member.
    const canRename = isOwner;

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
            onFamilyUpdated(data); // Notify parent component of the change
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
            onFamilyDeleted(family.id); // Notify parent component of the change
        } catch (err) {
            alert(err.message); // Show error in a simple alert
        }
    }

    return (
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
                    {error && <p className="error text-xs">{error}</p>}
                </form>
            ) : (
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-semibold text-lg text-gray-700">{family.first_name}</h3>
                        <p className="text-xs text-gray-500">Owner: {family.owner.full_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link to={`/families/${family.id}`} className="primary-btn-sm">Manage</Link>
                        {isOwner && (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="secondary-btn-sm"
                                    disabled={!canRename}
                                    title={canRename ? "Rename family" : "Only the family owner can rename"}
                                >
                                    Rename
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="danger-btn-sm"
                                >
                                    Delete
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}