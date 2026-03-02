

"use client";

import React, { useContext, useState, useEffect, useMemo } from "react";
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    SafeAreaView, 
    RefreshControl,
    Alert
} from "react-native";
import { AppContext } from "../../context/AppContext";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase-config";

// System & UI
import { Icons, Btn, DashboardCard } from "../../components/realm/RealmSharedUI";
import { useRealmData } from "../../hooks/useRealmData";
import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";
import Modal from "../../components/ui/Modal";

// Realms (Sub-Screens)
import FamilyRealm from "./FamilyRealm";
import CompanyRealm from "./CompanyRealm";

// Widgets
import LoanTrackingWidget from "../../components/loan/LoanTrackingWidget";
import RecordLoanFlowWidget from "../../components/loan/RecordLoanFlowWidget";
import ApplyPremiumWidget from "../../components/management/ApplyPremiumWidget";
import CreateUnifiedTransactionWidget from '../../components/finance/CreateUnifiedTransactionWidget';
import CreateUnifiedGoalWidget from "../../components/goal/CreateUnifiedGoalWidget";
import UnifiedTransactionsListWidget from '../../components/finance/UnifiedTransactionsListWidget';
import UnifiedGoalListWidget from "../../components/goal/UnifiedGoalListWidget";
import UnifiedManagerWidget from "../../components/management/UnifiedManagerWidget";
import UnifiedReportChartWidget from "../../components/analytics/UnifiedReportChartWidget";

export default function UserDashboard({ onEnterAdmin }) {
    const context = useContext(AppContext) || {};
    const { user, refreshUserData } = context;

    // State management
    const [modals, setModals] = useState({
        transactions: false, goals: false, families: false, lending: false,
        createTx: false, createGoal: false, recordLoan: false, applyCompany: false, applyFamily: false
    });
    
    const [activeFamilyRealm, setActiveFamilyRealm] = useState(null);
    const [showCompanyRealm, setShowCompanyRealm] = useState(false);

    // Realm Data Hook (Personal)
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
    } = useRealmData(user, 'personal', user?.uid);

    const userLastName = user?.last_name || (user?.full_name ? user.full_name.trim().split(' ').pop() : 'User');
    
    const toggleModal = (key, val) => setModals(prev => ({ ...prev, [key]: val }));

    // Access Logic
    const isAdmin = user?.role === 'admin';
    const isCompanyActive = isAdmin || (user?.is_premium && user?.subscription_status === 'active'); 
    const isFamilyActive = isAdmin || (user?.is_family_premium && user?.family_subscription_status === 'active'); 
    const isCompanyPending = user?.subscription_status === 'pending_approval';
    const isFamilyPending = user?.family_subscription_status === 'pending_approval';

    const handleUpgradeSubmit = async (paymentData) => {
        if (!user?.uid) return;
        try {
            const userRef = doc(db, "users", user.uid);
            const isFamily = paymentData.targetAccess === 'family';
            const updates = isFamily ? {
                family_subscription_status: 'pending_approval',
                family_payment_ref: paymentData.paymentRef,
                family_premium_plan: paymentData.plan,
                family_request_date: serverTimestamp()
            } : {
                subscription_status: 'pending_approval',
                payment_ref: paymentData.paymentRef,
                premium_plan: paymentData.plan,
                request_date: serverTimestamp()
            };
            await updateDoc(userRef, updates);
            toggleModal(isFamily ? 'applyFamily' : 'applyCompany', false);
            Alert.alert("Success", "Request submitted for approval.");
            if (refreshUserData) refreshUserData();
        } catch (err) { 
            Alert.alert("Error", "Failed to submit request."); 
        }
    };

    if (!user || (loading && !refreshing)) {
        return <UnifiedLoadingWidget type="fullscreen" message="Syncing Personal Realm..." variant="indigo" />;
    }

    // Realm Navigation Overlays
    if (activeFamilyRealm) return <FamilyRealm family={activeFamilyRealm} onBack={() => setActiveFamilyRealm(null)} onDataChange={refresh} />;
    if (showCompanyRealm) return <CompanyRealm company={{ id: user?.uid, name: "Company" }} onBack={() => setShowCompanyRealm(false)} onDataChange={refresh} />;

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <ScrollView 
                className="flex-1 px-4 pt-4"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#4F46E5" />}
            >
                {/* --- HEADER --- */}
                <View className="mb-8 flex-row items-end justify-between">
                    <View className="flex-row items-center">
                        <View className="w-1.5 h-12 bg-indigo-600 rounded-full mr-4 shadow-lg shadow-indigo-200" />
                        <View>
                            <Text className="text-3xl font-black text-slate-800 tracking-tighter">{userLastName}</Text>
                            <Text className="text-slate-500 font-bold text-[10px] uppercase tracking-[2px]">Personal Realm</Text>
                        </View>
                    </View>
                    
                    {isAdmin && (
                        <TouchableOpacity 
                            onPress={onEnterAdmin}
                            className="bg-purple-600 px-4 py-2 rounded-xl shadow-md shadow-purple-200 active:scale-95"
                        >
                            <Text className="text-white font-black text-[10px] uppercase tracking-widest">Admin</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* --- QUICK ACTIONS --- */}
                <View className="flex-row gap-2 mb-6">
                    <TouchableOpacity 
                        onPress={() => toggleModal('createTx', true)}
                        className="flex-1 bg-indigo-600 py-4 rounded-2xl items-center flex-row justify-center shadow-md shadow-indigo-200"
                    >
                        <Text className="text-white font-bold mr-2">{Icons.Plus}</Text>
                        <Text className="text-white font-bold">Entry</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        onPress={() => toggleModal('createGoal', true)}
                        className="flex-1 bg-white border border-slate-200 py-4 rounded-2xl items-center flex-row justify-center shadow-sm"
                    >
                        <Text className="text-slate-600 mr-2">{Icons.Flag}</Text>
                        <Text className="text-slate-600 font-bold">Goal</Text>
                    </TouchableOpacity>
                </View>

                {/* --- REALM ACCESS TABS --- */}
                <View className="flex-row gap-2 mb-8">
                    {isFamilyActive ? (
                        <TouchableOpacity onPress={() => toggleModal('families', true)} className="flex-1 bg-white border border-slate-200 py-3 rounded-xl items-center flex-row justify-center">
                            <Text className="text-slate-600 text-xs font-bold">{Icons.Users} Families</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity 
                            onPress={() => toggleModal(isFamilyPending ? '' : 'applyFamily', true)} 
                            className={`flex-1 py-3 rounded-xl items-center flex-row justify-center border ${isFamilyPending ? 'bg-amber-50 border-amber-200' : 'bg-slate-100 border-slate-200'}`}
                        >
                            <Text className={`${isFamilyPending ? 'text-amber-600' : 'text-slate-400'} text-xs font-bold`}>
                                {isFamilyPending ? 'Pending Family' : 'Lock Family'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {isCompanyActive ? (
                        <TouchableOpacity onPress={() => setShowCompanyRealm(true)} className="flex-1 bg-white border border-slate-200 py-3 rounded-xl items-center flex-row justify-center">
                            <Text className="text-slate-600 text-xs font-bold">{Icons.Build} Company</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity 
                            onPress={() => toggleModal(isCompanyPending ? '' : 'applyCompany', true)} 
                            className={`flex-1 py-3 rounded-xl items-center flex-row justify-center border ${isCompanyPending ? 'bg-amber-50 border-amber-200' : 'bg-slate-100 border-slate-200'}`}
                        >
                            <Text className={`${isCompanyPending ? 'text-amber-600' : 'text-slate-400'} text-xs font-bold`}>
                                {isCompanyPending ? 'Pending Company' : 'Lock Company'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* --- STAT CARDS --- */}
                <View className="space-y-4 mb-6">
                    <DashboardCard 
                        title="Personal Funds" 
                        value={`₱${(summaryData?.netPosition || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
                        subtext="Available Balance" 
                        onClick={() => toggleModal('transactions', true)} 
                        icon={Icons.Wallet} 
                        colorClass="text-emerald-600" 
                    />
                    <View className="flex-row gap-4">
                        <View className="flex-1">
                            <DashboardCard 
                                title="Active Goals" 
                                value={activeGoalsCount} 
                                subtext="Targets" 
                                onClick={() => toggleModal('goals', true)} 
                                icon={Icons.Flag} 
                                colorClass="text-rose-600" 
                            />
                        </View>
                        <View className="flex-1">
                            <DashboardCard 
                                title="Lending" 
                                value={`₱${(outstandingLending || 0).toLocaleString()}`} 
                                subtext="Receivables" 
                                onClick={() => toggleModal('lending', true)} 
                                icon={Icons.Gift} 
                                colorClass="text-amber-600" 
                            />
                        </View>
                    </View>
                </View>

                {/* --- ANALYTICS --- */}
                <View className="mb-20">
                    <UnifiedReportChartWidget report={report} realm="personal" period={period} setPeriod={setPeriod} />
                </View>
            </ScrollView>

            {/* --- MODALS --- */}
            <Modal isOpen={modals.transactions} onClose={() => toggleModal('transactions', false)} title="Ledger">
                <UnifiedTransactionsListWidget />
            </Modal>
            <Modal isOpen={modals.goals} onClose={() => toggleModal('goals', false)} title="Personal Goals">
                <UnifiedGoalListWidget mode="personal" entityId={user?.uid} onDataChange={refresh} />
            </Modal>
            <Modal isOpen={modals.families} onClose={() => toggleModal('families', false)} title="Realms">
                <UnifiedManagerWidget type="family" onEnterRealm={setActiveFamilyRealm} />
            </Modal>
            <Modal isOpen={modals.lending} onClose={() => toggleModal('lending', false)} title="Loan Tracker">
                <LoanTrackingWidget onDataChange={refresh} />
            </Modal>
            <Modal isOpen={modals.createTx} onClose={() => toggleModal('createTx', false)} title="Add Entry">
                <CreateUnifiedTransactionWidget onSuccess={() => { toggleModal('createTx', false); refresh(); }} />
            </Modal>
            <Modal isOpen={modals.createGoal} onClose={() => toggleModal('createGoal', false)} title="New Goal">
                <CreateUnifiedGoalWidget mode="personal" entityId={user?.uid} onSuccess={() => { toggleModal('createGoal', false); refresh(); }} />
            </Modal>
            <Modal isOpen={modals.applyCompany} onClose={() => toggleModal('applyCompany', false)} title="Upgrade Company">
                <ApplyPremiumWidget targetAccess="company" onClose={() => toggleModal('applyCompany', false)} onUpgradeSuccess={handleUpgradeSubmit} />
            </Modal>
            <Modal isOpen={modals.applyFamily} onClose={() => toggleModal('applyFamily', false)} title="Upgrade Family">
                <ApplyPremiumWidget targetAccess="family" onClose={() => toggleModal('applyFamily', false)} onUpgradeSuccess={handleUpgradeSubmit} />
            </Modal>
        </SafeAreaView>
    );
}