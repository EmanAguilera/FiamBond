'use client';

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
    documentId, 
    doc, 
    updateDoc, 
    serverTimestamp, 
    Firestore 
} from 'firebase/firestore';
import UnifiedLoadingWidget from '../../components/ui/UnifiedLoadingWidget';
import { 
    Plus, 
    ChevronRight, 
    ShieldCheck, 
} from 'lucide-react-native';

// --- CONFIGURATION & TYPES ---
interface SchemeConfig {
    label: string;
    plural: string;
    memberLabel: string;
    memberPlural: string;
    apiPath: string;
    nameKey: string;
    accent: string;
    dataSource: string;
}

const SCHEMES: Record<string, SchemeConfig> = {
    family: {
        label: "Family",
        plural: "Families",
        memberLabel: "Member",
        memberPlural: "Household",
        apiPath: "families",
        nameKey: "family_name",
        accent: "#4f46e5", 
        dataSource: "api"
    },
    company: {
        label: "Company",
        plural: "Companies",
        memberLabel: "Employee",
        memberPlural: "Workforce",
        apiPath: "companies",
        nameKey: "company_name",
        accent: "#4f46e5",
        dataSource: "api"
    },
    admin: {
        label: "System",
        plural: "System Users",
        memberLabel: "Administrator",
        memberPlural: "Admin Team",
        apiPath: "users",
        nameKey: "full_name",
        accent: "#9333ea", 
        dataSource: "firebase"
    }
};

// --- ACTION FORM COMPONENT ---
const ActionForm = ({ type, mode, onConfirm, onCancel }: any) => {
    const [val, setVal] = useState("");
    const [loading, setLoading] = useState(false);
    const config = SCHEMES[type];

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

    return (
        <View className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm mt-2">
            <Text className="text-[10px] text-slate-500 mb-3 font-black uppercase tracking-widest">
                {type === 'admin' ? "Security Promotion" : mode === 'members' ? "Member Onboarding" : "New Realm Creation"}
            </Text>
            <TextInput
                value={val}
                onChangeText={setVal}
                placeholder={(type === 'admin' || mode === 'members') ? "user@example.com" : `e.g. My ${config.label}`}
                placeholderTextColor="#94a3b8"
                autoFocus
                keyboardType={(type === 'admin' || mode === 'members') ? "email-address" : "default"}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium mb-4"
            />
            <View className="flex-row justify-end gap-x-3">
                <TouchableOpacity onPress={onCancel} className="px-4 py-2">
                    <Text className="text-slate-400 font-bold text-xs uppercase">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={handleSubmit} 
                    disabled={loading}
                    style={{ backgroundColor: config.accent }}
                    className="px-6 py-2 rounded-lg shadow-sm"
                >
                    {loading ? <ActivityIndicator size="small" color="white" /> : (
                        <Text className="text-white font-black text-xs uppercase">
                            {type === 'admin' ? 'Promote' : (mode === 'members' ? 'Invite' : 'Create')}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

// --- MAIN COMPONENT ---
interface UnifiedManagerProps {
    type?: string;
    mode?: "directory" | "members";
    realmData?: any;
    members?: any[];
    onEnterRealm?: (item: any) => void;
    onUpdate?: () => void;
}

const UnifiedManagerWidget = ({ 
    type = "family", 
    mode = "directory", 
    realmData = null, 
    members = [], 
    onEnterRealm, 
    onUpdate 
}: UnifiedManagerProps) => {
    // ⭐️ Fixed context casting
    const context = useContext(AppContext as any) as any;
    const user = context?.user;
    
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const config = SCHEMES[type] || SCHEMES.family;

    const fetchData = useCallback(async () => {
        if (!user?.uid || !db) return;
        setLoading(true);
        try {
            if (config.dataSource === "firebase") {
                const q = query(collection(db as Firestore, "users"), where("role", "==", "admin"));
                const snap = await getDocs(q);
                setItems(snap.docs.map(d => ({ 
                    id: d.id, 
                    ...d.data(), 
                    [config.nameKey]: (d.data() as any).full_name || (d.data() as any).email 
                })));
            } else if (mode === "directory") {
                const res = await fetch(`${API_BASE_URL}/${config.apiPath}?user_id=${user.uid}`);
                const raw = await res.json();
                let mapped = raw.map((item: any) => ({
                    ...item,
                    id: (item._id || item.id).toString(),
                    isOwner: item.owner_id === user.uid
                }));

                const ownerIds = [...new Set(mapped.map((f: any) => f.owner_id))].filter(Boolean) as string[];
                if (ownerIds.length > 0) {
                    const ownersMap: Record<string, any> = {};
                    const q = query(collection(db as Firestore, "users"), where(documentId(), "in", ownerIds.slice(0, 10)));
                    const snap = await getDocs(q);
                    snap.forEach(doc => { ownersMap[doc.id] = doc.data(); });
                    mapped = mapped.map((item: any) => ({
                        ...item,
                        ownerDetails: ownersMap[item.owner_id!] || { full_name: 'System User' }
                    }));
                }
                setItems(mapped);
            }
        } catch (err) {
            Alert.alert("Sync Error", `Failed to load ${config.plural}.`);
        } finally {
            setLoading(false);
        }
    }, [user?.uid, mode, type, config]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleConfirm = async (value: string) => {
        setIsProcessing(true);
        try {
            if (type === 'admin') {
                const q = query(collection(db as Firestore, "users"), where("email", "==", value.trim().toLowerCase()));
                const snap = await getDocs(q);
                if (snap.empty) throw new Error("No user found.");
                await updateDoc(doc(db as Firestore, "users", snap.docs[0].id), { role: 'admin', promoted_at: serverTimestamp() });
            } else if (mode === 'members') {
                if (!realmData?.id) throw new Error("Realm context missing.");
                const q = query(collection(db as Firestore, "users"), where("email", "==", value.trim().toLowerCase()));
                const snap = await getDocs(q);
                if (snap.empty) throw new Error("User doesn't exist.");
                const res = await fetch(`${API_BASE_URL}/${config.apiPath}/${realmData.id}/members`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ newMemberId: snap.docs[0].id })
                });
                if (!res.ok) throw new Error("Failed to onboard.");
            } else {
                await fetch(`${API_BASE_URL}/${config.apiPath}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ [config.nameKey]: value, owner_id: user.uid, member_ids: [user.uid] })
                });
            }
            setShowForm(false);
            onUpdate?.();
            fetchData();
        } catch (err: any) {
            Alert.alert("Error", err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const listSource = (config.dataSource === "firebase" || mode === "directory") ? items : members;

    return (
        <View className="flex-1 gap-y-4">
            <Modal transparent visible={isProcessing} animationType="fade">
                <View className="flex-1 items-center justify-center bg-white/60">
                    <UnifiedLoadingWidget type="fullscreen" message="Synchronizing Matrix..." />
                </View>
            </Modal>

            <View className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                {!showForm ? (
                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="font-black text-slate-800 text-sm uppercase tracking-tight">
                                {type === 'admin' ? config.memberPlural : (mode === 'directory' ? `My ${config.plural}` : config.memberPlural)}
                            </Text>
                            <Text className="text-[10px] text-slate-400 font-bold uppercase">{config.label} Matrix</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => setShowForm(true)}
                            style={{ backgroundColor: config.accent }}
                            className="flex-row items-center gap-x-2 px-4 py-2 rounded-xl shadow-lg"
                        >
                            <Plus size={14} color="white" strokeWidth={3} />
                            <Text className="text-white font-black text-[10px] uppercase">Add</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ActionForm type={type} mode={mode} onConfirm={handleConfirm} onCancel={() => setShowForm(false)} />
                )}
            </View>

            <View className="flex-1 bg-white border border-slate-200 rounded-3xl overflow-hidden">
                <ScrollView stickyHeaderIndices={[0]}>
                    <View className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Authorized {type === 'admin' ? 'Admins' : 'Entities'} ({listSource.length})
                        </Text>
                    </View>

                    {loading ? (
                        <View className="p-20 items-center">
                            <ActivityIndicator color={config.accent} />
                        </View>
                    ) : listSource.length === 0 ? (
                        <View className="p-10 items-center">
                            <Text className="text-slate-300 italic text-xs">No entries detected.</Text>
                        </View>
                    ) : (
                        listSource.map((item, idx) => (
                            <View key={item.id || idx} className="flex-row items-center justify-between p-4 border-b border-slate-50">
                                <View className="flex-row items-center gap-x-3">
                                    <View style={{ backgroundColor: config.accent + '10' }} className="w-10 h-10 rounded-full items-center justify-center border border-slate-100">
                                        <Text style={{ color: config.accent }} className="font-black text-xs">
                                            {(item[config.nameKey] || "U").substring(0, 2).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View>
                                        <View className="flex-row items-center">
                                            <Text className="text-sm font-black text-slate-800">{item[config.nameKey]}</Text>
                                            {item.role === 'admin' && <ShieldCheck size={12} color={config.accent} style={{marginLeft: 4}} />}
                                        </View>
                                        <Text className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                                            {mode === 'directory' ? (item.isOwner ? '👑 Owner' : `Via ${item.ownerDetails?.full_name}`) : item.email}
                                        </Text>
                                    </View>
                                </View>

                                {mode === 'directory' ? (
                                    <TouchableOpacity 
                                        onPress={() => onEnterRealm?.(item)}
                                        className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex-row items-center"
                                    >
                                        <Text className="text-[9px] font-black text-slate-600 uppercase mr-1">Enter</Text>
                                        <ChevronRight size={12} color="#475569" />
                                    </TouchableOpacity>
                                ) : (
                                    <View className="bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                                        <Text className="text-[8px] font-black text-emerald-600 uppercase">Secure</Text>
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </ScrollView>
            </View>
        </View>
    );
};

export default memo(UnifiedManagerWidget);