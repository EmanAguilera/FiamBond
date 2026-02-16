'use client'; 

import { useState, Suspense, useContext, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AppContext } from '../../context/AppContext.jsx';
import { db } from '../../config/firebase-config.js';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';

// Auth Guard
import RouteGuard from "../../components/auth/RouteGuard";

// DRY Shared Resources
import { Icons, Btn, DashboardCard } from "../../components/realm/RealmSharedUI.jsx";
import { useRealmData } from "../../hooks/useRealmData.js";

// ⭐️ INTEGRATION: Using UnifiedLoadingWidget
import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";

// Dynamic Widget Imports
const Modal = dynamic(() => import('../../components/ui/Modal.jsx'), { 
    ssr: false,
    loading: () => <UnifiedLoadingWidget type="section" message="Opening Family Vault..." />
});
const LoanTrackingWidget = dynamic(() => import('../../components/loan/LoanTrackingWidget.tsx'), { ssr: false });
const CreateUnifiedLoanWidget = dynamic(() => import('../../components/loan/CreateUnifiedLoanWidget'), { ssr: false });
const CreateUnifiedTransactionWidget = dynamic(() => import('../../components/finance/CreateUnifiedTransactionWidget'), { ssr: false });
const UnifiedTransactionsListWidget = dynamic(() => import('../../components/finance/UnifiedTransactionsListWidget'), { ssr: false });
const CreateUnifiedGoalWidget = dynamic(() => import("../../components/goal/CreateUnifiedGoalWidget"), { ssr: false });
const UnifiedGoalListWidget = dynamic(() => import("../../components/goal/UnifiedGoalListWidget"), { ssr: false });
const UnifiedManagerWidget = dynamic(() => import('../../components/management/UnifiedManagerWidget'), { ssr: false });
const UnifiedReportChartWidget = dynamic(() => import("../../components/analytics/UnifiedReportChartWidget"), { ssr: false });

export default function FamilyRealm({ family, onBack, onDataChange, onFamilyUpdate }) {
    // ⭐️ FIX 1: Defensive Context Access
    const context = useContext(AppContext) || {};
    const { user } = context;

    // ⭐️ FIX 2: Mounted Guard
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    // Modal States
    const [modals, setModals] = useState({
        loan: false, transaction: false, goal: false,
        listGoals: false, listTransactions: false, listLoans: false, members: false
    });
    const toggle = (key, val) => setModals(prev => ({ ...prev, [key]: val }));

    const [familyMembers, setFamilyMembers] = useState([]);
    const [membersLoading, setMembersLoading] = useState(false);

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
    } = useRealmData(user, 'family', family?.id);

    const getFamilyMembers = useCallback(async () => {
        if (!family?.member_ids?.length || !mounted) return;
        setMembersLoading(true);
        try {
            const usersRef = collection(db, "users");
            const safeMemberIds = family.member_ids.slice(0, 10);
            const q = query(usersRef, where(documentId(), "in", safeMemberIds));
            const snap = await getDocs(q);
            setFamilyMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (err) {
            console.error("Failed to fetch family members:", err);
        } finally {
            setMembersLoading(false);
        }
    }, [family, mounted]);

    useEffect(() => { getFamilyMembers(); }, [getFamilyMembers]);

    const handleRealmRefresh = () => {
        if (refresh) refresh(); 
        getFamilyMembers(); 
        if (onDataChange) onDataChange();
    };

    const handleMembersUpdate = (updatedFamily) => {
        handleRealmRefresh();
        if (onFamilyUpdate) onFamilyUpdate(updatedFamily);
    };

    // ⭐️ Updated Loading State using UnifiedLoadingWidget
    if (!mounted || !family?.id) {
        return (
            <UnifiedLoadingWidget 
                type="fullscreen" 
                message="Entering Family Realm..." 
                variant="indigo" 
            />
        );
    }

    return (
        <RouteGuard require="premium">
            <div className="w-full">
                {error && (
                    <div className="mb-4 p-3 bg-rose-100 text-rose-700 rounded-xl text-xs font-bold text-center border border-rose-200">
                        ⚠️ Connection Error: Family API Offline
                    </div>
                )}

                <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex flex-col gap-1 text-left">
                        <button 
                            onClick={onBack} 
                            className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 text-sm font-medium hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm transition-all mb-4 w-fit shadow-sm active:scale-95"
                        >
                            <span className="group-hover:-translate-x-0.5 transition-transform">{Icons.Back}</span>
                            <span>Back to Personal</span>
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="w-1 h-12 bg-indigo-600 rounded-full opacity-80 shadow-[0_0_10px_rgba(79,70,229,0.3)]"></div>
                            <div>
                                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">{family.family_name}</h1>
                                <p className="text-slate-500 font-bold text-xs mt-1 uppercase tracking-[0.2em]">Family Realm</p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-auto">
                        <div className="grid grid-cols-2 gap-3 md:flex md:items-center">
                            <Btn onClick={() => toggle('transaction', true)} type="pri" icon={Icons.Plus} className="col-span-2 md:col-span-1">Transaction</Btn>
                            <Btn onClick={() => toggle('goal', true)} icon={Icons.Plus}>Goal</Btn>
                            <Btn onClick={() => toggle('loan', true)} icon={Icons.Plus}>Loan</Btn>
                            <div className="hidden md:block w-px h-10 bg-slate-200 mx-1"></div>
                            <Btn onClick={() => toggle('members', true)} icon={Icons.Users} className="col-span-2 md:col-span-1">Members</Btn>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <DashboardCard 
                        title="Family Funds" 
                        value={`₱${(summaryData?.netPosition || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
                        subtext="Available Balance" 
                        linkText="View Transactions" 
                        onClick={() => toggle('listTransactions', true)} 
                        icon={Icons.Wallet} 
                        colorClass="text-emerald-600"
                    />
                    <DashboardCard 
                        title="Active Goals" 
                        value={activeGoalsCount} 
                        subtext="Shared Targets" 
                        linkText="View Goals" 
                        onClick={() => toggle('listGoals', true)} 
                        icon={Icons.Flag} 
                        colorClass="text-rose-600"
                    />
                    <DashboardCard 
                        title="Outstanding Loans" 
                        value={`₱${(outstandingLending || 0).toLocaleString()}`} 
                        subtext="Shared Receivables" 
                        linkText="Manage Lending" 
                        onClick={() => toggle('listLoans', true)} 
                        icon={Icons.Gift} 
                        colorClass="text-amber-600"
                    />
                </div>

                <Suspense fallback={<UnifiedLoadingWidget type="section" message="Analyzing Family Growth..." />}>
                    <UnifiedReportChartWidget 
                        report={report} 
                        realm="family" 
                        period={period} 
                        setPeriod={setPeriod} 
                    />
                </Suspense>

                {/* Modals Section */}
                <Suspense fallback={null}>
                    {modals.loan && (
                        <Modal isOpen={modals.loan} onClose={() => toggle('loan', false)} title="Record Family Loan">
                            <CreateUnifiedLoanWidget 
                                mode="family" 
                                family={family} 
                                members={familyMembers} 
                                onSuccess={handleRealmRefresh} 
                            />
                        </Modal>
                    )}
                    
                    {modals.transaction && (
                        <Modal isOpen={modals.transaction} onClose={() => toggle('transaction', false)} title="New Family Transaction">
                            <CreateUnifiedTransactionWidget familyData={family} onSuccess={handleRealmRefresh} />
                        </Modal>
                    )}
                    
                    {modals.goal && (
                        <Modal isOpen={modals.goal} onClose={() => toggle('goal', false)} title="Set Family Goal">
                            <CreateUnifiedGoalWidget mode="family" entityId={family.id} onSuccess={handleRealmRefresh} />
                        </Modal>
                    )}

                    {modals.listTransactions && (
                        <Modal isOpen={modals.listTransactions} onClose={() => toggle('listTransactions', false)} title="Family Transactions">
                            <UnifiedTransactionsListWidget familyData={family} />
                        </Modal>
                    )}
                    
                    {modals.listGoals && (
                        <Modal isOpen={modals.listGoals} onClose={() => toggle('listGoals', false)} title="Family Goals">
                            <UnifiedGoalListWidget mode="family" entityId={family.id} onDataChange={handleRealmRefresh} />
                        </Modal>
                    )}

                    {modals.listLoans && (
                        <Modal isOpen={modals.listLoans} onClose={() => toggle('listLoans', false)} title="Family Loan Tracker">
                            <LoanTrackingWidget family={family} onDataChange={handleRealmRefresh} />
                        </Modal>
                    )}

                    {modals.members && (
                        <Modal isOpen={modals.members} onClose={() => toggle('members', false)} title="Family Access Control">
                            <UnifiedManagerWidget 
                                type="family" 
                                mode="members" 
                                realmData={family} 
                                members={familyMembers} 
                                onUpdate={handleMembersUpdate} 
                            />
                        </Modal>
                    )}
                </Suspense>
            </div>
        </RouteGuard>
    );
}