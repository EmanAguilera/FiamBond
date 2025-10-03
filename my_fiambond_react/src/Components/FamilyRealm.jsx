import { useState, lazy, Suspense, useContext, useCallback, useEffect, useRef } from 'react';
import { AppContext } from '../Context/AppContext.jsx';

// --- LAZY LOADED COMPONENTS ---
const Modal = lazy(() => import('./Modal.jsx'));
const FamilyReportChartWidget = lazy(() => import('./FamilyReportChartWidget.jsx'));
const LoanTrackingWidget = lazy(() => import('./LoanTrackingWidget.jsx'));
const GoalListsWidget = lazy(() => import("../Components/GoalListsWidget"));
const CreateLoanWidget = lazy(() => import('./CreateLoanWidget.jsx'));
const CreateFamilyTransactionWidget = lazy(() => import('./CreateFamilyTransactionWidget.jsx'));
const CreateFamilyGoalWidget = lazy(() => import('./CreateFamilyGoalWidget.jsx'));
const FamilyTransactionsWidget = lazy(() => import('./FamilyTransactionsWidget.jsx'));

// --- SKELETON LOADER FOR THE DASHBOARD ---
const FamilyRealmSkeleton = () => (
    <div className="p-4 md:p-10 animate-pulse">
        <div className="h-8 w-60 bg-slate-200 rounded-md mb-6"></div>
        <div className="flex flex-wrap gap-4 mb-8">
            <div className="h-10 w-48 bg-slate-200 rounded"></div>
            <div className="h-10 w-40 bg-slate-200 rounded"></div>
            <div className="h-10 w-40 bg-slate-200 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="h-32 bg-slate-200 rounded-lg"></div>
            <div className="h-32 bg-slate-200 rounded-lg"></div>
            <div className="h-32 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="w-full h-96 bg-slate-200 rounded-lg"></div>
    </div>
);

export default function FamilyRealm({ family, onBack }) {
    const { token } = useContext(AppContext);

    // --- STATE FOR MODALS ---
    const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [isGoalsListModalOpen, setIsGoalsListModalOpen] = useState(false);
    const [isFamilyTransactionsModalOpen, setIsFamilyTransactionsModalOpen] = useState(false);
    const [isLoanListModalOpen, setIsLoanListModalOpen] = useState(false);

    // --- STATE FOR DASHBOARD DATA ---
    const [loading, setLoading] = useState(true);
    const [summaryData, setSummaryData] = useState(null);
    const [activeGoalsCount, setActiveGoalsCount] = useState(0);
    const [activeLoansCount, setActiveLoansCount] = useState(0);

    // --- STATE LIFTED UP FROM CHART WIDGET ---
    const [report, setReport] = useState(null);
    const [reportLoading, setReportLoading] = useState(true);
    const [reportError, setReportError] = useState(null);
    const [period, setPeriod] = useState('monthly');

    const isInitialMount = useRef(true); // FIXED: Add ref to track initial mount


    // --- DATA FETCHING (Summary Cards) ---
    const getFamilyBalance = useCallback(async () => {
        if (!token || !family) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/${family.id}/balance`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store'
            });
            if (res.ok) setSummaryData(await res.json());
        } catch (error) { console.error("Failed to fetch family balance", error); }
    }, [token, family]);

    const getFamilyActiveGoalsCount = useCallback(async () => {
        if (!token || !family) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/${family.id}/active-goals-count`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store'
            });
            if (res.ok) {
                const data = await res.json();
                setActiveGoalsCount(data.count || 0);
            }
        } catch (error) { console.error("Failed to fetch family goal count", error); }
    }, [token, family]);

    const getFamilyActiveLoansCount = useCallback(async () => {
        if (!token || !family) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/${family.id}/active-loans-count`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store'
            });
            if (res.ok) {
                const data = await res.json();
                setActiveLoansCount(data.count || 0);
            }
        } catch (error) { console.error("Failed to fetch family loan count", error); }
    }, [token, family]);

    // --- DATA FETCHING LIFTED UP FROM CHART WIDGET ---
    const getFamilyReport = useCallback(async () => {
        if (!token || !family) return;
        setReportLoading(true);
        setReportError(null);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/${family.id}/report?period=${period}`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store'
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                throw new Error(errorData?.message || "Could not process the report request.");
            }
            setReport(await res.json());
        } catch (err) {
            console.error('Failed to fetch family report:', err);
            setReportError(err.message);
        } finally {
            setReportLoading(false);
        }
    }, [token, family, period]);

    // --- INITIAL DATA LOAD ---
    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            await Promise.all([
                getFamilyBalance(),
                getFamilyActiveGoalsCount(),
                getFamilyActiveLoansCount(),
                getFamilyReport()
            ]);
            setLoading(false);
        };
        fetchDashboardData();
    }, [family.id, getFamilyBalance, getFamilyActiveGoalsCount, getFamilyActiveLoansCount, getFamilyReport]);

    // --- EFFECT FOR PERIOD CHANGES ONLY ---
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
        } else {
            // This code will only run on subsequent renders when dependencies change
            getFamilyReport();
        }
    }, [period, getFamilyReport]);

    // --- SUCCESS HANDLERS ---
    const handleSuccess = () => {
        setIsTransactionModalOpen(false);
        setIsGoalModalOpen(false);
        setIsLoanModalOpen(false);
        
        // Re-fetch all summary data AND the report
        getFamilyBalance();
        getFamilyActiveGoalsCount();
        getFamilyActiveLoansCount();
        getFamilyReport();
    };
    
    // Show skeleton for the entire page ONLY on the very first load
    if (loading) return <FamilyRealmSkeleton />;

    return (
        <>
            <div className="p-4 md:p-10">
                {/* --- MODIFIED HEADER --- */}
                <header className="dashboard-header mb-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        {/* Left Side: Back Button & Title */}
                        <div className="flex items-center gap-4 flex-shrink-0 mr-auto">
                            <button onClick={onBack} className="secondary-btn-sm">&larr; Back</button>
                            <h1 className="text-2xl font-bold text-slate-800">{family.first_name}: Family Realm</h1>
                        </div>

                        {/* Right Side: Action Buttons */}
                        <div className="flex items-center flex-wrap gap-4">
                            <button onClick={() => setIsTransactionModalOpen(true)} className="primary-btn">+ Add Family Transaction</button>
                            <button onClick={() => setIsGoalModalOpen(true)} className="secondary-btn">+ Add Family Goal</button>
                            <button onClick={() => setIsLoanModalOpen(true)} className="secondary-btn">+ Record a Loan</button>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="dashboard-card-interactive" onClick={() => setIsFamilyTransactionsModalOpen(true)} role="button" tabIndex="0">
                        <h4 className="font-bold text-gray-600">Family Money (Net)</h4>
                        {summaryData && (<p className={`text-3xl font-bold mt-2 ${summaryData.netPosition >= 0 ? 'text-green-700' : 'text-red-700'}`}>₱{parseFloat(summaryData.netPosition).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>)}
                        <span className="text-link text-sm mt-2">View Transactions &rarr;</span>
                    </div>

                    <div className="dashboard-card-interactive" onClick={() => setIsGoalsListModalOpen(true)} role="button" tabIndex="0">
                        <h4 className="font-bold text-gray-600">Active Family Goals</h4>
                        <p className="text-3xl font-bold text-slate-800 mt-2">{activeGoalsCount}</p>
                        <span className="text-link text-sm mt-2">View Goals &rarr;</span>
                    </div>
                    
                    <div className="dashboard-card-interactive" onClick={() => setIsLoanListModalOpen(true)} role="button" tabIndex="0">
                        <h4 className="font-bold text-gray-600">Family Lending</h4>
                        <p className="text-3xl font-bold text-slate-800 mt-2">{activeLoansCount}</p>
                        <span className="text-link text-sm mt-2">Manage Lending &rarr;</span>
                    </div>
                </div>

                <div className="dashboard-section">
                    <div className="w-full mx-auto flex justify-center gap-4 mb-6">
                        <button onClick={() => setPeriod('weekly')} className={period === 'weekly' ? 'active-period-btn' : 'period-btn'}>Weekly</button>
                        <button onClick={() => setPeriod('monthly')} className={period === 'monthly' ? 'active-period-btn' : 'period-btn'}>Monthly</button>
                        <button onClick={() => setPeriod('yearly')} className={period === 'yearly' ? 'active-period-btn' : 'period-btn'}>Yearly</button>
                    </div>
                    
                    {reportLoading ? (
                        <div className="w-full h-96 bg-slate-100 rounded-lg flex justify-center items-center">
                           <p className="text-slate-500">Generating Family Report...</p>
                        </div>
                    ) : reportError ? (
                        <p className="error text-center py-10">{reportError}</p>
                    ) : (
                        <Suspense fallback={<div className="h-96 bg-slate-100 rounded-lg"></div>}>
                            <FamilyReportChartWidget family={family} report={report} />
                        </Suspense>
                    )}
                </div>
            </div>

            {/* --- MODALS --- */}
            <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">Loading...</div>}>
                {isTransactionModalOpen && <Modal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} title={`Add Transaction for ${family.first_name}`}><CreateFamilyTransactionWidget family={family} onSuccess={handleSuccess} /></Modal>}
                {isGoalModalOpen && <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title={`Add Goal for ${family.first_name}`}><CreateFamilyGoalWidget family={family} onSuccess={handleSuccess} /></Modal>}
                {isLoanModalOpen && <Modal isOpen={isLoanModalOpen} onClose={() => setIsLoanModalOpen(false)} title="Lend Money to a Family Member"><CreateLoanWidget family={family} onSuccess={handleSuccess} /></Modal>}
                {isFamilyTransactionsModalOpen && <Modal isOpen={isFamilyTransactionsModalOpen} onClose={() => setIsFamilyTransactionsModalOpen(false)} title={`Transactions for ${family.first_name}`}><FamilyTransactionsWidget family={family} /></Modal>}
                {isGoalsListModalOpen && <Modal isOpen={isGoalsListModalOpen} onClose={() => setIsGoalsListModalOpen(false)} title={`Goals for ${family.first_name}`}><GoalListsWidget family={family} /></Modal>}
                {isLoanListModalOpen && <Modal isOpen={isLoanListModalOpen} onClose={() => setIsLoanListModalOpen(false)} title={`Lending Activity for ${family.first_name}`}><LoanTrackingWidget family={family} /></Modal>}
            </Suspense>
        </>
    );
}