'use client';

import React, { useContext, useState, useEffect, Suspense, lazy, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Alert,
    useWindowDimensions
} from "react-native";
import { 
    Plus, 
    Users, 
    ArrowLeft, 
    Wallet, 
    Flag, 
    Gift 
} from "lucide-react-native";

// Context & Logic
import { AppContext } from "../../context/AppContext";
import { db } from "../../config/firebase-config.js";
import { collection, query, where, getDocs, documentId } from "firebase/firestore";
import { useRealmData } from "../../hooks/useRealmData.js";
import RouteGuard from "../../components/auth/RouteGuard";

// UI Components
import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";
import { Icons } from "../../components/realm/RealmSharedUI";

// Lazy Loaded Widgets
const Modal = lazy(() => import("../../components/ui/Modal.jsx"));
const LoanTrackingWidget = lazy(() => import("../../components/loan/LoanTrackingWidget.tsx"));
const CreateUnifiedLoanWidget = lazy(() => import("../../components/loan/CreateUnifiedLoanWidget.tsx"));
const CreateUnifiedTransactionWidget = lazy(() => import('../../components/finance/CreateUnifiedTransactionWidget.tsx'));
const UnifiedTransactionsListWidget = lazy(() => import('../../components/finance/UnifiedTransactionsListWidget.tsx'));
const CreateUnifiedGoalWidget = lazy(() => import("../../components/goal/CreateUnifiedGoalWidget.tsx"));
const UnifiedGoalListWidget = lazy(() => import("../../components/goal/UnifiedGoalListWidget.tsx"));
const UnifiedManagerWidget = lazy(() => import("../../components/management/UnifiedManagerWidget.tsx"));
const UnifiedReportChartWidget = lazy(() => import("../../components/analytics/UnifiedReportChartWidget.jsx"));

export default function FamilyRealm({ family, onBack, onDataChange, onFamilyUpdate }) {
    const { user } = useContext(AppContext);
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const [mounted, setMounted] = useState(false);

    // Member State
    const [familyMembers, setFamilyMembers] = useState([]);
    const [membersLoading, setMembersLoading] = useState(false);

    // Modal State
    const [modals, setModals] = useState({
        transactions: false, 
        goals: false, 
        lending: false,
        createTx: false, 
        createGoal: false, 
        createLoan: false,
        members: false
    });

    const toggleModal = (key, val) => setModals(prev => ({ ...prev, [key]: val }));

    // Data Hook
    const {
        summaryData = { netPosition: 0 },
        activeGoalsCount = 0,
        outstandingLending = 0,
        report,
        period,
        setPeriod,
        refresh
    } = useRealmData(user, 'family', family?.id);

    useEffect(() => { setMounted(true); }, []);

    const getFamilyMembers = useCallback(async () => {
        if (!family?.member_ids?.length) return;
        setMembersLoading(true);
        try {
            const usersRef = collection(db, "users");
            const safeMemberIds = family.member_ids.slice(0, 10);
            const q = query(usersRef, where(documentId(), "in", safeMemberIds));
            const snap = await getDocs(q);
            setFamilyMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (err) {
            console.error("Failed to fetch family members:", err);
        } finally {
            setMembersLoading(false);
        }
    }, [family]);

    useEffect(() => { 
        if (mounted) getFamilyMembers(); 
    }, [getFamilyMembers, mounted]);

    const handleRealmRefresh = () => {
        refresh();
        getFamilyMembers();
        if (onDataChange) onDataChange();
    };

    const handleMembersUpdate = (updatedFamily) => {
        handleRealmRefresh();
        if (onFamilyUpdate) onFamilyUpdate(updatedFamily);
    };

    if (!mounted || !family?.id) return <UnifiedLoadingWidget type="fullscreen" message="Entering Family Realm..." />;

    return (
        <RouteGuard require="premium">
            <SafeAreaView className="flex-1 bg-slate-50">
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
                    <View className="w-full px-6 md:px-10 pt-16">
                        
                        {/* --- BACK NAVIGATION (1:1 NEXT.JS REPLICATION) --- */}
                        <TouchableOpacity 
                            onPress={onBack}
                            activeOpacity={0.7}
                            className="flex-row items-center px-3 py-1.5 rounded-lg bg-white border border-slate-200 mb-6 self-start shadow-sm active:scale-95"
                        >
                            <ArrowLeft size={16} color="#64748b" strokeWidth={2} />
                            <Text className="ml-2 text-slate-500 text-sm font-medium">Back to Personal</Text>
                        </TouchableOpacity>

                        {/* --- HEADER --- */}
                        <View className="flex-col md:flex-row md:justify-between md:items-end mb-10 gap-y-8">
                            <View className="flex-row items-center">
                                <View className="w-1 h-12 bg-indigo-600 rounded-full mr-4 opacity-80 shadow-sm" />
                                <View>
                                    <Text className="text-3xl font-black text-slate-800 tracking-tighter">
                                        {family.family_name}
                                    </Text>
                                    <Text className="text-slate-500 font-bold text-xs uppercase tracking-[3px] mt-1">
                                        FAMILY REALM
                                    </Text>
                                </View>
                            </View>

                            {/* Action Buttons Grid */}
                            <View className="w-full md:w-auto">
                                <View className="flex-row flex-wrap justify-between md:justify-end items-center gap-y-2 md:gap-x-3">
                                    <ActionBtn 
                                        label="Transaction" 
                                        icon={<Plus size={16} color="white" />} 
                                        color="bg-indigo-600 border border-transparent" 
                                        onPress={() => toggleModal('createTx', true)} 
                                    />
                                    <ActionBtn 
                                        label="Goal" 
                                        icon={<Plus size={16} color="#475569" />} 
                                        color="bg-white border border-slate-200" 
                                        textColor="text-slate-600"
                                        onPress={() => toggleModal('createGoal', true)} 
                                    />
                                    <ActionBtn 
                                        label="Loan" 
                                        icon={<Plus size={16} color="#475569" />} 
                                        color="bg-white border border-slate-200" 
                                        textColor="text-slate-600"
                                        onPress={() => toggleModal('createLoan', true)} 
                                    />

                                    {!isMobile && <View className="w-[1px] h-10 bg-slate-200 mx-1" />}

                                    <ActionBtn 
                                        label="Members"
                                        icon={<Users size={16} color="white" />}
                                        color="bg-indigo-600"
                                        textColor="text-white"
                                        onPress={() => toggleModal('members', true)} 
                                    />
                                </View>
                            </View>
                        </View>

                        {/* --- DASHBOARD CARDS (WITH SHADOW LOGIC) --- */}
                        <View className="flex-col md:flex-row md:flex-wrap justify-between gap-4 mb-8">
                            <DashboardCard
                                title="Family Funds"
                                value={`₱${(summaryData?.netPosition || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                subtext="Available Balance"
                                linkText="View Transactions →"
                                color="text-emerald-600"
                                icon={Icons.Wallet}
                                iconColor="#059669"
                                onPress={() => toggleModal('transactions', true)}
                            />
                            <DashboardCard
                                title="Active Goals"
                                value={activeGoalsCount}
                                subtext="Shared Targets"
                                linkText="View Goals →"
                                color="text-rose-600"
                                icon={Icons.Flag}
                                iconColor="#e11d48"
                                onPress={() => toggleModal('goals', true)}
                            />
                            <DashboardCard
                                title="Family Loans"
                                value={`₱${(outstandingLending || 0).toLocaleString()}`}
                                subtext="Shared Receivables"
                                linkText="Manage Lending →"
                                color="text-amber-600"
                                icon={Icons.Gift}
                                iconColor="#d97706"
                                onPress={() => toggleModal('lending', true)}
                            />
                        </View>

                        {/* --- ANALYTICS --- */}
                        <Suspense fallback={<UnifiedLoadingWidget type="section" />}>
                            <UnifiedReportChartWidget 
                                report={report} 
                                realm="family" 
                                period={period} 
                                setPeriod={setPeriod} 
                            />
                        </Suspense>

                    </View>
                </ScrollView>

                {/* MODALS */}
                <Suspense fallback={null}>
                    {modals.transactions && (
                        <Modal isOpen={modals.transactions} onClose={() => toggleModal('transactions', false)} title="Family History">
                            <UnifiedTransactionsListWidget familyData={family} />
                        </Modal>
                    )}
                    {modals.goals && (
                        <Modal isOpen={modals.goals} onClose={() => toggleModal('goals', false)} title="Family Goals">
                            <UnifiedGoalListWidget mode="family" entityId={family.id} onDataChange={handleRealmRefresh} />
                        </Modal>
                    )}
                    {modals.lending && (
                        <Modal isOpen={modals.lending} onClose={() => toggleModal('lending', false)} title="Family Lending Ledger">
                            <LoanTrackingWidget family={family} onDataChange={handleRealmRefresh} />
                        </Modal>
                    )}
                    {modals.createTx && (
                        <Modal isOpen={modals.createTx} onClose={() => toggleModal('createTx', false)} title="New Family Transaction">
                            <CreateUnifiedTransactionWidget familyData={family} onSuccess={() => { toggleModal('createTx', false); handleRealmRefresh(); }} />
                        </Modal>
                    )}
                    {modals.createGoal && (
                        <Modal isOpen={modals.createGoal} onClose={() => toggleModal('createGoal', false)} title="New Family Goal">
                            <CreateUnifiedGoalWidget mode="family" entityId={family.id} onSuccess={() => { toggleModal('createGoal', false); handleRealmRefresh(); }} />
                        </Modal>
                    )}
                    {modals.createLoan && (
                        <Modal isOpen={modals.createLoan} onClose={() => toggleModal('createLoan', false)} title="Record Family Loan">
                            <CreateUnifiedLoanWidget mode="family" family={family} members={familyMembers} onSuccess={() => { toggleModal('createLoan', false); handleRealmRefresh(); }} />
                        </Modal>
                    )}
                    {modals.members && (
                        <Modal isOpen={modals.members} onClose={() => toggleModal('members', false)} title="Family Access Control">
                            <UnifiedManagerWidget type="family" mode="members" realmData={family} members={familyMembers} onUpdate={handleMembersUpdate} />
                        </Modal>
                    )}
                </Suspense>
            </SafeAreaView>
        </RouteGuard>
    );
}

// --- SUB-COMPONENTS (1:1 with UserRealm) ---

const ActionBtn = ({ label, icon, onPress, color, textColor = "text-white" }) => (
    <TouchableOpacity 
        onPress={onPress} 
        activeOpacity={0.7}
        className={`${color} h-[40px] flex-row items-center justify-center px-4 rounded-xl active:scale-95 shadow-sm w-[48.5%] md:w-auto md:px-5`}
    >
        {icon && <View className="mr-2">{icon}</View>}
        <Text className={`${textColor} font-medium text-[14px] leading-[20px] tracking-tight`}>
            {label}
        </Text>
    </TouchableOpacity>
);

const DashboardCard = ({ title, value, subtext, linkText, color, icon: IconComponent, iconColor, onPress }) => (
    <TouchableOpacity 
        onPress={onPress} 
        activeOpacity={0.9} 
        className="flex-1 bg-white border border-slate-100 rounded-2xl p-6 min-w-[280px]"
        style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            elevation: 10,
        }}
    >
        <View className="flex-row justify-between items-start">
            <Text className="font-bold text-gray-600 flex-1 pr-4">{title}</Text>
            <View className="flex-shrink-0">
                {IconComponent && <IconComponent size={32} color={iconColor} />}
            </View>
        </View>

        <View className="flex-1">
            <Text className={`text-4xl font-bold mt-2 ${color}`}>
                {value}
            </Text>
            <Text className="text-xs mt-1 font-bold text-slate-400">
                {subtext}
            </Text>
        </View>

        <Text className="text-indigo-600 text-sm mt-3 font-medium">
            {linkText}
        </Text>
    </TouchableOpacity>
);