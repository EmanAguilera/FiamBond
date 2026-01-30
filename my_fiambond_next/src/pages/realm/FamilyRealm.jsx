'use client'; // Required for all components using state, effects, or context in Next.js App Router

import { useState, Suspense, useContext, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic'; // Use next/dynamic instead of React.lazy
import { AppContext } from '../../context/AppContext.jsx';
import { db } from '../../config/firebase-config.js';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
// Removed: import { Link } from 'react-router-dom'; (Not needed, navigation handled by 'onBack' prop)

// --- WIDGET IMPORTS (Converted to next/dynamic) ---
// Using ssr: false for components that rely purely on client-side logic/APIs
const Modal = dynamic(() => import('../../components/layout/Modal.jsx'), { ssr: false });
const FamilyReportChartWidget = dynamic(() => import('../../components/analytics/FamilyReportChartWidget'), { ssr: false });
const LoanTrackingWidget = dynamic(() => import('../../components/loans/LoanTrackingWidget'), { ssr: false });
const GoalListsWidget = dynamic(() => import("../../components/goals/GoalListsWidget"), { ssr: false });
const CreateLoanWidget = dynamic(() => import('../../components/loans/setups/CreateLoanWidget'), { ssr: false });
const CreateFamilyTransactionWidget = dynamic(() => import('../../components/finance/CreateFamilyTransactionWidget'), { ssr: false });
const CreateFamilyGoalWidget = dynamic(() => import('../../components/goals/CreateFamilyGoalWidget'), { ssr: false });
const FamilyTransactionsWidget = dynamic(() => import('../../components/finance/FamilyTransactionsWidget'), { ssr: false });
const ManageMembersWidget = dynamic(() => import('../../components/management/ManageMembersWidget'), { ssr: false });

// --- ICONS (Kept as is) ---
const Icons = {
    Plus: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>,
    Back: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>,
    Users: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>,
    Wallet: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>,
    Flag: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2z"></path></svg>,
    Gift: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path></svg>
};

// --- REUSABLE BUTTON (Kept as is) ---
const Btn = ({ onClick, type = 'sec', icon, children, className = '' }) => {
    const styles = {
        pri: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm border border-transparent",
        sec: "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 hover:text-slate-800",
        ghost: "bg-transparent text-slate-500 hover:text-slate-800"
    };
    return (
        <button onClick={onClick} className={`${styles[type]} px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 flex items-center justify-center gap-2 w-full md:w-auto ${className}`}>
            {icon} {children}
        </button>
    );
};

// --- DASHBOARD CARD (Kept as is) ---
const DashboardCard = ({ title, value, subtext, linkText, onClick, icon, colorClass }) => (
    <div onClick={onClick} className="bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-lg p-6 cursor-pointer group transition-shadow hover:shadow-xl flex flex-col">
        <div className="flex justify-between items-start">
            <h4 className="font-bold text-gray-600 pr-4">{title}</h4>
            <div className={`flex-shrink-0 ${colorClass}`}>{icon}</div>
        </div>
        <div className="flex-grow"><p className={`text-4xl font-bold mt-2 ${colorClass}`}>{value}</p></div>
        {subtext && <p className="text-slate-400 text-sm font-medium mt-1">{subtext}</p>}
        <span className="text-indigo-600 text-sm mt-3 inline-block transition-all duration-200 group-hover:text-indigo-700">
            {linkText} &rarr;
        </span>
    </div>
);

// --- HELPER FUNCTION (Kept as is) ---
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
    };
};

export default function FamilyRealm({ family, onBack, onDataChange, onFamilyUpdate }) {
    const { user } = useContext(AppContext);
    // Next.js change: Replace import.meta.env.VITE_API_URL with process.env.NEXT_PUBLIC_API_URL
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [isGoalsListModalOpen, setIsGoalsListModalOpen] = useState(false);
    const [isFamilyTransactionsModalOpen, setIsFamilyTransactionsModalOpen] = useState(false);
    const [isLoanListModalOpen, setIsLoanListModalOpen] = useState(false);
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

    const [loading, setLoading] = useState(true);
    const [familyNotFound, setFamilyNotFound] = useState(false);
    const [summaryData, setSummaryData] = useState(null);
    const [activeGoalsCount, setActiveGoalsCount] = useState(0);
    const [activeLoansCount, setActiveLoansCount] = useState(0);
    const [report, setReport] = useState(null);
    const [reportLoading, setReportLoading] = useState(true);
    const [reportError, setReportError] = useState(null);
    const [period, setPeriod] = useState('monthly');
    const [familyMembers, setFamilyMembers] = useState([]);

    // --- FETCH DATA LOGIC (Kept as is, using updated API_URL) ---
    const getFamilyMembers = useCallback(async () => {
        if (!family) return;
        try {
            const famRes = await fetch(`${API_URL}/families/${family.id}`);
            if (!famRes.ok) return;
            const freshFamily = await famRes.json();
            const memberIds = freshFamily.member_ids || [];

            if (memberIds.length === 0) { setFamilyMembers([]); return; }

            const usersRef = collection(db, "users");
            const safeMemberIds = memberIds.slice(0, 10);
            const q = query(usersRef, where(documentId(), "in", safeMemberIds));
            const usersSnapshot = await getDocs(q);

            const fetchedMembers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFamilyMembers(fetchedMembers);
        } catch (error) { console.error("Failed to fetch members", error); }
    }, [family, API_URL]);

    const getFamilyBalance = useCallback(async () => {
        if (!user || !family || familyNotFound) return;
        try {
            const response = await fetch(`${API_URL}/transactions?family_id=${family.id}`);
            if (response.ok) {
                const transactions = await response.json();
                let netPosition = 0;
                transactions.forEach(tx => {
                    if (tx.type === 'income') netPosition += tx.amount;
                    else netPosition -= tx.amount;
                });
                setSummaryData({ netPosition });
            }
        } catch (error) { console.error(error); }
    }, [user, family, familyNotFound, API_URL]);

    const getFamilyActiveGoalsCount = useCallback(async () => {
        if (!user || !family || familyNotFound) return;
        try {
            const response = await fetch(`${API_URL}/goals?family_id=${family.id}`);
            if (response.ok) {
                setActiveGoalsCount((await response.json()).filter(g => g.status === 'active').length);
            }
        } catch (error) { console.error(error); }
    }, [user, family, familyNotFound, API_URL]);

    const getFamilyActiveLoansCount = useCallback(async () => {
        if (!user || !family || familyNotFound) return;
        try {
            const response = await fetch(`${API_URL}/loans?family_id=${family.id}`);
            if (response.ok) {
                const loans = await response.json();
                setActiveLoansCount(loans.filter(l => l.status === 'outstanding' || l.status === 'pending_confirmation').length);
            }
        } catch (error) { console.error(error); }
    }, [user, family, familyNotFound, API_URL]);

    const getFamilyReport = useCallback(async () => {
        if (!user || !family || familyNotFound) return;
        setReportLoading(true); setReportError(null);
        try {
            // FIX: Independent Date calculation for accurate report titles
            const endDate = new Date();
            const startDate = new Date();

            if (period === 'weekly') {
                startDate.setDate(endDate.getDate() - 7);
            } else if (period === 'yearly') {
                startDate.setFullYear(endDate.getFullYear() - 1);
            } else {
                // Monthly default
                startDate.setMonth(endDate.getMonth() - 1);
            }

            const response = await fetch(`${API_URL}/transactions?family_id=${family.id}&startDate=${startDate.toISOString()}`);
            if (!response.ok) throw new Error('API Error');

            const transactions = (await response.json()).map(tx => ({ ...tx, id: tx._id, created_at: { toDate: () => new Date(tx.created_at) } }));

            let totalInflow = 0, totalOutflow = 0;
            transactions.forEach(tx => { tx.type === 'income' ? totalInflow += tx.amount : totalOutflow += tx.amount; });

            setReport({
                chartData: formatDataForChart(transactions),
                totalInflow,
                totalOutflow,
                netPosition: totalInflow - totalOutflow,
                // FIX: Dynamic Date Range Title
                reportTitle: `Funds Report: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
                transactionCount: transactions.length
            });
        } catch (error) {
            console.error("Report Fetch Error:", error);
            setReportError("No data");
        } finally { setReportLoading(false); }
    }, [user, family, period, familyNotFound, API_URL]);

    const handleRealmRefresh = useCallback(async () => {
        if (familyNotFound) return;
        setIsTransactionModalOpen(false); setIsGoalModalOpen(false); setIsLoanModalOpen(false);
        await Promise.all([ getFamilyBalance(), getFamilyActiveGoalsCount(), getFamilyActiveLoansCount(), getFamilyReport(), getFamilyMembers() ]);
        if (onDataChange) onDataChange();
    }, [getFamilyBalance, getFamilyActiveGoalsCount, getFamilyActiveLoansCount, getFamilyReport, getFamilyMembers, onDataChange, familyNotFound]);

    useEffect(() => {
        const fetchAllData = async () => {
            if (!family || !user) return;
            setLoading(true);
            try {
                const checkResponse = await fetch(`${API_URL}/families/${family.id}`);
                if (checkResponse.status === 404) { setFamilyNotFound(true); setLoading(false); return; }
                await Promise.all([ getFamilyBalance(), getFamilyActiveGoalsCount(), getFamilyActiveLoansCount(), getFamilyReport(), getFamilyMembers() ]);
            } catch (error) { console.error(error); } finally { setLoading(false); }
        };
        fetchAllData();
    }, [family, user, API_URL, getFamilyBalance, getFamilyActiveGoalsCount, getFamilyActiveLoansCount, getFamilyReport, getFamilyMembers]);

    useEffect(() => { if (!loading && !familyNotFound) getFamilyReport(); }, [period, loading, familyNotFound, getFamilyReport]);

    const handleMembersUpdate = (updatedFamily) => { getFamilyMembers(); if (onFamilyUpdate) onFamilyUpdate(updatedFamily); };

    if (loading) return <div className="p-10 text-center animate-pulse text-slate-500">Loading Family Realm...</div>;
    if (familyNotFound) return <div className="p-10 text-center">Family Not Found <button onClick={onBack}>Back</button></div>;

    return (
        <div className="w-full">
            {/* --- HEADER --- */}
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex flex-col gap-1">

                    {/* Utility Pill Back Button */}
                    <button
                        onClick={onBack}
                        className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 text-sm font-medium hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm transition-all mb-4 w-fit"
                    >
                        <span className="group-hover:-translate-x-0.5 transition-transform">{Icons.Back}</span>
                        <span>Back to Personal</span>
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-1 h-12 bg-indigo-600 rounded-full opacity-80"></div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-none">
                                {family.family_name}
                            </h1>
                            <p className="text-slate-500 font-medium text-sm mt-1 tracking-wide">
                                Family Realm
                            </p>
                        </div>
                    </div>
                </div>

                {/* --- RESPONSIVE BUTTON GRID --- */}
                <div className="w-full md:w-auto">
                    <div className="grid grid-cols-2 gap-3 md:flex md:items-center">

                        {/* Transaction Button: Full Width on Mobile */}
                        <div className="col-span-2 md:col-span-1 md:w-auto">
                            <Btn onClick={() => setIsTransactionModalOpen(true)} type="pri" icon={Icons.Plus} className="w-full">
                                Transaction
                            </Btn>
                        </div>

                        {/* Middle Buttons */}
                        <Btn onClick={() => setIsGoalModalOpen(true)} icon={Icons.Plus}>Goal</Btn>
                        <Btn onClick={() => setIsLoanModalOpen(true)} icon={Icons.Plus}>Loan</Btn>

                        <div className="hidden md:block w-px h-10 bg-slate-200 mx-1"></div>

                        {/* Members Button: Full Width on Mobile (Matches Transaction) */}
                        <div className="col-span-2 md:col-span-1 md:w-auto">
                            <Btn onClick={() => setIsMembersModalOpen(true)} icon={Icons.Users} className="w-full">
                                Members
                            </Btn>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <DashboardCard title="Family Funds" value={summaryData ? `₱${summaryData.netPosition.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '₱0.00'} subtext="Available Balance" linkText="View Transactions" onClick={() => setIsFamilyTransactionsModalOpen(true)} icon={Icons.Wallet} colorClass="text-emerald-600"/>
                <DashboardCard title="Active Goals" value={activeGoalsCount} subtext="Targets in Progress" linkText="View Goals" onClick={() => setIsGoalsListModalOpen(true)} icon={Icons.Flag} colorClass="text-rose-600"/>
                <DashboardCard title="Outstanding Loans" value={activeLoansCount} subtext="Total Receivables" linkText="Manage Lending" onClick={() => setIsLoanListModalOpen(true)} icon={Icons.Gift} colorClass="text-amber-600"/>
            </div>

            <div className="dashboard-section">
                {/* --- UPDATED PERIOD SELECTOR (Pill Style) --- */}
                <div className="flex justify-center gap-2 mb-6 bg-slate-100 p-1 rounded-xl w-fit mx-auto">
                    {['weekly', 'monthly', 'yearly'].map(p => (
                        <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1 text-sm rounded-lg capitalize transition ${period === p ? 'bg-white shadow-sm font-semibold text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}>{p}</button>
                    ))}
                </div>

                {reportLoading ? (
                    <div className="w-full h-96 flex justify-center items-center text-slate-400">Loading Report...</div>
                ) : reportError ? (
                    <div className="w-full h-96 flex justify-center items-center text-red-400">No data available</div>
                ) : (
                    <Suspense fallback={<div className="h-96 bg-slate-100 rounded-lg"></div>}>
                        <FamilyReportChartWidget family={family} report={report} />
                    </Suspense>
                )}
            </div>

            <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center text-white">Loading...</div>}>
                {isLoanModalOpen && <Modal isOpen={isLoanModalOpen} onClose={() => setIsLoanModalOpen(false)} title="Record New Loan"><CreateLoanWidget family={family} members={familyMembers} onSuccess={handleRealmRefresh} /></Modal>}
                {isTransactionModalOpen && <Modal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} title={`Record New Transaction`}><CreateFamilyTransactionWidget family={family} onSuccess={handleRealmRefresh} /></Modal>}
                {isGoalModalOpen && <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title={`Record New Goal`}><CreateFamilyGoalWidget family={family} onSuccess={handleRealmRefresh} /></Modal>}
                {isFamilyTransactionsModalOpen && <Modal isOpen={isFamilyTransactionsModalOpen} onClose={() => setIsFamilyTransactionsModalOpen(false)} title={`Shared Family Transactions`}><FamilyTransactionsWidget family={family} /></Modal>}
                {isGoalsListModalOpen && <Modal isOpen={isGoalsListModalOpen} onClose={() => setIsGoalsListModalOpen(false)} title={`Shared Family Goals`}><GoalListsWidget family={family} onDataChange={handleRealmRefresh} /></Modal>}
                {isLoanListModalOpen && <Modal isOpen={isLoanListModalOpen} onClose={() => setIsLoanListModalOpen(false)} title={`Shared Family Loan Tracker`}><LoanTrackingWidget family={family} onDataChange={handleRealmRefresh} /></Modal>}
                {isMembersModalOpen && <Modal isOpen={isMembersModalOpen} onClose={() => setIsMembersModalOpen(false)} title={`Manage Member Access`}><ManageMembersWidget family={family} members={familyMembers} onUpdate={handleMembersUpdate}/></Modal>}
            </Suspense>
        </div>
    );
}