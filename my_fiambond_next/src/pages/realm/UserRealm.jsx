'use client';

import { useContext, useState, Suspense, useEffect } from "react";
import dynamic from 'next/dynamic';
import { AppContext } from "@/src/context/AppContext.jsx";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/src/config/firebase-config.js";

// Guard & Shared Resources
import RouteGuard from "@/src/components/auth/RouteGuard"; 
import { Icons, Btn, DashboardCard } from "@/src/components/realm/RealmSharedUI.jsx";
import { useRealmData } from "@/src/hooks/useRealmData.js";

// Widgets
import UnifiedLoadingWidget from "@/src/components/ui/UnifiedLoadingWidget";

// Dynamic Imports
const Modal = dynamic(() => import("@/src/components/ui/Modal.jsx"), { ssr: false });
const LoanTrackingWidget = dynamic(() => import("@/src/components/loan/LoanTrackingWidget.tsx"), { ssr: false });
const ApplyPremiumWidget = dynamic(() => import("@/src/components/management/ApplyPremiumWidget"), { ssr: false });
const CreateUnifiedTransactionWidget = dynamic(() => import('@/src/components/finance/CreateUnifiedTransactionWidget.tsx'), { ssr: false });
const CreateUnifiedGoalWidget = dynamic(() => import("@/src/components/goal/CreateUnifiedGoalWidget.tsx"), { ssr: false });
const UnifiedTransactionsListWidget = dynamic(() => import('@/src/components/finance/UnifiedTransactionsListWidget.tsx'), { ssr: false });
const UnifiedGoalListWidget = dynamic(() => import("@/src/components/goal/UnifiedGoalListWidget.tsx"), { ssr: false });
const UnifiedManagerWidget = dynamic(() => import("@/src/components/management/UnifiedManagerWidget.tsx"), { ssr: false });
const UnifiedReportChartWidget = dynamic(() => import("@/src/components/analytics/UnifiedReportChartWidget.jsx"), { ssr: false });
const CreateUnifiedLoanWidget = dynamic(() => import("@/src/components/loan/CreateUnifiedLoanWidget.tsx"), { ssr: false });
const RecordLoanChoiceWidget = dynamic(() => import("@/src/components/loan/RecordLoanChoiceWidget.tsx"), { ssr: false });
const RecordLoanFlowWidget = dynamic(() => import("@/src/components/loan/RecordLoanFlowWidget.tsx"), { ssr: false });

export default function UserDashboard({ onEnterAdmin, onEnterFamily, onEnterCompany }) {
    const context = useContext(AppContext);
    const { user, refreshUserData } = context || { user: null, refreshUserData: () => {} };
    
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    // Added actionHub and realmHub bridge modal states
    const [modals, setModals] = useState({
        actionHub: false, 
        realmHub: false, // Bridge modal for Admin / Family / Company
        transactions: false, goals: false, families: false, lending: false,
        createTx: false, createGoal: false, applyCompany: false, applyFamily: false,
        recordLoanChoice: false, recordLoanPersonal: false, recordLoanFamily: false
    });

    const { 
        summaryData = { netPosition: 0 }, 
        activeGoalsCount = 0, 
        outstandingLending = 0, 
        report, period, setPeriod, error, refresh 
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
                family_subscription_status: 'pending_approval', family_payment_ref: paymentData.paymentRef,
                family_premium_plan: paymentData.plan, family_request_date: serverTimestamp()
            } : {
                subscription_status: 'pending_approval', payment_ref: paymentData.paymentRef,
                premium_plan: paymentData.plan, request_date: serverTimestamp()
            };
            await updateDoc(userRef, updates);
            toggleModal(isFamily ? 'applyFamily' : 'applyCompany', false);
            alert("Success! Request submitted.");
            if (refreshUserData) refreshUserData();
        } catch (err) { alert("Failed to submit request."); }
    };
    
    const openPersonalLoan = () => {
        toggleModal('recordLoanChoice', false);
        toggleModal('recordLoanPersonal', true);
    }
    const openFamilyLoan = () => {
        toggleModal('recordLoanChoice', false);
        toggleModal('recordLoanFamily', true);
    }
    const handleCreateFamilyRequest = () => {
        toggleModal('recordLoanFamily', false);
        toggleModal('applyFamily', true);
    }

    if (!mounted || !user) {
        return <UnifiedLoadingWidget type="fullscreen" message="Syncing Personal Realm..." variant="indigo" />;
    }

    return (
        <RouteGuard require="auth">
            <div className="w-full">
                {error && (
                    <div className="mb-4 p-3 bg-rose-100 text-rose-700 rounded-xl text-xs font-bold text-center border border-rose-200">
                        ⚠️ Connection Error: {error}
                    </div>
                )}

                <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 text-left">
                    <div className="flex items-center gap-4">
                        <div className="w-1 h-12 bg-indigo-600 rounded-full opacity-80 shadow-[0_0_10px_rgba(79,70,229,0.3)]"></div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">{userLastName}</h1>
                            <p className="text-slate-500 font-bold text-xs mt-1 uppercase tracking-[0.2em]">Personal Realm</p>
                        </div>
                    </div>

                    <div className="w-full md:w-auto">
                        {/* 🎯 EXACTLY 2 BUTTONS JUST LIKE FAMILY & COMPANY REALMS */}
                        <div className="flex items-center gap-3">
                            <Btn onClick={() => toggleModal('actionHub', true)} type="pri" icon={Icons.Plus}>
                                New Entry
                            </Btn>
                            
                            <div className="hidden md:block w-px h-10 bg-slate-200 mx-1"></div>
                            
                            <Btn onClick={() => toggleModal('realmHub', true)} icon={Icons.Users}>
                                Switch Realm
                            </Btn>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left">
                    <DashboardCard title="Personal Funds" value={`₱${(summaryData?.netPosition || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} subtext="Available Balance" linkText="View Transactions" onClick={() => toggleModal('transactions', true)} icon={Icons.Wallet} colorClass="text-emerald-600" />
                    <DashboardCard title="Active Goals" value={activeGoalsCount} subtext="Targets in Progress" linkText="View Goals" onClick={() => toggleModal('goals', true)} icon={Icons.Flag} colorClass="text-rose-600" />
                    <DashboardCard title="Outstanding Loans" value={`₱${(outstandingLending || 0).toLocaleString()}`} subtext="Total Receivables" linkText="Manage Lending" onClick={() => toggleModal('lending', true)} icon={Icons.Gift} colorClass="text-amber-600" />
                </div>

                <Suspense fallback={<UnifiedLoadingWidget type="section" message="Generating Insight Report..." />}>
                    <UnifiedReportChartWidget report={report} realm="personal" period={period} setPeriod={setPeriod} />
                </Suspense>

                {/* Modals */}
                <Suspense fallback={null}>
                    {/* 🌉 1. ACTION BRIDGE MODAL */}
                    {modals.actionHub && (
                        <Modal isOpen={modals.actionHub} onClose={() => toggleModal('actionHub', false)} title="Quick Action Bridge">
                            <div className="p-2 space-y-4 text-center">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    What record would you like to create?
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <button 
                                        onClick={() => { toggleModal('actionHub', false); toggleModal('createTx', true); }}
                                        className="p-5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-2xl flex flex-col items-center gap-2 transition-all group active:scale-95"
                                    >
                                        <span className="text-3xl group-hover:scale-110 transition-transform">💸</span>
                                        <span className="font-bold text-slate-800 group-hover:text-emerald-700 text-sm">Transaction</span>
                                        <span className="text-[10px] text-slate-400 font-semibold">Income / Expense</span>
                                    </button>

                                    <button 
                                        onClick={() => { toggleModal('actionHub', false); toggleModal('createGoal', true); }}
                                        className="p-5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-2xl flex flex-col items-center gap-2 transition-all group active:scale-95"
                                    >
                                        <span className="text-3xl group-hover:scale-110 transition-transform">🎯</span>
                                        <span className="font-bold text-slate-800 group-hover:text-indigo-700 text-sm">Goal Target</span>
                                        <span className="text-[10px] text-slate-400 font-semibold">Savings & Target</span>
                                    </button>

                                    <button 
                                        onClick={() => { toggleModal('actionHub', false); toggleModal('recordLoanChoice', true); }}
                                        className="p-5 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-2xl flex flex-col items-center gap-2 transition-all group active:scale-95"
                                    >
                                        <span className="text-3xl group-hover:scale-110 transition-transform">🤝</span>
                                        <span className="font-bold text-slate-800 group-hover:text-amber-700 text-sm">Loan Record</span>
                                        <span className="text-[10px] text-slate-400 font-semibold">Lending & Debts</span>
                                    </button>
                                </div>
                            </div>
                        </Modal>
                    )}

                    {/* 🏰 2. REALM SWITCHER BRIDGE MODAL */}
                    {modals.realmHub && (
                        <Modal isOpen={modals.realmHub} onClose={() => toggleModal('realmHub', false)} title="Select Portal Realm">
                            <div className="p-2 space-y-4 text-center">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Choose a realm portal to enter
                                </p>
                                <div className={`grid grid-cols-1 ${isAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
                                    {/* Admin Realm Option */}
                                    {isAdmin && (
                                        <button 
                                            onClick={() => { toggleModal('realmHub', false); onEnterAdmin(); }}
                                            className="p-5 bg-purple-50 hover:bg-purple-100 border border-purple-200 hover:border-purple-300 rounded-2xl flex flex-col items-center gap-2 transition-all group active:scale-95"
                                        >
                                            <span className="text-3xl group-hover:scale-110 transition-transform">👑</span>
                                            <span className="font-bold text-purple-900 text-sm">Admin Realm</span>
                                            <span className="text-[10px] text-purple-600 font-semibold">System Dashboard</span>
                                        </button>
                                    )}

                                    {/* Family Realm Option */}
                                    <button 
                                        onClick={() => {
                                            toggleModal('realmHub', false);
                                            if (isFamilyActive) toggleModal('families', true);
                                            else if (!isFamilyPending) toggleModal('applyFamily', true);
                                        }}
                                        disabled={isFamilyPending}
                                        className={`p-5 rounded-2xl flex flex-col items-center gap-2 transition-all group active:scale-95 border ${
                                            isFamilyPending 
                                                ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed' 
                                                : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 hover:border-indigo-300'
                                        }`}
                                    >
                                        <span className="text-3xl group-hover:scale-110 transition-transform">👨‍👩‍👧‍👦</span>
                                        <span className="font-bold text-indigo-900 text-sm">Family Realm</span>
                                        <span className="text-[10px] text-indigo-600 font-semibold uppercase">
                                            {isFamilyActive ? 'Enter Vault' : isFamilyPending ? 'Pending Approval' : 'Apply Premium'}
                                        </span>
                                    </button>

                                    {/* Company Realm Option */}
                                    <button 
                                        onClick={() => {
                                            toggleModal('realmHub', false);
                                            if (isCompanyActive) onEnterCompany({ id: user?.uid, name: "Company" });
                                            else if (!isCompanyPending) toggleModal('applyCompany', true);
                                        }}
                                        disabled={isCompanyPending}
                                        className={`p-5 rounded-2xl flex flex-col items-center gap-2 transition-all group active:scale-95 border ${
                                            isCompanyPending 
                                                ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed' 
                                                : 'bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300'
                                        }`}
                                    >
                                        <span className="text-3xl group-hover:scale-110 transition-transform">🏢</span>
                                        <span className="font-bold text-blue-900 text-sm">Company Realm</span>
                                        <span className="text-[10px] text-blue-600 font-semibold uppercase">
                                            {isCompanyActive ? 'Enter Corporate' : isCompanyPending ? 'Pending Approval' : 'Apply Premium'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </Modal>
                    )}

                    {modals.transactions && <Modal isOpen={modals.transactions} onClose={() => toggleModal('transactions', false)} title="Personal Transactions"><UnifiedTransactionsListWidget /></Modal>}
                    {modals.goals && <Modal isOpen={modals.goals} onClose={() => toggleModal('goals', false)} title="Personal Goals"><UnifiedGoalListWidget mode="personal" entityId={user?.uid} onDataChange={refresh} /></Modal>}
                    
                    {modals.families && (
                        <Modal isOpen={modals.families} onClose={() => toggleModal('families', false)} title="Families Management">
                            <UnifiedManagerWidget type="family" onEnterRealm={(familyData) => {
                                toggleModal('families', false);
                                onEnterFamily(familyData);
                            }} />
                        </Modal>
                    )}

                    {modals.lending && <Modal isOpen={modals.lending} onClose={() => toggleModal('lending', false)} title="Loan Management"><LoanTrackingWidget onDataChange={refresh} /></Modal>}
                    {modals.createTx && <Modal isOpen={modals.createTx} onClose={() => toggleModal('createTx', false)} title="New Transaction"><CreateUnifiedTransactionWidget onSuccess={() => { toggleModal('createTx', false); refresh(); }} /></Modal>}
                    {modals.createGoal && <Modal isOpen={modals.createGoal} onClose={() => toggleModal('createGoal', false)} title="New Goal Target"><CreateUnifiedGoalWidget mode="personal" entityId={user?.uid} onSuccess={() => { toggleModal('createGoal', false); refresh(); }} /></Modal>}
                    
                    {modals.recordLoanChoice && (
                        <Modal isOpen={modals.recordLoanChoice} onClose={() => toggleModal('recordLoanChoice', false)} title="Record a New Loan">
                            <RecordLoanChoiceWidget onSelectPersonalLoan={openPersonalLoan} onSelectFamilyLoan={openFamilyLoan} />
                        </Modal>
                    )}
                    {modals.recordLoanPersonal && (
                        <Modal isOpen={modals.recordLoanPersonal} onClose={() => toggleModal('recordLoanPersonal', false)} title="Record New Personal Loan">
                            <CreateUnifiedLoanWidget mode="personal" entityId={user?.uid} onSuccess={() => { toggleModal('recordLoanPersonal', false); refresh(); }} />
                        </Modal>
                    )}
                    {modals.recordLoanFamily && (
                        <Modal isOpen={modals.recordLoanFamily} onClose={() => toggleModal('recordLoanFamily', false)} title="Record New Family Loan">
                            <RecordLoanFlowWidget onSuccess={() => { toggleModal('recordLoanFamily', false); refresh(); }} onRequestCreateFamily={handleCreateFamilyRequest} />
                        </Modal>
                    )}

                    {modals.applyCompany && <Modal isOpen={modals.applyCompany} onClose={() => toggleModal('applyCompany', false)} title="Unlock Company Premium"><ApplyPremiumWidget targetAccess="company" onClose={() => toggleModal('applyCompany', false)} onUpgradeSuccess={handleUpgradeSubmit} /></Modal>}
                    {modals.applyFamily && <Modal isOpen={modals.applyFamily} onClose={() => toggleModal('applyFamily', false)} title="Unlock Family Premium"><ApplyPremiumWidget targetAccess="family" onClose={() => toggleModal('applyFamily', false)} onUpgradeSuccess={handleUpgradeSubmit} /></Modal>}
                </Suspense>
            </div>
        </RouteGuard>
    );
}