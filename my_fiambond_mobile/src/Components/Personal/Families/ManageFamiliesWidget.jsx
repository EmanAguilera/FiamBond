import React, { useState, useCallback, useContext, useEffect, memo } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator, 
    Alert 
} from 'react-native';
import { AppContext } from '../../../Context/AppContext';
import { db } from '../../../config/firebase-config';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import Svg, { Path } from 'react-native-svg';

// --- ICONS (Converted to Svg) ---
const Icons = {
    Enter: <Svg className="w-4 h-4" fill="none" stroke="#4f46e5" strokeWidth="2" viewBox="0 0 24 24"><Path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></Svg>,
    Edit: <Svg className="w-4 h-4" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"><Path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></Svg>,
    Trash: <Svg className="w-4 h-4" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"><Path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></Svg>,
    Check: <Svg className="w-4 h-4" fill="none" stroke="#10b981" strokeWidth="2" viewBox="0 0 24 24"><Path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></Svg>,
    X: <Svg className="w-4 h-4" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"><Path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></Svg>,
    Plus: <Svg className="w-4 h-4" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><Path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></Svg>
};

// --- INTERNAL COMPONENT: Create Family Form ---
const CreateFamilyForm = ({ onAdd, onCancel }) => {
    const [familyName, setFamilyName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!familyName.trim()) return;
        setLoading(true);
        await onAdd(familyName);
        setLoading(false);
    };

    return (
        <View className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm mt-2">
            <Text className="text-xs text-slate-500 mb-4">Name your new family realm.</Text>
            <View className="mb-4">
                <TextInput 
                    value={familyName} 
                    onChangeText={setFamilyName} 
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" 
                    placeholder="e.g. The Smiths" 
                />
            </View>
            <View className="flex-row justify-end gap-2">
                <TouchableOpacity onPress={onCancel} className="px-3 py-1.5">
                    <Text className="text-xs font-bold text-slate-500">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={handleSubmit} 
                    disabled={loading} 
                    className={`px-3 py-1.5 rounded-lg bg-indigo-600 ${loading ? 'opacity-50' : ''}`}
                >
                    <Text className="text-xs font-bold text-white">
                        {loading ? 'Creating...' : 'Create'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// --- INTERNAL COMPONENT: Family Row ---
const FamilyRow = ({ family, onEnter, onRename, onDelete }) => {
    const initials = (family.family_name || "F").substring(0, 2).toUpperCase();
    const isOwner = family.isOwner; 
    const ownerName = family.ownerDetails?.full_name || "Unknown";

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(family.family_name);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!editName.trim() || editName === family.family_name) {
            setIsEditing(false);
            return;
        }
        setLoading(true);
        const success = await onRename(family.id, editName);
        if (success) setIsEditing(false);
        setLoading(false);
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Family",
            `Are you sure you want to delete "${family.family_name}"?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: async () => {
                    setLoading(true);
                    await onDelete(family.id);
                    setLoading(false);
                }}
            ]
        );
    };

    return (
        <View className="flex-col p-4 border-b border-slate-100 bg-white">
            <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-3 flex-1">
                    <View className={`w-10 h-10 rounded-full items-center justify-center border ${isOwner ? 'bg-indigo-100 border-indigo-200' : 'bg-slate-100 border-slate-200'}`}>
                        <Text className={`text-sm font-bold ${isOwner ? 'text-indigo-700' : 'text-slate-600'}`}>{initials}</Text>
                    </View>
                    
                    <View className="flex-1">
                        {isEditing ? (
                            <TextInput 
                                value={editName}
                                onChangeText={setEditName}
                                className="px-2 py-1 border border-slate-300 rounded text-sm w-full"
                                autoFocus
                                disabled={loading}
                            />
                        ) : (
                            <View>
                                <Text className="text-sm font-bold text-slate-700">{family.family_name}</Text>
                                <Text className="text-[10px] text-slate-400">
                                    {isOwner ? 'Head of Household' : `Owner: ${ownerName}`}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                <View className="flex-row items-center gap-2">
                    {isEditing ? (
                        <>
                            <TouchableOpacity onPress={handleSave} disabled={loading} className="p-2">
                                {Icons.Check}
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { setIsEditing(false); setEditName(family.family_name); }} disabled={loading} className="p-2">
                                {Icons.X}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity 
                            onPress={() => onEnter(family)}
                            className="flex-row items-center bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100"
                        >
                            <Text className="text-indigo-600 text-xs font-bold mr-1">Enter</Text>
                            {Icons.Enter}
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {isOwner && !isEditing && (
                <View className="flex-row justify-end border-t border-slate-50 pt-2 gap-4">
                    <TouchableOpacity onPress={() => setIsEditing(true)} className="flex-row items-center">
                        {Icons.Edit}
                        <Text className="text-[10px] text-slate-400 ml-1">Rename</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDelete} className="flex-row items-center">
                        {Icons.Trash}
                        <Text className="text-[10px] text-slate-400 ml-1">Delete</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

// --- MAIN WIDGET ---
const ManageFamiliesWidget = ({ onEnterRealm }) => {
    const { user } = useContext(AppContext);
    const API_URL = 'http://localhost:3000'; // Use your mobile-accessible IP
    
    const [families, setFamilies] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(true);

    const checkHasTransactions = async (familyId) => {
        try {
            const res = await fetch(`${API_URL}/transactions?family_id=${familyId}`);
            if (res.ok) {
                const transactions = await res.json();
                return transactions.length > 0;
            }
            return false; 
        } catch (error) {
            return false; 
        }
    };

    const fetchFamilies = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/families?user_id=${user.uid}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const raw = await res.json();
            
            let mapped = raw.map(f => ({
                ...f,
                id: (f._id || f.id).toString(),
                isOwner: f.owner_id === user.uid
            }));

            const ownerIds = [...new Set(mapped.map(f => f.owner_id))];
            const ownersMap = {};

            if (ownerIds.length > 0) {
                const usersRef = collection(db, "users");
                const ownersQuery = query(usersRef, where(documentId(), "in", ownerIds.slice(0, 10))); 
                const ownersSnapshot = await getDocs(ownersQuery);
                ownersSnapshot.forEach(doc => { ownersMap[doc.id] = doc.data(); });
            }

            mapped = mapped.map(family => ({
                ...family,
                ownerDetails: ownersMap[family.owner_id] || { full_name: 'Unknown' }
            }));

            setFamilies(mapped);
        } catch (err) {
            Alert.alert("Error", "Could not load families.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { fetchFamilies(); }, [fetchFamilies]);

    const handleCreate = async (name) => {
        try {
            const res = await fetch(`${API_URL}/families`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    family_name: name,
                    owner_id: user.uid,
                    member_ids: [user.uid]
                })
            });

            if (!res.ok) throw new Error("Creation failed");
            Alert.alert("Success", "Family created successfully!");
            setShowCreateForm(false);
            fetchFamilies(); 
        } catch (err) {
            Alert.alert("Error", "Failed to create family.");
        }
    };

    const handleRename = async (familyId, newName) => {
        const hasTx = await checkHasTransactions(familyId);
        if (hasTx) {
            Alert.alert("Blocked", "Cannot rename family: Transactions exist.");
            return false;
        }

        try {
            const res = await fetch(`${API_URL}/families/${familyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ family_name: newName })
            });

            if (!res.ok) throw new Error("Update failed");
            fetchFamilies();
            return true;
        } catch (err) {
            Alert.alert("Error", "Failed to rename family.");
            return false;
        }
    };

    const handleDelete = async (familyId) => {
        const hasTx = await checkHasTransactions(familyId);
        if (hasTx) {
            Alert.alert("Blocked", "Cannot delete family: Transactions exist. Please archive instead.");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/families/${familyId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Deletion failed");
            Alert.alert("Success", "Family deleted.");
            fetchFamilies();
        } catch (err) {
            Alert.alert("Error", "Failed to delete family.");
        }
    };

    return (
        <View className="flex-1 space-y-4">
            {/* 1. TOP SECTION */}
            <View className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                {!showCreateForm ? (
                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="font-bold text-slate-700">My Families</Text>
                            <Text className="text-[10px] text-slate-500">Manage household realms.</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => setShowCreateForm(true)}
                            className="bg-indigo-600 px-3 py-2 rounded-lg flex-row items-center"
                        >
                            <View className="mr-1">{Icons.Plus}</View>
                            <Text className="text-white text-[10px] font-bold">Create</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        <Text className="font-bold text-indigo-700 text-sm mb-2">Create New Family</Text>
                        <CreateFamilyForm onAdd={handleCreate} onCancel={() => setShowCreateForm(false)} />
                    </View>
                )}
            </View>

            {/* 2. LIST SECTION */}
            <View className="flex-1">
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                    Available Realms ({families.length})
                </Text>
                
                <View className="border border-slate-200 rounded-xl overflow-hidden bg-white h-[400px]">
                    <View className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                        <Text className="text-slate-600 text-[10px] font-bold uppercase">Family Details</Text>
                    </View>
                    
                    <ScrollView flex={1}>
                        {loading ? (
                            <ActivityIndicator className="mt-10" color="#4f46e5" />
                        ) : families.length > 0 ? (
                            families.map(family => (
                                <FamilyRow 
                                    key={family.id} 
                                    family={family} 
                                    onEnter={onEnterRealm}
                                    onRename={handleRename}
                                    onDelete={handleDelete}
                                />
                            ))
                        ) : (
                            <View className="p-10 items-center">
                                <Text className="text-slate-400 text-sm italic text-center">
                                    You are not part of any families yet.
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </View>
    );
};

export default memo(ManageFamiliesWidget);