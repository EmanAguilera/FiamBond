"use client";

import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { AppContext } from '@/context/AppContext';
import { db } from '@/config/firebase-config';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { API_BASE_URL } from '@/config/apiConfig';
import UnifiedLoadingWidget from "@/components/ui/UnifiedLoadingWidget";
import { ChevronRight, Home } from 'lucide-react-native';
import UnifiedLoanWidget from './CreateUnifiedLoanWidget'; 

export default function RecordLoanFlowWidget({ onSuccess, onRequestCreateFamily }: any) {
    const context = useContext(AppContext as any) as { user: any } || {};
    const user = context.user;
    
    const [flowState, setFlowState] = useState<'loading' | 'selecting' | 'lending'>('loading');
    const [families, setFamilies] = useState<any[]>([]);
    const [selectedFamily, setSelectedFamily] = useState<any | null>(null);
    const [familyMembers, setFamilyMembers] = useState<any[]>([]);

    const fetchFamilies = async () => {
        if (!user?.uid) return;
        setFlowState('loading');
        try {
            const res = await fetch(`${API_BASE_URL}/families?user_id=${user.uid}`);
            const data = await res.json();
            const formatted = data.map((f: any) => ({ ...f, id: f._id || f.id }));
            setFamilies(formatted);
            if (formatted.length === 1) setSelectedFamily(formatted[0]);
            else setFlowState('selecting');
        } catch (err) { setFlowState('selecting'); }
    };

    useEffect(() => { fetchFamilies(); }, [user?.uid]);

    useEffect(() => {
        const fetchMembers = async () => {
            if (!selectedFamily) return;
            setFlowState('loading');
            try {
                const memberIds = selectedFamily.member_ids || [];
                if (memberIds.length === 0) { setFlowState('lending'); return; }
                const q = query(collection(db, "users"), where(documentId(), "in", memberIds.slice(0, 10)));
                const snap = await getDocs(q);
                const formatted = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(m => m.id !== user?.uid);
                setFamilyMembers(formatted);
                setFlowState('lending');
            } catch (err) { setFlowState('selecting'); }
        };
        fetchMembers();
    }, [selectedFamily]);

    if (flowState === 'loading') return <UnifiedLoadingWidget type="section" message="Preparing ledger..." />;

    if (flowState === 'lending' && selectedFamily) {
        return (
            <View className="p-6">
                <UnifiedLoanWidget 
                    mode="family" 
                    family={{ id: selectedFamily.id, name: selectedFamily.family_name }} 
                    members={familyMembers} 
                    onSuccess={onSuccess} 
                    onSwitchFamily={() => setFlowState('selecting')}
                />
            </View>
        );
    }

    return (
        <ScrollView className="p-6">
            <View className="items-center mb-8">
                <Text className="text-2xl font-black text-slate-800 tracking-tight uppercase">Select a Group</Text>
                <Text className="text-sm text-slate-500 font-medium text-center mt-1">Which ledger should this loan belong to?</Text>
            </View>
            
            {families.length > 0 ? (
                <View className="space-y-4">
                    {families.map(f => (
                        <TouchableOpacity
                            key={f.id}
                            onPress={() => setSelectedFamily(f)}
                            className="w-full p-5 bg-white border border-slate-100 rounded-3xl flex-row justify-between items-center shadow-sm mb-3"
                        >
                            <View className="flex-row items-center">
                                <View className="w-12 h-12 bg-indigo-50 rounded-2xl items-center justify-center">
                                    <Text className="text-indigo-600 font-black text-xl">{f.family_name.charAt(0).toUpperCase()}</Text>
                                </View>
                                <View className="ml-4">
                                    <Text className="font-black text-slate-800 text-base">{f.family_name}</Text>
                                    <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{f.member_ids.length} Members</Text>
                                </View>
                            </View>
                            <ChevronRight size={20} color="#cbd5e1" />
                        </TouchableOpacity>
                    ))}
                </View>
            ) : (
                <View className="items-center p-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] space-y-4">
                    <Home size={32} color="#cbd5e1" />
                    <Text className="text-slate-800 font-black">No Groups Found</Text>
                    <TouchableOpacity onPress={onRequestCreateFamily} className="w-full py-4 bg-indigo-600 rounded-2xl">
                        <Text className="text-white text-xs font-black uppercase text-center">Create Family</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
}