// Components/FamilyMembersView.jsx

import { useState, useCallback, useEffect, memo } from 'react'; // useContext is no longer needed
// AppContext import is no longer needed
import { db } from '../../config/firebase-config';
import { 
    doc, 
    getDoc, 
    collection, 
    query, 
    where, 
    getDocs, 
    updateDoc, 
    arrayUnion, 
    documentId 
} from 'firebase/firestore';

// --- FULL SKELETON LOADER COMPONENT ---
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


function FamilyMembersView({ family, onFamilyUpdate }) {
    // THE FIX IS HERE: The entire useContext line has been removed as it's not used.
    
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
            const familyDocRef = doc(db, "families", family.id);
            const familyDocSnap = await getDoc(familyDocRef);
            if (!familyDocSnap.exists()) throw new Error("Could not load family details.");
            
            const familyData = familyDocSnap.data();
            setFamilyDetails({ id: familyDocSnap.id, ...familyData });
            
            const memberIds = familyData.member_ids || [];
            if (memberIds.length === 0) {
                setMembers([]);
                setLoading(false);
                return;
            }

            const usersRef = collection(db, "users");
            const q = query(usersRef, where(documentId(), "in", memberIds));
            const usersSnapshot = await getDocs(q);
            const fetchedMembers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            setMembers(fetchedMembers);

        } catch (err) {
            console.error("Error fetching family details: ", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [family.id]);

    useEffect(() => {
        getFamilyDetails();
    }, [getFamilyDetails]);

    async function handleAddMember(e) {
        e.preventDefault();
        setFormMessage({ type: '', text: '' });

        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", newMemberEmail));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setFormMessage({ type: 'error', text: "No user found with that email address." });
                return;
            }

            const newMemberDoc = querySnapshot.docs[0];
            const newMemberId = newMemberDoc.id;

            if (familyDetails.member_ids.includes(newMemberId)) {
                setFormMessage({ type: 'error', text: "This user is already a member of the family." });
                return;
            }

            const familyDocRef = doc(db, "families", family.id);
            await updateDoc(familyDocRef, {
                member_ids: arrayUnion(newMemberId)
            });
            
            setNewMemberEmail("");
            setFormMessage({ type: 'success', text: "Member added successfully!" });
            getFamilyDetails(); 
            
            if (onFamilyUpdate) {
                onFamilyUpdate({ ...familyDetails, member_ids: [...familyDetails.member_ids, newMemberId] });
            }

        } catch (err) {
            console.error("Failed to add member:", err);
            if (err.code === 'failed-precondition') {
                 setFormMessage({ type: 'error', text: "Query requires an index on 'email' in the 'users' collection." });
            } else {
                setFormMessage({ type: 'error', text: 'A network error occurred.' });
            }
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
                        Add Member to "{familyDetails.family_name}"
                    </h2>
                    <form onSubmit={handleAddMember} className="space-y-4">
                        <input type="email" placeholder="New Member's Email" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} className="w-full p-2 border rounded-md" required />
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