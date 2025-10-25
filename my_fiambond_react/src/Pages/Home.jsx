import { useContext, useEffect, useState, useCallback, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "../Context/AppContext.jsx";
import { db } from "../config/firebase-config";
import { collection, query, where, getDocs, getCountFromServer, Timestamp, orderBy } from "firebase/firestore";

// --- WIDGET IMPORTS ---
const Modal = lazy(() => import("../Components/Modal"));
const GoalListsWidget = lazy(() => import("../Components/GoalListsWidget"));
const CreateGoalWidget = lazy(() => import("../Components/CreateGoalWidget"));
const PersonalTransactionsWidget = lazy(() => import("../Components/PersonalTransactionsWidget.jsx"));
const CreateTransactionWidget = lazy(() => import("../Components/CreateTransactionWidget"));
const FamilyManagementWidget = lazy(() => import("../Components/FamilyManagementWidget"));
const CreateFamilyWidget = lazy(() => import("../Components/CreateFamilyWidget"));
const FamilyRealm = lazy(() => import('../Components/FamilyRealm'));
const PersonalReportChartWidget = lazy(() => import('../Components/PersonalReportChartWidget.jsx'));
const LoanTrackingWidget = lazy(() => import('../Components/LoanTrackingWidget.jsx'));


// --- SKELETON COMPONENT ---
const DashboardSkeleton = () => (
    <div className="p-4 md:p-10 animate-pulse">
        <header className="dashboard-header mb-8">
            <div className="flex flex-wrap gap-4">
                <div className="h-10 w-40 bg-slate-200 rounded"></div>
                <div className="h-10 w-32 bg-slate-200 rounded"></div>
                <div className="h-10 w-32 bg-slate-200 rounded"></div>
                <div className="h-10 w-40 bg-slate-200 rounded"></div>
            </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="h-32 bg-slate-200 rounded-lg p-4">
                <div className="h-5 w-3/4 bg-slate-300 rounded"></div>
                <div className="h-8 w-1/2 bg-slate-300 rounded mt-4"></div>
            </div>
            <div className="h-32 bg-slate-200 rounded-lg p-4">
                <div className="h-5 w-3/4 bg-slate-300 rounded"></div>
                <div className="h-8 w-1/4 bg-slate-300 rounded mt-4"></div>
            </div>
            <div className="h-32 bg-slate-200 rounded-lg p-4">
                <div className="h-5 w-3/4 bg-slate-300 rounded"></div>
                <div className="h-8 w-1/4 bg-slate-300 rounded mt-4"></div>
            </div>
        </div>
        <div className="w-full h-96 bg-slate-200 rounded-lg"></div>
    </div>
);

// --- Helper function to format transaction data for charts ---
const formatDataForChart = (transactions) => {
    if (!transactions || transactions.length === 0) {
        return { labels: [], datasets: [] };
    }
    const data = {};
    transactions.forEach(tx => {
        if (tx.created_at && typeof tx.created_at.toDate === 'function') {
            const date = tx.created_at.toDate().toLocaleDateString();
            if (!data[date]) {
                data[date] = { income: 0, expense: 0 };
            }
            if (tx.type === 'income') {
                data[date].income += tx.amount;
            } else {
                data[date].expense += tx.amount;
            }
        }
    });
    const labels = Object.keys(data).sort((a, b) => new Date(a) - new Date(b));
    return {
        labels,
        datasets: [
            { label: 'Inflow (₱)', data: labels.map(label => data[label].income), backgroundColor: 'rgba(75, 192, 192, 0.5)' },
            { label: 'Outflow (₱)', data: labels.map(label => data[label].expense), backgroundColor: 'rgba(255, 99, 132, 0.5)' }
        ]
    };
};

export default function Home() {
    const { user } = useContext(AppContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (user && !user.emailVerified) {
            navigate('/verify-email');
        }
    }, [user, navigate]);

    // --- STATE FOR MODAL VISIBILITY ---
    const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
    const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false);
    const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
    const [isLendingModalOpen, setIsLendingModalOpen] = useState(false);
    const [isCreateTransactionModalOpen, setIsCreateTransactionModalOpen] = useState(false);
    const [isCreateGoalModalOpen, setIsCreateGoalModalOpen] = useState(false);
    const [isCreateFamilyModalOpen, setIsCreateFamilyModalOpen] = useState(false);
    
    // --- STATE FOR VIEW MANAGEMENT ---
    const [activeFamilyRealm, setActiveFamilyRealm] = useState(null);

    // --- STATE FOR DATA & LOADING ---
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [summaryData, setSummaryData] = useState(null);
    const [summaryError, setSummaryError] = useState(null);
    const [activeGoalsCount, setActiveGoalsCount] = useState(0);
    const [lendingSummary, setLendingSummary] = useState({ outstanding: 0 });
    const [report, setReport] = useState(null);
    const [reportLoading, setReportLoading] = useState(true);
    const [reportError, setReportError] = useState(null);
    const [period, setPeriod] = useState('monthly');

    // --- DATA FETCHING FUNCTIONS ---
    const getSummaryData = useCallback(async () => {
        if (!user || !user.emailVerified) return;
        try {
            const q = query(collection(db, "transactions"), where("user_id", "==", user.uid), where("family_id", "==", null));
            const querySnapshot = await getDocs(q);
            let balance = 0;
            querySnapshot.forEach((doc) => {
                const transaction = doc.data();
                if (transaction.type === 'income') balance += transaction.amount;
                else balance -= transaction.amount;
            });
            setSummaryData({ netPosition: balance });
        } catch (err) {
            console.error("Failed to fetch summary data:", err);
            setSummaryError("Could not load summary data.");
        }
    }, [user]);
    
    const getActiveTotalGoalsCount = useCallback(async () => {
        if (!user || !user.emailVerified) return;
        try {
            const q = query(collection(db, "goals"), where("user_id", "==", user.uid), where("family_id", "==", null), where("status", "==", "active"));
            const snapshot = await getCountFromServer(q);
            setActiveGoalsCount(snapshot.data().count);
        } catch (error) {
            console.error("Error fetching active goals count:", error);
        }
    }, [user]);
    
    const getLendingSummary = useCallback(async () => {
        if (!user || !user.emailVerified) return;
        try {
            const q = query(collection(db, "loans"), where("creditor_id", "==", user.uid), where("status", "==", "outstanding"));
            const querySnapshot = await getDocs(q);
            let totalOutstanding = 0;
            querySnapshot.forEach((doc) => {
                const loan = doc.data();
                totalOutstanding += (loan.amount - loan.repaid_amount);
            });
            setLendingSummary({ outstanding: totalOutstanding });
        } catch (error) { 
            console.error("Error fetching lending summary:", error); 
        }
    }, [user]);

    const getReport = useCallback(async () => {
        if (!user || !user.emailVerified) return;
        setReportLoading(true);
        setReportError(null);
        try {
            const now = new Date();
            let startDate;
            if (period === 'weekly') startDate = new Date(now.setDate(now.getDate() - 7));
            else if (period === 'yearly') startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            else startDate = new Date(now.setMonth(now.getMonth() - 1));

            const q = query(
                collection(db, "transactions"),
                where("user_id", "==", user.uid),
                where("family_id", "==", null),
                where("created_at", ">=", Timestamp.fromDate(startDate)),
                orderBy("created_at", "desc")
            );
            const querySnapshot = await getDocs(q);
            const transactions = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

            let totalInflow = 0;
            let totalOutflow = 0;
            transactions.forEach(tx => {
                if (tx.type === 'income') totalInflow += tx.amount;
                else totalOutflow += tx.amount;
            });

            setReport({
                chartData: formatDataForChart(transactions),
                totalInflow,
                totalOutflow,
                netPosition: totalInflow - totalOutflow,
                reportTitle: `Report from ${startDate.toLocaleDateString()}`,
                transactionCount: transactions.length
            });
        } catch (err) {
            console.error("Failed to fetch report:", err);
            setReportError("Network error. Please try again.");
            setReport(null);
        } finally {
            setReportLoading(false);
        }
    }, [user, period]);

    // --- EFFECTS ---
    useEffect(() => {
        if (user && user.emailVerified) {
            const fetchInitialData = async () => {
                setIsInitialLoading(true);
                await Promise.all([ getSummaryData(), getActiveTotalGoalsCount(), getLendingSummary(), getReport() ]);
                setIsInitialLoading(false);
            };
            fetchInitialData();
        } else {
            setIsInitialLoading(false);
        }
    }, [user, getSummaryData, getActiveTotalGoalsCount, getLendingSummary, getReport]);

    useEffect(() => {
        if (!isInitialLoading && user && user.emailVerified) { getReport(); }
    }, [period, isInitialLoading, user, getReport]);

    // --- SUCCESS HANDLERS ---
    const handleTransactionSuccess = useCallback(() => {
        setIsCreateTransactionModalOpen(false);
        getSummaryData();
        getReport();
    }, [getSummaryData, getReport]);
    
    const handleGoalSuccess = useCallback(() => {
        setIsCreateGoalModalOpen(false);
        getActiveTotalGoalsCount();
    }, [getActiveTotalGoalsCount]);

    const handleFamilySuccess = useCallback(() => {
        setIsCreateFamilyModalOpen(false);
    }, []);
    
    const handleFamilyDataChange = useCallback(() => {
        getSummaryData();
        getReport();
        getLendingSummary();
    }, [getSummaryData, getReport, getLendingSummary]);

    // --- NAVIGATION HANDLERS ---
    const handleEnterFamilyRealm = (family) => {
        setActiveFamilyRealm(family);
        setIsFamilyModalOpen(false);
    };
    
    const handleExitFamilyRealm = () => {
        setActiveFamilyRealm(null);
    };
    
    // --- CONDITIONAL RENDERING ---
    if (user && !user.emailVerified) { return <DashboardSkeleton />; }

    return (
        <>
            <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">Loading...</div>}>
                {isTransactionsModalOpen && <Modal isOpen={isTransactionsModalOpen} onClose={() => setIsTransactionsModalOpen(false)} title="Your Personal Transactions"><PersonalTransactionsWidget /></Modal>}
                {isGoalsModalOpen && <Modal isOpen={isGoalsModalOpen} onClose={() => setIsGoalsModalOpen(false)} title="Your Financial Goals"><GoalListsWidget /></Modal>}
                {isFamilyModalOpen && <Modal isOpen={isFamilyModalOpen} onClose={() => setIsFamilyModalOpen(false)} title="Family Management"><FamilyManagementWidget onEnterRealm={handleEnterFamilyRealm} /></Modal>}
                
                {isLendingModalOpen && (
                    <Modal isOpen={isLendingModalOpen} onClose={() => setIsLendingModalOpen(false)} title="Your Lending Activity">
                        <LoanTrackingWidget onDataChange={handleFamilyDataChange} />
                    </Modal>
                )}

                {isCreateTransactionModalOpen && <Modal isOpen={isCreateTransactionModalOpen} onClose={() => setIsCreateTransactionModalOpen(false)} title="Add a New Transaction"><CreateTransactionWidget onSuccess={handleTransactionSuccess} /></Modal>}
                {isCreateGoalModalOpen && <Modal isOpen={isCreateGoalModalOpen} onClose={() => setIsCreateGoalModalOpen(false)} title="Create a New Goal"><CreateGoalWidget onSuccess={handleGoalSuccess} /></Modal>}
                {isCreateFamilyModalOpen && <Modal isOpen={isCreateFamilyModalOpen} onClose={() => setIsCreateFamilyModalOpen(false)} title="Create a New Family"><CreateFamilyWidget onSuccess={handleFamilySuccess} /></Modal>}
            </Suspense>

            {activeFamilyRealm ? (
                <Suspense fallback={<DashboardSkeleton />}>
                    <FamilyRealm family={activeFamilyRealm} onBack={handleExitFamilyRealm} onDataChange={handleFamilyDataChange} />
                </Suspense>
            ) : user ? (
                isInitialLoading ? <DashboardSkeleton /> : (
                    <div className="p-4 md:p-10">
                        <header className="dashboard-header">
                            <div className="flex flex-wrap gap-4">
                                <button onClick={() => setIsCreateTransactionModalOpen(true)} className="primary-btn">+ Add Transaction</button>
                                <button onClick={() => setIsCreateGoalModalOpen(true)} className="secondary-btn">+ Add Goal</button>
                                <button onClick={() => setIsCreateFamilyModalOpen(true)} className="secondary-btn">+ Add Family</button>
                                <button onClick={() => setIsFamilyModalOpen(true)} className="secondary-btn">Manage Families</button>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="dashboard-card-interactive" onClick={() => setIsTransactionsModalOpen(true)} role="button" tabIndex="0">
                                <h4 className="font-bold text-gray-600">Current Money (Net)</h4>
                                {summaryError ? <p className="text-red-500 text-sm">{summaryError}</p> :
                                summaryData && (<p className={`text-3xl font-bold mt-2 ${summaryData.netPosition >= 0 ? 'text-green-700' : 'text-red-700'}`}>₱{parseFloat(summaryData.netPosition).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>)}
                                <span className="text-link text-sm mt-2">View Transactions &rarr;</span>
                            </div>
                            
                            <div className="dashboard-card-interactive" onClick={() => setIsGoalsModalOpen(true)} role="button" tabIndex="0">
                                <h4 className="font-bold text-gray-600">Your Active Goals</h4>
                                <p className="text-3xl font-bold text-slate-800 mt-2">{activeGoalsCount}</p>
                                <span className="text-link text-sm mt-2">View Goals &rarr;</span>
                            </div>

                            <div className="dashboard-card-interactive" onClick={() => setIsLendingModalOpen(true)} role="button" tabIndex="0">
                                <h4 className="font-bold text-gray-600">Outstanding Loans (Owed to You)</h4>
                                <p className="text-3xl font-bold text-blue-700 mt-2">₱{lendingSummary.outstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
                                    <p className="text-slate-500">Generating Your Financial Report...</p>
                                </div>
                            ) : reportError ? (
                                <p className="error text-center py-10">{reportError}</p>
                            ) : (
                                <Suspense fallback={<div className="h-96 bg-slate-100 rounded-lg"></div>}>
                                    <PersonalReportChartWidget report={report} />
                                </Suspense>
                            )}
                        </div>
                    </div>
                )
            ) : (
                <div className="hero-section">
                   <div className="hero-content">
                        <div className="hero-text">
                            <h1 className="hero-headline">Take Control of Your Finances</h1>
                            <p className="hero-subheadline">Fiambond is the simplest way to manage your personal and family finances. Track your income, monitor expenses, and achieve your financial goals with ease.</p>
                            <div className="hero-cta">
                                <Link to="/register" className="primary-btn text-lg">Get Started for Free</Link>
                                <Link to="/login" className="text-link text-lg">Login to your account</Link>
                            </div>
                            <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-700 rounded-r-lg">
                                <p className="font-bold">Disclaimer:</p>
                                <p className="text-sm">This is a demo application. It does not involve real money, monetary transactions, or any blockchain technology.</p>
                            </div>
                        </div>
                        <div className="hero-visual">
                            <img src="/FiamBond_Image.png" alt="A family happily managing their finances on a tablet with an overlay of financial charts" className="rounded-xl shadow-2xl" />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}