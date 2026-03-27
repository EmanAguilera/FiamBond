"use client";

import React, { useState, useCallback, useContext, useEffect, memo } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    TextInput, 
    ScrollView, 
    ActivityIndicator, 
    Alert,
    Modal
} from 'react-native';
import { AppContext } from '@/context/AppContext';
import { db } from '@/config/firebase-config';
import { API_BASE_URL } from '@/config/apiConfig';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    updateDoc, 
    serverTimestamp, 
    documentId,
    Firestore,
} from 'firebase/firestore';
import UnifiedLoadingWidget from '@/components/ui/UnifiedLoadingWidget';
import { 
    Plus, 
    ArrowRight, 
    Trash2, 
    Shield, 
    Loader2
} from 'lucide-react-native';

// --- TYPES & SCHEMES (1:1 with Next.js) ---
type RealmType = "family" | "company" | "admin";
type ManagerMode = "directory" | "members";

interface SchemeConfig {
    label: string;
    plural: string;
    memberLabel: string;
    memberPlural: string;
    apiPath: string;
    nameKey: string;
    accent: string;
    dataSource: "api" | "firebase";
}

const SCHEMES: Record<RealmType, SchemeConfig> = {
    family: {
        label: "Family", plural: "Families",
        memberLabel: "Member", memberPlural: "Household",
        apiPath: "families", nameKey: "family_name",
        accent: "indigo", dataSource: "api"
    },
    company: {
        label: "Company", plural: "Companies",
        memberLabel: "Employee", memberPlural: "Workforce",
        apiPath: "companies", nameKey: "company_name",
        accent: "indigo", dataSource: "api"
    },
    admin: {
        label: "System", plural: "System Users",
        memberLabel: "Administrator", memberPlural: "Admin Team",
        apiPath: "users", nameKey: "full_name",
        accent: "purple", dataSource: "firebase"
    }
};

// --- ACTION FORM ---
const ActionForm = ({ type, mode, onConfirm, onCancel }: any) => {
    const [val, setVal] = useState("");
    const [loading, setLoading] = useState(false);
    const config = SCHEMES[type as RealmType];

    const handleSubmit = async () => {
        if (!val.trim()) return;
        setLoading(true);
        try {
            await onConfirm(val);
            setVal("");
        } catch (err: any) {
            Alert.alert("Error", err.message || "Action failed.");
        } finally {
            setLoading(false);
        }
    };

    const isEmailInput = type === 'admin' || mode === 'members';

    return (
        <View className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm mt-2">
            <Text className="text-xs text-slate-500 mb-4 font-medium">
                {type === 'admin' ? "Enter email to promote to Administrator." : 
                 mode === 'members' ? `Enter email to onboard to ${config.label}.` : 
                 `Name your new ${config.label.toLowerCase()} realm.`}
            </Text>
            
            <TextInput
                value={val}
                onChangeText={setVal}
                placeholder={isEmailInput ? "user@example.com" : `e.g. My ${config.label}`}
                placeholderTextColor="#cbd5e1"
                autoFocus
                keyboardType={isEmailInput ? "email-address" : "default"}
                autoCapitalize="none"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm mb-1 text-slate-800 font-medium"
                style={{ height: 40 }}
            />

            <View className="flex-row justify-end gap-x-2 mt-3">
                <TouchableOpacity onPress={onCancel} className="px-3 py-1.5">
                    <Text className="text-xs font-bold text-slate-500">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={handleSubmit} 
                    disabled={loading || !val.trim()}
                    className={`px-4 py-1.5 rounded-lg flex-row items-center ${config.accent === 'purple' ? 'bg-purple-600' : 'bg-indigo-600'} ${(!val.trim() || loading) ? 'opacity-50' : ''}`}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text className="text-xs font-bold text-white">
                            {type === 'admin' ? 'Promote' : (mode === 'members' ? 'Invite' : 'Create')}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

// --- MAIN COMPONENT ---
const UnifiedManagerWidget = ({ 
    type = "family", 
    mode = "directory", 
    realmData = null, 
    members = [], 
    onEnterRealm, 
    onUpdate 
}: any) => {
    const { user } = useContext(AppContext) || {};
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const config = SCHEMES[type as RealmType];

    const fetchData = useCallback(async () => {
        if (!user?.uid || !db) return;
        setLoading(true);
        try {
            if (config.dataSource === "firebase") {
                // Fetch Admins directly from Firestore
                const q = query(collection(db as Firestore, "users"), where("role", "==", "admin"));
                const snap = await getDocs(q);
                setItems(snap.docs.map(d => ({ 
                    id: d.id, 
                    ...d.data(), 
                    name: (d.data() as any).full_name || (d.data() as any).email,
                    isOwner: false 
                })));
            } else if (mode === "directory") {
                // Fetch Realms from API
                const res = await fetch(`${API_BASE_URL}/${config.apiPath}?user_id=${user.uid}`);
                const raw = await res.json();
                let mapped = raw.map((item: any) => ({
                    ...item,
                    id: (item._id || item.id).toString(),
                    isOwner: item.owner_id === user.uid,
                    name: item[config.nameKey]
                }));

                // Fetch Owner Names from Firebase (Match Next.js logic)
                const ownerIds = [...new Set(mapped.map((f: any) => f.owner_id))].filter(Boolean) as string[];
                if (ownerIds.length > 0) {
                    const ownersMap: Record<string, any> = {};
                    const q = query(collection(db as Firestore, "users"), where(documentId(), "in", ownerIds.slice(0, 10)));
                    const snap = await getDocs(q);
                    snap.forEach(doc => { ownersMap[doc.id] = doc.data(); });
                    mapped = mapped.map((item: any) => ({
                        ...item,
                        ownerDetails: ownersMap[item.owner_id] || { full_name: 'Unknown User' }
                    }));
                }
                setItems(mapped);
            }
        } catch (err) { 
            console.error(err); 
        } finally { 
            setLoading(false); 
        }
    }, [user?.uid, mode, config, type]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleConfirm = async (value: string) => {
        if (!user || !db) return;
        setIsProcessing(true);
        try {
            if (type === 'admin') {
                const q = query(collection(db as Firestore, "users"), where("email", "==", value.trim().toLowerCase()));
                const snap = await getDocs(q);
                if (snap.empty) throw new Error("No user found with that email.");
                await updateDoc(doc(db as Firestore, "users", snap.docs[0].id), { 
                    role: 'admin', 
                    promoted_at: serverTimestamp() 
                });
            } else if (mode === 'members') {
                const q = query(collection(db as Firestore, "users"), where("email", "==", value.trim().toLowerCase()));
                const snap = await getDocs(q);
                if (snap.empty) throw new Error("No user found with that email.");
                
                const res = await fetch(`${API_BASE_URL}/${config.apiPath}/${realmData?.id}/members`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ newMemberId: snap.docs[0].id })
                });
                if (res.status === 409) throw new Error("User is already in this realm.");
                if (!res.ok) throw new Error("Onboarding failed.");
            } else {
                await fetch(`${API_BASE_URL}/${config.apiPath}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ [config.nameKey]: value, owner_id: user.uid, member_ids: [user.uid] })
                });
            }
            setShowForm(false);
            if (onUpdate) onUpdate();
            fetchData();
        } catch (err: any) {
            Alert.alert("Error", err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAction = async (id: string, action: string, name: string = "") => {
        if (!db) return;
        
        const performDelete = async () => {
            setIsProcessing(true);
            try {
                if (type === 'admin') {
                    await updateDoc(doc(db as Firestore, "users", id), { role: 'user' });
                } else {
                    await fetch(`${API_BASE_URL}/${config.apiPath}/${id}`, { method: 'DELETE' });
                }
                fetchData();
            } finally { setIsProcessing(false); }
        };

        Alert.alert(
            "Confirm Action",
            `Are you sure you want to remove ${name}?`,
            [{ text: "Cancel", style: "cancel" }, { text: "Remove", style: "destructive", onPress: performDelete }]
        );
    };

    const listSource = (config.dataSource === "firebase" || mode === "directory") ? items : members;
    const accentTextClass = config.accent === 'purple' ? 'text-purple-600' : 'text-indigo-600';

    return (
        <View className="space-y-4">
            <Modal transparent visible={isProcessing} animationType="fade">
                <View className="flex-1 items-center justify-center bg-white/60">
                    <UnifiedLoadingWidget type="fullscreen" message="Processing Matrix..." />
                </View>
            </Modal>

            {/* Header Section */}
            <View className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                {!showForm ? (
                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="font-bold text-slate-700 text-base">
                                {type === 'admin' ? config.memberPlural : (mode === 'directory' ? `My ${config.plural}` : config.memberPlural)}
                            </Text>
                            <Text className="text-xs text-slate-500">
                                {type === 'admin' ? "System access management." : (mode === 'directory' ? "Overview of your active realms." : "Team access control.")}
                            </Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => setShowForm(true)}
                            className={`${config.accent === 'purple' ? 'bg-purple-600' : 'bg-indigo-600'} flex-row items-center gap-x-2 px-3 py-2 rounded-lg`}
                        >
                            <Plus size={14} color="white" strokeWidth={3} />
                            <Text className="text-white font-bold text-xs">
                                {type === 'admin' ? 'Promote' : (mode === 'directory' ? `New ${config.label}` : `Add ${config.memberLabel}`)}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ActionForm type={type} mode={mode} onConfirm={handleConfirm} onCancel={() => setShowForm(false)} />
                )}
            </View>

            {/* List Section */}
            <View className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <View className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        Active {type === 'admin' ? config.memberPlural : (mode === 'directory' ? config.plural : config.memberPlural)} ({listSource.length})
                    </Text>
                </View>

                <ScrollView className="max-h-[400px]">
                    {loading ? (
                        <View className="p-10 items-center">
                            <ActivityIndicator color={config.accent === 'purple' ? '#9333ea' : '#4f46e5'} />
                            <Text className="text-[10px] font-black uppercase mt-2 text-slate-400">Syncing Matrix...</Text>
                        </View>
                    ) : listSource.length > 0 ? (
                        listSource.map((item: any) => (
                            <View key={item.id || item.uid} className="flex-row items-center justify-between p-4 border-b border-slate-50">
                                <View className="flex-row items-center gap-x-3">
                                    <View className={`w-10 h-10 rounded-full items-center justify-center border ${item.role === 'admin' ? 'bg-purple-50 border-purple-100' : 'bg-indigo-50 border-indigo-100'}`}>
                                        <Text className={`font-black text-sm ${item.role === 'admin' ? 'text-purple-600' : 'text-indigo-600'}`}>
                                            {(item.name || item.full_name || item.email || "U").substring(0, 2).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View>
                                        <View className="flex-row items-center gap-x-1">
                                            <Text className="text-sm font-bold text-slate-700">{item.name || item.full_name || item.email}</Text>
                                            {item.role === 'admin' && <Shield size={12} color="#9333ea" />}
                                        </View>
                                        <Text className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-tight">
                                            {type === 'admin' ? item.email : mode === 'directory' ? (item.isOwner ? '👑 Realm Owner' : `Shared by ${item.ownerDetails?.full_name}`) : item.email}
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row items-center gap-x-1">
                                    {mode === 'directory' ? (
                                        <>
                                            <TouchableOpacity 
                                                onPress={() => onEnterRealm?.(item)}
                                                className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 flex-row items-center"
                                            >
                                                <Text className={`${accentTextClass} text-[10px] font-black uppercase mr-1`}>Enter</Text>
                                                <ArrowRight size={14} color={config.accent === 'purple' ? '#9333ea' : '#4f46e5'} strokeWidth={2.5} />
                                            </TouchableOpacity>
                                            {item.isOwner && (
                                                <TouchableOpacity onPress={() => handleAction(item.id, 'delete', item.name)} className="p-2">
                                                    <Trash2 size={16} color="#cbd5e1" />
                                                </TouchableOpacity>
                                            )}
                                        </>
                                    ) : (
                                        type === 'admin' ? (
                                            <TouchableOpacity onPress={() => handleAction(item.id, 'delete', item.full_name)} className="p-2">
                                                <Trash2 size={16} color="#cbd5e1" />
                                            </TouchableOpacity>
                                        ) : (
                                            <View className="bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                                                <Text className="text-[9px] font-black text-emerald-600 uppercase">Authorized</Text>
                                            </View>
                                        )
                                    )}
                                </View>
                            </View>
                        ))
                    ) : (
                        <View className="p-10 items-center">
                            <Text className="text-slate-400 text-xs italic">No entries found.</Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </View>
    );
};

export default memo(UnifiedManagerWidget);