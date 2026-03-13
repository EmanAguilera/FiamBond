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
    Shield, 
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

    // Modal State - Replicating UserRealm pattern
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

    // Data Hook - Scoped to Family
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

    // Fetch Members (logic from web version)
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
                    <View className="w-full px-6 md:px-10 pt-6">
                        
                        {/* --- BACK NAVIGATION --- */}
                        <TouchableOpacity 
                            onPress={onBack}
                            className="flex-row items-center mb-6 bg-white self-start px-3 py-2 rounded-xl border border-slate-200 shadow-sm"
                        >
                            <ArrowLeft size={16} color="#475569" />
                            <Text className="ml-2 text-slate-600 font-bold text-xs">Back to Personal</Text>
                        </TouchableOpacity>

                        {/* --- HEADER (Matches UserRealm Face) --- */}
                        <View className="flex-col md:flex-row md:justify-between md:items-end mb-10 gap-y-8">
                            
                            {/* Left Side: Title */}
                            <View className="flex-row items-center">
                                <View className="w-1.5 h-12 bg-indigo-600 rounded-full mr-4 opacity-80 shadow-sm" />
                                <View>
                                    <Text className="text-4xl font-black text-slate-800 tracking-tighter">
                                        {family.family_name}
                                    </Text>
                                    <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-[3px] mt-1">
                                        FAMILY REALM
                                    </Text>
                                </View>
                            </View>

                            {/* Right Side: Action Buttons Grid (Matches UserRealm 2x2 on Mobile) */}
                            <View className="w-full md:w-auto">
                                <View className="flex-row flex-wrap justify-between md:justify-end items-center gap-y-3 md:gap-x-3">
                                    <ActionBtn 
                                        label="Transaction" 
                                        icon={<Plus size={16} color="white" />} 
                                        color="bg-indigo-600" 
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

                                    {/* Vertical Divider (Desktop Only) */}
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

                        {/* --- DASHBOARD CARDS (Matches UserRealm Face) --- */}
                        <View className="flex-col md:flex-row gap-6 mb-10">
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

                {/* MODALS (Lazy Loaded - Matches UserRealm structure) */}
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
                            <CreateUnifiedLoanWidget 
                                mode="family" 
                                family={family} 
                                members={familyMembers} 
                                onSuccess={() => { toggleModal('createLoan', false); handleRealmRefresh(); }} 
                            />
                        </Modal>
                    )}
                    {modals.members && (
                        <Modal isOpen={modals.members} onClose={() => toggleModal('members', false)} title="Family Access Control">
                            <UnifiedManagerWidget 
                                type="family" 
                                mode="members" 
                                realmData={family} 
                                members={familyMembers} 
                                onUpdate={handleMembersUpdate} 
                            />
                        </Modal>
                    )}
                </Suspense>
            </SafeAreaView>
        </RouteGuard>
    );
}

// --- SUB-COMPONENTS (Exact Replicas from UserRealm for UI Consistency) ---

const ActionBtn = ({ label, icon, onPress, color, textColor = "text-white" }) => (
    <TouchableOpacity 
        onPress={onPress} 
        activeOpacity={0.8}
        className={`${color} flex-row items-center justify-center px-4 py-4 rounded-2xl active:scale-95 shadow-sm w-[48.5%] md:w-auto md:px-6 md:py-3.5`}
    >
        {icon && <View className="mr-2">{icon}</View>}
        <Text className={`${textColor} font-black text-[11px] md:text-[12px] tracking-tight`}>
            {label}
        </Text>
    </TouchableOpacity>
);

const DashboardCard = ({ title, value, subtext, linkText, color, icon: IconComponent, iconColor, onPress }) => (
    <TouchableOpacity 
        onPress={onPress} 
        activeOpacity={0.9} 
        className="flex-1 bg-white p-7 rounded-[30px] border border-slate-100 shadow-sm min-w-[280px]"
    >
        <View className="flex-row justify-between items-start mb-4">
            <Text className="text-slate-500 font-bold text-xs tracking-widest uppercase">{title}</Text>
            {IconComponent && <IconComponent size={24} color={iconColor} />}
        </View>

        <Text className={`text-4xl font-black tracking-tighter ${color} mb-1`}>
            {value}
        </Text>
        
        <Text className="text-slate-400 text-[11px] font-medium mb-6">
            {subtext}
        </Text>

        <Text className="text-indigo-500 font-bold text-xs">
            {linkText}
        </Text>
    </TouchableOpacity>
);