"use client";

import React, { useState, useContext, useCallback, useEffect } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    SafeAreaView, 
    RefreshControl 
} from 'react-native';
import { AppContext } from '../../context/AppContext';
import { db } from '../../config/firebase-config';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';

// System & UI
import { Icons, Btn, DashboardCard } from "../../components/realm/RealmSharedUI";
import { useRealmData } from "../../hooks/useRealmData";
import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";
import Modal from "../../components/ui/Modal";

// Widgets
import LoanTrackingWidget from '../../components/loan/LoanTrackingWidget';
import CreateUnifiedLoanWidget from '../../components/loan/CreateUnifiedLoanWidget';
import CreateUnifiedTransactionWidget from '../../components/finance/CreateUnifiedTransactionWidget';
import UnifiedTransactionsListWidget from '../../components/finance/UnifiedTransactionsListWidget';
import CreateUnifiedGoalWidget from "../../components/goal/CreateUnifiedGoalWidget";
import UnifiedGoalListWidget from "../../components/goal/UnifiedGoalListWidget";
import UnifiedManagerWidget from '../../components/management/UnifiedManagerWidget';
import UnifiedReportChartWidget from "../../components/analytics/UnifiedReportChartWidget";

export default function FamilyRealmScreen({ family, onBack, onDataChange, onFamilyUpdate }) {
    // Graceful context handling for JSX
    const context = useContext(AppContext) || {};
    const { user } = context;

    // Modal States
    const [modals, setModals] = useState({
        loan: false, transaction: false, goal: false,
        listGoals: false, listTransactions: false, listLoans: false, members: false
    });
    
    const toggle = (key, val) => setModals(prev => ({ ...prev, [key]: val }));

    const [familyMembers, setFamilyMembers] = useState([]);
    const [membersLoading, setMembersLoading] = useState(false);

    // Data Hook
    const { 
        summaryData = { netPosition: 0 }, 
        activeGoalsCount = 0, 
        outstandingLending = 0, 
        report, 
        period, 
        setPeriod, 
        error, 
        loading,
        refreshing,
        refresh 
    } = useRealmData(user, 'family', family?.id);

    const getFamilyMembers = useCallback(async () => {
        if (!family?.member_ids?.length) return;
        setMembersLoading(true);
        try {
            const usersRef = collection(db, "users");
            const safeMemberIds = family.member_ids.slice(0, 10);
            const q = query(usersRef, where(documentId(), "in", safeMemberIds));
            const snap = await getDocs(q);
            // Removed 'as any' casting
            setFamilyMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (err) {
            console.error("Failed to fetch family members:", err);
        } finally {
            setMembersLoading(false);
        }
    }, [family]);

    useEffect(() => { getFamilyMembers(); }, [getFamilyMembers]);

    const handleRealmRefresh = () => {
        if (refresh) refresh(); 
        getFamilyMembers(); 
        if (onDataChange) onDataChange();
    };

    const handleMembersUpdate = (updatedFamily) => {
        handleRealmRefresh();
        if (onFamilyUpdate) onFamilyUpdate(updatedFamily);
    };

    if (loading && !refreshing) {
        return (
            <UnifiedLoadingWidget 
                type="fullscreen" 
                message="Entering Family Realm..." 
                variant="indigo" 
            />
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <ScrollView 
                className="flex-1 px-4 pt-4"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRealmRefresh} tintColor="#4F46E5" />
                }
            >
                {error && (
                    <View className="mb-4 p-3 bg-rose-100 border border-rose-200 rounded-2xl">
                        <Text className="text-rose-700 text-center font-bold text-[10px]">⚠️ FAMILY API OFFLINE</Text>
                    </View>
                )}

                {/* --- HEADER --- */}
                <View className="mb-6">
                    <TouchableOpacity 
                        onPress={onBack} 
                        className="flex-row items-center bg-white border border-slate-200 px-3 py-2 rounded-xl w-32 mb-6 shadow-sm active:scale-95"
                    >
                        <Text className="text-slate-500 mr-2">{Icons.Back}</Text>
                        <Text className="text-slate-500 font-bold text-xs uppercase">Personal</Text>
                    </TouchableOpacity>

                    <View className="flex-row items-center">
                        <View className="w-1.5 h-12 bg-indigo-600 rounded-full mr-4 shadow-lg shadow-indigo-200" />
                        <View>
                            <Text className="text-3xl font-black text-slate-900 tracking-tighter">
                                {family?.family_name}
                            </Text>
                            <Text className="text-slate-500 font-black text-[10px] uppercase tracking-[2px]">
                                Family Realm Vault
                            </Text>
                        </View>
                    </View>
                </View>

                {/* --- QUICK ACTION GRID --- */}
                <View className="flex-row flex-wrap gap-2 mb-8">
                    <TouchableOpacity 
                        onPress={() => toggle('transaction', true)}
                        className="flex-1 bg-indigo-600 py-4 rounded-2xl items-center flex-row justify-center shadow-md shadow-indigo-200"
                    >
                        <Text className="text-white font-bold mr-2">{Icons.Plus}</Text>
                        <Text className="text-white font-bold">Entry</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        onPress={() => toggle('goal', true)}
                        className="flex-1 bg-white border border-slate-200 py-4 rounded-2xl items-center flex-row justify-center shadow-sm"
                    >
                        <Text className="text-slate-600 mr-2">{Icons.Flag}</Text>
                        <Text className="text-slate-600 font-bold">Goal</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => toggle('members', true)}
                        className="bg-white border border-slate-200 px-6 py-4 rounded-2xl items-center flex-row justify-center shadow-sm"
                    >
                        <Text className="text-slate-600">{Icons.Users}</Text>
                    </TouchableOpacity>
                </View>

                {/* --- DASHBOARD CARDS --- */}
                <View className="flex-row flex-wrap justify-between mb-6">
                    <View className="w-full mb-4">
                        <DashboardCard 
                            title="Family Funds" 
                            value={`₱${(summaryData?.netPosition || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
                            subtext="Available Balance" 
                            onClick={() => toggle('listTransactions', true)} 
                            icon={Icons.Wallet} 
                            colorClass="text-emerald-600"
                        />
                    </View>
                    <View className="w-[48%]">
                        <DashboardCard 
                            title="Active Goals" 
                            value={activeGoalsCount} 
                            subtext="Shared Targets" 
                            onClick={() => toggle('listGoals', true)} 
                            icon={Icons.Flag} 
                            colorClass="text-rose-600"
                        />
                    </View>
                    <View className="w-[48%]">
                        <DashboardCard 
                            title="Lending" 
                            value={`₱${(outstandingLending || 0).toLocaleString()}`} 
                            subtext="Receivables" 
                            onClick={() => toggle('listLoans', true)} 
                            icon={Icons.Gift} 
                            colorClass="text-amber-600"
                        />
                    </View>
                </View>

                {/* --- ANALYTICS --- */}
                <View className="mb-10">
                    <UnifiedReportChartWidget 
                        report={report} 
                        realm="family" 
                        period={period} 
                        setPeriod={setPeriod} 
                    />
                </View>
            </ScrollView>

            {/* --- MODAL LAYER --- */}
            <Modal isOpen={modals.transaction} onClose={() => toggle('transaction', false)} title="New Transaction">
                <CreateUnifiedTransactionWidget familyData={family} onSuccess={handleRealmRefresh} />
            </Modal>

            <Modal isOpen={modals.loan} onClose={() => toggle('loan', false)} title="Record Family Loan">
                <CreateUnifiedLoanWidget 
                    mode="family" 
                    family={family} 
                    members={familyMembers} 
                    onSuccess={handleRealmRefresh} 
                />
            </Modal>

            <Modal isOpen={modals.listTransactions} onClose={() => toggle('listTransactions', false)} title="Family Ledger">
                <UnifiedTransactionsListWidget familyData={family} />
            </Modal>

            <Modal isOpen={modals.listGoals} onClose={() => toggle('listGoals', false)} title="Shared Goals">
                <UnifiedGoalListWidget mode="family" entityId={family?.id} onDataChange={handleRealmRefresh} />
            </Modal>

            <Modal isOpen={modals.listLoans} onClose={() => toggle('listLoans', false)} title="Loan Tracker">
                <LoanTrackingWidget family={family} onDataChange={handleRealmRefresh} />
            </Modal>

            <Modal isOpen={modals.members} onClose={() => toggle('members', false)} title="Family Access">
                <UnifiedManagerWidget 
                    type="family" 
                    mode="members" 
                    realmData={family} 
                    members={familyMembers} 
                    onUpdate={handleMembersUpdate} 
                />
            </Modal>
        </SafeAreaView>
    );
}