'use client'; 

import { useContext, useState, useMemo, Suspense, useEffect } from "react";
import dynamic from 'next/dynamic';
import { AppContext } from "../../context/AppContext.jsx";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase-config.js";

// Guard & Shared Resources
import RouteGuard from "../../components/auth/RouteGuard.tsx"; 
import { Icons, Btn, DashboardCard } from "../../components/realm/RealmSharedUI.jsx";
import { useRealmData } from "../../hooks/useRealmData.js";

// ⭐️ INTEGRATION: Using UnifiedLoadingWidget
import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";

// Additional Icon for Admin
const AdminIcon = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>;

// Dynamic Imports with Section Loading
const Modal = dynamic(() => import("../../components/ui/Modal.jsx"), { 
    ssr: false,
    loading: () => <UnifiedLoadingWidget type="section" message="Preparing view..." />
});
const LoanTrackingWidget = dynamic(() => import("../../components/loan/LoanTrackingWidget.tsx"), { ssr: false });
const RecordLoanFlowWidget = dynamic(() => import("../../components/loan/RecordLoanFlowWidget.tsx"), { ssr: false });
const FamilyRealm = dynamic(() => import("./FamilyRealm.jsx"), { ssr: false });
const CompanyRealm = dynamic(() => import("./CompanyRealm.jsx"), { ssr: false });
const ApplyPremiumWidget = dynamic(() => import("../../components/management/ApplyPremiumWidget"), { ssr: false });
const CreateUnifiedTransactionWidget = dynamic(() => import('../../components/finance/CreateUnifiedTransactionWidget.tsx'), { ssr: false });
const CreateUnifiedGoalWidget = dynamic(() => import("../../components/goal/CreateUnifiedGoalWidget.tsx"), { ssr: false });
const UnifiedTransactionsListWidget = dynamic(() => import('../../components/finance/UnifiedTransactionsListWidget.tsx'), { ssr: false });
const UnifiedGoalListWidget = dynamic(() => import("../../components/goal/UnifiedGoalListWidget.tsx"), { ssr: false });
const UnifiedManagerWidget = dynamic(() => import("../../components/management/UnifiedManagerWidget.tsx"), { ssr: false });
const UnifiedReportChartWidget = dynamic(() => import("../../components/analytics/UnifiedReportChartWidget.jsx"), { ssr: false });

export default function UserDashboard({ onEnterFamily, onEnterCompany, onEnterAdmin }) {
    // ⭐️ FIX 1: Defensive Context Access
    const context = useContext(AppContext) || {};
    const { user, refreshUserData, loading: authLoading } = context;
    
    // ⭐️ FIX 2: Mounted Guard
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    // State management
    const [modals, setModals] = useState({
        transactions: false, goals: false, families: false, lending: false,
        createTx: false, createGoal: false, recordLoan: false, applyCompany: false, applyFamily: false
    });
    
    const [activeFamilyRealm, setActiveFamilyRealm] = useState(null);
    const [showCompanyRealm, setShowCompanyRealm] = useState(false);

    // Realm Data Hook
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
            alert("Success! Request submitted.");
            if (refreshUserData) refreshUserData();
        } catch (err) { alert("Failed to submit request."); }
    };

    // ⭐️ Updated Loading State using UnifiedLoadingWidget
    if (!mounted || !user) {
        return (
            <UnifiedLoadingWidget 
                type="fullscreen" 
                message="Syncing Personal Realm..." 
                variant="indigo" 
            />
        );
    }

    if (activeFamilyRealm) return <Suspense fallback={<UnifiedLoadingWidget type="fullscreen" message="Entering Family Realm..." />}><FamilyRealm family={activeFamilyRealm} onBack={() => setActiveFamilyRealm(null)} onDataChange={refresh} /></Suspense>;
    if (showCompanyRealm) return <Suspense fallback={<UnifiedLoadingWidget type="fullscreen" message="Entering Company Realm..." />}><CompanyRealm company={{ id: user?.uid, name: "Company" }} onBack={() => setShowCompanyRealm(false)} onDataChange={refresh} /></Suspense>;

    return (
        <RouteGuard require="auth">
            <div className="w-full">
                {error && <div className="mb-4 p-3 bg-rose-100 text-rose-700 rounded-xl text-xs font-bold text-center border border-rose-200">⚠️ Connection Error: Ensure backend is running.</div>}

                <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 text-left">
                    <div className="flex items-center gap-4">
                        <div className="w-1 h-12 bg-indigo-600 rounded-full opacity-80 shadow-[0_0_10px_rgba(79,70,229,0.3)]"></div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">{userLastName}</h1>
                            <p className="text-slate-500 font-bold text-xs mt-1 uppercase tracking-[0.2em]">Personal Realm</p>
                        </div>
                    </div>

                    <div className="w-full md:w-auto">
                        <div className="grid grid-cols-2 gap-3 md:flex md:items-center">
                            {isAdmin && (
                                <Btn 
                                    onClick={onEnterAdmin} 
                                    type="pri" 
                                    icon={AdminIcon} 
                                    className="bg-purple-600 hover:bg-purple-700 border-purple-500 shadow-purple-200"
                                >
                                    Admin Realm
                                </Btn>
                            )}

                            <Btn onClick={() => toggleModal('createTx', true)} type="pri" icon={Icons.Plus}>Transaction</Btn>
                            <Btn onClick={() => toggleModal('createGoal', true)} icon={Icons.Plus}>Goal</Btn>
                            
                            <div className="hidden md:block w-px h-10 bg-slate-200 mx-1"></div>

                            {isFamilyActive ? <Btn onClick={() => toggleModal('families', true)} icon={Icons.Users}>Families</Btn>
                            : isFamilyPending ? <Btn type="pending" icon={Icons.Lock} disabled>Pending</Btn>
                            : <Btn onClick={() => toggleModal('applyFamily', true)} icon={Icons.Lock}>Apply Family</Btn>}

                            {isCompanyActive ? <Btn onClick={() => setShowCompanyRealm(true)} type="comp" icon={Icons.Build}>Company</Btn>
                            : isCompanyPending ? <Btn type="pending" icon={Icons.Lock} disabled>Pending</Btn>
                            : <Btn onClick={() => toggleModal('applyCompany', true)} icon={Icons.Lock}>Apply Company</Btn>}
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left">
                    <DashboardCard 
                        title="Personal Funds" 
                        value={`₱${(summaryData?.netPosition || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
                        subtext="Available Balance" 
                        linkText="View Transactions" 
                        onClick={() => toggleModal('transactions', true)} 
                        icon={Icons.Wallet} 
                        colorClass="text-emerald-600" 
                    />
                    <DashboardCard 
                        title="Active Goals" 
                        value={activeGoalsCount} 
                        subtext="Targets in Progress" 
                        linkText="View Goals" 
                        onClick={() => toggleModal('goals', true)} 
                        icon={Icons.Flag} 
                        colorClass="text-rose-600" 
                    />
                    <DashboardCard 
                        title="Outstanding Loans" 
                        value={`₱${(outstandingLending || 0).toLocaleString()}`} 
                        subtext="Total Receivables" 
                        linkText="Manage Lending" 
                        onClick={() => toggleModal('lending', true)} 
                        icon={Icons.Gift} 
                        colorClass="text-amber-600" 
                    />
                </div>

                <Suspense fallback={<UnifiedLoadingWidget type="section" message="Generating Insight Report..." />}>
                    <UnifiedReportChartWidget report={report} realm="personal" period={period} setPeriod={setPeriod} />
                </Suspense>

                {/* Modals */}
                <Suspense fallback={null}>
                    {modals.transactions && <Modal isOpen={modals.transactions} onClose={() => toggleModal('transactions', false)} title="Personal Transactions"><UnifiedTransactionsListWidget /></Modal>}
                    {modals.goals && <Modal isOpen={modals.goals} onClose={() => toggleModal('goals', false)} title="Personal Goals"><UnifiedGoalListWidget mode="personal" entityId={user?.uid} onDataChange={refresh} /></Modal>}
                    {modals.families && <Modal isOpen={modals.families} onClose={() => toggleModal('families', false)} title="Families Management"><UnifiedManagerWidget type="family" onEnterRealm={setActiveFamilyRealm} /></Modal>}
                    {modals.lending && <Modal isOpen={modals.lending} onClose={() => toggleModal('lending', false)} title="Loan Management"><LoanTrackingWidget onDataChange={refresh} /></Modal>}
                    {modals.createTx && <Modal isOpen={modals.createTx} onClose={() => toggleModal('createTx', false)} title="New Transaction"><CreateUnifiedTransactionWidget onSuccess={() => { toggleModal('createTx', false); refresh(); }} /></Modal>}
                    {modals.createGoal && <Modal isOpen={modals.createGoal} onClose={() => toggleModal('createGoal', false)} title="New Goal Target"><CreateUnifiedGoalWidget mode="personal" entityId={user?.uid} onSuccess={() => { toggleModal('createGoal', false); refresh(); }} /></Modal>}
                    
                    {modals.recordLoan && (
                        <Modal isOpen={modals.recordLoan} onClose={() => toggleModal('recordLoan', false)} title="Record New Loan">
                            <RecordLoanFlowWidget onSuccess={() => { toggleModal('recordLoan', false); refresh(); }} />
                        </Modal>
                    )}

                    {modals.applyCompany && <Modal isOpen={modals.applyCompany} onClose={() => toggleModal('applyCompany', false)} title="Unlock Company Premium"><ApplyPremiumWidget targetAccess="company" onClose={() => toggleModal('applyCompany', false)} onUpgradeSuccess={handleUpgradeSubmit} /></Modal>}
                    {modals.applyFamily && <Modal isOpen={modals.applyFamily} onClose={() => toggleModal('applyFamily', false)} title="Unlock Family Premium"><ApplyPremiumWidget targetAccess="family" onClose={() => toggleModal('applyFamily', false)} onUpgradeSuccess={handleUpgradeSubmit} /></Modal>}
                </Suspense>
            </div>
        </RouteGuard>
    );
}