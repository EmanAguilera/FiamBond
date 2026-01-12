// GoalListsWidget.jsx
import React, { useContext, useEffect, useState, useCallback, lazy, Suspense } from "react";
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    ActivityIndicator, 
    Alert, 
    Modal as RNModal
} from "react-native";
import { AppContext } from "../../../Context/AppContext";
import { db } from '../../../config/firebase-config';
import {
    collection,
    query,
    where,
    getDocs,
    documentId
} from 'firebase/firestore';

// Lazy-loaded complete goal widget
const CompleteGoalWidget = lazy(() => import('./CompleteGoalWidget'));

// Skeleton loader
const GoalListsSkeleton = () => (
    <View className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-4">
        <View className="flex-row border-b border-slate-200 mb-4">
            <View className="h-10 flex-1 bg-slate-100 rounded-t-lg" />
            <View className="h-10 flex-1 bg-white" />
        </View>
        <View className="space-y-4">
            {[1, 2].map((i) => (
                <View key={i} className="p-4 bg-white border border-slate-200 rounded-2xl">
                    <View className="h-6 w-3/4 bg-slate-200 rounded mb-2" />
                    <View className="h-4 w-1/2 bg-slate-100 rounded" />
                </View>
            ))}
        </View>
    </View>
);

export default function GoalListsWidget({ family, onDataChange }) {
    const { user } = useContext(AppContext);

    const [activeGoals, setActiveGoals] = useState([]);
    const [completedGoals, setCompletedGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState(null);
    const [activeTab, setActiveTab] = useState('active');

    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [goalToComplete, setGoalToComplete] = useState(null);
    
    const API_URL = 'http://localhost:3000'; // ← Change for physical device / production

    const getGoals = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setListError(null);
        try {
            let url = `${API_URL}/goals?`;
            if (family) {
                url += `family_id=${family.id}`;
            } else {
                url += `user_id=${user.uid}`;
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch goals');
            
            const rawGoals = await response.json();

            const allGoals = rawGoals.map((g) => ({
                ...g,
                id: g._id, 
                target_date: g.target_date ? { toDate: () => new Date(g.target_date) } : null,
                created_at: g.created_at ? { toDate: () => new Date(g.created_at) } : { toDate: () => new Date() },
                completed_at: g.completed_at ? { toDate: () => new Date(g.completed_at) } : null
            }));

            const userIds = new Set();
            allGoals.forEach((goal) => {
                if (goal.user_id) userIds.add(goal.user_id);
                if (goal.completed_by_user_id) userIds.add(goal.completed_by_user_id);
            });

            const usersMap = {};
            if (userIds.size > 0) {
                const usersQuery = query(collection(db, "users"), where(documentId(), "in", [...userIds]));
                const usersSnapshot = await getDocs(usersQuery);
                usersSnapshot.forEach(doc => {
                    usersMap[doc.id] = doc.data();
                });
            }

            const enrichedGoals = allGoals.map((goal) => ({
                ...goal,
                user: usersMap[goal.user_id] || { full_name: 'Unknown' },
                completed_by: usersMap[goal.completed_by_user_id]
            }));

            setActiveGoals(enrichedGoals.filter(g => g.status === 'active'));
            setCompletedGoals(enrichedGoals.filter(g => g.status === 'completed'));
        } catch (err) {
            console.error("Failed to get goals:", err);
            setListError("Could not load your goals.");
        } finally {
            setLoading(false);
        }
    }, [user, family]);

    useEffect(() => {
        getGoals();
    }, [getGoals]);

    const handleMarkAsComplete = (goal) => {
        setGoalToComplete(goal);
        setIsCompleteModalOpen(true);
    };
    
    const handleCompletionSuccess = () => {
        setIsCompleteModalOpen(false);
        setGoalToComplete(null);
        getGoals(); 
        if (onDataChange) onDataChange();
    };

    const handleDeleteGoal = async (goalId) => {
        Alert.alert(
            "Abandon Goal",
            "Are you sure you want to abandon this goal?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Abandon", 
                    style: "destructive", 
                    onPress: async () => {
                        setListError(null);
                        try {
                            const response = await fetch(`${API_URL}/goals/${goalId}`, {
                                method: 'DELETE'
                            });
                            if (!response.ok) throw new Error('Failed to delete');
                            getGoals(); 
                            if (onDataChange) onDataChange();
                        } catch {
                            setListError("Could not delete the goal.");
                        }
                    }
                }
            ]
        );
    };

    if (loading) return <GoalListsSkeleton />;
    
    if (listError) return (
        <View className="p-10 bg-rose-50 rounded-2xl border border-rose-100 items-center">
            <Text className="text-rose-500 font-bold">{listError}</Text>
        </View>
    );

    return (
        <View className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* TABS */}
            <View className="flex-row border-b border-slate-200">
                <TouchableOpacity 
                    onPress={() => setActiveTab('active')} 
                    className={`flex-1 py-4 items-center ${activeTab === 'active' ? 'bg-indigo-50 border-b-2 border-indigo-600' : ''}`}
                >
                    <Text className={`text-sm font-bold ${activeTab === 'active' ? 'text-indigo-700' : 'text-slate-500'}`}>
                        Active Goals
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => setActiveTab('history')} 
                    className={`flex-1 py-4 items-center ${activeTab === 'history' ? 'bg-indigo-50 border-b-2 border-indigo-600' : ''}`}
                >
                    <Text className={`text-sm font-bold ${activeTab === 'history' ? 'text-indigo-700' : 'text-slate-500'}`}>
                        History
                    </Text>
                </TouchableOpacity>
            </View>

            {/* LIST CONTENT */}
            <ScrollView className="max-h-[500px] p-4" showsVerticalScrollIndicator={false}>
                {activeTab === 'active' ? (
                    <View className="gap-y-4">
                        {activeGoals.length > 0 ? activeGoals.map((goal) => {
                            const deadlineDate = goal.target_date?.toDate();
                            const isOverdue = deadlineDate && new Date() > deadlineDate;

                            return (
                                <View 
                                    key={goal.id} 
                                    className={`bg-white border rounded-2xl p-4 shadow-sm ${isOverdue ? 'border-amber-300 bg-amber-50' : 'border-slate-100'}`}
                                >
                                    <View className="flex-row justify-between items-start mb-3">
                                        <View className="flex-1">
                                            <Text className="font-bold text-slate-800 text-lg">{goal.name}</Text>
                                            <Text className="text-[10px] text-slate-500 mt-1">
                                                Creator: {goal.user.full_name}
                                            </Text>
                                            {deadlineDate && (
                                                <Text className={`text-[10px] mt-0.5 ${isOverdue ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                                                    Deadline: {deadlineDate.toLocaleDateString()} {isOverdue && '(Overdue)'}
                                                </Text>
                                            )}
                                        </View>
                                        <Text className="font-bold text-indigo-600 text-lg">
                                            ₱{parseFloat(goal.target_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </Text>
                                    </View>
                                    
                                    <View className="flex-row justify-end gap-x-2 pt-3 border-t border-slate-50">
                                        <TouchableOpacity
                                            onPress={() => handleMarkAsComplete(goal)}
                                            className="px-4 py-2 bg-emerald-600 rounded-xl"
                                        >
                                            <Text className="text-white text-xs font-bold">Complete</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => handleDeleteGoal(goal.id)}
                                            className="px-4 py-2 bg-rose-600 rounded-xl"
                                        >
                                            <Text className="text-white text-xs font-bold">Abandon</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        }) : (
                            <View className="p-10 items-center">
                                <Text className="text-slate-400 text-center">No active goals yet.</Text>
                            </View>
                        )}
                    </View>
                ) : (
                    <View className="gap-y-4">
                        {completedGoals.length > 0 ? completedGoals.map((goal) => (
                            <View 
                                key={goal.id} 
                                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
                            >
                                <Text className="font-bold text-slate-700 text-lg">{goal.name}</Text>
                                <Text className="text-[10px] text-slate-500 mt-1">
                                    Completed by: {goal.completed_by?.full_name || 'Unknown'}
                                </Text>
                                <Text className="text-xs text-emerald-600 mt-2">
                                    Completed on {goal.completed_at?.toDate().toLocaleDateString()}
                                </Text>
                            </View>
                        )) : (
                            <View className="p-10 items-center">
                                <Text className="text-slate-400 text-center">No completed goals yet.</Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Complete Goal Modal */}
            <RNModal
                visible={isCompleteModalOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setIsCompleteModalOpen(false)}
            >
                <Suspense fallback={<ActivityIndicator />}>
                    <CompleteGoalWidget
                        goal={goalToComplete}
                        onSuccess={handleCompletionSuccess}
                        onClose={() => setIsCompleteModalOpen(false)}
                    />
                </Suspense>
            </RNModal>
        </View>
    );
}