"use client";

import { useState, Suspense, useContext, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { AppContext } from '@/src/context/AppContext.jsx';
import { collection, doc, serverTimestamp, writeBatch, deleteDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/src/config/firebase-config.js";
import { toast } from 'react-hot-toast';

// --- AUTH & SECURITY ---
import RouteGuard from "@/src/components/auth/RouteGuard";

// --- SHARED SYSTEM ---
import { useRealmData } from "@/src/hooks/useRealmData.js";
import { Icons, Btn, DashboardCard } from "@/src/components/realm/RealmSharedUI.jsx";

// UnifiedLoadingWidget
import UnifiedLoadingWidget from "@/src/components/ui/UnifiedLoadingWidget";

// --- DYNAMIC WIDGETS ---
const Modal = dynamic(() => import("@/src/components/ui/Modal.jsx"), { 
    ssr: false,
    loading: () => <UnifiedLoadingWidget type="section" message="Opening Portal..." />
});
const AdminUserTableWidget = dynamic(() => import("@/src/components/management/AdminUserTableWidget"), { ssr: false });
const UnifiedTransactionsListWidget = dynamic(() => import("@/src/components/finance/UnifiedTransactionsListWidget"), { ssr: false });
const UnifiedReportChartWidget = dynamic(() => import("@/src/components/analytics/UnifiedReportChartWidget"), { ssr: false });
const UnifiedCorporateLedgerWidget = dynamic(() => import("@/src/components/management/UnifiedCorporateLedgerWidget"), { ssr: false });
const UnifiedManagerWidget = dynamic(() => import("@/src/components/management/UnifiedManagerWidget"), { ssr: false });

const ADMIN_REPORT_CONFIG = {
    filterFn: () => true,
    columnLabels: ["Subscriber", "Plan / Method"],
    getMainLabel: (tx) => tx.subscriber || "Unknown",
    getSubLabel: (tx) => `${String(tx.plan).toUpperCase()} • ${tx.method} • Ref: ${tx.ref}`,
};

const getPlanValue = (plan = 'monthly', type = 'company') => {
    if (type === 'company') return plan === 'yearly' ? 15000.00 : 1500.00;
    return plan === 'yearly' ? 5000.00 : 500.00;
};

export default function AdminDashboard({ onBack }) {
    const context = useContext(AppContext) || {}; 
    const { user, refreshUserData } = context;

    const [modals, setModals] = useState({ revenue: false, entities: false, reports: false, manageTeam: false, autoApproval: false });
    const [mounted, setMounted] = useState(false);
    const [realtimeUsers, setRealtimeUsers] = useState([]);

    useEffect(() => { setMounted(true); }, []);

    const { 
        users: initialUsers = [], 
        premiums = [], 
        loading, 
        totalFunds = 0, 
        report, 
        period, 
        setPeriod, 
        refresh 
    } = useRealmData(user, 'admin');

    // 🛰️ REAL-TIME FIRESTORE LISTENER FOR INSTANT POP-UPS
    useEffect(() => {
        if (!db || !mounted) return;

        const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
            const liveUsers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRealtimeUsers(liveUsers);
        }, (err) => console.error("Realtime users listener error:", err));

        return () => unsub();
    }, [mounted]);

    // Use live stream users if available, falling back to hook users
    const displayUsers = realtimeUsers.length > 0 ? realtimeUsers : initialUsers;

    const pendingUsers = useMemo(() => {
        return displayUsers.filter(u => u.subscription_status === 'pending_approval' || u.family_subscription_status === 'pending_approval');
    }, [displayUsers]);

    // 🚀 REAL-TIME AUTO POP-UP: Opens the modal immediately when a user requests access from another window
    useEffect(() => {
        if (pendingUsers.length > 0) {
            setModals(prev => ({ ...prev, autoApproval: true }));
        }
    }, [pendingUsers.length]);

    const adminDisplayName = useMemo(() => {
        const lastName = user?.full_name ? user.full_name.trim().split(' ').pop() : 'Admin';
        return `${lastName}`;
    }, [user]);

    const handleTogglePremium = async (userId, action, type) => {
        try {
            const batch = writeBatch(db);
            const userRef = doc(db, "users", userId);
            const isGranting = action === 'grant' || action === 'approve';
            const userObj = displayUsers.find(u => u.id === userId);

            const effectivePlan = (type === 'company' ? userObj?.premium_plan : userObj?.family_premium_plan) || 'monthly';

            const updates = {};

            if (type === 'company') {
                updates.is_premium = isGranting;
                updates.subscription_status = isGranting ? 'active' : 'none';
                if (isGranting) {
                    updates.premium_granted_at = serverTimestamp();
                    updates.premium_plan = effectivePlan;
                }
            } else {
                updates.is_family_premium = isGranting;
                updates.family_subscription_status = isGranting ? 'active' : 'none';
                if (isGranting) {
                    updates.family_premium_granted_at = serverTimestamp();
                    updates.family_premium_plan = effectivePlan;
                }
            }

            batch.update(userRef, updates);

            // Only record revenue when approving a real request
            if (action === 'approve') {
                const amount = getPlanValue(effectivePlan, type);
                const premiumRef = doc(collection(db, "premiums"));
                
                if (type === 'company') updates.active_company_premium_id = premiumRef.id;
                else updates.active_family_premium_id = premiumRef.id;

                batch.set(premiumRef, {
                    user_id: userId,
                    email: userObj?.email || "unknown",
                    amount: amount,
                    access_type: type,
                    granted_at: serverTimestamp(),
                    payment_ref: userObj?.payment_ref || 'VERIFIED_PAYMENT',
                    plan_cycle: effectivePlan,
                    payment_method: userObj?.payment_method || 'Verified Payment'
                });
            }

            await batch.commit();
            toast.success(isGranting ? `Activated ${type.toUpperCase()} Access` : `Revoked ${type.toUpperCase()} Access`);
            if (refresh) refresh(); 
            if (userId === user?.id && refreshUserData) refreshUserData();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update access rights");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Remove this user record from the database?")) return;
        try {
            await deleteDoc(doc(db, "users", userId));
            toast.success("User record removed");
            if (refresh) refresh();
        } catch (err) {
            toast.error("Failed to remove user record");
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
                        <button 
                            onClick={onBack} 
                            className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 text-sm font-medium hover:border-indigo-300 hover:text-indigo-600 transition-all mb-4 w-fit shadow-sm active:scale-95"
                        >
                            <span className="group-hover:-translate-x-0.5 transition-transform">{Icons.Back}</span>
                            <span>Back to Personal</span>
                        </button>

                        <div className="flex items-center gap-4">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left">
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
                        value={displayUsers.length} 
                        subtext={`${pendingUsers.length} Pending Approvals`} 
                        linkText="Review Access" 
                        onClick={() => setModals({ ...modals, entities: true })} 
                        icon={Icons.Entities} 
                        colorClass="text-indigo-600" 
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
                    {/* ⚡ REAL-TIME EXECUTIVE APPROVAL MODAL */}
                    {modals.autoApproval && pendingUsers.length > 0 && (
                        <Modal isOpen={modals.autoApproval} onClose={() => setModals({ ...modals, autoApproval: false })} title="⚡ Executive Action Required">
                            <div className="p-2 text-center space-y-4">
                                <p className="text-xs font-bold text-amber-600 bg-amber-50 py-1.5 px-3 rounded-full border border-amber-200 inline-block uppercase tracking-wider">
                                    {pendingUsers.length} Pending Access Request(s)
                                </p>

                                <div className="space-y-3 max-h-60 overflow-y-auto text-left">
                                    {pendingUsers.map(u => {
                                        const type = u.subscription_status === 'pending_approval' ? 'company' : 'family';
                                        const plan = (type === 'company' ? u.premium_plan : u.family_premium_plan) || 'monthly';
                                        return (
                                            <div key={u.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center">
                                                <div>
                                                    <p className="font-extrabold text-slate-800 text-sm">{u.full_name}</p>
                                                    <p className="text-xs text-slate-500">{u.email}</p>
                                                    <p className="text-[10px] font-bold text-indigo-600 uppercase mt-1">
                                                        Requesting: {type} ({plan})
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        handleTogglePremium(u.id, 'approve', type);
                                                        setModals({ ...modals, autoApproval: false });
                                                    }}
                                                    className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-emerald-700 active:scale-95 transition-all"
                                                >
                                                    Approve Payment &rarr;
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                <button 
                                    onClick={() => {
                                        setModals({ ...modals, autoApproval: false, entities: true });
                                    }}
                                    className="text-xs font-bold text-indigo-600 underline pt-2 hover:text-indigo-800"
                                >
                                    Open Full Entity Access Manager
                                </button>
                            </div>
                        </Modal>
                    )}

                    {modals.revenue && (
                        <Modal isOpen={modals.revenue} onClose={() => setModals({ ...modals, revenue: false })} title="Revenue Ledger">
                            <UnifiedTransactionsListWidget adminMode={true} />
                        </Modal>
                    )}
                    
                    {modals.entities && (
                        <Modal isOpen={modals.entities} onClose={() => setModals({ ...modals, entities: false })} title="Entity Access Management">
                            <AdminUserTableWidget 
                                users={displayUsers} 
                                type="entity" 
                                onTogglePremium={handleTogglePremium} 
                                onDeleteUser={handleDeleteUser}
                                headerText="Manage System Access Rights" 
                            />
                        </Modal>
                    )}
                    
                    {modals.reports && (
                        <Modal isOpen={modals.reports} onClose={() => setModals({ ...modals, reports: false })} title="Financial Reports">
                            <UnifiedCorporateLedgerWidget 
                                transactions={premiums.map(p => {
                                    const u = displayUsers.find(usr => usr.id === p.user_id);
                                    return { 
                                        ...p, 
                                        created_at: p.granted_at, 
                                        subscriber: u?.full_name || u?.email || "Unknown", 
                                        plan: String(p.plan_cycle || 'monthly').toUpperCase(), 
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