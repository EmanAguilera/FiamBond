"use client";

import React, { useState, useContext, useMemo } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  RefreshControl,
  Alert 
} from "react-native";
import { AppContext } from '../../context/AppContext';
import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "../../config/firebase-config";

// --- SYSTEM ---
import { useRealmData } from "../../hooks/useRealmData";
import { Icons, Btn, DashboardCard } from "../../components/realm/RealmSharedUI";
import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";
import Modal from "../../components/ui/Modal";

// --- DYNAMIC WIDGETS ---
import AdminUserTableWidget from "../../components/management/AdminUserTableWidget";
import UnifiedTransactionsListWidget from "../../components/finance/UnifiedTransactionsListWidget";
import UnifiedReportChartWidget from "../../components/analytics/UnifiedReportChartWidget";
import UnifiedCorporateLedgerWidget from "../../components/management/UnifiedCorporateLedgerWidget";
import UnifiedManagerWidget from "../../components/management/UnifiedManagerWidget";

const getPlanValue = (plan, type = 'company') => {
    if (type === 'company') return plan === 'yearly' ? 15000.00 : 1500.00;
    return plan === 'yearly' ? 5000.00 : 500.00;
};

export default function AdminDashboardScreen({ onBack }) {
    // Standard JSX Context access
    const context = useContext(AppContext);
    
    // Use optional chaining to prevent crashes if context is null
    const user = context?.user;
    const refreshUserData = context?.refreshUserData;

    const [modals, setModals] = useState({ 
        revenue: false, 
        entities: false, 
        reports: false, 
        manageTeam: false 
    });

    const { 
        users = [], 
        premiums = [], 
        loading, 
        refreshing,
        totalFunds = 0, 
        pendingCount = 0, 
        report, 
        period, 
        setPeriod, 
        refresh 
    } = useRealmData(user, 'admin');

    const adminDisplayName = useMemo(() => {
        const lastName = user?.full_name ? user.full_name.trim().split(' ').pop() : 'Admin';
        return `${lastName}`;
    }, [user]);

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

            if (isGranting && premiumRef) {
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
            if (userId === user?.uid && refreshUserData) refreshUserData();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Critical: Failed to update access rights");
        }
    };

    if (loading && !refreshing) return (
        <UnifiedLoadingWidget 
            type="fullscreen" 
            message="Syncing Admin Realm Matrix..." 
            variant="indigo" 
        />
    );

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <ScrollView 
                className="flex-1 px-4 pt-4"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#4F46E5" />
                }
            >
                {/* --- HEADER --- */}
                <View className="mb-6">
                    <TouchableOpacity 
                        onPress={onBack} 
                        className="flex-row items-center bg-white border border-slate-200 px-3 py-2 rounded-xl w-32 mb-6"
                    >
                        <Text className="text-slate-500 mr-2">{Icons.Back}</Text>
                        <Text className="text-slate-500 font-bold text-xs">EXIT REALM</Text>
                    </TouchableOpacity>

                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <View className="w-1.5 h-12 bg-purple-600 rounded-full mr-4 shadow-lg shadow-purple-300" />
                            <View>
                                <Text className="text-3xl font-black text-slate-900 tracking-tighter">
                                    {adminDisplayName}
                                </Text>
                                <Text className="text-purple-600 font-black text-[10px] uppercase tracking-[2px]">
                                    System Administrator
                                </Text>
                            </View>
                        </View>
                        
                        <TouchableOpacity 
                            onPress={() => setModals({ ...modals, manageTeam: true })}
                            className="bg-purple-100 p-3 rounded-2xl"
                        >
                            <Text className="text-purple-700 font-bold text-xs">TEAM</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* --- DASHBOARD CARDS --- */}
                <View className="flex-row flex-wrap justify-between mb-6">
                    <View className="w-[48%] mb-4">
                        <DashboardCard 
                            title="Admin Funds" 
                            value={`₱${(totalFunds || 0).toLocaleString()}`} 
                            subtext="Total Inflow" 
                            onClick={() => setModals({ ...modals, revenue: true })} 
                            icon={Icons.Money} 
                            colorClass="text-emerald-600" 
                        />
                    </View>
                    <View className="w-[48%] mb-4">
                        <DashboardCard 
                            title="User Access" 
                            value={users.length} 
                            subtext={pendingCount > 0 ? `⚠️ ${pendingCount} PENDING` : "Stable"} 
                            onClick={() => setModals({ ...modals, entities: true })} 
                            icon={Icons.Entities} 
                            colorClass={pendingCount > 0 ? "text-amber-600" : "text-indigo-600"} 
                            isAlert={pendingCount > 0} 
                        />
                    </View>
                    <View className="w-full">
                        <DashboardCard 
                            title="Revenue Reports" 
                            value="Ledger" 
                            subtext="Subscription Tracking" 
                            onClick={() => setModals({ ...modals, reports: true })} 
                            icon={Icons.Report} 
                            colorClass="text-emerald-600" 
                        />
                    </View>
                </View>

                {/* --- ANALYTICS WIDGET --- */}
                <View className="mb-10">
                    <UnifiedReportChartWidget 
                        report={report} 
                        realm="admin" 
                        period={period} 
                        setPeriod={setPeriod} 
                    />
                </View>
            </ScrollView>

            {/* --- MODALS --- */}
            <Modal 
                isOpen={modals.revenue} 
                onClose={() => setModals({ ...modals, revenue: false })} 
                title="Revenue Ledger"
            >
                <UnifiedTransactionsListWidget adminMode={true} />
            </Modal>

            <Modal 
                isOpen={modals.entities} 
                onClose={() => setModals({ ...modals, entities: false })} 
                title="Entity Management"
            >
                <AdminUserTableWidget 
                    users={users} 
                    onTogglePremium={handleTogglePremium} 
                />
            </Modal>

            <Modal 
                isOpen={modals.reports} 
                onClose={() => setModals({ ...modals, reports: false })} 
                title="Financial Reports"
            >
                <UnifiedCorporateLedgerWidget 
                    transactions={premiums} 
                    brandName="FiamBond Admin"
                />
            </Modal>

            <Modal 
                isOpen={modals.manageTeam} 
                onClose={() => setModals({ ...modals, manageTeam: false })} 
                title="Admin Directory"
            >
                <UnifiedManagerWidget type="admin" onUpdate={refresh} />
            </Modal>
        </SafeAreaView>
    );
}