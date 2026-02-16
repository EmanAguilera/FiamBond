"use client";

import { useState, Suspense, useContext, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { AppContext } from '../../context/AppContext.jsx';
import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "../../config/firebase-config.js";
import { toast } from 'react-hot-toast';

// --- AUTH & SECURITY ---
import RouteGuard from "../../components/auth/RouteGuard";

// --- SHARED SYSTEM ---
import { useRealmData } from "../../hooks/useRealmData.js";
import { Icons, Btn, DashboardCard } from "../../components/realm/RealmSharedUI.jsx";

// ⭐️ INTEGRATION: Using specific UnifiedLoadingWidget
import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";

// --- DYNAMIC WIDGETS ---
const Modal = dynamic(() => import("../../components/ui/Modal.jsx"), { 
    ssr: false,
    loading: () => <UnifiedLoadingWidget type="section" message="Opening Portal..." />
});
const AdminUserTableWidget = dynamic(() => import("../../components/management/AdminUserTableWidget"), { ssr: false });
const UnifiedTransactionsListWidget = dynamic(() => import("../../components/finance/UnifiedTransactionsListWidget"), { ssr: false });
const UnifiedReportChartWidget = dynamic(() => import("../../components/analytics/UnifiedReportChartWidget"), { ssr: false });
const UnifiedCorporateLedgerWidget = dynamic(() => import("../../components/management/UnifiedCorporateLedgerWidget"), { ssr: false });
const UnifiedManagerWidget = dynamic(() => import("../../components/management/UnifiedManagerWidget"), { ssr: false });

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

export default function AdminDashboard({ onBack }) {
    const context = useContext(AppContext) || {}; 
    const { user, refreshUserData } = context;

    const [modals, setModals] = useState({ revenue: false, entities: false, reports: false, manageTeam: false });
    const [mounted, setMounted] = useState(false);

    useEffect(() => { 
        setMounted(true); 
    }, []);

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

    // Branding logic consistent with Company/Family Realms
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
            toast.success("System Access Updated");
            if (refresh) refresh(); 
            if (userId === user?.id && refreshUserData) refreshUserData();
        } catch (error) {
            console.error(error);
            toast.error("Critical: Failed to update access rights");
        }
    };

    if (!mounted || loading || !context) return (
        <UnifiedLoadingWidget 
            type="fullscreen" 
            message="Syncing Admin Realm Matrix..." 
            variant="indigo" 
        />
    );

    return (
        <RouteGuard require="admin">
            <div className="w-full">
                {/* --- HEADER --- */}
                <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex flex-col gap-1 text-left">
                        {/* ⭐️ FIXED: Back button now matches Family/Company Realm exactly */}
                        <button 
                            onClick={onBack} 
                            className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 text-sm font-medium hover:border-indigo-300 hover:text-indigo-600 transition-all mb-4 w-fit shadow-sm active:scale-95"
                        >
                            <span className="group-hover:-translate-x-0.5 transition-transform">{Icons.Back}</span>
                            <span>Back to Personal</span>
                        </button>

                        <div className="flex items-center gap-4">
                            {/* ⭐️ Consistency with Purple accent for Admin */}
                            <div className="w-1 h-12 bg-purple-600 rounded-full opacity-80 shadow-[0_0_10px_rgba(147,51,234,0.3)]"></div>
                            <div>
                                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">
                                    {adminDisplayName}
                                </h1>
                                <p className="text-slate-500 font-bold text-xs mt-1 uppercase tracking-[0.2em]">
                                    Admin Realm 
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Btn onClick={() => setModals({ ...modals, manageTeam: true })} type="admin" icon={Icons.Plus}>
                            Manage Team
                        </Btn>
                    </div>
                </header>

                {/* --- DASHBOARD CARDS --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <DashboardCard 
                        title="Admin Funds" 
                        value={`₱${(totalFunds || 0).toLocaleString()}`} 
                        subtext="Total System Inflow" 
                        linkText="View Transactions" 
                        onClick={() => setModals({ ...modals, revenue: true })} 
                        icon={Icons.Money} 
                        colorClass="text-emerald-600" 
                    />
                    <DashboardCard 
                        title="User Access" 
                        value={users.length} 
                        subtext={pendingCount > 0 ? `⚠️ ${pendingCount} PENDING` : "System Stable"} 
                        linkText="Review Access" 
                        onClick={() => setModals({ ...modals, entities: true })} 
                        icon={Icons.Entities} 
                        colorClass={pendingCount > 0 ? "text-amber-600" : "text-indigo-600"} 
                        isAlert={pendingCount > 0} 
                    />
                    <DashboardCard 
                        title="Revenue Reports" 
                        value="Export" 
                        subtext="Subscription Ledger" 
                        linkText="Manage Reports" 
                        onClick={() => setModals({ ...modals, reports: true })} 
                        icon={Icons.Report} 
                        colorClass="text-emerald-600" 
                    />
                </div>

                <Suspense fallback={<UnifiedLoadingWidget type="section" message="Loading Analytics..." />}>
                    <UnifiedReportChartWidget 
                        report={report} 
                        realm="admin" 
                        period={period} 
                        setPeriod={setPeriod} 
                    />
                </Suspense>

                {/* --- MODALS --- */}
                <Suspense fallback={null}>
                    {modals.revenue && (
                        <Modal isOpen={modals.revenue} onClose={() => setModals({ ...modals, revenue: false })} title="Revenue Ledger">
                            <UnifiedTransactionsListWidget adminMode={true} />
                        </Modal>
                    )}
                    
                    {modals.entities && (
                        <Modal isOpen={modals.entities} onClose={() => setModals({ ...modals, entities: false })} title="Entity Management">
                            <AdminUserTableWidget 
                                users={users} 
                                type="entity" 
                                onTogglePremium={handleTogglePremium} 
                                headerText={pendingCount > 0 ? "⚠️ Approval Needed" : "Manage Access Rights"} 
                            />
                        </Modal>
                    )}
                    
                    {modals.reports && (
                        <Modal isOpen={modals.reports} onClose={() => setModals({ ...modals, reports: false })} title="Financial Reports">
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
                        <Modal isOpen={modals.manageTeam} onClose={() => setModals({ ...modals, manageTeam: false })} title="Admin Team Directory">
                            <UnifiedManagerWidget 
                                type="admin" 
                                mode="directory" 
                                onUpdate={refresh} 
                            />
                        </Modal>
                    )}
                </Suspense>
            </div>
        </RouteGuard>
    );
}