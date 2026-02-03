'use client'; // Required for hooks and client-side data fetching

import { useState, useEffect, useContext } from 'react';
import { AppContext } from '@/src/Context/AppContext';
import CreateLoanWidget from './CreateLoanWidget'; 
import { db } from '@/src/config/firebase-config';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '@/src/config/apiConfig';

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
    
    const [flowState, setFlowState] = useState<'loadingFamilies' | 'selecting' | 'loadingMembers' | 'lending'>('loadingFamilies');
    const [families, setFamilies] = useState<Family[]>([]);
    const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
    const [familyMembers, setFamilyMembers] = useState<Member[]>([]);
    const [error, setError] = useState<string | null>(null);

    // 1. Fetch Families the user belongs to
    useEffect(() => {
        const fetchFamilies = async () => {
            if (!user?.uid) return;
            setFlowState('loadingFamilies');
            setError(null);
            try {
                const response = await fetch(`${API_BASE_URL}/families?user_id=${user.uid}`);
                if (!response.ok) throw new Error('Failed to fetch families');
                
                const fetchedFamilies = await response.json();
                const formattedFamilies = fetchedFamilies.map((f: any) => ({
                    ...f,
                    id: f._id || f.id,
                    member_ids: f.member_ids || [] 
                }));

                setFamilies(formattedFamilies);

                // Auto-select if only one family exists
                if (formattedFamilies.length === 1) {
                    setSelectedFamily(formattedFamilies[0]);
                } else {
                    setFlowState('selecting');
                }
            } catch (err) {
                console.error("Family fetch error:", err);
                toast.error("Could not load your families.");
                setError("Could not load your families.");
                setFlowState('selecting');
            }
        };
        fetchFamilies();
    }, [user]);

    // 2. Fetch Detailed Member Profiles once a family is selected
    useEffect(() => {
        const fetchMembers = async () => {
            if (!selectedFamily) return;

            setFlowState('loadingMembers');
            setError(null);
            
            if (!db) {
                setError("Database connection lost.");
                setFlowState('selecting');
                return;
            }

            try {
                const memberIds = selectedFamily.member_ids || [];

                if (memberIds.length === 0) {
                    setFamilyMembers([]);
                    setFlowState('lending');
                    return;
                }

                // Query Firestore for member details (names, avatars, etc.)
                const usersRef = collection(db, "users");
                // Limit to 10 to stay within Firestore 'in' query bounds
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
                console.error("Member fetch error:", err);
                toast.error("Could not load family members.");
                setError("Could not load family members.");
                setFlowState('selecting');
            }
        };

        if (selectedFamily) {
            fetchMembers();
        }
    }, [selectedFamily]); 

    const handleFamilySelect = (familyId: string) => {
        const family = families.find(f => f.id === familyId);
        if (family) setSelectedFamily(family);
    };

    if (flowState === 'loadingFamilies') {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-3">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Finding your families...</p>
            </div>
        );
    }

    if (flowState === 'loadingMembers') {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-3">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Gathering members...</p>
            </div>
        );
    }

    if (flowState === 'lending' && selectedFamily) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <button 
                        onClick={() => setFlowState('selecting')}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase"
                    >
                        &larr; Change Family
                    </button>
                    <span className="text-xs font-black text-slate-300 uppercase">{selectedFamily.family_name}</span>
                </div>
                <CreateLoanWidget family={selectedFamily} members={familyMembers} onSuccess={onSuccess} />
            </div>
        );
    }

    return (
        <div className="space-y-6 py-2">
            <div className="text-center">
                <h3 className="text-xl font-black text-slate-800">Choose a Group</h3>
                <p className="text-sm text-slate-500">Which family is this loan associated with?</p>
            </div>
            
            {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-center">
                    <p className="text-rose-600 text-xs font-bold">{error}</p>
                </div>
            )}
            
            {families.length > 0 ? (
                <div className="grid gap-3">
                    {families.map(family => (
                        <button
                            key={family.id}
                            onClick={() => handleFamilySelect(family.id)}
                            className="w-full text-left p-5 bg-white border border-slate-100 rounded-2xl flex justify-between items-center group hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-50/50 transition-all active:scale-[0.98]"
                        >
                            <div>
                                <p className="font-black text-slate-700 group-hover:text-indigo-600 transition-colors">{family.family_name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{family.member_ids.length} Members</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                <span className="text-slate-400 group-hover:text-indigo-600 font-bold">&rarr;</span>
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="text-center p-8 bg-slate-50 border border-dashed border-slate-200 rounded-3xl space-y-4">
                    <p className="text-slate-500 text-sm font-medium">You aren't in any families yet. You need a family group to lend to members.</p>
                    <button 
                        onClick={onRequestCreateFamily} 
                        className="px-6 py-2.5 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                        Create a Family
                    </button>
                </div>
            )}
        </div>
    );
}