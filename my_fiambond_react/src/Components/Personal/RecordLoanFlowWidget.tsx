import { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../Context/AppContext.jsx';
import CreateLoanWidget from './CreateLoanWidget'; 

// --- 1. ADD FIREBASE IMPORTS ---
import { db } from '../../config/firebase-config.js';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';

// --- TypeScript Interfaces ---
interface Family {
    id: string;
    family_name: string;
    member_ids: string[];
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
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    
    const [flowState, setFlowState] = useState<'loadingFamilies' | 'selecting' | 'loadingMembers' | 'lending'>('loadingFamilies');
    const [families, setFamilies] = useState<Family[]>([]);
    const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
    const [familyMembers, setFamilyMembers] = useState<Member[]>([]);
    const [error, setError] = useState<string | null>(null);

    // 1. Fetch Families (This works fine with MongoDB)
    useEffect(() => {
        const fetchFamilies = async () => {
            if (!user?.uid) return;
            setFlowState('loadingFamilies');
            setError(null);
            try {
                const response = await fetch(`${API_URL}/families?user_id=${user.uid}`);
                if (!response.ok) throw new Error('Failed to fetch families');
                
                const fetchedFamilies = await response.json();
                
                const formattedFamilies = fetchedFamilies.map((f: any) => ({
                    ...f,
                    id: f._id || f.id,
                    member_ids: f.member_ids || [] 
                }));

                setFamilies(formattedFamilies);

                if (formattedFamilies.length === 0) {
                    setFlowState('selecting');
                } else if (formattedFamilies.length === 1) {
                    setSelectedFamily(formattedFamilies[0]);
                } else {
                    setFlowState('selecting');
                }
            } catch (err) {
                console.error("Failed to fetch families:", err);
                setError("Could not load your families.");
                setFlowState('selecting');
            }
        };
        fetchFamilies();
    }, [user, API_URL]);

    // 2. Fetch Members (THE FIX: USE FIREBASE DIRECTLY)
    useEffect(() => {
        const fetchMembers = async () => {
            if (!selectedFamily) return;

            setFlowState('loadingMembers');
            setError(null);
            try {
                const memberIds = selectedFamily.member_ids || [];

                if (memberIds.length === 0) {
                    setFamilyMembers([]);
                    setFlowState('lending');
                    return;
                }

                // --- DIRECT FIREBASE QUERY ---
                const usersRef = collection(db, "users");
                // Firebase 'in' limit is 10. Slice to prevent crash if family is huge.
                const safeIds = memberIds.slice(0, 10); 
                
                const q = query(usersRef, where(documentId(), "in", safeIds));
                const querySnapshot = await getDocs(q);
                
                const formattedMembers = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Member[];
                
                setFamilyMembers(formattedMembers);
                setFlowState('lending');
                
            } catch (err) {
                console.error("Failed to fetch members:", err);
                setError("Could not load family members.");
                setFlowState('selecting');
            }
        };

        if (selectedFamily) {
            fetchMembers();
        }
    }, [selectedFamily]); // Removed API_URL dependency


    const handleFamilySelect = (familyId: string) => {
        const family = families.find(f => f.id === familyId);
        if (family) setSelectedFamily(family);
    };

    if (flowState === 'loadingFamilies') return <div className="p-4 text-center animate-pulse">Loading your families...</div>;
    if (flowState === 'loadingMembers') return <div className="p-4 text-center animate-pulse">Loading members...</div>;

    if (flowState === 'lending' && selectedFamily) {
        return <CreateLoanWidget family={selectedFamily} members={familyMembers} onSuccess={onSuccess} />;
    }

    return (
        <div className="space-y-4 p-2">
            <h3 className="text-lg font-medium text-center text-gray-800">Select a Family</h3>
            <p className="text-sm text-center text-gray-500">Choose which family this loan belongs to.</p>
            
            {error && <p className="text-red-500 text-center text-sm">{error}</p>}
            
            {families.length > 0 ? (
                <div className="space-y-2">
                    {families.map(family => (
                        <button
                            key={family.id}
                            onClick={() => handleFamilySelect(family.id)}
                            className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md flex justify-between group"
                        >
                            <span className="font-semibold text-gray-700">{family.family_name}</span>
                            <span className="text-gray-400 group-hover:text-blue-500">&rarr;</span>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-800 text-sm">You must be a member of a family to record a loan.</p>
                    <button onClick={onRequestCreateFamily} className="text-blue-600 underline text-sm mt-2">Create a Family now</button>
                </div>
            )}
        </div>
    );
}