import React, { useState, useContext, useEffect } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    ActivityIndicator, 
    TouchableOpacity, 
    Alert,
    Platform 
} from 'react-native';
import { AppContext } from '../../../../Context/AppContext.jsx';
// FIX 1: Removed .tsx extension from import path
import CreateLoanWidget from './CreateLoanWidget'; 

// --- FIREBASE IMPORTS ---
import { db } from '../../../../config/firebase-config';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';

// --- TypeScript Interfaces (Simplified) ---
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

// Interfaces for Context Fix (Error 2339)
interface User { 
    uid: string; 
    [key: string]: any; 
}
interface AppContextType { 
    user: User | null; 
    [key: string]: any; 
}
// ------------------------------------

export default function RecordLoanFlowWidget({ onSuccess, onRequestCreateFamily }: RecordLoanFlowWidgetProps) {
    // FIX 2: Assert context type with non-null assertion (!)
    const { user } = useContext(AppContext)! as AppContextType; 
    const API_URL = 'http://localhost:3000/api'; // Simplified URL
    
    const [flowState, setFlowState] = useState<'loadingFamilies' | 'selecting' | 'loadingMembers' | 'lending'>('loadingFamilies');
    const [families, setFamilies] = useState<Family[]>([]);
    const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
    const [familyMembers, setFamilyMembers] = useState<Member[]>([]);
    const [error, setError] = useState<string | null>(null);

    // 1. Fetch Families
    useEffect(() => {
        const fetchFamilies = async () => {
            // Safe check for user object access (user is now User | null)
            if (!user || !user.uid) return;
            
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
        // Dependency on user.uid is safe due to the check inside the effect
        if (user) { 
            fetchFamilies();
        }
    }, [user]);

    // 2. Fetch Members
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
                
                // This will fail if safeIds is empty, but the check above handles it.
                if (safeIds.length === 0) {
                     setFamilyMembers([]);
                     setFlowState('lending');
                     return;
                }
                
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

    // --- RENDER FLOW STATES ---
    if (flowState === 'loadingFamilies') return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading your families...</Text>
        </View>
    );
    if (flowState === 'loadingMembers') return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading members...</Text>
        </View>
    );

    if (flowState === 'lending' && selectedFamily) {
        return <CreateLoanWidget family={selectedFamily} members={familyMembers} onSuccess={onSuccess} />;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Select a Family</Text>
            <Text style={styles.infoText}>Choose which family this loan belongs to.</Text>
            
            {error && <Text style={styles.errorText}>{error}</Text>}
            
            {families.length > 0 ? (
                <View style={styles.familyList}>
                    {families.map(family => (
                        <TouchableOpacity
                            key={family.id}
                            onPress={() => handleFamilySelect(family.id)}
                            style={styles.familyButton}
                        >
                            <Text style={styles.familyName}>{family.family_name}</Text>
                            <Text style={styles.familyArrow}>→</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            ) : (
                <View style={styles.noFamilyBox}>
                    <Text style={styles.noFamilyText}>You must be a member of a family to record a loan.</Text>
                    <TouchableOpacity onPress={onRequestCreateFamily}>
                        <Text style={styles.createFamilyLink}>Create a Family now</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

// --- REACT NATIVE STYLESHEET ---
const styles = StyleSheet.create({
    container: {
        gap: 16, // space-y-4
        padding: 8, // p-2
    },
    loadingContainer: {
        padding: 16, // p-4
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    loadingText: {
        textAlign: 'center',
        color: '#4B5563', // text-slate-500
        opacity: 0.8,
    },
    title: {
        fontSize: 18, // text-lg
        fontWeight: '500', // font-medium
        textAlign: 'center',
        color: '#1F2937', // text-gray-800
    },
    infoText: {
        fontSize: 14, // text-sm
        textAlign: 'center',
        color: '#6B7280', // text-gray-500
    },
    errorText: {
        color: '#EF4444', // text-red-500
        textAlign: 'center',
        fontSize: 14,
    },
    
    // Family List Styles
    familyList: {
        gap: 8, // space-y-2
    },
    familyButton: {
        width: '100%',
        padding: 12, // p-3
        backgroundColor: '#F8FAFC', // bg-slate-50
        borderWidth: 1,
        borderColor: '#E2E8F0', // border-slate-200
        borderRadius: 6, // rounded-md
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    familyName: {
        fontWeight: '600', // font-semibold
        color: '#374151', // text-gray-700
        fontSize: 16,
    },
    familyArrow: {
        color: '#9CA3AF', // text-gray-400
        fontSize: 18,
    },
    
    // No Family Styles
    noFamilyBox: {
        textAlign: 'center',
        padding: 16, // p-4
        backgroundColor: '#FFFBEB', // bg-yellow-50
        borderWidth: 1,
        borderColor: '#FDE68A', // border-yellow-200
        borderRadius: 6, // rounded-md
        gap: 8,
    },
    noFamilyText: {
        color: '#B45309', // text-yellow-800
        fontSize: 14,
        textAlign: 'center',
    },
    createFamilyLink: {
        color: '#2563EB', // text-blue-600
        textDecorationLine: 'underline',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
});