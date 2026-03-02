'use client';

import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { AppContext } from '@/context/AppContext';
import { db } from '@/config/firebase-config';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { API_BASE_URL } from '@/config/apiConfig';
import UnifiedLoadingWidget from "@/components/ui/UnifiedLoadingWidget";
import { ChevronRight, Home } from 'lucide-react-native';

// Import your converted RN widget
import UnifiedLoanWidget from '@/components/loan/CreateUnifiedLoanWidget'; 

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
    // ⭐️ TypeScript Fix for AppContext
    const context = useContext(AppContext as any) as { user: any } || {};
    const user = context.user;
    
    const [flowState, setFlowState] = useState<'loadingFamilies' | 'selecting' | 'loadingMembers' | 'lending'>('loadingFamilies');
    const [families, setFamilies] = useState<Family[]>([]);
    const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
    const [familyMembers, setFamilyMembers] = useState<Member[]>([]);
    const [error, setError] = useState<string | null>(null);

    // 1. Fetch Families
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

            // If user only has one family, skip selection
            if (formattedFamilies.length === 1) {
                setSelectedFamily(formattedFamilies[0]);
            } else {
                setFlowState('selecting');
            }
        } catch (err) {
            setError("Could not load your families.");
            setFlowState('selecting');
        }
    };

    useEffect(() => { fetchFamilies(); }, [user?.uid]);

    // 2. Fetch Detailed Member Profiles
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

                const usersRef = collection(db, "users");
                // Firestore 'in' query supports up to 30 IDs, but we'll stick to a safe limit
                const safeIds = memberIds.slice(0, 10); 
                
                const q = query(usersRef, where(documentId(), "in", safeIds));
                const querySnapshot = await getDocs(q);
                
                const formattedMembers = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Member[];
                
                // Exclude the current user from the list of potential borrowers
                const otherMembers = formattedMembers.filter(m => m.id !== user?.uid);
                setFamilyMembers(otherMembers);
                setFlowState('lending');
            } catch (err) {
                Alert.alert("Error", "Could not load family members.");
                setError("Could not load family members.");
                setFlowState('selecting');
            }
        };

        if (selectedFamily) fetchMembers();
    }, [selectedFamily, user?.uid]); 

    // --- RENDER STATES ---

    if (flowState === 'loadingFamilies') return <UnifiedLoadingWidget type="section" message="Loading families..." />;
    if (flowState === 'loadingMembers') return <UnifiedLoadingWidget type="section" message="Fetching members..." />;

    // LENDING FLOW VIEW (The Final Step)
    if (flowState === 'lending' && selectedFamily) {
        return (
            <View className="p-1">
                <View className="flex-row items-center justify-between px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
                    <TouchableOpacity 
                        onPress={() => setFlowState('selecting')}
                        className="bg-indigo-100 px-3 py-2 rounded-full"
                    >
                        <Text className="text-[10px] font-black text-indigo-600 uppercase">← Switch Group</Text>
                    </TouchableOpacity>
                    <View className="items-end">
                        <Text className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Selected Family</Text>
                        <Text className="text-xs font-black text-slate-700">{selectedFamily.family_name}</Text>
                    </View>
                </View>
                <UnifiedLoanWidget 
                    mode="family" 
                    family={{ id: selectedFamily.id }} 
                    members={familyMembers} 
                    onSuccess={onSuccess} 
                />
            </View>
        );
    }

    // SELECTION VIEW (Choosing which family to lend from)
    return (
        <ScrollView className="space-y-6 py-2" showsVerticalScrollIndicator={false}>
            <View className="items-center mb-6 px-4">
                <Text className="text-2xl font-black text-slate-800 tracking-tight">Select a Group</Text>
                <Text className="text-sm text-slate-500 font-medium text-center">Which group's ledger should this loan belong to?</Text>
            </View>
            
            {error && (
                <View className="mx-4 p-4 bg-rose-50 border border-rose-100 rounded-3xl items-center mb-4">
                    <Text className="text-rose-600 text-xs font-bold">{error}</Text>
                    <TouchableOpacity onPress={fetchFamilies} className="mt-2">
                        <Text className="text-[10px] underline uppercase font-black text-rose-400">Retry</Text>
                    </TouchableOpacity>
                </View>
            )}
            
            {families.length > 0 ? (
                <View className="px-4 space-y-3">
                    {families.map(family => (
                        <TouchableOpacity
                            key={family.id}
                            onPress={() => setSelectedFamily(family)}
                            className="w-full p-5 bg-white border-2 border-slate-100 rounded-[32px] flex-row justify-between items-center shadow-sm mb-3"
                        >
                            <View className="flex-row items-center">
                                <View className="w-12 h-12 bg-indigo-50 rounded-2xl items-center justify-center">
                                    <Text className="text-indigo-600 font-black text-xl">{family.family_name.charAt(0).toUpperCase()}</Text>
                                </View>
                                <View className="ml-4">
                                    <Text className="font-black text-slate-800 text-base">{family.family_name}</Text>
                                    <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                        {family.member_ids.length} Members
                                    </Text>
                                </View>
                            </View>
                            <View className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center">
                                <ChevronRight size={18} color="#94a3b8" />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            ) : (
                <View className="mx-4 items-center p-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] space-y-4">
                    <View className="w-16 h-16 bg-white rounded-3xl shadow-sm items-center justify-center mb-2">
                        <Home size={32} color="#cbd5e1" />
                    </View>
                    <Text className="text-slate-800 font-black text-center">No Families Found</Text>
                    <Text className="text-slate-500 text-xs font-medium px-6 text-center leading-5">
                        You need to be part of a family group to record collective loans.
                    </Text>
                    <TouchableOpacity 
                        onPress={onRequestCreateFamily} 
                        className="w-full py-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 mt-4"
                    >
                        <Text className="text-white text-xs font-black uppercase tracking-widest text-center">
                            Create Your First Family
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
}