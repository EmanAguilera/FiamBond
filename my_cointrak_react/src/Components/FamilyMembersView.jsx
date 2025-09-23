import { useState, useCallback, useContext, useEffect } from 'react';
import { AppContext } from '../Context/AppContext';

export default function FamilyMembersView({ family, onBack, onFamilyUpdate }) {
    const { token } = useContext(AppContext);
    
    const [detailedFamily, setDetailedFamily] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [newMemberEmail, setNewMemberEmail] = useState("");
    const [formErrors, setFormErrors] = useState({});
    const [formMessage, setFormMessage] = useState({ type: '', text: '' });
    const MAX_MEMBERS_PER_FAMILY = 10;

    const getFamilyDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/${family.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Could not load family details.");
            const data = await res.json();
            setDetailedFamily(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token, family.id]);

    useEffect(() => {
        getFamilyDetails();
    }, [getFamilyDetails]);

    async function handleAddMember(e) {
        e.preventDefault();
        setFormMessage({ type: '', text: '' });
        setFormErrors({});
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/${family.id}/members`, {
                method: "post",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ email: newMemberEmail }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 422) {
                    setFormErrors(data.errors);
                } else {
                    setFormMessage({ type: 'error', text: data.message || "Failed to add member." });
                }
                return;
            }
            setDetailedFamily(data); 
            onFamilyUpdate(data);
            setNewMemberEmail("");
            setFormMessage({ type: 'success', text: "Member added successfully!" });
        } catch (err) {
            console.error("Failed to add member:", err);
            setFormMessage({ type: 'error', text: 'A network error occurred.' });
        }
    }
    
    if (loading) return <p className="text-center py-4">Loading members...</p>;
    if (error) return <p className="error text-center py-4">{error}</p>;

    const members = detailedFamily?.members || [];

    return (
        <div className="space-y-8">
            <button onClick={onBack} className="secondary-btn-sm">&larr; Back to Families List</button>

            {members.length < MAX_MEMBERS_PER_FAMILY ? (
                <div>
                    <h2 className="font-bold text-xl mb-4 text-gray-800 break-words">
                        Add Member to "{detailedFamily.first_name}"
                    </h2>
                    <form onSubmit={handleAddMember} className="space-y-4">
                        <input type="email" placeholder="New Member's Email" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} className="w-full p-2 border rounded-md" />
                        {formErrors.email && <p className="error">{formErrors.email[0]}</p>}
                        {formMessage.text && <p className={`mt-2 text-sm ${formMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{formMessage.text}</p>}
                        <button type="submit" className="primary-btn">Add Member</button>
                    </form>
                </div>
            ) : (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 p-4 rounded-md"><p className="font-bold">Member Limit Reached</p></div>
            )}

            <div>
                <h2 className="font-bold text-xl mb-4 text-gray-800">Current Members ({members.length})</h2>
                <div className="space-y-3">
                    {members.length > 0 ? (
                        members.map((member) => (
                            <div key={member.id} className="p-4 bg-gray-50 border rounded-md">
                                <h3 className="font-semibold text-gray-700">{member.full_name}</h3>
                                <p className="text-sm text-gray-500">{member.email}</p>
                            </div>
                        ))
                    ) : (
                        <p className="italic text-gray-600">This family has no members yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};