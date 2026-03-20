'use client';

import React, { useContext, useState, useEffect, Suspense, lazy, useCallback, useMemo } from "react";
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    useWindowDimensions,
    Alert
} from "react-native";
import { 
    Building2, 
    Plus, 
    Users, 
    ArrowLeft, 
    Wallet, 
    Flag, 
    Printer,
    Target
} from "lucide-react-native";

// Context & Logic
import { AppContext } from "../../context/AppContext";
import { db } from "../../config/firebase-config.js";
import { collection, query, where, getDocs, documentId } from "firebase/firestore";
import { API_BASE_URL } from "../../config/apiConfig.js";
import { useRealmData } from "../../hooks/useRealmData.js";
import RouteGuard from "../../components/auth/RouteGuard";

// UI Components
import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";
import { Icons } from "../../components/realm/RealmSharedUI";

// Lazy Loaded Widgets
const Modal = lazy(() => import("../../components/ui/Modal.jsx"));
const UnifiedCorporateLedgerWidget = lazy(() => import('../../components/management/UnifiedCorporateLedgerWidget'));
const CreateUnifiedTransactionWidget = lazy(() => import('../../components/finance/CreateUnifiedTransactionWidget.tsx'));
const UnifiedTransactionsListWidget = lazy(() => import('../../components/finance/UnifiedTransactionsListWidget.tsx'));
const CreateUnifiedGoalWidget = lazy(() => import("../../components/goal/CreateUnifiedGoalWidget.tsx"));
const UnifiedGoalListWidget = lazy(() => import("../../components/goal/UnifiedGoalListWidget.tsx"));
const UnifiedManagerWidget = lazy(() => import("../../components/management/UnifiedManagerWidget.tsx"));
const UnifiedReportChartWidget = lazy(() => import("../../components/analytics/UnifiedReportChartWidget.jsx"));

export default function CompanyRealm({ company, onBack, onDataChange }) {
    const { user } = useContext(AppContext);
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const [mounted, setMounted] = useState(false);

    // Corporate State
    const [members, setMembers] = useState([]);
    const [payrollCount, setPayrollCount] = useState(0);

    // Modal State - Replicating UserRealm pattern
    const [modals, setModals] = useState({
        accounting: false, 
        addGoal: false, 
        manageEmp: false,
        viewTx: false, 
        viewGoals: false,
        payrollHistory: false
    });

    const toggleModal = (key, val) => setModals(prev => ({ ...prev, [key]: val }));

    // Logic: Corporate Display Name (Matches Next.js logic)
    const corporateDisplayName = useMemo(() => {
        if (!company) return "";
        const isGeneric = company.name?.toLowerCase() === 'company' || company.name?.toLowerCase() === 'my company';
        const userLastName = user?.full_name ? user.full_name.trim().split(' ').pop() : '';
        return isGeneric && userLastName ? `${userLastName} Corporate` : (company.name || "Company");
    }, [company, user]);

    // Data Hook - Scoped to Company
    const {
        transactions = [],
        summaryData = { netPosition: 0 },
        activeGoalsCount = 0,
        report,
        period,
        setPeriod,
        refresh
    } = useRealmData(user, 'company', company?.id);

    // Payroll Configuration (Ported from Next.js)
    const companyPayrollConfig = useMemo(() => ({
        filterFn: (tx) => 
            (tx.category === 'Payroll' || tx.category === 'Cash Advance') || 
            (tx.description && (tx.description.toLowerCase().includes('salary') || tx.description.toLowerCase().includes('advance'))),
        columnLabels: ["Employee / Description", "Category"],
        getMainLabel: (tx) => tx.description || "Unnamed Disbursement",
        getSubLabel: (tx) => tx.category || "General Payroll",
    }), []);

    // Initialize Company Data via API (Ported from Next.js)
    const initCompanyData = useCallback(async () => {
        if (!company?.id) return;
        try {
            let compRes = await fetch(`${API_BASE_URL}/companies/${company.id}`);
            
            // Auto-create company if 404 (Logic from Next.js)
            if (!compRes.ok && compRes.status === 404) {
                await fetch(`${API_BASE_URL}/companies`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ owner_id: company.id, name: company.name })
                });
                compRes = await fetch(`${API_BASE_URL}/companies/${company.id}`);
            }

            if (compRes.ok) {
                const companyData = await compRes.json();
                const memberIds = companyData.member_ids || [];
                
                if (memberIds.length > 0) {
                    const snap = await getDocs(query(collection(db, "users"), where(documentId(), "in", memberIds.slice(0, 10))));
                    setMembers(snap.docs.map(d => ({ 
                        id: d.id, 
                        full_name: d.data().full_name || 'Unnamed Employee' 
                    })));
                }

                const txRes = await fetch(`${API_BASE_URL}/transactions?company_id=${company.id}`);
                if (txRes.ok) {
                    const txs = await txRes.json();
                    setPayrollCount(txs.filter(companyPayrollConfig.filterFn).length);
                }
            }
        } catch (e) {
            console.error("Company Init Error:", e);
        }
    }, [company, companyPayrollConfig]);

    useEffect(() => { 
        setMounted(true);
        initCompanyData(); 
    }, [initCompanyData]);

    const handleRefresh = () => {
        refresh();
        initCompanyData();
        if (onDataChange) onDataChange();
    };

    if (!mounted || !company) return <UnifiedLoadingWidget type="fullscreen" message="Accessing Corporate Assets..." />;

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
                            
                            <View className="flex-row items-center">
                                <View className="w-1 h-12 bg-indigo-600 rounded-full mr-4 opacity-80 shadow-sm" />
                                <View>
                                    <Text className="text-3xl font-black text-slate-800 tracking-tighter">
                                        {corporateDisplayName}
                                    </Text>
                                    <Text className="text-slate-500 font-bold text-xs uppercase tracking-[3px] mt-1">
                                        COMPANY REALM
                                    </Text>
                                </View>
                            </View>

                            <View className="w-full md:w-auto">
                                <View className="flex-row flex-wrap justify-between md:justify-end items-center gap-y-3 md:gap-x-3">
                                    <ActionBtn 
                                        label="Accounting" 
                                        icon={<Plus size={16} color="white" />} 
                                        color="bg-indigo-600" 
                                        onPress={() => toggleModal('accounting', true)} 
                                    />
                                    <ActionBtn 
                                        label="Strategic Goal" 
                                        icon={<Plus size={16} color="#475569" />} 
                                        color="bg-white border border-slate-200" 
                                        textColor="text-slate-600"
                                        onPress={() => toggleModal('addGoal', true)} 
                                    />
                                    
                                    {!isMobile && <View className="w-[1px] h-10 bg-slate-200 mx-1" />}

                                    <ActionBtn 
                                        label="Employees"
                                        icon={<Users size={16} color="white" />}
                                        color="bg-indigo-600"
                                        textColor="text-white"
                                        onPress={() => toggleModal('manageEmp', true)} 
                                    />
                                </View>
                            </View>
                        </View>

                        {/* --- DASHBOARD CARDS --- */}
                        <View className="flex-col md:flex-row gap-6 mb-10">
                            <DashboardCard
                                title="Company Funds"
                                value={`₱${(summaryData?.netPosition || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                subtext="Available Balance"
                                linkText="View Transactions →"
                                color="text-emerald-600"
                                icon={Icons.Wallet}
                                iconColor="#059669"
                                onPress={() => toggleModal('viewTx', true)}
                            />
                            <DashboardCard
                                title="Active Goals"
                                value={activeGoalsCount}
                                subtext="Corporate Targets"
                                linkText="View Goals →"
                                color="text-rose-600"
                                icon={Icons.Flag}
                                iconColor="#e11d48"
                                onPress={() => toggleModal('viewGoals', true)}
                            />
                            <DashboardCard
                                title="Payroll Reports"
                                value={`${payrollCount} Records`}
                                subtext="Disbursement History"
                                linkText="Manage Reports →"
                                color="text-indigo-600"
                                icon={Icons.Printer}
                                iconColor="#4f46e5"
                                onPress={() => toggleModal('payrollHistory', true)}
                            />
                        </View>

                        {/* --- ANALYTICS --- */}
                        <Suspense fallback={<UnifiedLoadingWidget type="section" />}>
                            <UnifiedReportChartWidget 
                                report={report} 
                                realm="company" 
                                period={period} 
                                setPeriod={setPeriod} 
                            />
                        </Suspense>

                    </View>
                </ScrollView>

                {/* MODALS */}
                <Suspense fallback={null}>
                    {modals.accounting && (
                        <Modal isOpen={modals.accounting} onClose={() => toggleModal('accounting', false)} title="Corporate Accounting">
                            <CreateUnifiedTransactionWidget 
                                companyData={company.id} 
                                members={members} 
                                onSuccess={() => { toggleModal('accounting', false); handleRefresh(); }} 
                            />
                        </Modal>
                    )}
                    
                    {modals.addGoal && (
                        <Modal isOpen={modals.addGoal} onClose={() => toggleModal('addGoal', false)} title="Set Strategic Target">
                            <CreateUnifiedGoalWidget mode="company" entityId={company.id} onSuccess={() => { toggleModal('addGoal', false); handleRefresh(); }} />
                        </Modal>
                    )}

                    {modals.manageEmp && (
                        <Modal isOpen={modals.manageEmp} onClose={() => toggleModal('manageEmp', false)} title="Manage Employee Access">
                            <UnifiedManagerWidget 
                                type="company" 
                                mode="members" 
                                realmData={company} 
                                members={members} 
                                onUpdate={() => { handleRefresh(); }} 
                            />
                        </Modal>
                    )}
                    
                    {modals.viewTx && (
                        <Modal isOpen={modals.viewTx} onClose={() => toggleModal('viewTx', false)} title="Corporate Ledger">
                            <UnifiedTransactionsListWidget companyData={company} />
                        </Modal>
                    )}
                    
                    {modals.viewGoals && (
                        <Modal isOpen={modals.viewGoals} onClose={() => toggleModal('viewGoals', false)} title="Strategic Goals">
                            <UnifiedGoalListWidget mode="company" entityId={company.id} onDataChange={handleRefresh} />
                        </Modal>
                    )}

                    {modals.payrollHistory && (
                        <Modal isOpen={modals.payrollHistory} onClose={() => toggleModal('payrollHistory', false)} title="Payroll Ledger">
                            <UnifiedCorporateLedgerWidget 
                                transactions={transactions}
                                config={companyPayrollConfig}
                                brandName={company.name}
                                reportType="Corporate Payroll Ledger"
                                filenamePrefix={`${company.name}_Payroll`}
                                themeColor="indigo"
                            />
                        </Modal>
                    )}
                </Suspense>
            </SafeAreaView>
        </RouteGuard>
    );
}

// --- SUB-COMPONENTS (Replicated from UserRealm) ---

const ActionBtn = ({ label, icon, onPress, color, textColor = "text-white" }) => (
    <TouchableOpacity 
        onPress={onPress} 
        activeOpacity={0.7}
        // h-[40px] gives you the exact "Admin" button height from the web
        // rounded-xl (12px) matches the modern Next.js look
        className={`${color} h-[40px] flex-row items-center justify-center px-4 rounded-xl active:scale-95 shadow-sm w-[48.5%] md:w-auto md:px-5`}
    >
        {icon && <View className="mr-2">{icon}</View>}
        
        <Text 
            // Using a fixed line-height ensures the text doesn't 
            // shift up or down based on the font family
            className={`${textColor} font-medium text-[14px] leading-[20px] tracking-tight`}
        >
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
        // iOS Shadow (The deep spread in your screenshot)
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        
        // Android Shadow (The "lift")
        elevation: 10,
    }}
>
        {/* HTML: <div class="flex justify-between items-start"> */}
        <View className="flex-row justify-between items-start">
            {/* HTML: <h4 class="font-bold pr-4 text-gray-600"> */}
            <Text className="font-bold text-gray-600 flex-1 pr-4">{title}</Text>
            
            {/* HTML: <div class="flex-shrink-0 text-emerald-600"> */}
            <View className="flex-shrink-0">
                {IconComponent && <IconComponent size={32} color={iconColor} />}
            </View>
        </View>

        {/* HTML: <div class="flex-grow"> */}
        <View className="flex-1">
            {/* HTML: <p class="text-4xl font-bold mt-2 text-emerald-600"> */}
            <Text className={`text-4xl font-bold mt-2 ${color}`}>
                {value}
            </Text>
            
            {/* HTML: <p class="text-xs mt-1 font-bold text-slate-400"> */}
            <Text className="text-xs mt-1 font-bold text-slate-400">
                {subtext}
            </Text>
        </View>

        {/* HTML: <span class="text-indigo-600 text-sm mt-3 inline-block"> */}
        <Text className="text-indigo-600 text-sm mt-3 font-medium">
            {linkText}
        </Text>
    </TouchableOpacity>
);