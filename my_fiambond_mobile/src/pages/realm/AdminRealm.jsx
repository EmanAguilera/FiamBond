'use client';

import React, { useContext, useState, useEffect, Suspense, lazy, useMemo } from "react";
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
    Shield, 
    Plus, 
    Users, 
    ArrowLeft, 
    Wallet, 
    FileText, 
    Printer,
    Users2,
    Activity
} from "lucide-react-native";

// Context & Logic
import { AppContext } from "../../context/AppContext";
import { db } from "../../config/firebase-config.js";
import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { useRealmData } from "../../hooks/useRealmData.js";
import RouteGuard from "../../components/auth/RouteGuard";

// UI Components
import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";
import { Icons } from "../../components/realm/RealmSharedUI";

// Lazy Loaded Widgets
const Modal = lazy(() => import("../../components/ui/Modal.jsx"));
const AdminUserTableWidget = lazy(() => import("../../components/management/AdminUserTableWidget"));
const UnifiedTransactionsListWidget = lazy(() => import("../../components/finance/UnifiedTransactionsListWidget.tsx"));
const UnifiedReportChartWidget = lazy(() => import("../../components/analytics/UnifiedReportChartWidget.jsx"));
const UnifiedCorporateLedgerWidget = lazy(() => import("../../components/management/UnifiedCorporateLedgerWidget"));
const UnifiedManagerWidget = lazy(() => import("../../components/management/UnifiedManagerWidget.tsx"));

// Constants from Next.js version
const ADMIN_REPORT_CONFIG = {
    filterFn: () => true,
    columnLabels: ["Subscriber", "Plan / Method"],
    getMainLabel: (tx) => tx.subscriber || "Unknown",
    getSubLabel: (tx) => `${String(tx.plan).toUpperCase()} • ${tx.method} • Ref: ${tx.ref}`,
};

const getPlanValue = (plan, type = 'company') => {
    if (type === 'company') return plan === 'yearly' ? 15000.00 : 1500.00;
    return plan === 'yearly' ? 5000.00 : 500.00;
};

export default function AdminRealm({ onBack }) {
    const { user, refreshUserData } = useContext(AppContext);
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const [mounted, setMounted] = useState(false);

    // Modal State
    const [modals, setModals] = useState({ 
        revenue: false, 
        entities: false, 
        reports: false, 
        manageTeam: false 
    });

    const toggleModal = (key, val) => setModals(prev => ({ ...prev, [key]: val }));

    // Data Hook - Scoped to Admin
    const { 
        users = [], 
        premiums = [], 
        loading, 
        totalFunds = 0, 
        pendingCount = 0, 
        report, 
        period, 
        setPeriod, 
        refresh 
    } = useRealmData(user, 'admin');

    useEffect(() => { setMounted(true); }, []);

    // Branding logic consistent with web
    const adminDisplayName = useMemo(() => {
        const lastName = user?.full_name ? user.full_name.trim().split(' ').pop() : 'Admin';
        return `${lastName}`;
    }, [user]);

    // Firestore Logic (Ported from Next.js)
    const handleTogglePremium = async (userId, action, type) => {
        try {
            const batch = writeBatch(db);
            const userRef = doc(db, "users", userId);
            const isGranting = action === 'grant' || action === 'approve';
            const userObj = users.find(u => u.id === userId);

            const updates = {};
            let premiumRef;

            if (type === 'company') {
                updates.is_premium = isGranting;
                updates.subscription_status = isGranting ? 'active' : 'none';
                if (isGranting) {
                    updates.premium_granted_at = serverTimestamp();
                    premiumRef = doc(collection(db, "premiums"));
                    updates.active_company_premium_id = premiumRef.id;
                }
            } else {
                updates.is_family_premium = isGranting;
                updates.family_subscription_status = isGranting ? 'active' : 'none';
                if (isGranting) {
                    updates.family_premium_granted_at = serverTimestamp();
                    premiumRef = doc(collection(db, "premiums"));
                    updates.active_family_premium_id = premiumRef.id;
                }
            }

            batch.update(userRef, updates);

            if (isGranting) {
                batch.set(premiumRef, {
                    user_id: userId,
                    email: userObj?.email || "unknown",
                    amount: getPlanValue(userObj?.premium_plan || 'monthly', type),
                    access_type: type,
                    granted_at: serverTimestamp(),
                    payment_ref: userObj?.payment_ref || 'ADMIN_GRANT',
                    plan_cycle: userObj?.premium_plan || 'monthly',
                    payment_method: userObj?.payment_method || 'Admin Direct'
                });
            }

            await batch.commit();
            Alert.alert("Success", "System Access Updated");
            if (refresh) refresh(); 
            if (userId === user?.id && refreshUserData) refreshUserData();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to update access rights");
        }
    };

    if (!mounted || loading) return <UnifiedLoadingWidget type="fullscreen" message="Syncing Admin Matrix..." />;

    return (
        <RouteGuard require="admin">
            <SafeAreaView className="flex-1 bg-slate-50">
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
                    <View className="w-full px-6 md:px-10 pt-6">
                        
                        {/* --- BACK NAVIGATION --- */}
                        <TouchableOpacity 
                            onPress={() => onBack && onBack()} 
                            className="flex-row items-center px-3 py-1.5 rounded-lg bg-white border border-slate-200 mb-6 self-start shadow-sm active:scale-95"
                        >
                            <ArrowLeft size={16} color="#64748b" strokeWidth={2} />
                             <Text className="ml-2 text-slate-500 text-sm font-medium">Back to Personal</Text>
                        </TouchableOpacity>

                        {/* --- HEADER --- */}
                        <View className="flex-col md:flex-row md:justify-between md:items-end mb-10 gap-y-8">
                            
                            <View className="flex-row items-center">
                                {/* Purple Accent for Admin */}
                                <View className="w-1 h-12 bg-indigo-600 rounded-full mr-4 opacity-80 shadow-sm" />
                                <View>
                                   <Text className="text-3xl font-black text-slate-800 tracking-tighter">
                                        {adminDisplayName}
                                    </Text>
                                   <Text className="text-slate-500 font-bold text-xs uppercase tracking-[3px] mt-1">
                                        ADMIN REALM
                                    </Text>
                                </View>
                            </View>

                            <View className="w-full md:w-auto">
                                <View className="flex-row flex-wrap justify-between md:justify-end items-center gap-y-3 md:gap-x-3">
                                    <ActionBtn 
                                        label="Manage Team" 
                                        icon={<Users size={16} color="white" />} 
                                        color="bg-purple-600" 
                                        onPress={() => toggleModal('manageTeam', true)} 
                                    />
                                    {/* Placeholder for future admin quick actions to maintain 2x2 grid if needed */}
                                    <ActionBtn 
                                        label="System Log" 
                                        icon={<Activity size={16} color="#475569" />} 
                                        color="bg-white border border-slate-200" 
                                        textColor="text-slate-600"
                                        onPress={() => Alert.alert("Logs", "System activity is stable.")} 
                                    />
                                </View>
                            </View>
                        </View>

                        {/* --- DASHBOARD CARDS --- */}
                        <View className="flex-col md:flex-row gap-6 mb-10">
                            <DashboardCard
                                title="Admin Funds"
                                value={`₱${(totalFunds || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                subtext="Total System Inflow"
                                linkText="View Transactions →"
                                color="text-emerald-600"
                                icon={Icons.Money}
                                iconColor="#059669"
                                onPress={() => toggleModal('revenue', true)}
                            />
                            <DashboardCard
                                title="User Access"
                                value={users.length}
                                subtext={pendingCount > 0 ? `⚠️ ${pendingCount} PENDING` : "System Stable"}
                                linkText="Review Access →"
                                color={pendingCount > 0 ? "text-amber-600" : "text-indigo-600"}
                                icon={Icons.Entities}
                                iconColor={pendingCount > 0 ? "#d97706" : "#4f46e5"}
                                onPress={() => toggleModal('entities', true)}
                            />
                            <DashboardCard
                                title="Revenue Reports"
                                value="Export"
                                subtext="Subscription Ledger"
                                linkText="Manage Reports →"
                                color="text-emerald-600"
                                icon={Icons.Report}
                                iconColor="#059669"
                                onPress={() => toggleModal('reports', true)}
                            />
                        </View>

                        {/* --- ANALYTICS --- */}
                        <Suspense fallback={<UnifiedLoadingWidget type="section" />}>
                            <UnifiedReportChartWidget 
                                report={report} 
                                realm="admin" 
                                period={period} 
                                setPeriod={setPeriod} 
                            />
                        </Suspense>

                    </View>
                </ScrollView>

                {/* MODALS */}
                <Suspense fallback={null}>
                    {modals.revenue && (
                        <Modal isOpen={modals.revenue} onClose={() => toggleModal('revenue', false)} title="Revenue Ledger">
                            <UnifiedTransactionsListWidget adminMode={true} />
                        </Modal>
                    )}
                    
                    {modals.entities && (
                        <Modal isOpen={modals.entities} onClose={() => toggleModal('entities', false)} title="Entity Management">
                            <AdminUserTableWidget 
                                users={users} 
                                type="entity" 
                                onTogglePremium={handleTogglePremium} 
                                headerText={pendingCount > 0 ? "⚠️ Approval Needed" : "Manage Access Rights"} 
                            />
                        </Modal>
                    )}
                    
                    {modals.reports && (
                        <Modal isOpen={modals.reports} onClose={() => toggleModal('reports', false)} title="Financial Reports">
                            <UnifiedCorporateLedgerWidget 
                                transactions={premiums.map(p => {
                                    const u = users.find(usr => usr.id === p.user_id);
                                    return { 
                                        ...p, 
                                        created_at: p.granted_at, 
                                        subscriber: u?.full_name || u?.email || "Unknown", 
                                        plan: p.plan_cycle || 'monthly', 
                                        method: p.payment_method || 'System',
                                        ref: p.payment_ref || 'N/A'
                                    };
                                })} 
                                config={ADMIN_REPORT_CONFIG}
                                brandName="FiamBond Admin"
                                reportType="Revenue Report"
                                filenamePrefix="Revenue_Ledger"
                                themeColor="emerald" 
                            />
                        </Modal>
                    )}

                    {modals.manageTeam && (
                        <Modal isOpen={modals.manageTeam} onClose={() => toggleModal('manageTeam', false)} title="Admin Team Directory">
                            <UnifiedManagerWidget 
                                type="admin" 
                                mode="directory" 
                                onUpdate={refresh} 
                            />
                        </Modal>
                    )}
                </Suspense>
            </SafeAreaView>
        </RouteGuard>
    );
}

// --- SHARED SUB-COMPONENTS (Exact replica of UserRealm UI) ---

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