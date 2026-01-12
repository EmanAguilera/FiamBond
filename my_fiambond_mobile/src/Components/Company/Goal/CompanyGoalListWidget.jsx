import React, { useState, useMemo, lazy, Suspense, memo, useCallback, useEffect } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator, 
    Alert, 
    Linking, 
    Modal as RNModal,
    SafeAreaView
} from 'react-native';
import { db } from '../../../config/firebase-config';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';

// --- LAZY COMPONENTS ---
const CompleteCompanyGoalWidget = lazy(() => import('./CompleteCompanyGoalWidget'));

// Removed interface CompanyGoalListProps

const CompanyGoalListWidget = ({ goals, onDataChange }) => { // Removed type annotation
    const [activeTab, setActiveTab] = useState('active');
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [goalToComplete, setGoalToComplete] = useState(null); // Removed type annotation
    const [userProfiles, setUserProfiles] = useState({}); // Removed type annotation

    const API_URL = 'http://localhost:3000'; // Replace with local IP for dev

    // 1. Organize Data
    const { activeGoals, completedGoals } = useMemo(() => {
        if (!goals) return { activeGoals: [], completedGoals: [] };
        
        const parseDate = (d) => d ? new Date(d) : null; // Removed type annotation

        return {
            activeGoals: goals.filter(g => g.status === 'active').map(g => ({ ...g, target_date: parseDate(g.target_date) })),
            completedGoals: goals.filter(g => g.status === 'completed').map(g => ({ ...g, completed_at: parseDate(g.completed_at) }))
        };
    }, [goals]);

    // 2. Fetch User Profiles for Accountability
    useEffect(() => {
        const fetchUserProfiles = async () => {
            if (!goals || goals.length === 0) return;

            const userIds = new Set(); // Removed type annotation
            goals.forEach(g => {
                if (g.user_id) userIds.add(g.user_id);
                if (g.completed_by_user_id) userIds.add(g.completed_by_user_id);
            });

            if (userIds.size === 0) return;

            try {
                const idsArray = Array.from(userIds);
                const chunks = [];
                for (let i = 0; i < idsArray.length; i += 10) {
                    chunks.push(idsArray.slice(i, i + 10));
                }

                const newProfiles = {}; // Removed type annotation
                for (const chunk of chunks) {
                    const q = query(collection(db, "users"), where(documentId(), "in", chunk));
                    const snapshot = await getDocs(q);
                    snapshot.forEach(doc => {
                        newProfiles[doc.id] = doc.data();
                    });
                }
                setUserProfiles(prev => ({ ...prev, ...newProfiles }));
            } catch (error) {
                console.error("Error fetching user profiles:", error);
            }
        };

        fetchUserProfiles();
    }, [goals]);

    // 3. Handlers
    const handleAbandon = (id) => { // Removed type annotation
        Alert.alert(
            "Abandon Strategic Target",
            "Are you sure you want to abandon this goal?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Abandon", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            const res = await fetch(`${API_URL}/goals/${id}`, { method: 'DELETE' });
                            if (res.ok && onDataChange) onDataChange();
                        } catch (e) {
                            console.error("Error deleting goal", e);
                        }
                    }
                }
            ]
        );
    };

    const openCompleteModal = (goal) => { // Removed type annotation
        setGoalToComplete(goal);
        setIsCompleteModalOpen(true);
    };

    const handleSuccess = useCallback(() => {
        setIsCompleteModalOpen(false);
        setGoalToComplete(null);
        if (onDataChange) onDataChange();
    }, [onDataChange]);

    const getUserName = (id) => userProfiles[id]?.full_name || 'Loading...'; // Removed type annotation

    return (
        <View className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            {/* --- TABS --- */}
            <View className="flex-row border-b border-slate-100">
                <TouchableOpacity 
                    onPress={() => setActiveTab('active')} 
                    className={`flex-1 py-4 items-center ${activeTab === 'active' ? 'bg-indigo-50 border-b-2 border-indigo-600' : ''}`}
                >
                    <Text className={`text-xs font-black uppercase tracking-tighter ${activeTab === 'active' ? 'text-indigo-700' : 'text-slate-400'}`}>
                        Active Targets
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => setActiveTab('history')} 
                    className={`flex-1 py-4 items-center ${activeTab === 'history' ? 'bg-indigo-50 border-b-2 border-indigo-600' : ''}`}
                >
                    <Text className={`text-xs font-black uppercase tracking-tighter ${activeTab === 'history' ? 'text-indigo-700' : 'text-slate-400'}`}>
                        History
                    </Text>
                </TouchableOpacity>
            </View>

            {/* --- LIST CONTENT --- */}
            <ScrollView className="max-h-[500px] p-4" showsVerticalScrollIndicator={false}>
                {activeTab === 'active' ? (
                    <View className="gap-y-4">
                        {activeGoals.length > 0 ? activeGoals.map((goal) => { // Removed type annotation
                            const isOverdue = goal.target_date && new Date() > goal.target_date;
                            return (
                                <View key={goal.id || goal._id} className={`bg-white border rounded-3xl p-5 shadow-sm ${isOverdue ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100'}`}>
                                    <View className="flex-row justify-between items-start mb-3">
                                        <View className="flex-1 mr-2">
                                            <Text className="font-bold text-slate-800 text-lg leading-tight">{goal.name}</Text>
                                            <View className="mt-2 space-y-1">
                                                <Text className="text-[10px] text-slate-500">
                                                    Author: <Text className="font-bold text-slate-700">{getUserName(goal.user_id)}</Text>
                                                </Text>
                                                <View className="flex-row items-center">
                                                    <Text className="text-[10px] text-slate-500">
                                                        Deadline: <Text className="font-bold text-slate-700">{goal.target_date?.toLocaleDateString()}</Text>
                                                    </Text>
                                                    {isOverdue && <Text className="text-rose-600 font-black text-[9px] ml-2 uppercase tracking-widest">(Overdue)</Text>}
                                                </View>
                                            </View>
                                        </View>
                                        <Text className="font-black text-indigo-600 text-lg">
                                            ₱{parseFloat(goal.target_amount).toLocaleString()}
                                        </Text>
                                    </View>
                                    
                                    <View className="flex-row justify-end gap-x-2 pt-3 border-t border-slate-50">
                                        <TouchableOpacity onPress={() => handleAbandon(goal.id || goal._id)} className="px-4 py-2 bg-rose-50 rounded-xl">
                                            <Text className="text-[10px] font-bold text-rose-600 uppercase">Abandon</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => openCompleteModal(goal)} className="px-4 py-2 bg-indigo-600 rounded-xl shadow-sm">
                                            <Text className="text-[10px] font-bold text-white uppercase">Complete</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        }) : (
                            <View className="p-10 items-center">
                                <Text className="text-slate-400 italic text-sm">No active strategic targets.</Text>
                            </View>
                        )}
                    </View>
                ) : (
                    <View className="gap-y-3">
                        {completedGoals.length > 0 ? completedGoals.map((goal) => ( // Removed type annotation
                            <View key={goal.id || goal._id} className="bg-slate-50 border border-slate-100 rounded-3xl p-5 opacity-80">
                                <View className="flex-row justify-between items-center">
                                    <View className="flex-1 mr-2">
                                        <Text className="font-bold text-slate-400 text-base line-through leading-tight">{goal.name}</Text>
                                        <View className="mt-1">
                                            <Text className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">
                                                {goal.completed_by_user_id 
                                                    ? `Achieved by ${getUserName(goal.completed_by_user_id)}`
                                                    : `Created by ${getUserName(goal.user_id)}` 
                                                } • {goal.completed_at?.toLocaleDateString()}
                                            </Text>
                                        </View>
                                        {goal.achievement_url && (
                                            <TouchableOpacity onPress={() => Linking.openURL(goal.achievement_url)} className="mt-2 flex-row items-center">
                                                <Text className="text-[10px] font-bold text-emerald-600 underline">View Proof</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <View className="items-end">
                                        <Text className="font-bold text-emerald-600 text-base">₱{parseFloat(goal.target_amount).toLocaleString()}</Text>
                                        <View className="bg-emerald-100 px-2 py-0.5 rounded-full mt-1">
                                            <Text className="text-[8px] font-black text-emerald-700 uppercase">Achieved</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )) : (
                            <View className="p-10 items-center">
                                <Text className="text-slate-400 italic text-sm">No completed targets yet.</Text>
                            </View>
                        )}
                    </View>
                )}
                <View className="h-10" />
            </ScrollView>

            {/* --- NATIVE MODAL --- */}
            <RNModal 
                visible={isCompleteModalOpen} 
                animationType="slide" 
                transparent={false}
                onRequestClose={() => setIsCompleteModalOpen(false)}
            >
                <SafeAreaView className="flex-1 bg-white">
                    <View className="flex-row justify-between items-center p-5 border-b border-slate-100">
                        <Text className="text-xl font-bold text-slate-800">Achieve Target</Text>
                        <TouchableOpacity onPress={() => setIsCompleteModalOpen(false)} className="bg-slate-100 px-4 py-2 rounded-full">
                            <Text className="text-slate-600 font-bold text-xs">Close</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="flex-1 p-5">
                        <Suspense fallback={<ActivityIndicator size="large" color="#4f46e5" />}>
                            {goalToComplete && (
                                <CompleteCompanyGoalWidget 
                                    goal={goalToComplete} 
                                    onSuccess={handleSuccess} 
                                />
                            )}
                        </Suspense>
                    </View>
                </SafeAreaView>
            </RNModal>
        </View>
    );
};

export default memo(CompanyGoalListWidget);