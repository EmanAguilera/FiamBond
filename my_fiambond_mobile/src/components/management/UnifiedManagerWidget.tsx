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
    Firestore,
} from 'firebase/firestore';
import UnifiedLoadingWidget from '../../components/ui/UnifiedLoadingWidget';
import { 
    Plus, 
    ArrowRight, 
    Trash2
} from 'lucide-react-native';

// --- 1:1 REPLICATED ACTION FORM ---
const ActionForm = ({ type, onConfirm, onCancel }: any) => {
    const [val, setVal] = useState("");
    const [loading, setLoading] = useState(false);
    
    // Config based on type
    const isUserMode = type === 'admin';
    const label = type === 'family' ? 'family realm' : type === 'company' ? 'company workspace' : 'admin access';

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
        /* 1:1 HTML: p-4 bg-white rounded-lg border border-slate-100 shadow-sm mt-2 */
        <View className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm mt-2">
            {/* 1:1 HTML: text-xs text-slate-500 mb-4 font-medium */}
            <Text className="text-xs text-slate-500 mb-4 font-medium">
                {isUserMode ? "Promote user via email address." : `Name your new ${label}.`}
            </Text>
            
            <View>
                {/* 1:1 HTML: w-full px-4 py-2 border rounded-lg text-sm mb-1 text-slate-800 border-slate-300 */}
                <TextInput
                    value={val}
                    onChangeText={setVal}
                    placeholder={isUserMode ? "user@example.com" : "e.g. My Family"}
                    placeholderTextColor="#cbd5e1"
                    autoFocus
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm mb-1 text-slate-800 font-medium"
                    style={{ height: 40 }} // To match px-4 py-2 standard height
                />
            </View>

            {/* 1:1 HTML: flex justify-end gap-2 mt-3 */}
            <View className="flex-row justify-end gap-x-2 mt-3">
                {/* 1:1 HTML: px-3 py-1.5 text-xs font-bold text-slate-500 */}
                <TouchableOpacity onPress={onCancel} className="px-3 py-1.5">
                    <Text className="text-xs font-bold text-slate-500">Cancel</Text>
                </TouchableOpacity>

                {/* 1:1 HTML: px-4 py-1.5 text-xs font-bold text-white rounded-lg bg-indigo-600 */}
                <TouchableOpacity 
                    onPress={handleSubmit} 
                    disabled={loading || !val.trim()}
                    className={`px-4 py-1.5 rounded-lg flex-row items-center bg-indigo-600 ${(!val.trim() || loading) ? 'opacity-50' : ''}`}
                    style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text className="text-xs font-bold text-white">
                            {isUserMode ? 'Promote' : 'Create'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

// --- MAIN COMPONENT ---
const UnifiedManagerWidget = ({ type = "family", mode = "directory", onEnterRealm, onUpdate }: any) => {
    const context = useContext(AppContext as any);
    const user = context?.user;
    
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Fetch Logic (Shortened for brevity)
    const fetchData = useCallback(async () => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            const path = type === 'family' ? 'families' : 'companies';
            const res = await fetch(`${API_BASE_URL}/${path}?user_id=${user.uid}`);
            const raw = await res.json();
            setItems(raw.map((item: any) => ({
                ...item,
                id: (item._id || item.id).toString(),
                isOwner: item.owner_id === user.uid,
                name: item.family_name || item.company_name
            })));
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, [user?.uid, type]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleConfirm = async (value: string) => {
        setIsProcessing(true);
        try {
            const nameKey = type === 'family' ? 'family_name' : 'company_name';
            const path = type === 'family' ? 'families' : 'companies';
            await fetch(`${API_BASE_URL}/${path}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [nameKey]: value, owner_id: user.uid, member_ids: [user.uid] })
            });
            setShowForm(false);
            fetchData();
        } catch (err: any) { Alert.alert("Error", err.message); } finally { setIsProcessing(false); }
    };

    return (
        <View className="space-y-4">
            <Modal transparent visible={isProcessing} animationType="fade">
                <View className="flex-1 items-center justify-center bg-white/60">
                    <UnifiedLoadingWidget type="fullscreen" message="Syncing..." />
                </View>
            </Modal>

            {/* 1:1 HTML HEADER CONTAINER: bg-slate-50 p-4 rounded-xl border border-slate-200 */}
            <View className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                {!showForm ? (
                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="font-bold text-slate-700 text-base">My {type === 'family' ? 'Families' : 'Companies'}</Text>
                            <Text className="text-xs text-slate-500">Overview of your active realms.</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => setShowForm(true)}
                            className="bg-indigo-600 flex-row items-center gap-x-2 px-3 py-2 rounded-lg"
                        >
                            <Plus size={14} color="white" strokeWidth={3} />
                            <Text className="text-white font-bold text-xs">New {type === 'family' ? 'Family' : 'Company'}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ActionForm type={type} onConfirm={handleConfirm} onCancel={() => setShowForm(false)} />
                )}
            </View>

            {/* List Section */}
            <View className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <View className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        Active Realms ({items.length})
                    </Text>
                </View>

                <ScrollView className="max-h-[400px]">
                    {loading ? (
                        <View className="p-10"><ActivityIndicator color="#4f46e5" /></View>
                    ) : (
                        items.map((item) => (
                            <View key={item.id} className="flex-row items-center justify-between p-4 border-b border-slate-50 last:border-0">
                                <View className="flex-row items-center gap-x-3">
                                    <View className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 items-center justify-center">
                                        <Text className="text-indigo-600 font-black text-sm">
                                            {(item.name || "U").substring(0, 2).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text className="text-sm font-bold text-slate-700">{item.name}</Text>
                                        <Text className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-tight">
                                            {item.isOwner ? '👑 Realm Owner' : `Guest Access`}
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row items-center gap-x-1">
                                    <TouchableOpacity 
                                        onPress={() => onEnterRealm?.(item)}
                                        className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 flex-row items-center"
                                    >
                                        <Text className="text-indigo-600 text-[10px] font-black uppercase mr-1">Enter</Text>
                                        <ArrowRight size={14} color="#4f46e5" strokeWidth={2.5} />
                                    </TouchableOpacity>
                                    <TouchableOpacity className="p-2">
                                        <Trash2 size={16} color="#cbd5e1" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            </View>
        </View>
    );
};

export default memo(UnifiedManagerWidget);