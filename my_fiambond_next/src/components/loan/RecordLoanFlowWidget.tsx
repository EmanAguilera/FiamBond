'use client';

import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import UnifiedLoanWidget from './CreateUnifiedLoanWidget'; 
import { db } from '../../config/firebase-config';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../config/apiConfig';
import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";

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
    const context = useContext(AppContext) as any || {};
    const user = context.user;
    
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

                // Smart Redirect: Kung 1 lang ang family, auto-select agad para bawas clicks
                if (formattedFamilies.length === 1) {
                    setSelectedFamily(formattedFamilies[0]);
                } else {
                    setFlowState('selecting');
                }
            } catch (err) {
                console.error("Family fetch error:", err);
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

                const usersRef = collection(db, "users");
                // Limit to 10 per Firestore 'in' query safety
                const safeIds = memberIds.slice(0, 10); 
                
                const q = query(usersRef, where(documentId(), "in", safeIds));
                const querySnapshot = await getDocs(q);
                
                const formattedMembers = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Member[];
                
                // I-filter out ang sarili para hindi mautangan ang sarili
                const otherMembers = formattedMembers.filter(m => m.id !== user?.uid);
                
                setFamilyMembers(otherMembers);
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
    }, [selectedFamily, user?.uid]); 

    const handleFamilySelect = (familyId: string) => {
        const family = families.find(f => f.id === familyId);
        if (family) setSelectedFamily(family);
    };

    // --- RENDER STATES ---

    if (flowState === 'loadingFamilies') {
        return <UnifiedLoadingWidget type="section" message="Loading your families..." />;
    }

    if (flowState === 'loadingMembers') {
        return <UnifiedLoadingWidget type="section" message="Finding members..." />;
    }

    if (flowState === 'lending' && selectedFamily) {
        return (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between px-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <button 
                        onClick={() => setFlowState('selecting')}
                        className="text-xs font-black text-indigo-600 hover:bg-indigo-100 px-3 py-1 rounded-full transition-colors uppercase"
                    >
                        &larr; Switch Family
                    </button>
                    <div className="text-right">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected Group</span>
                        <span className="text-xs font-black text-slate-700">{selectedFamily.family_name}</span>
                    </div>
                </div>
                <UnifiedLoanWidget 
                    mode="family" 
                    family={{ id: selectedFamily.id }} 
                    members={familyMembers} 
                    onSuccess={onSuccess} 
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 py-2 animate-in fade-in duration-300">
            <div className="text-center">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Select a Family</h3>
                <p className="text-sm text-slate-500 font-medium">Which group's ledger should this loan belong to?</p>
            </div>
            
            {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-center">
                    <p className="text-rose-600 text-xs font-bold">{error}</p>
                    <button onClick={() => window.location.reload()} className="mt-2 text-[10px] underline uppercase font-black text-rose-400">Retry Connection</button>
                </div>
            )}
            
            {families.length > 0 ? (
                <div className="grid gap-3">
                    {families.map(family => (
                        <button
                            key={family.id}
                            onClick={() => handleFamilySelect(family.id)}
                            className="w-full text-left p-5 bg-white border-2 border-slate-100 rounded-3xl flex justify-between items-center group hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-100/20 transition-all active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    {family.family_name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{family.family_name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{family.member_ids.length} Members Syncing</p>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                <span className="text-slate-400 group-hover:text-indigo-600 font-black">&rarr;</span>
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="text-center p-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] space-y-4">
                    <div className="w-16 h-16 bg-white rounded-3xl shadow-sm mx-auto flex items-center justify-center text-slate-300 text-3xl">
                        🏘️
                    </div>
                    <div className="space-y-1">
                        <p className="text-slate-800 font-black">No Families Found</p>
                        <p className="text-slate-500 text-xs font-medium px-6">You need to be part of a family group to record collective loans.</p>
                    </div>
                    <button 
                        onClick={onRequestCreateFamily} 
                        className="w-full py-4 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
                    >
                        Create Your First Family
                    </button>
                </div>
            )}
        </div>
    );
}