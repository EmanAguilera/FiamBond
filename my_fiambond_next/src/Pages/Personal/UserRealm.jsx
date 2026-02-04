// UserRealm.jsx

'use client'; 

import { useContext, useEffect, useState, useCallback, useMemo, Suspense } from "react";
import dynamic from 'next/dynamic';
import { AppContext } from "../../Context/AppContext.jsx";
import { useRouter } from "next/navigation";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../config/firebase-config.js";
import { API_BASE_URL } from "../../config/apiConfig";

// --- WIDGET IMPORTS ---
const Modal = dynamic(() => import("../../Components/Modal.jsx"), { ssr: false });
const GoalListsWidget = dynamic(() => import("../../Components/Personal/Goal/GoalListsWidget.jsx"), { ssr: false });
const CreateGoalWidget = dynamic(() => import("../../Components/Personal/Goal/CreateGoalWidget.tsx"), { ssr: false });
const PersonalTransactionsWidget = dynamic(() => import("../../Components/Personal/Finance/PersonalTransactionsWidget.jsx"), { ssr: false });
const CreateTransactionWidget = dynamic(() => import("../../Components/Personal/Finance/CreateTransactionWidget.tsx"), { ssr: false });
const ManageFamiliesWidget = dynamic(() => import("../../Components/Personal/Families/ManageFamiliesWidget.jsx"), { ssr: false });
const PersonalReportChartWidget = dynamic(() => import("../../Components/Personal/Analytics/PersonalReportChartWidget.jsx"), { ssr: false });
const LoanTrackingWidget = dynamic(() => import("../../Components/Personal/Loan/LoanTrackingWidget.tsx"), { ssr: false });
const RecordLoanFlowWidget = dynamic(() => import("../../Components/Personal/Loan/Setup/RecordLoanFlowWidget.tsx"), { ssr: false });
const RecordLoanChoiceWidget = dynamic(() => import("../../Components/Personal/Loan/Setup/RecordLoanChoiceWidget.tsx"), { ssr: false });
const CreatePersonalLoanWidget = dynamic(() => import("../../Components/Personal/Loan/Setup/CreatePersonalLoanWidget.tsx"), { ssr: false });
const FamilyRealm = dynamic(() => import("../Family/FamilyRealm.jsx"), { ssr: false });
const CompanyRealm = dynamic(() => import("../Company/CompanyRealm.jsx"), { ssr: false });
const ApplyPremiumWidget = dynamic(() => import("../../Components/Company/Onboarding/ApplyPremiumWidget.jsx"), { ssr: false });

// --- ICONS ---
const Icons = {
    Plus: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>,
    Users: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m16-10a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>,
    Build: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>,
    Lock: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>,
    Wallet: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>,
    Flag: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2z"></path></svg>,
    Gift: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path></svg>
};

const SubscriptionReminder = ({ details, type }) => {
    if (!details) return null;
    const expiryDate = details.expires_at?.toDate();
    if (!expiryDate) return null;
    const diffTime = expiryDate - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 7) return null;
    return (
        <div className={`mb-6 p-4 rounded-2xl border flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500
            ${diffDays <= 0 ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
            <div className="flex items-center gap-3">
                <span className="text-xl">{diffDays <= 0 ? '🚫' : '⏳'}</span>
                <div>
                    <p className="font-bold text-sm">
                        {diffDays <= 0 ? `${type.toUpperCase()} Access Expired` : `${type.toUpperCase()} expiring in ${diffDays} days`}
                    </p>
                    <p className="text-xs opacity-75">Ends on {expiryDate.toLocaleDateString()}</p>
                </div>
            </div>
            <button className="text-xs font-bold px-4 py-2 bg-white rounded-lg shadow-sm border border-current hover:bg-opacity-50 transition-all">
                {diffDays <= 0 ? 'Renew Now' : 'Extend'}
            </button>
        </div>
    );
};

const Btn = ({ onClick, type = 'sec', icon, children, className = '', disabled = false }) => {
    const styles = {
        pri: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm border border-transparent",
        sec: "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 hover:text-slate-800",
        comp: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm border border-transparent",
        pending: "bg-amber-100 text-amber-700 border border-amber-200 cursor-not-allowed"
    };
    return (
        <button
            onClick={disabled ? null : onClick}
            disabled={disabled}
            className={`${styles[type]} px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 flex items-center justify-center gap-2 w-full md:w-auto ${className}`}
        >
            {icon} {children}
        </button>
    );
};

const DashboardCard = ({ title, value, subtext, linkText, onClick, icon, colorClass }) => (
    <div onClick={onClick} className="bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-lg p-6 cursor-pointer group transition-shadow hover:shadow-xl flex flex-col">
        <div className="flex justify-between items-start">
            <h4 className="font-bold text-gray-600 pr-4">{title}</h4>
            <div className={`flex-shrink-0 ${colorClass}`}>{icon}</div>
        </div>
        <div className="flex-grow">
            <p className={`text-4xl font-bold mt-2 ${colorClass}`}>{value}</p>
            {subtext && <p className="text-slate-400 text-sm font-medium mt-1">{subtext}</p>}
        </div>
        <span className="text-indigo-600 text-sm mt-3 inline-block transition-all duration-200 group-hover:text-indigo-700">
            {linkText} &rarr;
        </span>
    </div>
);

const formatDataForChart = (transactions) => {
    if (!transactions || transactions.length === 0) return { labels: [], datasets: [] };
    const data = {};
    transactions.forEach(tx => {
        if (tx.created_at && typeof tx.created_at.toDate === 'function') {
            const date = tx.created_at.toDate().toLocaleDateString();
            if (!data[date]) data[date] = { income: 0, expense: 0 };
            if (tx.type === 'income') data[date].income += tx.amount;
            else data[date].expense += tx.amount;
        }
    });
    const labels = Object.keys(data).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    return {
        labels,
        datasets: [
            { label: 'Inflow (₱)', data: labels.map(label => data[label].income), backgroundColor: 'rgba(75, 192, 192, 0.5)' },
            { label: 'Outflow (₱)', data: labels.map(label => data[label].expense), backgroundColor: 'rgba(255, 99, 132, 0.5)' }
        ]
    }
};

export default function UserDashboard({ onEnterFamily, onEnterCompany, onEnterAdmin }) {
    const context = useContext(AppContext);
    const router = useRouter(); 
    
    const [modals, setModals] = useState({
        transactions: false, goals: false, families: false, lending: false,
        createTx: false, createGoal: false, recordLoan: false, applyCompany: false, applyFamily: false
    });
    const [loanFlowStep, setLoanFlowStep] = useState('choice');
    const [activeFamilyRealm, setActiveFamilyRealm] = useState(null);
    const [showCompanyRealm, setShowCompanyRealm] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [summaryData, setSummaryData] = useState({ netPosition: 0 });
    const [summaryError, setSummaryError] = useState(null);
    const [activeGoalsCount, setActiveGoalsCount] = useState(0);
    const [lendingSummary, setLendingSummary] = useState({ outstanding: 0 });
    const [report, setReport] = useState(null);
    const [reportLoading, setReportLoading] = useState(true);
    const [reportError, setReportError] = useState(null);
    const [period, setPeriod] = useState('monthly');

    const { user, premiumDetails, refreshUserData } = context || {};
    const userLastName = user?.last_name || (user?.full_name ? user.full_name.trim().split(' ').pop() : 'User');

    // ⭐️ FIX: Simplify access check to rely ONLY on the user object flags
    const isCompanyActive = useMemo(() => {
        if (user?.role === 'admin') return true;
        
        // Rely on the is_premium flag AND the subscription_status set by the Admin
        return user?.is_premium === true && user?.subscription_status === 'active';
    }, [user]); 

    // ⭐️ FIX: Simplify access check to rely ONLY on the user object flags
    const isFamilyActive = useMemo(() => {
        if (user?.role === 'admin') return true;
        
        // Rely on the is_family_premium flag AND the subscription_status set by the Admin
        return user?.is_family_premium === true && user?.family_subscription_status === 'active';
    }, [user]);

    const isCompanyPending = user?.subscription_status === 'pending_approval';
    const isFamilyPending = user?.family_subscription_status === 'pending_approval';

    const toggleModal = (key, val) => setModals(prev => ({ ...prev, [key]: val }));

    const fetchData = useCallback(async () => {
        if (!user?.uid) return; 

        try {
            const txRes = await fetch(`${API_BASE_URL}/transactions?user_id=${user.uid}`);
            if (!txRes.ok) throw new Error("Fetch failed");
            
            const txs = await txRes.json();
            let balance = 0;
            txs.forEach((tx) => { 
                if (!tx.family_id) {
                    tx.type === 'income' ? balance += tx.amount : balance -= tx.amount; 
                }
            });
            setSummaryData({ netPosition: balance });

            const gRes = await fetch(`${API_BASE_URL}/goals?user_id=${user.uid}`);
            if (gRes.ok) setActiveGoalsCount((await gRes.json()).filter(g => g.status === 'active').length);

            const lRes = await fetch(`${API_BASE_URL}/loans?user_id=${user.uid}`);
            if (lRes.ok) {
                const loans = await lRes.json();
                let out = 0;
                loans.forEach(l => { 
                    if (l.creditor_id === user.uid && (l.status === 'outstanding' || l.status === 'pending_confirmation')) {
                        out += ((l.total_owed || l.amount) - (l.repaid_amount || 0)); 
                    }
                });
                setLendingSummary({ outstanding: out });
            }
        } catch (e) { 
            console.error("Dashboard Fetch Error:", e); 
            setSummaryError("Error"); 
        }
    }, [user?.uid]);

    const getReport = useCallback(async () => {
        if (!user?.uid) return;
        setReportLoading(true); 
        setReportError(null);
        try {
            const endDate = new Date();
            const startDate = new Date();
            if (period === 'weekly') startDate.setDate(endDate.getDate() - 7);
            else if (period === 'yearly') startDate.setFullYear(endDate.getFullYear() - 1);
            else startDate.setMonth(endDate.getMonth() - 1);

            const res = await fetch(`${API_BASE_URL}/transactions?user_id=${user.uid}&startDate=${startDate.toISOString()}`);
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();
            const txList = Array.isArray(data) ? data : [];
            const txs = txList.filter(tx => !tx.family_id).map(tx => ({ 
                ...tx, 
                created_at: { toDate: () => new Date(tx.created_at) } 
            }));
            
            let inflow = 0, outflow = 0;
            txs.forEach(tx => tx.type === 'income' ? inflow += tx.amount : outflow += tx.amount);

            setReport({
                chartData: formatDataForChart(txs), 
                totalInflow: inflow, 
                totalOutflow: outflow, 
                netPosition: inflow - outflow,
                reportTitle: `Funds Report: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 
                transactionCount: txs.length
            });
        } catch (err) { 
            console.error("Report Fetch Error:", err);
            setReportError("No Data"); 
        } finally { 
            setReportLoading(false); 
        }
    }, [user?.uid, period]);

    const refresh = useCallback(() => { fetchData(); getReport(); }, [fetchData, getReport]);

    useEffect(() => { 
        if (user?.uid) { 
            setIsInitialLoading(true); 
            refresh(); 
            setIsInitialLoading(false); 
        } 
    }, [user?.uid, refresh]);

    useEffect(() => { 
        if (!isInitialLoading && user?.uid) getReport(); 
    }, [period, isInitialLoading, getReport, user?.uid]);

    // FIX: Add useEffect to refresh user data when the browser tab becomes visible
    useEffect(() => {
        if (user?.uid && typeof refreshUserData === 'function') {
            const handleVisibilityChange = () => {
                if (document.visibilityState === 'visible') {
                    refreshUserData(); 
                    refresh();
                }
            };

            document.addEventListener('visibilitychange', handleVisibilityChange);
            return () => {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            };
        }
    }, [user?.uid, refreshUserData, refresh]);

    const handleUpgradeSubmit = async (paymentData) => {
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
            alert("Success! Request submitted for review.");
            
            if (typeof refreshUserData === 'function') refreshUserData();

        } catch (error) {
            console.error("Upgrade submission failed:", error);
            alert("Failed to submit request.");
        }
    };

    if (!context || !context.user || context.loading) {
        return <div className="p-20 text-center text-slate-500">Authenticating...</div>;
    }

    if (activeFamilyRealm) return <Suspense fallback={<div/>}><FamilyRealm family={activeFamilyRealm} onBack={() => setActiveFamilyRealm(null)} onDataChange={refresh} /></Suspense>;
    if (showCompanyRealm) return <Suspense fallback={<div/>}><CompanyRealm company={{ id: user.uid, name: "Company" }} onBack={() => setShowCompanyRealm(false)} onDataChange={refresh} /></Suspense>;

    return (
        <div className="w-full">
            <SubscriptionReminder details={premiumDetails?.company} type="company" />
            <SubscriptionReminder details={premiumDetails?.family} type="family" />

            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-1 h-12 bg-indigo-600 rounded-full opacity-80"></div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-none">{userLastName}</h1>
                        <p className="text-slate-500 font-medium text-sm mt-1 tracking-wide">Personal Realm</p>
                    </div>
                </div>

                <div className="w-full md:w-auto">
                    <div className="grid grid-cols-2 gap-3 md:flex md:items-center">
                        <Btn onClick={() => toggleModal('createTx', true)} type="pri" icon={Icons.Plus} className="col-span-2 md:col-span-1">Transaction</Btn>
                        <Btn onClick={() => toggleModal('createGoal', true)} icon={Icons.Plus}>Goal</Btn>
                        <Btn onClick={() => { setLoanFlowStep('choice'); toggleModal('recordLoan', true); }} icon={Icons.Plus}>Loan</Btn>
                        <div className="hidden md:block w-px h-10 bg-slate-200 mx-1"></div>

                        {/* Families Button Logic - NOW RELIES ON SIMPLIFIED isFamilyActive */}
                        {isFamilyActive ? (
                            <Btn onClick={() => toggleModal('families', true)} icon={Icons.Users}>Families</Btn>
                        ) : isFamilyPending ? (
                            <Btn type="pending" icon={Icons.Lock} disabled>Pending</Btn>
                        ) : (
                            <Btn onClick={() => toggleModal('applyFamily', true)} type="sec" icon={Icons.Lock}>Apply Family</Btn>
                        )}

                        {/* Company Button Logic - NOW RELIES ON SIMPLIFIED isCompanyActive */}
                        {isCompanyActive ? (
                            <Btn onClick={() => setShowCompanyRealm(true)} type="comp" icon={Icons.Build}>Company</Btn>
                        ) : isCompanyPending ? (
                            <Btn type="pending" icon={Icons.Lock} disabled>Pending</Btn>
                        ) : (
                            <Btn onClick={() => toggleModal('applyCompany', true)} type="sec" icon={Icons.Lock}>Apply Company</Btn>
                        )}

                        {user?.role === 'admin' && (
                            <Btn onClick={onEnterAdmin} icon={Icons.Lock} className="col-span-2 md:col-span-1">Admin</Btn>
                        )}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <DashboardCard 
                    title="Personal Funds" 
                    value={summaryError ? 'Error' : `₱${(summaryData?.netPosition || 0).toLocaleString()}`} 
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
                    value={`₱${(lendingSummary?.outstanding || 0).toLocaleString()}`} 
                    subtext="Total Receivables" 
                    linkText="Manage Lending" 
                    onClick={() => toggleModal('lending', true)} 
                    icon={Icons.Gift} 
                    colorClass="text-amber-600" 
                />
            </div>

            <div className="dashboard-section">
                <div className="flex justify-center gap-2 mb-6 bg-slate-100 p-1 rounded-xl w-fit mx-auto">
                    {['weekly', 'monthly', 'yearly'].map(p => (
                        <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1 text-sm rounded-lg capitalize transition ${period === p ? 'bg-white shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-800'}`}>{p}</button>
                    ))}
                </div>
                {reportLoading ? <div className="h-96 flex items-center justify-center text-slate-400">Loading Report...</div> :
                 reportError ? <p className="text-red-500 text-center py-10">{reportError}</p> :
                 <Suspense fallback={<div className="h-96"/>}><PersonalReportChartWidget report={report} /></Suspense>}
            </div>

            <Suspense fallback={null}>
                {modals.transactions && <Modal isOpen={modals.transactions} onClose={() => toggleModal('transactions', false)} title="Personal Transactions"><PersonalTransactionsWidget /></Modal>}
                {modals.goals && <Modal isOpen={modals.goals} onClose={() => toggleModal('goals', false)} title="Goals"><GoalListsWidget onDataChange={refresh} /></Modal>}
                {modals.families && <Modal isOpen={modals.families} onClose={() => toggleModal('families', false)} title="Families"><ManageFamiliesWidget onEnterRealm={setActiveFamilyRealm} /></Modal>}
                {modals.lending && <Modal isOpen={modals.lending} onClose={() => toggleModal('lending', false)} title="Loans"><LoanTrackingWidget onDataChange={refresh} /></Modal>}
                {modals.createTx && <Modal isOpen={modals.createTx} onClose={() => toggleModal('createTx', false)} title="New Transaction"><CreateTransactionWidget onSuccess={() => { toggleModal('createTx', false); refresh(); }} /></Modal>}
                {modals.createGoal && <Modal isOpen={modals.createGoal} onClose={() => toggleModal('createGoal', false)} title="New Goal"><CreateGoalWidget onSuccess={() => { toggleModal('createGoal', false); fetchData(); }} /></Modal>}
                {modals.recordLoan && <Modal isOpen={modals.recordLoan} onClose={() => toggleModal('recordLoan', false)} title="Record Loan">
                    {loanFlowStep === 'choice' && <RecordLoanChoiceWidget onSelectFamilyLoan={() => setLoanFlowStep('family')} onSelectPersonalLoan={() => setLoanFlowStep('personal')} />}
                    {loanFlowStep === 'family' && <RecordLoanFlowWidget onSuccess={() => { toggleModal('recordLoan', false); refresh(); }} />}
                    {loanFlowStep === 'personal' && <CreatePersonalLoanWidget onSuccess={() => { toggleModal('recordLoan', false); refresh(); }} />}
                </Modal>}
                {modals.applyCompany && <Modal isOpen={modals.applyCompany} onClose={() => toggleModal('applyCompany', false)} title="Unlock Company"><ApplyPremiumWidget targetAccess="company" onClose={() => toggleModal('applyCompany', false)} onUpgradeSuccess={handleUpgradeSubmit} /></Modal>}
                {modals.applyFamily && <Modal isOpen={modals.applyFamily} onClose={() => toggleModal('applyFamily', false)} title="Unlock Family"><ApplyPremiumWidget targetAccess="family" onClose={() => toggleModal('applyFamily', false)} onUpgradeSuccess={handleUpgradeSubmit} /></Modal>}
            </Suspense>
        </div>
    );
}