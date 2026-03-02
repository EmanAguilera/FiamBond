"use client";

import React, { useContext, useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal as NativeModal } from "react-native";
import { AppContext } from "@/context/AppContext";
import { API_BASE_URL } from '@/config/apiConfig';
import { db } from '@/config/firebase-config';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { Calendar, User, Trash2, CheckCircle, X } from "lucide-react-native";

// 🏎️ Simplex Loader
import UnifiedLoadingWidget from "@/components/ui/UnifiedLoadingWidget";
import CompleteGoalWidget from "./UnifiedCompleteGoalWidget";

type GoalMode = 'personal' | 'family' | 'company';

interface Props {
    mode: GoalMode;
    entityId: string | number;
    onDataChange?: () => void;
    externalGoals?: any[]; 
}

export default function UnifiedGoalListWidget({ mode, entityId, onDataChange, externalGoals }: Props) {
    /** * ⭐️ THE NUCLEAR FIX:
     * Casting AppContext to any to bypass Error 2345.
     */
    const context = useContext(AppContext as any) as { user: any } || {};
    const user = context.user;

    const [internalGoals, setInternalGoals] = useState<any[]>([]);
    const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [goalToComplete, setGoalToComplete] = useState<any>(null);

    const fetchGoals = useCallback(async () => {
        if (!entityId || externalGoals) return;
        setLoading(true);
        try {
            const paramKey = mode === 'personal' ? 'user_id' : mode === 'family' ? 'family_id' : 'company_id';
            const res = await fetch(`${API_BASE_URL}/goals?${paramKey}=${entityId}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setInternalGoals(data);
        } catch (err) {
            // ⭐️ Error 2307 Fix: Swapped toast for Alert
            Alert.alert("Error", "Could not load goals");
        } finally {
            setLoading(false);
        }
    }, [mode, entityId, externalGoals]);

    useEffect(() => { fetchGoals(); }, [fetchGoals]);

    const goalsToProcess = useMemo(() => externalGoals || internalGoals, [externalGoals, internalGoals]);

    const { activeGoals, completedGoals } = useMemo(() => {
        const parseDate = (d: any) => d ? new Date(d) : null;
        const list = (goalsToProcess || []).map(g => ({
            ...g,
            id: g._id || g.id,
            processed_target_date: parseDate(g.target_date),
            processed_completed_at: parseDate(g.completed_at)
        }));
        return {
            activeGoals: list.filter(g => g.status === 'active'),
            completedGoals: list.filter(g => g.status === 'completed')
        };
    }, [goalsToProcess]);

    // Batch Profile Enrichment
    useEffect(() => {
        const enrichProfiles = async () => {
            const uids = new Set<string>();
            goalsToProcess.forEach(g => {
                if (g.user_id) uids.add(g.user_id);
                if (g.completed_by_user_id) uids.add(g.completed_by_user_id);
            });

            if (uids.size === 0) return;
            const idsArray = Array.from(uids);
            const newProfiles: any = {};
            
            try {
                for (let i = 0; i < idsArray.length; i += 10) {
                    const chunk = idsArray.slice(i, i + 10);
                    const q = query(collection(db, "users"), where(documentId(), "in", chunk));
                    const snap = await getDocs(q);
                    snap.forEach(doc => { newProfiles[doc.id] = doc.data(); });
                }
                setUserProfiles(prev => ({ ...prev, ...newProfiles }));
            } catch (e) { console.error("Profile fetch error", e); }
        };
        enrichProfiles();
    }, [goalsToProcess]);

    const handleAbandon = (id: string) => {
        Alert.alert("Abandon Target", "Are you sure? This will be removed from your ledger.", [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Abandon", 
                style: "destructive", 
                onPress: async () => {
                    try {
                        const res = await fetch(`${API_BASE_URL}/goals/${id}`, { method: 'DELETE' });
                        if (!res.ok) throw new Error();
                        Alert.alert("Success", "Goal abandoned");
                        fetchGoals();
                        onDataChange?.();
                    } catch (e) { Alert.alert("Error", "Failed to delete"); }
                } 
            }
        ]);
    };

    const getUserName = (id: string) => userProfiles[id]?.full_name || userProfiles[id]?.display_name || 'Member';

    if (loading && !goalsToProcess.length) {
        return <UnifiedLoadingWidget type="section" message="Syncing Ledger..." />;
    }

    return (
        <View className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            {/* Tabs */}
            <View className="flex-row p-1.5 bg-slate-50 border-b border-slate-100">
                {(['active', 'history'] as const).map((tab) => (
                    <TouchableOpacity 
                        key={tab}
                        onPress={() => setActiveTab(tab)} 
                        className={`flex-1 py-3 rounded-2xl items-center ${activeTab === tab ? 'bg-white shadow-sm' : ''}`}
                    >
                        <Text className={`font-black text-xs uppercase tracking-widest ${activeTab === tab ? 'text-indigo-600' : 'text-slate-400'}`}>
                            {tab === 'active' ? (mode === 'company' ? 'Active' : 'Goals') : 'History'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView className="max-h-[500px] p-4">
                {activeTab === 'active' ? (
                    <View className="space-y-4 pb-6">
                        {activeGoals.length > 0 ? activeGoals.map((goal) => {
                            const isOverdue = goal.processed_target_date && new Date() > goal.processed_target_date;
                            return (
                                <View key={goal.id} className={`bg-white border rounded-3xl p-5 mb-4 ${isOverdue ? 'border-rose-100 bg-rose-50/20' : 'border-slate-100'}`}>
                                    <View className="flex-row justify-between items-start">
                                        <View className="flex-1 mr-2">
                                            <Text className="font-black text-slate-800 text-lg leading-6">{goal.name}</Text>
                                            <View className="mt-3 space-y-1.5">
                                                <View className="flex-row items-center">
                                                    <User size={12} color="#94a3b8" />
                                                    <Text className="text-[11px] text-slate-500 ml-1 font-medium">{getUserName(goal.user_id)}</Text>
                                                </View>
                                                <View className="flex-row items-center">
                                                    <Calendar size={12} color={isOverdue ? "#f43f5e" : "#94a3b8"} />
                                                    <Text className={`text-[11px] ml-1 font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-500'}`}>
                                                        {goal.processed_target_date?.toLocaleDateString()}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                        <Text className="font-black text-indigo-600 text-xl">₱{parseFloat(goal.target_amount).toLocaleString()}</Text>
                                    </View>

                                    <View className="flex-row justify-end gap-2 mt-5 pt-4 border-t border-slate-50">
                                        <TouchableOpacity onPress={() => handleAbandon(goal.id)} className="px-4 py-2 rounded-xl bg-rose-50">
                                            <Trash2 size={16} color="#f43f5e" />
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            onPress={() => { setGoalToComplete(goal); setIsCompleteModalOpen(true); }}
                                            className="flex-row items-center px-5 py-2 bg-indigo-600 rounded-xl shadow-sm"
                                        >
                                            <CheckCircle size={14} color="white" />
                                            <Text className="text-white font-black text-xs ml-2">Complete</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        }) : <Text className="text-center py-10 text-slate-400 italic">No active items.</Text>}
                    </View>
                ) : (
                    <View className="space-y-3 pb-6">
                        {completedGoals.length > 0 ? completedGoals.map((goal) => (
                            <View key={goal.id} className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-4 flex-row justify-between items-center mb-3">
                                <View className="flex-1">
                                    <Text className="font-bold text-slate-500 text-base line-through">{goal.name}</Text>
                                    <Text className="text-[10px] text-emerald-600 font-bold mt-1">
                                        Done on {goal.processed_completed_at?.toLocaleDateString()}
                                    </Text>
                                </View>
                                <View className="items-end">
                                    <Text className="font-black text-emerald-700 text-lg">₱{parseFloat(goal.target_amount).toLocaleString()}</Text>
                                </View>
                            </View>
                        )) : <Text className="text-center py-10 text-slate-400 italic">History is empty.</Text>}
                    </View>
                )}
            </ScrollView>

            <NativeModal
                visible={isCompleteModalOpen}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsCompleteModalOpen(false)}
            >
                <View className="flex-1 bg-white p-6">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-black text-slate-800">Goal Achievement</Text>
                        <TouchableOpacity onPress={() => setIsCompleteModalOpen(false)} className="bg-slate-100 p-2 rounded-full">
                            <X size={20} color="#64748b" />
                        </TouchableOpacity>
                    </View>
                    <CompleteGoalWidget 
                        goal={goalToComplete} 
                        mode={mode} 
                        onSuccess={() => { 
                            setIsCompleteModalOpen(false); 
                            fetchGoals(); 
                            onDataChange?.(); 
                        }} 
                    />
                </View>
            </NativeModal>
        </View>
    );
}