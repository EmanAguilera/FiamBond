'use client';

import React, { useContext, useState, useEffect, Suspense, lazy } from "react";
import { 
    View, 
    Text, 
    ScrollView, 
    SafeAreaView, 
    TouchableOpacity, 
    Alert,
    Platform
} from "react-native";
import { Shield, Plus, Users, Building2 } from "lucide-react-native";

// Context & Logic
import { AppContext } from "../../context/AppContext";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase-config.js";
import { useRealmData } from "../../hooks/useRealmData.js";
import RouteGuard from "../../components/auth/RouteGuard";

// UI Components
import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";
import { Icons } from "../../components/realm/RealmSharedUI";

// Lazy Loaded Widgets
const Modal = lazy(() => import("../../components/ui/Modal.jsx"));
const FamilyRealm = lazy(() => import("./FamilyRealm.jsx"));
const CompanyRealm = lazy(() => import("./CompanyRealm.jsx"));
const LoanTrackingWidget = lazy(() => import("../../components/loan/LoanTrackingWidget.tsx"));
const RecordLoanFlowWidget = lazy(() => import("../../components/loan/RecordLoanFlowWidget.tsx"));
const UnifiedTransactionsListWidget = lazy(() => import('../../components/finance/UnifiedTransactionsListWidget.tsx'));
const UnifiedGoalListWidget = lazy(() => import("../../components/goal/UnifiedGoalListWidget.tsx"));
const UnifiedManagerWidget = lazy(() => import("../../components/management/UnifiedManagerWidget.tsx"));
const CreateUnifiedTransactionWidget = lazy(() => import('../../components/finance/CreateUnifiedTransactionWidget.tsx'));
const CreateUnifiedGoalWidget = lazy(() => import("../../components/goal/CreateUnifiedGoalWidget.tsx"));
const ApplyPremiumWidget = lazy(() => import("../../components/management/ApplyPremiumWidget"));
const UnifiedReportChartWidget = lazy(() => import("../../components/analytics/UnifiedReportChartWidget.jsx"));

export default function UserDashboard({ onEnterAdmin, onEnterCompany, onEnterFamily }) {
    const { user, refreshUserData } = useContext(AppContext);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    // Realm/View Switching
    const [activeFamilyRealm, setActiveFamilyRealm] = useState(null);
    const [showCompanyRealm, setShowCompanyRealm] = useState(false);

    // Modal State
    const [modals, setModals] = useState({
        transactions: false, goals: false, families: false, lending: false,
        createTx: false, createGoal: false, recordLoan: false, applyCompany: false, applyFamily: false
    });

    // Data Hook
    const {
        summaryData = { netPosition: 0 },
        activeGoalsCount = 0,
        outstandingLending = 0,
        report,
        period,
        setPeriod,
        error,
        refresh
    } = useRealmData(user, 'personal', user?.uid);

    const userLastName = user?.last_name || (user?.full_name ? user.full_name.trim().split(' ').pop() : 'User');
    const toggleModal = (key, val) => setModals(prev => ({ ...prev, [key]: val }));

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
                family_request_date: serverTimestamp()
            } : {
                subscription_status: 'pending_approval',
                payment_ref: paymentData.paymentRef,
                request_date: serverTimestamp()
            };
            await updateDoc(userRef, updates);
            toggleModal(isFamily ? 'applyFamily' : 'applyCompany', false);
            if (refreshUserData) refreshUserData();
            Alert.alert("Success", "Request Submitted.");
        } catch (err) { Alert.alert("Error", "Submission failed."); }
    };

    if (!mounted || !user) return <UnifiedLoadingWidget type="fullscreen" message="Syncing Personal Realm..." />;

    // Navigation Switches
    if (activeFamilyRealm) return <Suspense fallback={<UnifiedLoadingWidget type="fullscreen" />}><FamilyRealm family={activeFamilyRealm} onBack={() => setActiveFamilyRealm(null)} onDataChange={refresh} /></Suspense>;
    if (showCompanyRealm) return <Suspense fallback={<UnifiedLoadingWidget type="fullscreen" />}><CompanyRealm company={{ id: user?.uid, name: "Personal Company" }} onBack={() => setShowCompanyRealm(false)} onDataChange={refresh} /></Suspense>;

    return (
        <RouteGuard require="auth">
            <SafeAreaView className="flex-1 bg-white">
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
                    <View className="w-full px-8 pt-12">
                        
                        {/* --- HEADER & BUTTON ROW (FIXED ALIGNMENT) --- */}
                        <View className="flex-row justify-between items-center mb-10">
                            
                            {/* Left Side: Header */}
                            <View className="flex-row items-center">
                                <View className="w-1.5 h-12 bg-indigo-600 rounded-full mr-4" />
                                <View>
                                    <Text className="text-4xl font-black text-slate-900 tracking-tighter">
                                        {userLastName}
                                    </Text>
                                    <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-[2px]">
                                        PERSONAL REALM
                                    </Text>
                                </View>
                            </View>

                            {/* Right Side: Action Buttons */}
                            <View className="flex-row items-center">
                                <View className="flex-row items-center gap-2">
                                    {isAdmin && (
                                        <ActionBtn 
                                            label="Admin Realm" 
                                            icon={<Shield size={14} color="white" />} 
                                            color="bg-purple-600" 
                                            onPress={onEnterAdmin} 
                                        />
                                    )}
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
                                    
                                    {/* Vertical Divider Pipe */}
                                    <View className="w-[1px] h-8 bg-slate-200 mx-2" />

                                    <ActionBtn 
                                        label={isFamilyActive ? "Families" : (isFamilyPending ? "Pending" : "Apply Family")} 
                                        icon={<Users size={16} color={isFamilyActive ? "white" : "#475569"} />}
                                        color={isFamilyActive ? "bg-white border border-slate-200" : "bg-white border border-slate-200"}
                                        textColor="text-slate-600"
                                        onPress={() => isFamilyActive ? toggleModal('families', true) : (!isFamilyPending && toggleModal('applyFamily', true))} 
                                    />

                                    <ActionBtn 
                                        label={isCompanyActive ? "Company" : (isCompanyPending ? "Pending" : "Apply Company")} 
                                        icon={<Building2 size={16} color="white" />}
                                        color="bg-indigo-600"
                                        textColor="text-white"
                                        onPress={() => isCompanyActive ? setShowCompanyRealm(true) : (!isCompanyPending && toggleModal('applyCompany', true))} 
                                    />
                                </View>
                            </View>
                        </View>

                        {/* --- DASHBOARD CARDS --- */}
                        <View className="flex-col md:flex-row gap-6">
                            <DashboardCard
                                title="Personal Funds"
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
                                subtext="Targets in Progress"
                                linkText="View Goals →"
                                color="text-rose-600"
                                icon={Icons.Flag}
                                iconColor="#e11d48"
                                onPress={() => toggleModal('goals', true)}
                            />
                            <DashboardCard
                                title="Outstanding Loans"
                                value={`₱${(outstandingLending || 0).toLocaleString()}`}
                                subtext="Total Receivables"
                                linkText="Manage Lending →"
                                color="text-amber-600"
                                icon={Icons.Gift}
                                iconColor="#d97706"
                                onPress={() => toggleModal('lending', true)}
                            />
                        </View>

                        {/* --- ANALYTICS --- */}
                        <View className="mt-12 bg-slate-50 p-6 rounded-[40px] border border-slate-100 shadow-sm">
                            <Suspense fallback={<View className="p-10 items-center"><Text>Loading Analytics...</Text></View>}>
                                <UnifiedReportChartWidget report={report} realm="personal" period={period} setPeriod={setPeriod} />
                            </Suspense>
                        </View>

                    </View>
                </ScrollView>

                {/* --- MODALS --- */}
                <Suspense fallback={null}>
                    {modals.transactions && <Modal isOpen={modals.transactions} onClose={() => toggleModal('transactions', false)} title="History"><UnifiedTransactionsListWidget /></Modal>}
                    {modals.goals && <Modal isOpen={modals.goals} onClose={() => toggleModal('goals', false)} title="Personal Goals"><UnifiedGoalListWidget mode="personal" entityId={user?.uid} onDataChange={refresh} /></Modal>}
                    {modals.families && <Modal isOpen={modals.families} onClose={() => toggleModal('families', false)} title="Manage Families"><UnifiedManagerWidget type="family" onEnterRealm={setActiveFamilyRealm} /></Modal>}
                    {modals.lending && <Modal isOpen={modals.lending} onClose={() => toggleModal('lending', false)} title="Lending Ledger"><LoanTrackingWidget onDataChange={refresh} /></Modal>}
                    {modals.createTx && <Modal isOpen={modals.createTx} onClose={() => toggleModal('createTx', false)} title="New Transaction"><CreateUnifiedTransactionWidget onSuccess={() => { toggleModal('createTx', false); refresh(); }} /></Modal>}
                    {modals.createGoal && <Modal isOpen={modals.createGoal} onClose={() => toggleModal('createGoal', false)} title="New Goal"><CreateUnifiedGoalWidget mode="personal" entityId={user?.uid} onSuccess={() => { toggleModal('createGoal', false); refresh(); }} /></Modal>}
                    {modals.recordLoan && <Modal isOpen={modals.recordLoan} onClose={() => toggleModal('recordLoan', false)} title="Record Loan"><RecordLoanFlowWidget onSuccess={() => { toggleModal('recordLoan', false); refresh(); }} /></Modal>}
                    {modals.applyCompany && <Modal isOpen={modals.applyCompany} onClose={() => toggleModal('applyCompany', false)} title="Unlock Company"><ApplyPremiumWidget targetAccess="company" onClose={() => toggleModal('applyCompany', false)} onUpgradeSuccess={handleUpgradeSubmit} /></Modal>}
                    {modals.applyFamily && <Modal isOpen={modals.applyFamily} onClose={() => toggleModal('applyFamily', false)} title="Unlock Family"><ApplyPremiumWidget targetAccess="family" onClose={() => toggleModal('applyFamily', false)} onUpgradeSuccess={handleUpgradeSubmit} /></Modal>}
                </Suspense>
            </SafeAreaView>
        </RouteGuard>
    );
}

// --- REFINED SUB-COMPONENTS ---

const ActionBtn = ({ label, icon, onPress, color, textColor = "text-white" }) => (
    <TouchableOpacity 
        onPress={onPress} 
        activeOpacity={0.8}
        className={`${color} flex-row items-center px-5 py-3 rounded-2xl active:scale-95 shadow-sm`}
    >
        {icon && <View className="mr-2">{icon}</View>}
        <Text className={`${textColor} font-black text-[11px] tracking-tight`}>{label}</Text>
    </TouchableOpacity>
);

const DashboardCard = ({ title, value, subtext, linkText, color, icon: IconComponent, iconColor, onPress }) => (
    <TouchableOpacity 
        onPress={onPress} 
        activeOpacity={0.9} 
        className="flex-1 bg-white p-7 rounded-[30px] border border-slate-100 shadow-sm min-w-[280px]"
    >
        <View className="flex-row justify-between items-start mb-4">
            <Text className="text-slate-600 font-bold text-sm tracking-tight">{title}</Text>
            {IconComponent && <IconComponent size={24} color={iconColor} />}
        </View>

        <Text className={`text-4xl font-black tracking-tighter ${color} mb-1`}>
            {value}
        </Text>
        
        <Text className="text-slate-400 text-[11px] font-medium mb-6">
            {subtext}
        </Text>

        <Text className="text-indigo-500 font-semibold text-xs">
            {linkText}
        </Text>
    </TouchableOpacity>
);