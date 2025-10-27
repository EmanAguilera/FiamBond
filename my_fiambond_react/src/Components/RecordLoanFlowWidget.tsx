import { useState, useEffect, useContext } from 'react';
import { AppContext } from '../Context/AppContext.jsx';
import { db } from '../config/firebase-config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import CreateLoanWidget from './CreateLoanWidget'; // Import the existing widget

// --- TypeScript Interfaces ---
interface Family {
    id: string;
    family_name: string;
}

interface RecordLoanFlowWidgetProps {
    onSuccess: () => void;
    // Optional: Add a prop to trigger opening the "Create Family" modal
    onRequestCreateFamily: () => void;
}

export default function RecordLoanFlowWidget({ onSuccess, onRequestCreateFamily }: RecordLoanFlowWidgetProps) {
    const { user } = useContext(AppContext);
    
    // State to manage the view: 'loading', 'selecting', or 'lending'
    const [flowState, setFlowState] = useState<'loading' | 'selecting' | 'lending'>('loading');
    const [families, setFamilies] = useState<Family[]>([]);
    const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFamilies = async () => {
            if (!user?.uid) return;
            setError(null);
            try {
                const q = query(collection(db, "families"), where("member_ids", "array-contains", user.uid));
                const querySnapshot = await getDocs(q);
                const fetchedFamilies = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Family));
                
                setFamilies(fetchedFamilies);

                // Smart Logic: Decide what to show next
                if (fetchedFamilies.length === 0) {
                    // No families, stay in 'selecting' state to show a message
                    setFlowState('selecting');
                } else if (fetchedFamilies.length === 1) {
                    // Only one family, auto-select it and proceed to lending form
                    setSelectedFamily(fetchedFamilies[0]);
                    setFlowState('lending');
                } else {
                    // Multiple families, user must select one
                    setFlowState('selecting');
                }
            } catch (err) {
                console.error("Failed to fetch families for loan flow:", err);
                setError("Could not load your families. Please try again.");
                setFlowState('selecting'); // Show error in the selection screen
            }
        };

        fetchFamilies();
    }, [user]);

    const handleFamilySelect = (familyId: string) => {
        const family = families.find(f => f.id === familyId);
        if (family) {
            setSelectedFamily(family);
            setFlowState('lending');
        }
    };

    // Render loading state
    if (flowState === 'loading') {
        return <div className="p-4 text-center">Loading your families...</div>;
    }

    // Render the loan creation form once a family is selected
    if (flowState === 'lending' && selectedFamily) {
        return <CreateLoanWidget family={selectedFamily} onSuccess={onSuccess} />;
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