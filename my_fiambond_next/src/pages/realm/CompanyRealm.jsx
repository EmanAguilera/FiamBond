'use client'; 

import React, { useState, Suspense, useContext, useCallback, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { AppContext } from '../../context/AppContext.jsx';
import { db } from '../../config/firebase-config.js';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { API_BASE_URL } from "../../config/apiConfig.js";

// Auth & Security
import RouteGuard from "../../components/auth/RouteGuard";

// DRY Shared Resources
import { Icons, Btn, DashboardCard } from "../../components/realm/RealmSharedUI.jsx";
import { useRealmData } from "../../hooks/useRealmData.js";

// ⭐️ INTEGRATION: Using UnifiedLoadingWidget
import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";

// Dynamic Widget Imports
const Modal = dynamic(() => import('../../components/ui/Modal.jsx'), { 
    ssr: false,
    loading: () => <UnifiedLoadingWidget type="section" message="Opening Corporate Portal..." />
});
const UnifiedCorporateLedgerWidget = dynamic(() => import('../../components/management/UnifiedCorporateLedgerWidget'), { ssr: false });
const CreateUnifiedTransactionWidget = dynamic(() => import('../../components/finance/CreateUnifiedTransactionWidget'), { ssr: false });
const UnifiedTransactionsListWidget = dynamic(() => import('../../components/finance/UnifiedTransactionsListWidget'), { ssr: false });
const CreateUnifiedGoalWidget = dynamic(() => import("../../components/goal/CreateUnifiedGoalWidget"), { ssr: false });
const UnifiedGoalListWidget = dynamic(() => import("../../components/goal/UnifiedGoalListWidget"), { ssr: false });
const UnifiedManagerWidget = dynamic(() => import('../../components/management/UnifiedManagerWidget'), { ssr: false });
const UnifiedReportChartWidget = dynamic(() => import("../../components/analytics/UnifiedReportChartWidget"), { ssr: false });

export default function CompanyRealm({ company, onBack, onDataChange }) {
    const context = useContext(AppContext) || {};
    const { user } = context;

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    // ⭐️ FIXED LOGIC: Matches FamilyRealm "Lastname Family" style
    const corporateDisplayName = useMemo(() => {
        if (!company) return "";
        
        // Check if the name is a generic placeholder
        const isGeneric = company.name?.toLowerCase() === 'company' || company.name?.toLowerCase() === 'my company';
        const userLastName = user?.full_name ? user.full_name.split(' ').pop() : '';
        
        // If generic, produce "Aguilera Corporate", otherwise use the actual company name
        return isGeneric && userLastName ? `${userLastName} ` : company.name;
    }, [company, user]);

    // Modal States
    const [modals, setModals] = useState({
        accounting: false, 
        addGoal: false, 
        manageEmp: false,
        viewTx: false, 
        viewGoals: false,
        payrollHistory: false
    });
    const toggle = (key, val) => setModals(prev => ({ ...prev, [key]: val }));

    const [members, setMembers] = useState([]);
    const [payrollCount, setPayrollCount] = useState(0);

    const { 
        transactions = [], 
        summaryData = { netPosition: 0 }, 
        activeGoalsCount = 0, 
        report, 
        period, 
        setPeriod, 
        error, 
        refresh 
    } = useRealmData(user, 'company', company?.id);

    const companyPayrollConfig = useMemo(() => ({
        filterFn: (tx) => 
            (tx.category === 'Payroll' || tx.category === 'Cash Advance') || 
            (tx.description && (tx.description.toLowerCase().includes('salary') || tx.description.toLowerCase().includes('advance'))),
        columnLabels: ["Employee / Description", "Category"],
        getMainLabel: (tx) => tx.description || "Unnamed Disbursement",
        getSubLabel: (tx) => tx.category || "General Payroll",
    }), []);

    const initCompanyData = useCallback(async () => {
        if (!company?.id || !mounted) return;
        try {
            let compRes = await fetch(`${API_BASE_URL}/companies/${company.id}`);
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
        } catch (e) { console.error("Company Init Error:", e); }
    }, [company?.id, company?.name, companyPayrollConfig, mounted]);

    useEffect(() => { initCompanyData(); }, [initCompanyData]);

    const handleRefresh = () => {
        if (refresh) refresh(); 
        initCompanyData(); 
        if (onDataChange) onDataChange();
    };

    if (!mounted || !context || !company) {
        return <UnifiedLoadingWidget type="fullscreen" message="Loading Corporate Assets..." variant="indigo" />;
    }

    return (
        <RouteGuard require="premium">
            <div className="w-full">
                {error && (
                    <div className="mb-4 p-3 bg-rose-100 text-rose-700 rounded-xl text-xs font-bold text-center border border-rose-200">
                        ⚠️ Connection Error: Corporate API Offline
                    </div>
                )}

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
                            <div className="w-1 h-12 bg-indigo-600 rounded-full opacity-80 shadow-[0_0_10px_rgba(79,70,229,0.3)]"></div>
                            <div>
                                {/* ⭐️ FIXED: Removed 'uppercase' and used the same classes as FamilyRealm */}
                                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">
                                    {corporateDisplayName}
                                </h1>
                                <p className="text-slate-500 font-bold text-xs mt-1 uppercase tracking-[0.2em]">
                                    Company Realm
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Btn onClick={() => toggle('accounting', true)} type="pri" icon={Icons.Plus}>Accounting</Btn>
                        <Btn onClick={() => toggle('addGoal', true)} icon={Icons.Plus}>Strategic Goal</Btn>
                        <div className="hidden md:block w-px h-10 bg-slate-200 mx-1"></div>
                        <Btn onClick={() => toggle('manageEmp', true)} icon={Icons.Users}>Employees</Btn>
                    </div>
                </header>

                {/* --- DASHBOARD CARDS --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <DashboardCard 
                        title="Company Funds" 
                        value={`₱${(summaryData?.netPosition || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
                        subtext="Available Balance" 
                        linkText="View Transactions" 
                        onClick={() => toggle('viewTx', true)} 
                        icon={Icons.Wallet} 
                        colorClass="text-emerald-600" 
                    />
                    <DashboardCard 
                        title="Active Goals" 
                        value={activeGoalsCount} 
                        subtext="Corporate Targets" 
                        linkText="View Goals" 
                        onClick={() => toggle('viewGoals', true)} 
                        icon={Icons.Flag} 
                        colorClass="text-rose-600" 
                    />
                    <DashboardCard 
                        title="Payroll Reports" 
                        value={`${payrollCount} Records`} 
                        subtext="Disbursement History" 
                        linkText="Manage Reports" 
                        onClick={() => toggle('payrollHistory', true)} 
                        icon={Icons.Printer} 
                        colorClass="text-indigo-600" 
                    />
                </div>

                {/* --- ANALYTICS --- */}
                <Suspense fallback={<UnifiedLoadingWidget type="section" message="Analyzing Corporate Data..." />}>
                    <UnifiedReportChartWidget 
                        report={report} 
                        realm="company" 
                        period={period} 
                        setPeriod={setPeriod} 
                    />
                </Suspense>

                {/* --- MODALS --- */}
                <Suspense fallback={null}>
                    {modals.accounting && (
                        <Modal isOpen={modals.accounting} onClose={() => toggle('accounting', false)} title="Corporate Accounting">
                            <CreateUnifiedTransactionWidget 
                                companyData={company.id} 
                                members={members} 
                                onSuccess={() => { toggle('accounting', false); handleRefresh(); }} 
                            />
                        </Modal>
                    )}
                    
                    {modals.addGoal && (
                        <Modal isOpen={modals.addGoal} onClose={() => toggle('addGoal', false)} title="Set Strategic Target">
                            <CreateUnifiedGoalWidget mode="company" entityId={company.id} onSuccess={handleRefresh} />
                        </Modal>
                    )}

                    {modals.manageEmp && (
                        <Modal isOpen={modals.manageEmp} onClose={() => toggle('manageEmp', false)} title="Manage Employee Access">
                            <UnifiedManagerWidget 
                                type="company" 
                                mode="members" 
                                realmData={company} 
                                members={members} 
                                onUpdate={handleRefresh} 
                            />
                        </Modal>
                    )}
                    
                    {modals.viewTx && (
                        <Modal isOpen={modals.viewTx} onClose={() => toggle('viewTx', false)} title="Corporate Ledger">
                            <UnifiedTransactionsListWidget companyData={company} onDataChange={handleRefresh} />
                        </Modal>
                    )}
                    
                    {modals.viewGoals && (
                        <Modal isOpen={modals.viewGoals} onClose={() => toggle('viewGoals', false)} title="Strategic Goals">
                            <UnifiedGoalListWidget mode="company" entityId={company.id} onDataChange={handleRefresh} />
                        </Modal>
                    )}

                    {modals.payrollHistory && (
                        <Modal isOpen={modals.payrollHistory} onClose={() => toggle('payrollHistory', false)} title="Disbursement & Payroll Reports">
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
            </div>
        </RouteGuard>
    );
}