import { useState, useCallback, useEffect, memo } from 'react';
// --- 1. BRING BACK FIREBASE IMPORTS ---
import { db } from '../../../config/firebase-config.js';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    documentId 
} from 'firebase/firestore';

// --- FULL SKELETON LOADER COMPONENT ---
const FamilyMembersSkeleton = () => (
    <div className="animate-pulse space-y-8">
        <div>
            <div className="h-7 w-2/3 bg-slate-200 rounded mb-4"></div>
            <div className="h-10 w-full bg-slate-200 rounded-md mb-4"></div>
            <div className="h-10 w-32 bg-slate-200 rounded-md"></div>
        </div>
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

function FamilyMembersView({ family, onFamilyUpdate }) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    
    const [members, setMembers] = useState([]);
    const [familyDetails, setFamilyDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [newMemberEmail, setNewMemberEmail] = useState("");
    const [formMessage, setFormMessage] = useState({ type: '', text: '' });
    const MAX_MEMBERS_PER_FAMILY = 10;

    const getFamilyDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch Family Data from MongoDB
            const famResponse = await fetch(`${API_URL}/families/${family.id}`);
            
            if (famResponse.status === 404) {
                setError("This family no longer exists in the database.");
                setLoading(false);
                return;
            }

            if (!famResponse.ok) throw new Error("Could not load family details.");
            
            const rawFamily = await famResponse.json();
            const familyData = { ...rawFamily, id: rawFamily._id }; 
            setFamilyDetails(familyData);
            
            const memberIds = familyData.member_ids || [];
            
            if (memberIds.length === 0) {
                setMembers([]);
                setLoading(false);
                return;
            }

            // 2. Fetch User Profiles from FIREBASE (Using the IDs from Mongo)
            // This works because the IDs in Mongo are actually Firebase UIDs
            const usersRef = collection(db, "users");
            
            // Firebase 'in' query is limited to 10 items. 
            // If you have >10 members, you'd need to batch this. For now, we slice.
            const safeMemberIds = memberIds.slice(0, 10); 
            
            const q = query(usersRef, where(documentId(), "in", safeMemberIds));
            const usersSnapshot = await getDocs(q);
            
            const fetchedMembers = usersSnapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            }));
            
            setMembers(fetchedMembers);

        } catch (err) {
            console.error("Error fetching family details: ", err);
            setError("Failed to load family data.");
        } finally {
            setLoading(false);
        }
    }, [family.id, API_URL]);

    useEffect(() => {
        getFamilyDetails();
    }, [getFamilyDetails]);

    async function handleAddMember(e) {
        e.preventDefault();
        setFormMessage({ type: '', text: '' });

        try {
            // 1. Lookup User in FIREBASE by Email
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", newMemberEmail));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setFormMessage({ type: 'error', text: "No user found with that email address." });
                return;
            }

            const newMemberDoc = querySnapshot.docs[0];
            const newMemberId = newMemberDoc.id; // This is the Firebase UID

            // 2. Check for duplicates locally
            if (familyDetails.member_ids.includes(newMemberId)) {
                setFormMessage({ type: 'error', text: "This user is already a member." });
                return;
            }

            // 3. Update MongoDB via API
            // We send the UID we found in Firebase to the Backend
            const response = await fetch(`${API_URL}/families/${family.id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    newMemberId: newMemberId // Send ID, not email
                })
            });

            if (!response.ok) throw new Error("Failed to update family member list.");
            
            const updatedFamily = await response.json();

            setNewMemberEmail("");
            setFormMessage({ type: 'success', text: "Member added successfully!" });
            
            getFamilyDetails(); 
            
            if (onFamilyUpdate) {
                onFamilyUpdate(updatedFamily);
            }

        } catch (err) {
            console.error("Failed to add member:", err);
            setFormMessage({ type: 'error', text: "A network error occurred." });
        }
    }
    
    if (loading) {
        return <FamilyMembersSkeleton />;
    }

    if (error) {
        return <p className="error text-center py-4">{error}</p>;
    }

    return (
        <div className="space-y-8">
            {members.length < MAX_MEMBERS_PER_FAMILY ? (
                <div>
                    <h2 className="font-bold text-xl mb-4 text-gray-800 break-words">
                        Add Member to "{familyDetails?.family_name}"
                    </h2>
                    <form onSubmit={handleAddMember} className="space-y-4">
                        <input type="email" placeholder="New Member's Email" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
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
                            <div key={member.id} className="p-4 bg-gray-50 border border-gray-200 rounded-md">
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