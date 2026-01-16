import React, { useState, useEffect, useContext } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ActivityIndicator, 
    ScrollView, 
    Alert 
} from 'react-native';
import { AppContext } from '../../../../Context/AppContext.jsx';
import CreateLoanWidget from './CreateLoanWidget'; 

// --- FIREBASE IMPORTS ---
import { db } from '../../../../config/firebase-config';
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
    const { user } = useContext(AppContext) as any;
    
    // Replace with your local IP or production URL for mobile
    const API_URL = 'https://super-duper-engine-57wjxxp4jxq2p64w-3000.app.github.dev';
    
    const [flowState, setFlowState] = useState<'loadingFamilies' | 'selecting' | 'loadingMembers' | 'lending'>('loadingFamilies');
    const [families, setFamilies] = useState<Family[]>([]);
    const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
    const [familyMembers, setFamilyMembers] = useState<Member[]>([]);
    const [error, setError] = useState<string | null>(null);

    // 1. Fetch Families from MongoDB API
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
    }, [user]);

    // 2. Fetch Members from Firestore
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
                // Firebase 'in' limit is 10.
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
    }, [selectedFamily]);


    const handleFamilySelect = (familyId: string) => {
        const family = families.find(f => f.id === familyId);
        if (family) setSelectedFamily(family);
    };

    // --- RENDER STATES ---

    if (flowState === 'loadingFamilies') {
        return (
            <View className="p-10 items-center justify-center">
                <ActivityIndicator color="#4f46e5" />
                <Text className="mt-4 text-slate-500 font-medium">Loading your families...</Text>
            </View>
        );
    }

    if (flowState === 'loadingMembers') {
        return (
            <View className="p-10 items-center justify-center">
                <ActivityIndicator color="#4f46e5" />
                <Text className="mt-4 text-slate-500 font-medium">Loading family members...</Text>
            </View>
        );
    }

    if (flowState === 'lending' && selectedFamily) {
        return (
            <CreateLoanWidget 
                family={selectedFamily} 
                members={familyMembers} 
                onSuccess={onSuccess} 
            />
        );
    }

    return (
        <ScrollView className="p-1 space-y-6">
            <View className="items-center">
                <Text className="text-xl font-bold text-slate-800">Select a Family</Text>
                <Text className="text-sm text-slate-500 mt-2 text-center">
                    Choose which family realm this loan belongs to.
                </Text>
            </View>
            
            {error && (
                <View className="bg-rose-50 p-3 rounded-xl">
                    <Text className="text-rose-500 text-center text-xs font-bold">{error}</Text>
                </View>
            )}
            
            {families.length > 0 ? (
                <View className="gap-y-3 mt-4">
                    {families.map(family => (
                        <TouchableOpacity
                            key={family.id}
                            onPress={() => handleFamilySelect(family.id)}
                            activeOpacity={0.7}
                            className="w-full flex-row justify-between items-center p-5 bg-white border border-slate-200 rounded-2xl shadow-sm"
                        >
                            <Text className="font-bold text-slate-700 text-base">{family.family_name}</Text>
                            <Text className="text-indigo-600 font-bold">Select →</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            ) : (
                <View className="mt-6 items-center p-6 bg-amber-50 border border-amber-100 rounded-3xl">
                    <Text className="text-amber-800 text-center text-sm font-medium leading-5">
                        You must be a member of a family realm to record a family loan.
                    </Text>
                    <TouchableOpacity onPress={onRequestCreateFamily} className="mt-4">
                        <Text className="text-indigo-600 font-bold text-sm underline">
                            Create a Family Now
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Bottom Spacing */}
            <View className="h-10" />
        </ScrollView>
    );
}