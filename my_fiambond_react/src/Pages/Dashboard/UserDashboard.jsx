import { useContext, useEffect, useState, useCallback, lazy, Suspense } from "react";
import { AppContext } from "../../Context/AppContext.jsx";

// --- WIDGET IMPORTS ---
const Modal = lazy(() => import("../../Components/Modal"));

// Personal - Goals
const GoalListsWidget = lazy(() => import("../../Components/Personal/Goals/GoalListsWidget.jsx"));
const CreateGoalWidget = lazy(() => import("../../Components/Personal/Goals/CreateGoalWidget.tsx"));

// Personal - Transactions
const PersonalTransactionsWidget = lazy(() => import("../../Components/Personal/Transactions/PersonalTransactionsWidget.jsx"));
const CreateTransactionWidget = lazy(() => import("../../Components/Personal/Transactions/CreateTransactionWidget.tsx"));

// Personal - Dashboard Tools
const MyFamiliesListWidget = lazy(() => import("../../Components/Personal/Dashboard/MyFamiliesListWidget.jsx"));
const PersonalReportChartWidget = lazy(() => import("../../Components/Personal/Dashboard/PersonalReportChartWidget.jsx"));

// Personal - Loans
const LoanTrackingWidget = lazy(() => import("../../Components/Personal/Loans/LoanTrackingWidget.tsx"));
const RecordLoanFlowWidget = lazy(() => import("../../Components/Personal/Loans/RecordLoanFlowWidget.tsx"));
const RecordLoanChoiceWidget = lazy(() => import("../../Components/Personal/Loans/RecordLoanChoiceWidget.tsx"));
const CreatePersonalLoanWidget = lazy(() => import("../../Components/Personal/Loans/CreatePersonalLoanWidget.tsx"));

// Family - Dashboard
const FamilyRealm = lazy(() => import("../../Components/Family/Dashboard/FamilyRealm.jsx"));

// --- SKELETON & ICONS ---
const DashboardSkeleton = () => (
    <div className="p-4 md:p-10 animate-pulse">
        <header className="dashboard-header mb-8">
            <div className="flex flex-wrap gap-4">
                <div className="h-10 w-40 bg-slate-200 rounded"></div>
                <div className="h-10 w-40 bg-slate-200 rounded"></div>
                <div className="h-10 w-32 bg-slate-200 rounded"></div>
            </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="h-32 bg-slate-200 rounded-lg"></div>
            <div className="h-32 bg-slate-200 rounded-lg"></div>
            <div className="h-32 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="w-full h-96 bg-slate-200 rounded-lg"></div>
    </div>
);

const WalletIcon = () => (<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>);
const FlagIcon = () => (<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2z"></path></svg>);
const GiftIcon = () => (<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path></svg>);

const DashboardCard = ({ title, value, linkText, onClick, icon, colorClass }) => (
    <div onClick={onClick} className="bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-lg p-6 cursor-pointer group transition-shadow hover:shadow-xl flex flex-col">
        <div className="flex justify-between items-start">
            <h4 className="font-bold text-gray-600 pr-4">{title}</h4>
            <div className={`flex-shrink-0 ${colorClass}`}>{icon}</div>
        </div>
        <div className="flex-grow"><p className={`text-4xl font-bold mt-2 ${colorClass}`}>{value}</p></div>
        <span className="text-link text-sm mt-3 inline-block">{linkText} &rarr;</span>
    </div>
);

// Helper for Chart Data
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

export default function UserDashboard() {
    const { user } = useContext(AppContext);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    // --- UI STATE ---
    const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
    const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false);
    const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
    const [isLendingModalOpen, setIsLendingModalOpen] = useState(false);
    const [isCreateTransactionModalOpen, setIsCreateTransactionModalOpen] = useState(false);
    const [isCreateGoalModalOpen, setIsCreateGoalModalOpen] = useState(false);
    const [isRecordLoanModalOpen, setIsRecordLoanModalOpen] = useState(false);
    const [loanFlowStep, setLoanFlowStep] = useState('choice');
    const [activeFamilyRealm, setActiveFamilyRealm] = useState(null);
    
    // --- DATA STATE ---
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [summaryData, setSummaryData] = useState(null);
    const [summaryError, setSummaryError] = useState(null);
    const [activeGoalsCount, setActiveGoalsCount] = useState(0);
    const [lendingSummary, setLendingSummary] = useState({ outstanding: 0 });
    const [report, setReport] = useState(null);
    const [reportLoading, setReportLoading] = useState(true);
    const [reportError, setReportError] = useState(null);
    const [period, setPeriod] = useState('monthly');

    // --- DATA FETCHING ---
    const getSummaryData = useCallback(async () => {
        if (!user) return;
        try {
            const response = await fetch(`${API_URL}/transactions?user_id=${user.uid}`);
            if (!response.ok) throw new Error('API Error');
            const transactions = await response.json();
            let balance = 0;
            transactions.forEach((tx) => {
                if (!tx.family_id) {
                    if (tx.type === 'income') balance += tx.amount;
                    else balance -= tx.amount;
                }
            });
            setSummaryData({ netPosition: balance });
        } catch (err) { 
            console.error(err); // <--- FIX 1: Log the error
            setSummaryError("Could not load summary."); 
        }
    }, [user, API_URL]);
    
    const getActiveTotalGoalsCount = useCallback(async () => {
        if (!user) return;
        try {
            const response = await fetch(`${API_URL}/goals?user_id=${user.uid}`);
            if (response.ok) {
                const goals = await response.json();
                setActiveGoalsCount(goals.filter(g => g.status === 'active').length);
            }
        } catch (error) { console.error(error); }
    }, [user, API_URL]);
    
    const getLendingSummary = useCallback(async () => {
        if (!user) return;
        try {
            const response = await fetch(`${API_URL}/loans?user_id=${user.uid}`);
            if (response.ok) {
                const loans = await response.json();
                let totalOutstanding = 0;
                loans.forEach((loan) => {
                    if (loan.creditor_id === user.uid && (loan.status === 'outstanding' || loan.status === 'pending_confirmation')) {
                        totalOutstanding += ((loan.total_owed || loan.amount) - (loan.repaid_amount || 0));
                    }
                });
                setLendingSummary({ outstanding: totalOutstanding });
            }
        } catch (error) { console.error(error); }
    }, [user, API_URL]);

    const getReport = useCallback(async () => {
        if (!user) return;
        setReportLoading(true);
        setReportError(null);
        try {
            const now = new Date();
            let startDate;
            if (period === 'weekly') startDate = new Date(now.setDate(now.getDate() - 7));
            else if (period === 'yearly') startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            else startDate = new Date(now.setMonth(now.getMonth() - 1));

            const queryParams = new URLSearchParams({ user_id: user.uid, startDate: startDate.toISOString() });
            const response = await fetch(`${API_URL}/transactions?${queryParams}`);
            if (!response.ok) throw new Error('API Error');
            const rawData = await response.json();

            const transactions = rawData.filter(tx => !tx.family_id).map(tx => ({
                ...tx, id: tx._id, created_at: { toDate: () => new Date(tx.created_at) }
            }));

            let totalInflow = 0;
            let totalOutflow = 0;
            transactions.forEach(tx => {
                if (tx.type === 'income') totalInflow += tx.amount;
                else totalOutflow += tx.amount;
            });

            setReport({
                chartData: formatDataForChart(transactions),
                totalInflow, totalOutflow,
                netPosition: totalInflow - totalOutflow,
                reportTitle: `Report from ${startDate.toLocaleDateString()}`,
                transactionCount: transactions.length
            });
        } catch (err) { 
            console.error(err); // <--- FIX 2: Log the error
            setReportError("No Data"); 
            setReport(null); 
        } 
        finally { setReportLoading(false); }
    }, [user, period, API_URL]);

    const handleDashboardRefresh = useCallback(() => {
        getSummaryData();
        getActiveTotalGoalsCount();
        getLendingSummary();
        getReport();
    }, [getSummaryData, getActiveTotalGoalsCount, getLendingSummary, getReport]);

    useEffect(() => {
        const init = async () => {
            setIsInitialLoading(true);
            await handleDashboardRefresh();
            setIsInitialLoading(false);
        };
        if (user) init();
    }, [user, handleDashboardRefresh]); 

    useEffect(() => {
        if (!isInitialLoading) getReport();
    }, [period, isInitialLoading, getReport]);

    // --- HANDLERS ---
    const handleTransactionSuccess = () => { setIsCreateTransactionModalOpen(false); handleDashboardRefresh(); };
    const handleGoalSuccess = () => { setIsCreateGoalModalOpen(false); getActiveTotalGoalsCount(); };
    const handleRecordLoanSuccess = () => { setIsRecordLoanModalOpen(false); handleDashboardRefresh(); };
    const openCreateFamilyFromLoanFlow = () => { setIsRecordLoanModalOpen(false); setIsFamilyModalOpen(true); };
    
    const renderLoanModalContent = () => {
        switch (loanFlowStep) {
            case 'family': return <RecordLoanFlowWidget onSuccess={handleRecordLoanSuccess} onRequestCreateFamily={openCreateFamilyFromLoanFlow} />;
            case 'personal': return <CreatePersonalLoanWidget onSuccess={handleRecordLoanSuccess} />;
            case 'choice': default: return <RecordLoanChoiceWidget onSelectFamilyLoan={() => setLoanFlowStep('family')} onSelectPersonalLoan={() => setLoanFlowStep('personal')} />;
        }
    };

    if (isInitialLoading) return <DashboardSkeleton />;

    // 1. FAMILY REALM VIEW (If Active)
    if (activeFamilyRealm) {
        return (
            <Suspense fallback={<DashboardSkeleton />}>
                <FamilyRealm 
                    family={activeFamilyRealm} 
                    onBack={() => setActiveFamilyRealm(null)} 
                    onDataChange={handleDashboardRefresh} 
                />
            </Suspense>
        );
    }

    // 2. MAIN DASHBOARD VIEW
    return (
        <div className="p-4 md:p-10">
            <header className="dashboard-header">
                <div className="flex flex-wrap gap-4">
                    <button onClick={() => setIsCreateTransactionModalOpen(true)} className="primary-btn">+ Add Transaction</button>
                    <button onClick={() => { setLoanFlowStep('choice'); setIsRecordLoanModalOpen(true); }} className="primary-btn">+ Record a Loan</button>
                    <button onClick={() => setIsCreateGoalModalOpen(true)} className="secondary-btn">+ Add Goal</button>
                    <button onClick={() => setIsFamilyModalOpen(true)} className="secondary-btn">Manage Families</button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <DashboardCard title="Current Money (Net)" value={summaryError ? 'Error' : `₱${parseFloat(summaryData?.netPosition || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} linkText="View Transactions" onClick={() => setIsTransactionsModalOpen(true)} icon={<WalletIcon />} colorClass="text-emerald-600" />
                <DashboardCard title="Your Active Goals" value={activeGoalsCount} linkText="View Goals" onClick={() => setIsGoalsModalOpen(true)} icon={<FlagIcon />} colorClass="text-rose-600" />
                <DashboardCard title="Outstanding Loans" value={`₱${lendingSummary.outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} linkText="Manage Lending" onClick={() => setIsLendingModalOpen(true)} icon={<GiftIcon />} colorClass="text-amber-600" />
            </div>

            <div className="dashboard-section">
                <div className="w-full mx-auto flex justify-center gap-4 mb-6">
                    <button onClick={() => setPeriod('weekly')} className={period === 'weekly' ? 'active-period-btn' : 'period-btn'}>Weekly</button>
                    <button onClick={() => setPeriod('monthly')} className={period === 'monthly' ? 'active-period-btn' : 'period-btn'}>Monthly</button>
                    <button onClick={() => setPeriod('yearly')} className={period === 'yearly' ? 'active-period-btn' : 'period-btn'}>Yearly</button>
                </div>
                {reportLoading ? <div className="h-96 flex justify-center items-center text-slate-500">Loading Report...</div> : 
                 reportError ? <p className="error text-center py-10">{reportError}</p> : 
                 <Suspense fallback={<div className="h-96 bg-slate-100"></div>}><PersonalReportChartWidget report={report} /></Suspense>
                }
            </div>

            <Suspense fallback={<div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center text-white">Loading...</div>}>
                {isTransactionsModalOpen && <Modal isOpen={isTransactionsModalOpen} onClose={() => setIsTransactionsModalOpen(false)} title="Your Personal Transactions"><PersonalTransactionsWidget /></Modal>}
                {isGoalsModalOpen && <Modal isOpen={isGoalsModalOpen} onClose={() => setIsGoalsModalOpen(false)} title="Your Financial Goals"><GoalListsWidget onDataChange={handleDashboardRefresh} /></Modal>}
                {isFamilyModalOpen && <Modal isOpen={isFamilyModalOpen} onClose={() => setIsFamilyModalOpen(false)} title="Family Management"><MyFamiliesListWidget onEnterRealm={setActiveFamilyRealm} /></Modal>}
                {isLendingModalOpen && <Modal isOpen={isLendingModalOpen} onClose={() => setIsLendingModalOpen(false)} title="Your Lending Activity"><LoanTrackingWidget onDataChange={handleDashboardRefresh} /></Modal>}
                {isCreateTransactionModalOpen && <Modal isOpen={isCreateTransactionModalOpen} onClose={() => setIsCreateTransactionModalOpen(false)} title="Add Transaction"><CreateTransactionWidget onSuccess={handleTransactionSuccess} /></Modal>}
                {isCreateGoalModalOpen && <Modal isOpen={isCreateGoalModalOpen} onClose={() => setIsCreateGoalModalOpen(false)} title="New Goal"><CreateGoalWidget onSuccess={handleGoalSuccess} /></Modal>}
                {isRecordLoanModalOpen && <Modal isOpen={isRecordLoanModalOpen} onClose={() => { setIsRecordLoanModalOpen(false); setLoanFlowStep('choice'); }} title="Record Loan">{renderLoanModalContent()}</Modal>}
            </Suspense>
        </div>
    );
}