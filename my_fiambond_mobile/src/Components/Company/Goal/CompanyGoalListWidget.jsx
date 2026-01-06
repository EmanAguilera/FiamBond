import React, { useState, useMemo, useContext, useCallback, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator, 
    Alert, 
    Linking,
    Dimensions
} from 'react-native';
import { AppContext } from '../../../Context/AppContext.jsx';
// Firebase Imports for User Profile Lookup
import { db } from '../../../config/firebase-config';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';

// --- DIRECTLY IMPORTED WIDGETS (Assumed Native versions) ---
import Modal from '../../Modal.jsx';
import CompleteCompanyGoalWidget from './CompleteCompanyGoalWidget.tsx'; // Assumed native component

// --- SKELETON LOADER (Copied from Family Ledger) ---
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


const CompanyGoalListWidget = ({ goals, onDataChange }) => {
    const [activeTab, setActiveTab] = useState('active');
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [goalToComplete, setGoalToComplete] = useState(null);
    const [userProfiles, setUserProfiles] = useState({}); // Store user data (id -> profile)
    const [loadingProfiles, setLoadingProfiles] = useState(true);

    const API_URL = 'http://localhost:3000/api'; // Simplified URL

    // 1. Organize Data
    const { activeGoals, completedGoals } = useMemo(() => {
        if (!goals) return { activeGoals: [], completedGoals: [] };
        
        const parseDate = (d) => d ? new Date(d) : null;

        return {
            activeGoals: goals.filter(g => g.status === 'active').map(g => ({ ...g, target_date: parseDate(g.target_date) })),
            completedGoals: goals.filter(g => g.status === 'completed').map(g => ({ ...g, completed_at: parseDate(g.completed_at) }))
        };
    }, [goals]);

    // 2. Fetch User Profiles (Accountability)
    useEffect(() => {
        const fetchUserProfiles = async () => {
            if (!goals || goals.length === 0) { setLoadingProfiles(false); return; }

            setLoadingProfiles(true);
            const userIds = new Set();
            goals.forEach(g => {
                if (g.user_id) userIds.add(g.user_id);
                if (g.completed_by_user_id) userIds.add(g.completed_by_user_id);
            });

            if (userIds.size === 0) { setLoadingProfiles(false); return; }

            try {
                const idsArray = Array.from(userIds);
                const chunks = [];
                for (let i = 0; i < idsArray.length; i += 10) {
                    chunks.push(idsArray.slice(i, i + 10));
                }

                const newProfiles = {};
                for (const chunk of chunks) {
                    const q = query(collection(db, "users"), where(documentId(), "in", chunk));
                    const snapshot = await getDocs(q);
                    snapshot.forEach(doc => {
                        newProfiles[doc.id] = doc.data();
                    });
                }

                setUserProfiles(prev => ({ ...prev, ...newProfiles }));
            } catch (error) {
                console.error("Error fetching user profiles for goals:", error);
                Alert.alert("Error", "Failed to load accountability data.");
            } finally {
                setLoadingProfiles(false);
            }
        };

        fetchUserProfiles();
    }, [goals]);

    // 3. Action Handlers
    const handleAbandon = (id) => {
        Alert.alert(
            "Confirm Abandonment",
            "Are you sure you want to abandon this strategic target?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Abandon", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            const res = await fetch(`${API_URL}/goals/${id}`, { method: 'DELETE' });
                            if (res.ok) {
                                if (onDataChange) {
                                    onDataChange(); 
                                }
                                Alert.alert("Success", "Target abandoned.");
                            } else {
                                throw new Error('Failed to delete');
                            }
                        } catch (e) {
                            console.error("Error deleting goal", e);
                            Alert.alert("Error", "Could not abandon target.");
                        }
                    } 
                },
            ]
        );
    };

    const openCompleteModal = (goal) => {
        setGoalToComplete(goal);
        setIsCompleteModalOpen(true);
    };

    const handleSuccess = useCallback(() => {
        setIsCompleteModalOpen(false);
        setGoalToComplete(null);
        if (onDataChange) {
            onDataChange(); 
        }
    }, [onDataChange]);

    // Helper to get name safely
    const getUserName = (id) => userProfiles[id]?.full_name || 'Loading...';

    if (loadingProfiles) return <GoalListsSkeleton />;

    return (
        <View style={styles.mainContainer}>
            {/* --- TABS --- */}
            <View style={styles.tabBar}>
                <TouchableOpacity 
                    onPress={() => setActiveTab('active')} 
                    style={[styles.tabButton, activeTab === 'active' && styles.tabButtonActive]}
                >
                    <Text style={[styles.tabText, activeTab === 'active' ? styles.tabTextActive : styles.tabTextInactive]}>
                        Active Targets
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => setActiveTab('history')} 
                    style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
                >
                    <Text style={[styles.tabText, activeTab === 'history' ? styles.tabTextActive : styles.tabTextInactive]}>
                        Target History
                    </Text>
                </TouchableOpacity>
            </View>

            {/* --- LIST CONTENT --- */}
            <ScrollView style={styles.listScrollView}>
                <View style={styles.listContent}>
                    {activeTab === 'active' && (
                        <View style={styles.listSection}>
                            {activeGoals.length > 0 ? activeGoals.map((goal) => {
                                const isOverdue = goal.target_date && new Date() > goal.target_date;
                                return (
                                    <View key={goal.id || goal._id} style={[styles.goalItemBase, isOverdue && styles.goalItemOverdue]}>
                                        <View style={styles.goalItemDetails}>
                                            <View>
                                                <Text style={styles.goalName}>{goal.name}</Text>
                                                
                                                {/* ACCOUNTABILITY SECTION */}
                                                <View style={styles.goalSubDetails}>
                                                    <Text style={styles.goalCreator}>Created by: <Text style={styles.goalCreatorName}>{getUserName(goal.user_id)}</Text></Text>
                                                    
                                                    <View style={styles.goalDeadlineWrapper}>
                                                        <Text style={styles.goalDeadlineText}>Deadline: <Text style={styles.goalDeadlineValue}>{goal.target_date?.toLocaleDateString()}</Text></Text>
                                                        {isOverdue && <Text style={styles.goalOverdueText}>(Overdue)</Text>}
                                                    </View>
                                                </View>
                                            </View>
                                            <View style={styles.goalAmountWrapper}>
                                                <Text style={styles.goalAmountText}>₱{parseFloat(goal.target_amount).toLocaleString()}</Text>
                                            </View>
                                        </View>
                                        
                                        <View style={styles.goalActions}>
                                            <TouchableOpacity onPress={() => handleAbandon(goal.id || goal._id)} style={styles.actionButtonAbandon}>
                                                <Text style={styles.actionButtonAbandonText}>Abandon</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => openCompleteModal(goal)} style={styles.actionButtonComplete}>
                                                <Text style={styles.actionButtonCompleteText}>Mark Complete</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            }) : (
                                <Text style={styles.emptyListText}>No active strategic targets.</Text>
                            )}
                        </View>
                    )}

                    {activeTab === 'history' && (
                        <View style={styles.listSection}>
                            {completedGoals.length > 0 ? completedGoals.map((goal) => (
                                <View key={goal.id || goal._id} style={styles.historyItem}>
                                    <View style={styles.historyDetails}>
                                        <View>
                                            <Text style={styles.historyName}>{goal.name}</Text>
                                            
                                            {/* HISTORY ACCOUNTABILITY */}
                                            <View style={styles.historySubtitleWrapper}>
                                                <Text style={styles.historySubtitleText}>
                                                    {goal.completed_by_user_id 
                                                        ? `Completed by ${getUserName(goal.completed_by_user_id)}`
                                                        : `Created by ${getUserName(goal.user_id)}` 
                                                    }
                                                </Text>
                                                <Text style={styles.historySubtitleSeparator}> • </Text>
                                                <Text style={styles.historySubtitleText}>{goal.completed_at?.toLocaleDateString()}</Text>
                                            </View>

                                            {goal.achievement_url && (
                                                <TouchableOpacity onPress={() => Linking.openURL(goal.achievement_url)} style={styles.historyViewProofButton}>
                                                    <Text style={styles.historyViewProofText}>
                                                        View Proof
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                        <View style={styles.historyAmountWrapper}>
                                            <Text style={styles.historyAmountText}>₱{parseFloat(goal.target_amount).toLocaleString()}</Text>
                                            <Text style={styles.historyAchievedTag}>Achieved</Text>
                                        </View>
                                    </View>
                                </View>
                            )) : (
                                <Text style={styles.emptyListText}>No completed targets yet.</Text>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* --- MODAL --- */}
            {isCompleteModalOpen && goalToComplete && (
                <Modal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} title="Achieve Target">
                    <CompleteCompanyGoalWidget goal={goalToComplete} onSuccess={handleSuccess} />
                </Modal>
            )}
        </View>
    );
};

export default CompanyGoalListWidget;

// --- REACT NATIVE STYLESHEET ---
const styles = StyleSheet.create({
    // --- General Containers ---
    mainContainer: {
        backgroundColor: 'white',
        borderRadius: 8,
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
    listContent: {
        padding: 16, // p-4
    },
    listSection: {
        gap: 16, // space-y-4 or space-y-3
    },
    emptyListText: {
        textAlign: 'center',
        color: '#9CA3AF', // text-slate-400
        fontStyle: 'italic',
        paddingVertical: 24, // py-6
        fontSize: 16,
    },

    // --- Tab Bar ---
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

    // --- Active Goal Item ---
    goalItemBase: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 16, // p-4
        backgroundColor: 'white',
        borderColor: '#E2E8F0', // border-slate-200
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2, // shadow-sm
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
        lineHeight: 20,
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
    goalCreatorName: {
        fontWeight: '500',
        color: '#334155', // text-slate-700
    },
    goalDeadlineWrapper: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
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
        alignItems: 'center',
        justifyContent: 'center',
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

    // --- History Goal Item ---
    historyItem: {
        backgroundColor: '#F8FAFC', // bg-slate-50
        borderWidth: 1,
        borderColor: '#E2E8F0', // border-slate-200
        borderRadius: 8,
        padding: 16,
        opacity: 0.75, // opacity-75
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
    historySubtitleWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2, // mt-0.5
    },
    historySubtitleText: {
        fontSize: 12,
        color: '#94A3B8', // text-slate-400
    },
    historySubtitleSeparator: {
        fontSize: 12,
        color: '#94A3B8',
        marginHorizontal: 4, // mx-1
    },
    historyViewProofButton: {
        marginTop: 8, // mt-2
    },
    historyViewProofText: {
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
    
    // --- Skeleton Styles ---
    skeletonContainer: {
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        padding: 16,
        alignItems: 'center',
    },
    skeletonTabWrapper: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16, // mb-4
        width: '100%',
    },
    skeletonTab: { height: 40, width: '50%', backgroundColor: '#F1F5F9' },
    skeletonTabInactive: { height: 40, width: '50%', backgroundColor: 'white' },
    skeletonGoalList: { gap: 16, width: '100%' },
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
    skeletonGoalDetails: { gap: 8 },
    skeletonGoalTitle: { height: 24, width: 192, backgroundColor: '#E2E8F0', borderRadius: 4 },
    skeletonGoalSubtitle: { height: 16, width: 128, backgroundColor: '#F1F5F9', borderRadius: 4 },
    skeletonGoalAmount: { height: 28, width: 112, backgroundColor: '#E2E8F0', borderRadius: 4 },
});