import { useState, useCallback, useContext, useEffect, memo } from 'react';
import { AppContext } from '../Context/AppContext';

// --- SKELETON LOADER COMPONENT ---
const FamilyMembersSkeleton = () => (
    <div className="animate-pulse space-y-8">
        {/* Skeleton for Add Member section */}
        <div>
            <div className="h-7 w-2/3 bg-slate-200 rounded mb-4"></div>
            <div className="h-10 w-full bg-slate-200 rounded-md mb-4"></div> {/* Input */}
            <div className="h-10 w-32 bg-slate-200 rounded-md"></div> {/* Button */}
        </div>

        {/* Skeleton for Current Members section */}
        <div>
            <div className="h-7 w-1/2 bg-slate-200 rounded mb-4"></div>
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-4 bg-slate-100 border rounded-md">
                        <div className="h-5 w-2/3 bg-slate-200 rounded"></div>
                        <div className="h-4 w-1/2 bg-slate-200 rounded mt-2"></div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);


function FamilyMembersView({ family, onFamilyUpdate }) { // Removed onBack from props
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
            getFamilyDetails(); 
            onFamilyUpdate(data);
            setNewMemberEmail("");
            setFormMessage({ type: 'success', text: "Member added successfully!" });
        } catch (err) {
            console.error("Failed to add member:", err);
            setFormMessage({ type: 'error', text: 'A network error occurred.' });
        }
    }
    
    if (loading) {
        return <FamilyMembersSkeleton />;
    }

    if (error) {
        return <p className="error text-center py-4">{error}</p>;
    }

    const members = detailedFamily?.members || [];

    return (
        <div className="space-y-8">
            {/* The "Back to Families List" button has been removed from here */}

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

export default memo(FamilyMembersView);