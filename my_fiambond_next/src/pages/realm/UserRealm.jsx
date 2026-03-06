'use client'; 

import { useContext, useState, useMemo, Suspense, useEffect } from "react";
import dynamic from 'next/dynamic';
import { AppContext } from "@/src/context/AppContext.jsx";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/src/config/firebase-config.js";

// Guard & Shared Resources
import RouteGuard from "@/src/components/auth/RouteGuard"; 
import { Icons, Btn, DashboardCard } from "@/src/components/realm/RealmSharedUI.jsx";
import { useRealmData } from "@/src/hooks/useRealmData.js";

// ⭐️ INTEGRATION: Using UnifiedLoadingWidget
import UnifiedLoadingWidget from "@/src/components/ui/UnifiedLoadingWidget";

// Additional Icon for Admin
const AdminIcon = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>;

// Dynamic Imports with Section Loading
const Modal = dynamic(() => import("@/src/components/ui/Modal.jsx"), { 
    ssr: false,
    loading: () => <UnifiedLoadingWidget type="section" message="Preparing view..." />
});
const LoanTrackingWidget = dynamic(() => import("@/src/components/loan/LoanTrackingWidget.tsx"), { ssr: false });
const RecordLoanFlowWidget = dynamic(() => import("@/src/components/loan/RecordLoanFlowWidget.tsx"), { ssr: false });
const FamilyRealm = dynamic(() => import("@/src/pages/realm/FamilyRealm.jsx"), { ssr: false });
const CompanyRealm = dynamic(() => import("@/src/pages/realm/CompanyRealm.jsx"), { ssr: false });
const ApplyPremiumWidget = dynamic(() => import("@/src/components/management/ApplyPremiumWidget"), { ssr: false });
const CreateUnifiedTransactionWidget = dynamic(() => import('@/src/components/finance/CreateUnifiedTransactionWidget.tsx'), { ssr: false });
const CreateUnifiedGoalWidget = dynamic(() => import("@/src/components/goal/CreateUnifiedGoalWidget.tsx"), { ssr: false });
const UnifiedTransactionsListWidget = dynamic(() => import('@/src/components/finance/UnifiedTransactionsListWidget.tsx'), { ssr: false });
const UnifiedGoalListWidget = dynamic(() => import("@/src/components/goal/UnifiedGoalListWidget.tsx"), { ssr: false });
const UnifiedManagerWidget = dynamic(() => import("@/src/components/management/UnifiedManagerWidget.tsx"), { ssr: false });
const UnifiedReportChartWidget = dynamic(() => import("@/src/components/analytics/UnifiedReportChartWidget.jsx"), { ssr: false });

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

RealmSharedUI.jsx

'use client';

import React from 'react';
import UnifiedLoadingWidget from '@/src/components/ui/UnifiedLoadingWidget';

export const Icons = {
    // Basic Actions
    Plus: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>,
    Back: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>,
    
    // Realm Specific
    Users: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m16-10a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>,
    Build: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>,
    Lock: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>,
    
    // Dashboard Icons
    Wallet: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>,
    Flag: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2z"></path></svg>,
    Gift: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path></svg>,
    Printer: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>,
    
    // Admin Specific
    Money: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Entities: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 v5m-4 0h4" /></svg>,
    Report: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
};

export const Btn = ({ onClick, type = 'sec', icon, children, className = '', disabled = false, isLoading = false }) => {
    const styles = {
        pri: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm border border-transparent",
        sec: "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 hover:text-slate-800",
        admin: "bg-purple-600 text-white hover:bg-purple-700 shadow-sm border border-transparent",
        comp: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm border border-transparent",
        pending: "bg-amber-100 text-amber-700 border border-amber-200 cursor-not-allowed"
    };

    return (
        <button
            onClick={disabled || isLoading ? null : onClick}
            disabled={disabled || isLoading}
            className={`${styles[type]} px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 flex items-center justify-center gap-2 w-full md:w-auto shadow-sm ${className} relative overflow-hidden`}
        >
            {isLoading ? (
                <UnifiedLoadingWidget type="inline" />
            ) : (
                <>
                    {icon} {children}
                </>
            )}
        </button>
    );
};

export const DashboardCard = ({ title, value, subtext, linkText, onClick, icon, colorClass, isAlert = false, isLoading = false }) => (
    <div 
        onClick={isLoading ? null : onClick} 
        className={`bg-white/60 backdrop-blur-xl border rounded-2xl shadow-lg p-6 cursor-pointer group transition-all hover:shadow-xl flex flex-col text-left relative overflow-hidden ${isAlert ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200/50'}`}
    >
        {/* 🟢 Card-level loading section */}
        {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
                <UnifiedLoadingWidget type="section" />
            </div>
        )}

        <div className="flex justify-between items-start">
            <h4 className={`font-bold pr-4 ${isAlert ? 'text-amber-800' : 'text-gray-600'}`}>{title}</h4>
            <div className={`flex-shrink-0 ${colorClass}`}>{icon}</div>
        </div>
        <div className="flex-grow">
            <p className={`text-4xl font-bold mt-2 ${colorClass}`}>{value}</p>
            {subtext && (
                <p className={`text-xs mt-1 font-bold ${isAlert ? 'text-amber-600 animate-pulse' : 'text-slate-400'}`}>
                    {subtext}
                </p>
            )}
        </div>
        <span className="text-indigo-600 text-sm mt-3 inline-block transition-all duration-200 group-hover:text-indigo-700">
            {linkText} &rarr;
        </span>
    </div>
);