import { useState, lazy, Suspense, useContext, useCallback, useEffect } from 'react';
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
    const [loading, setLoading] = useState(true); // For initial card data
    const [isChartLoading, setIsChartLoading] = useState(true); // <-- ADDED: New state for the chart's loading status
    const [summaryData, setSummaryData] = useState(null);
    const [activeGoalsCount, setActiveGoalsCount] = useState(0);
    const [activeLoansCount, setActiveLoansCount] = useState(0);
    const [key, setKey] = useState(Date.now());

    // --- DATA FETCHING ---
    const getFamilyBalance = useCallback(async () => {
        if (!token || !family) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/${family.id}/balance`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setSummaryData(await res.json());
        } catch (error) { console.error("Failed to fetch family balance", error); }
    }, [token, family]);

    const getFamilyActiveGoalsCount = useCallback(async () => {
        if (!token || !family) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/${family.id}/active-goals-count`, {
                headers: { Authorization: `Bearer ${token}` }
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
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setActiveLoansCount(data.count || 0);
            }
        } catch (error) { console.error("Failed to fetch family loan count", error); }
    }, [token, family]);

    // --- INITIAL DATA LOAD ---
    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            await Promise.all([
                getFamilyBalance(),
                getFamilyActiveGoalsCount(),
                getFamilyActiveLoansCount()
            ]);
            setLoading(false); // This only sets the card loading to false
        };
        fetchDashboardData();
    }, [family.id, getFamilyBalance, getFamilyActiveGoalsCount, getFamilyActiveLoansCount]);

    // --- SUCCESS HANDLERS ---
    const handleSuccess = () => {
        setIsTransactionModalOpen(false);
        setIsGoalModalOpen(false);
        setIsLoanModalOpen(false);
        // Re-fetch all summary data to update the dashboard cards.
        getFamilyBalance();
        getFamilyActiveGoalsCount();
        getFamilyActiveLoansCount();
        // Update the key to force-refresh any child components that depend on this data.
        setKey(Date.now());
    };
    
    // MODIFIED: Show skeleton if either the initial data OR the chart is loading
    if (loading || isChartLoading) return <FamilyRealmSkeleton />;

    return (
        <>
            <div className="p-4 md:p-10">
                <header className="dashboard-header">
                    <button onClick={onBack} className="secondary-btn-sm mb-2">&larr; Back to Personal Dashboard</button>
                    <h1 className="text-2xl font-bold text-slate-800 mb-6">{family.first_name}: Family Realm</h1>

                    <div className="flex flex-wrap gap-4">
                        <button onClick={() => setIsTransactionModalOpen(true)} className="primary-btn">+ Add Family Transaction</button>
                        <button onClick={() => setIsGoalModalOpen(true)} className="secondary-btn">+ Add Family Goal</button>
                        <button onClick={() => setIsLoanModalOpen(true)} className="secondary-btn">+ Record a Loan</button>
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
                    <Suspense fallback={<p className="text-center py-10">Loading Report...</p>}>
                        {/* MODIFIED: Pass the loading state handler to the child component */}
                        <FamilyReportChartWidget family={family} key={key} onLoadingChange={setIsChartLoading} />
                    </Suspense>
                </div>
            </div>

            {/* --- MODALS --- */}
            <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">Loading...</div>}>
                {/* --- Modals for CREATING new items --- */}
                {isTransactionModalOpen && <Modal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} title={`Add Transaction for ${family.first_name}`}><CreateFamilyTransactionWidget family={family} onSuccess={handleSuccess} /></Modal>}
                
                {isGoalModalOpen && <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title={`Add Goal for ${family.first_name}`}><CreateFamilyGoalWidget family={family} onSuccess={handleSuccess} /></Modal>}
                
                {isLoanModalOpen && <Modal isOpen={isLoanModalOpen} onClose={() => setIsLoanModalOpen(false)} title="Lend Money to a Family Member"><CreateLoanWidget family={family} onSuccess={handleSuccess} /></Modal>}
                
                {/* --- Modals for VIEWING lists of items --- */}
                {isFamilyTransactionsModalOpen && <Modal isOpen={isFamilyTransactionsModalOpen} onClose={() => setIsFamilyTransactionsModalOpen(false)} title={`Transactions for ${family.first_name}`}><FamilyTransactionsWidget family={family} /></Modal>}
                
                {isGoalsListModalOpen && <Modal isOpen={isGoalsListModalOpen} onClose={() => setIsGoalsListModalOpen(false)} title={`Goals for ${family.first_name}`}><GoalListsWidget family={family} /></Modal>}

                {isLoanListModalOpen && <Modal isOpen={isLoanListModalOpen} onClose={() => setIsLoanListModalOpen(false)} title={`Lending Activity for ${family.first_name}`}><LoanTrackingWidget family={family} /></Modal>}
            </Suspense>
        </>
    );
}