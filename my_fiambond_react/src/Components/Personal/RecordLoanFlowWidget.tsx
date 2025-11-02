import { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../Context/AppContext.jsx';
import { db } from '../../config/firebase-config.js';
import { collection, query, where, getDocs, doc, getDoc, documentId } from 'firebase/firestore';
import CreateLoanWidget from './CreateLoanWidget.js'; // Ensure path is correct

// --- TypeScript Interfaces ---
interface Family {
    id: string;
    family_name: string;
    member_ids: string[]; // We need member_ids to fetch the members
}

interface Member {
    id: string;
    full_name: string;
}

interface RecordLoanFlowWidgetProps {
    onSuccess: () => void;
    onRequestCreateFamily: () => void;
}

export default function RecordLoanFlowWidget({ onSuccess, onRequestCreateFamily }: RecordLoanFlowWidgetProps) {
    const { user } = useContext(AppContext);
    
    // State to manage the view: 'loadingFamilies', 'selecting', 'loadingMembers', or 'lending'
    const [flowState, setFlowState] = useState<'loadingFamilies' | 'selecting' | 'loadingMembers' | 'lending'>('loadingFamilies');
    const [families, setFamilies] = useState<Family[]>([]);
    const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
    const [familyMembers, setFamilyMembers] = useState<Member[]>([]); // State to hold the fetched members
    const [error, setError] = useState<string | null>(null);

    // Effect 1: Fetch the user's families
    useEffect(() => {
        const fetchFamilies = async () => {
            if (!user?.uid) return;
            setFlowState('loadingFamilies');
            setError(null);
            try {
                const q = query(collection(db, "families"), where("member_ids", "array-contains", user.uid));
                const querySnapshot = await getDocs(q);
                const fetchedFamilies = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Family));
                
                setFamilies(fetchedFamilies);

                if (fetchedFamilies.length === 0) {
                    setFlowState('selecting');
                } else if (fetchedFamilies.length === 1) {
                    // Auto-select the only family and trigger member fetching
                    setSelectedFamily(fetchedFamilies[0]);
                } else {
                    setFlowState('selecting');
                }
            } catch (err) {
                console.error("Failed to fetch families for loan flow:", err);
                setError("Could not load your families. Please try again.");
                setFlowState('selecting');
            }
        };

        fetchFamilies();
    }, [user]);

    // THE FIX IS HERE: Effect 2: Fetch members *after* a family has been selected
    useEffect(() => {
        const fetchMembers = async () => {
            if (!selectedFamily || !selectedFamily.member_ids) return;

            setFlowState('loadingMembers'); // Show a loading state for members
            setError(null);
            try {
                const memberIds = selectedFamily.member_ids;
                if (memberIds.length === 0) {
                    setFamilyMembers([]);
                    setFlowState('lending'); // Proceed even if no members
                    return;
                }

                const usersRef = collection(db, "users");
                const q = query(usersRef, where(documentId(), "in", memberIds));
                const querySnapshot = await getDocs(q);
                const members = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    full_name: doc.data().full_name
                } as Member));
                
                setFamilyMembers(members);
                setFlowState('lending'); // Move to the final step
            } catch (err) {
                console.error("Failed to fetch family members:", err);
                setError("Could not load family members. Please try again.");
                setFlowState('selecting'); // Go back to selection on error
            }
        };

        if (selectedFamily) {
            fetchMembers();
        }
    }, [selectedFamily]);


    const handleFamilySelect = (familyId: string) => {
        const family = families.find(f => f.id === familyId);
        if (family) {
            setSelectedFamily(family); // This will trigger the second useEffect
        }
    };

    // Render loading state for families
    if (flowState === 'loadingFamilies') {
        return <div className="p-4 text-center">Loading your families...</div>;
    }

    // Render loading state for members
    if (flowState === 'loadingMembers') {
        return <div className="p-4 text-center">Loading family members...</div>;
    }

    // Render the loan creation form once everything is loaded
    if (flowState === 'lending' && selectedFamily) {
        return <CreateLoanWidget 
                    family={selectedFamily} 
                    members={familyMembers} // Pass the fetched members down
                    onSuccess={onSuccess} 
                />;
    }

    // Render the family selection screen by default
    return (
        <div className="space-y-4 p-2">
            <h3 className="text-lg font-medium text-center text-gray-800">Select a Family</h3>
            <p className="text-sm text-center text-gray-500">Choose which family this loan belongs to.</p>
            
            {error && <p className="error text-center">{error}</p>}
            
            {families.length > 0 ? (
                <div className="space-y-2">
                    {families.map(family => (
                        <button
                            key={family.id}
                            onClick={() => handleFamilySelect(family.id)}
                            className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md"
                        >
                            {family.family_name}
                        </button>
                    ))}
                </div>
            ) : (
                <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-800">You must be a member of a family to record a loan.</p>
                    <button
                        onClick={onRequestCreateFamily}
                        className="primary-btn-sm mt-3"
                    >
                        + Create a Family
                    </button>
                </div>
            )}
        </div>
    );
}