import React, { useContext, useEffect, useState, useCallback } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator, 
    Alert,
    Dimensions,
    Linking
} from 'react-native';
import { AppContext } from "../../../Context/AppContext.jsx";
import { db } from '../../../config/firebase-config.ts';
import {
    collection,
    query,
    where,
    getDocs,
    documentId
} from 'firebase/firestore';

// --- WIDGET IMPORTS (Directly Imported) ---
import Modal from '../../Modal.jsx'; // Assumed RN Modal component
import CompleteGoalWidget from './CompleteGoalWidget.tsx';


// --- SKELETON LOADER ---
const GoalListsSkeleton = () => (
    <View style={styles.skeletonContainer}>
        <View style={styles.skeletonTabWrapper}>
            <View style={styles.skeletonTab} />
            <View style={styles.skeletonTabInactive} />
        </View>
        <View style={styles.skeletonGoalList}>
            {[...Array(3)].map((_, i) => (
                <View key={i} style={styles.skeletonGoalItem}>
                    <View style={styles.skeletonGoalDetails}>
                        <View style={styles.skeletonGoalTitle} />
                        <View style={styles.skeletonGoalSubtitle} />
                    </View>
                    <View style={styles.skeletonGoalAmount} />
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
    
    const API_URL = 'http://localhost:3000/api'; // Simplified URL

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

            // 1. Transform Data (RN Date objects/shimming)
            const allGoals = rawGoals.map(g => ({
                ...g,
                id: g._id, 
                target_date: g.target_date ? { toDate: () => new Date(g.target_date) } : null,
                created_at: g.created_at ? { toDate: () => new Date(g.created_at) } : { toDate: () => new Date() },
                completed_at: g.completed_at ? { toDate: () => new Date(g.completed_at) } : null
            }));

            // 2. Fetch User Details (Unchanged logic)
            const userIds = new Set();
            allGoals.forEach(goal => {
                if (goal.user_id) userIds.add(goal.user_id);
                if (goal.completed_by_user_id) userIds.add(goal.completed_by_user_id);
            });

            const usersMap = {};
            if (userIds.size > 0) {
                const usersQuery = query(collection(db, "users"), where(documentId(), "in", [...userIds]));
                const usersSnapshot = await getDocs(usersQuery);
                usersSnapshot.forEach(doc => usersMap[doc.id] = doc.data());
            }

            const enrichedGoals = allGoals.map(goal => ({
                ...goal,
                user: usersMap[goal.user_id] || { full_name: 'Unknown' },
                completed_by: usersMap[goal.completed_by_user_id]
            }));

            setActiveGoals(enrichedGoals.filter(g => g.status === 'active').sort((a,b) => new Date(a.target_date.toDate()).getTime() - new Date(b.target_date.toDate()).getTime()));
            setCompletedGoals(enrichedGoals.filter(g => g.status === 'completed').sort((a,b) => new Date(b.completed_at.toDate()).getTime() - new Date(a.completed_at.toDate()).getTime()));
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

    function handleMarkAsComplete(goal) {
        setGoalToComplete(goal);
        setIsCompleteModalOpen(true);
    }
    
    const handleCompletionSuccess = () => {
        setIsCompleteModalOpen(false);
        setGoalToComplete(null);
        getGoals(); 
        if (onDataChange) onDataChange();
    };

    async function handleDeleteGoal(goalId) {
        Alert.alert(
            "Confirm Abandon",
            "Are you sure you want to abandon this goal? This cannot be undone.",
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
                },
            ]
        );
    }

    if (loading) return <GoalListsSkeleton />;
    if (listError) return <Text style={styles.errorText}>{listError}</Text>;

    return (
        <View style={styles.mainContainer}>
            <View style={styles.tabBar}>
                <TouchableOpacity 
                    onPress={() => setActiveTab('active')} 
                    style={[styles.tabButton, activeTab === 'active' && styles.tabButtonActive]}
                >
                    <Text style={[styles.tabText, activeTab === 'active' ? styles.tabTextActive : styles.tabTextInactive]}>
                        Active Goals
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => setActiveTab('history')} 
                    style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
                >
                    <Text style={[styles.tabText, activeTab === 'history' ? styles.tabTextActive : styles.tabTextInactive]}>
                        Goal History
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.listScrollView}>
                {activeTab === 'active' && (
                    <View style={styles.listSection}>
                        {activeGoals.length > 0 ? activeGoals.map((goal) => {
                            const deadlineDate = goal.target_date?.toDate();
                            const isOverdue = deadlineDate && new Date() > deadlineDate;

                            return (
                                <View 
                                    key={goal.id} 
                                    style={[
                                        styles.goalItemBase, 
                                        isOverdue ? styles.goalItemOverdue : styles.goalItemActive
                                    ]}
                                >
                                    <View style={styles.goalItemDetails}>
                                        <View>
                                            <Text style={styles.goalName}>{goal.name}</Text>
                                            <View style={styles.goalSubDetails}>
                                                <Text style={styles.goalCreator}>Created by: {goal.user.full_name}</Text>
                                                <View style={styles.goalDeadlineWrapper}>
                                                    {deadlineDate && (
                                                        <Text style={styles.goalDeadlineText}>Deadline: <Text style={styles.goalDeadlineValue}>{deadlineDate.toLocaleDateString()}</Text></Text>
                                                    )}
                                                    {isOverdue && <Text style={styles.goalOverdueText}>(Overdue)</Text>}
                                                </View>
                                            </View>
                                        </View>
                                        <View style={styles.goalAmountWrapper}>
                                            <Text style={styles.goalAmountText}>
                                                ₱{parseFloat(goal.target_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.goalActions}>
                                        <TouchableOpacity 
                                            onPress={() => handleDeleteGoal(goal.id)} 
                                            style={styles.actionButtonAbandon}
                                        >
                                            <Text style={styles.actionButtonAbandonText}>Abandon</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            onPress={() => handleMarkAsComplete(goal)} 
                                            style={styles.actionButtonComplete}
                                        >
                                            <Text style={styles.actionButtonCompleteText}>Mark Complete</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        }) : (
                            <Text style={styles.emptyListText}>You have no active goals yet.</Text>
                        )}
                    </View>
                )}

                {activeTab === 'history' && (
                    <View style={styles.listSection}>
                        {completedGoals.length > 0 ? completedGoals.map((goal) => (
                            <View 
                                key={goal.id} 
                                style={styles.historyItem}
                            >
                                <View style={styles.historyDetails}>
                                    <View>
                                        <Text style={styles.historyName}>{goal.name}</Text>
                                        <Text style={styles.historySubtitle}>
                                            Completed by {goal.completed_by?.full_name || 'Unknown'} 
                                        </Text>
                                        <Text style={styles.historySubtitle}>
                                            on {goal.completed_at?.toDate().toLocaleDateString()}
                                        </Text>
                                        {goal.achievement_url && (
                                            <TouchableOpacity 
                                                onPress={() => Linking.openURL(goal.achievement_url)} 
                                                style={styles.historyAchievementButton}
                                            >
                                                <Text style={styles.historyAchievementText}>
                                                    View Achievement
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <View style={styles.historyAmountWrapper}>
                                        <Text style={styles.historyAmountText}>
                                            ₱{parseFloat(goal.target_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </Text>
                                        <Text style={styles.historyAchievedTag}>Achieved</Text>
                                    </View>
                                </View>
                            </View>
                        )) : (
                            <Text style={styles.emptyListText}>You have not completed any goals yet.</Text>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* MODAL (Not wrapped in Suspense in RN) */}
            {isCompleteModalOpen && goalToComplete && (
                <Modal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} title="Complete Your Goal">
                    <CompleteGoalWidget goal={goalToComplete} onSuccess={handleCompletionSuccess} />
                </Modal>
            )}
        </View>
    );
}

// --- REACT NATIVE STYLESHEET ---
const styles = StyleSheet.create({
    // General Containers
    mainContainer: {
        backgroundColor: 'white',
        borderRadius: 8, // rounded-lg
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2, // shadow-sm
        borderWidth: 1,
        borderColor: '#E2E8F0', // border-slate-200
        overflow: 'hidden',
        minHeight: 300,
    },
    listScrollView: {
        maxHeight: Dimensions.get('window').height * 0.6, // max-h-[60vh] simulation
    },
    listSection: {
        padding: 16, // p-4
        gap: 16, // space-y-4 or space-y-3
    },
    emptyListText: {
        textAlign: 'center',
        color: '#9CA3AF', // text-slate-400
        fontStyle: 'italic',
        paddingVertical: 24, // py-6
        fontSize: 16,
    },
    errorText: {
        textAlign: 'center',
        color: '#F43F5E', // text-rose-500
        paddingVertical: 40,
        backgroundColor: '#FFF1F2', // bg-rose-50
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FECACA', // border-rose-100
        margin: 16,
    },

    // Tab Bar
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#E2E8F0',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12, // py-3
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabButtonActive: {
        backgroundColor: '#EEF2FF', // bg-indigo-50
        borderBottomWidth: 2,
        borderColor: '#4F46E5', // border-indigo-600
    },
    tabText: {
        fontSize: 14, // text-sm
        fontWeight: 'bold',
    },
    tabTextActive: {
        color: '#4F46E5', // text-indigo-700
    },
    tabTextInactive: {
        color: '#64748B', // text-slate-500
    },

    // Active Goal Item
    goalItemBase: {
        borderRadius: 8,
        borderWidth: 1,
        padding: 16, // p-4
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2, // shadow-sm
    },
    goalItemActive: {
        backgroundColor: 'white',
        borderColor: '#E2E8F0', // border-slate-200
    },
    goalItemOverdue: {
        backgroundColor: '#FFFBEB', // bg-amber-50
        borderColor: '#FCD34D', // border-amber-300
    },
    goalItemDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12, // mb-3
    },
    goalName: {
        fontSize: 18, // text-lg
        fontWeight: 'bold',
        color: '#1F2937', // text-gray-800
    },
    goalSubDetails: {
        fontSize: 12, // text-xs
        color: '#64748B', // text-slate-500
        marginTop: 4, // mt-1
        gap: 4,
        flexDirection: 'column',
    },
    goalCreator: {
        color: '#64748B',
    },
    goalDeadlineWrapper: {
        flexDirection: 'row',
        gap: 8,
    },
    goalDeadlineText: {
        color: '#64748B',
    },
    goalDeadlineValue: {
        fontWeight: 'bold',
    },
    goalOverdueText: {
        color: '#D97706', // text-amber-600
        fontWeight: 'bold',
    },
    goalAmountWrapper: {
        alignItems: 'flex-end',
    },
    goalAmountText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4F46E5', // text-indigo-600
    },
    
    // Active Goal Actions
    goalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8, // gap-2
        paddingTop: 8, // pt-2
        borderTopWidth: 1,
        borderColor: '#F1F5F9', // border-slate-100
    },
    actionButtonBase: {
        paddingHorizontal: 12, // px-3
        paddingVertical: 6, // py-1.5
        borderRadius: 4,
        fontSize: 12, // text-xs
        fontWeight: 'bold',
    },
    actionButtonAbandon: {
        ...this.actionButtonBase,
        backgroundColor: '#FFF1F2', // bg-rose-50
    },
    actionButtonAbandonText: {
        color: '#DC2626', // text-rose-600
        fontSize: 12,
        fontWeight: 'bold',
    },
    actionButtonComplete: {
        ...this.actionButtonBase,
        backgroundColor: '#4F46E5', // bg-indigo-600
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1, // shadow-sm
    },
    actionButtonCompleteText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },

    // History Goal Item
    historyItem: {
        backgroundColor: '#F8FAFC', // bg-slate-50
        borderWidth: 1,
        borderColor: '#E2E8F0', // border-slate-200
        borderRadius: 8,
        padding: 16,
        opacity: 0.75, // opacity-75
        // hover:opacity-100 transition-opacity is handled via activeOpacity/onPressIn/onPressOut if desired
    },
    historyDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    historyName: {
        fontWeight: '600', // font-semibold
        color: '#475569', // text-slate-600
        textDecorationLine: 'line-through',
        fontSize: 18,
    },
    historySubtitle: {
        fontSize: 12,
        color: '#94A3B8', // text-slate-400
        marginTop: 2, // mt-0.5
    },
    historyAchievementButton: {
        marginTop: 8, // mt-2
    },
    historyAchievementText: {
        fontSize: 12, // text-xs
        fontWeight: 'bold',
        color: '#059669', // text-emerald-600
        textDecorationLine: 'underline',
    },
    historyAmountWrapper: {
        alignItems: 'flex-end',
    },
    historyAmountText: {
        fontWeight: 'bold',
        color: '#059669', // text-emerald-600
    },
    historyAchievedTag: {
        fontSize: 10, // text-[10px]
        textTransform: 'uppercase',
        fontWeight: 'bold',
        color: '#047857', // text-emerald-600
        backgroundColor: '#D1FAE5', // bg-emerald-100
        paddingHorizontal: 6, // px-1.5
        borderRadius: 3,
        marginTop: 4,
    },

    // Skeleton Styles
    skeletonContainer: {
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        padding: 16,
    },
    skeletonTabWrapper: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16, // mb-4
    },
    skeletonTab: {
        height: 40,
        width: '50%',
        backgroundColor: '#F1F5F9', // bg-slate-100
    },
    skeletonTabInactive: {
        height: 40,
        width: '50%',
        backgroundColor: 'white',
    },
    skeletonGoalList: {
        gap: 16, // space-y-4
    },
    skeletonGoalItem: {
        padding: 16,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    skeletonGoalDetails: {
        gap: 8, // space-y-2
    },
    skeletonGoalTitle: {
        height: 24, // h-6
        width: 192, // w-48
        backgroundColor: '#E2E8F0', // bg-slate-200
        borderRadius: 4,
    },
    skeletonGoalSubtitle: {
        height: 16, // h-4
        width: 128, // w-32
        backgroundColor: '#F1F5F9', // bg-slate-100
        borderRadius: 4,
    },
    skeletonGoalAmount: {
        height: 28, // h-7
        width: 112, // w-28
        backgroundColor: '#E2E8F0', // bg-slate-200
        borderRadius: 4,
    },
});