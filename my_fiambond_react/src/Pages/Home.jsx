import { useContext, useEffect, useState, useCallback, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "../Context/AppContext.jsx";
import { db } from "../config/firebase-config";
import { collection, query, where, getDocs, getCountFromServer, Timestamp, orderBy } from "firebase/firestore";

// --- WIDGET IMPORTS ---
const Modal = lazy(() => import("../Components/Modal"));
const GoalListsWidget = lazy(() => import("../Components/Personal/GoalListsWidget.jsx"));
const CreateGoalWidget = lazy(() => import("../Components/Personal/CreateGoalWidget.tsx"));
const PersonalTransactionsWidget = lazy(() => import("../Components/Personal/PersonalTransactionsWidget.jsx"));
const CreateTransactionWidget = lazy(() => import("../Components/Personal/CreateTransactionWidget.tsx"));
const FamilyManagementWidget = lazy(() => import("../Components/Family/FamilyManagementWidget.jsx"));
const CreateFamilyWidget = lazy(() => import("../Components/Family/CreateFamilyWidget.tsx"));
const FamilyRealm = lazy(() => import('../Components/Family/FamilyRealm.jsx'));
const PersonalReportChartWidget = lazy(() => import('../Components/Personal/PersonalReportChartWidget.jsx'));
const LoanTrackingWidget = lazy(() => import('../Components/Personal/LoanTrackingWidget.jsx'));
const RecordLoanFlowWidget = lazy(() => import('../Components/Personal/RecordLoanFlowWidget.tsx'));
const RecordLoanChoiceWidget = lazy(() => import('../Components/Personal/RecordLoanChoiceWidget.tsx'));
const CreatePersonalLoanWidget = lazy(() => import('../Components/Personal/CreatePersonalLoanWidget.tsx'));

// --- SKELETON COMPONENT ---
const DashboardSkeleton = () => (
    <div className="p-4 md:p-10 animate-pulse">
        <header className="dashboard-header mb-8">
            <div className="flex flex-wrap gap-4">
                <div className="h-10 w-40 bg-slate-200 rounded"></div>
                <div className="h-10 w-40 bg-slate-200 rounded"></div>
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

// --- NEW ICONS FOR THE REDESIGNED CARDS ---
const WalletIcon = () => (<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>);
const FlagIcon = () => (<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2z"></path></svg>);
const GiftIcon = () => (<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path></svg>);

// --- NEW STYLED DASHBOARD CARD COMPONENT ---
const DashboardCard = ({ title, value, linkText, onClick, icon, colorClass }) => (
    <div onClick={onClick} className="bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-lg p-6 cursor-pointer group transition-shadow hover:shadow-xl flex flex-col">
        {/* Header with Title and Icon */}
        <div className="flex justify-between items-start">
            <h4 className="font-bold text-gray-600 pr-4">{title}</h4>
            <div className={`flex-shrink-0 ${colorClass}`}>
                {icon}
            </div>
        </div>

        {/* This middle section will grow to push the link to the bottom */}
        <div className="flex-grow">
            <p className={`text-4xl font-bold mt-2 ${colorClass}`}>{value}</p>
        </div>

        {/* Link at the bottom */}
        <span className="text-link text-sm mt-3 inline-block">{linkText} &rarr;</span>
    </div>
);

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
    const [isRecordLoanModalOpen, setIsRecordLoanModalOpen] = useState(false);
    const [loanFlowStep, setLoanFlowStep] = useState('choice');
    
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
            const q = query(
                collection(db, "loans"), 
                where("creditor_id", "==", user.uid), 
                where("status", "in", ["outstanding", "pending_confirmation"])
            );

            const querySnapshot = await getDocs(q);
            let totalOutstanding = 0;
            querySnapshot.forEach((doc) => {
                const loan = doc.data();
                totalOutstanding += ((loan.total_owed || loan.amount) - (loan.repaid_amount || 0));
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

    const handleRecordLoanSuccess = () => {
        setIsRecordLoanModalOpen(false);
        handleFamilyDataChange();
    };
    
    const openCreateFamilyFromLoanFlow = () => {
        setIsRecordLoanModalOpen(false);
        setIsCreateFamilyModalOpen(true);
    };

    // --- MODAL CONTENT RENDERER ---
    const renderLoanModalContent = () => {
        switch (loanFlowStep) {
            case 'family':
                return <RecordLoanFlowWidget 
                            onSuccess={handleRecordLoanSuccess} 
                            onRequestCreateFamily={openCreateFamilyFromLoanFlow} 
                        />;
            case 'personal':
                return <CreatePersonalLoanWidget onSuccess={handleRecordLoanSuccess} />;
            case 'choice':
            default:
                return <RecordLoanChoiceWidget 
                            onSelectFamilyLoan={() => setLoanFlowStep('family')}
                            onSelectPersonalLoan={() => setLoanFlowStep('personal')}
                        />;
        }
    };

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
                {isRecordLoanModalOpen && (
                    <Modal 
                        isOpen={isRecordLoanModalOpen} 
                        onClose={() => {
                            setIsRecordLoanModalOpen(false);
                            setLoanFlowStep('choice');
                        }} 
                        title="Record a New Loan"
                    >
                        {renderLoanModalContent()}
                    </Modal>
                )}
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
                                <button onClick={() => {
                                    setLoanFlowStep('choice');
                                    setIsRecordLoanModalOpen(true);
                                }} className="primary-btn">+ Record a Loan</button>
                                <button onClick={() => setIsCreateGoalModalOpen(true)} className="secondary-btn">+ Add Goal</button>
                                <button onClick={() => setIsFamilyModalOpen(true)} className="secondary-btn">Manage Families</button>
                            </div>
                        </header>

                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <DashboardCard 
                                title="Current Money (Net)"
                                value={summaryError ? 'Error' : `₱${parseFloat(summaryData?.netPosition || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                                linkText="View Transactions"
                                onClick={() => setIsTransactionsModalOpen(true)}
                                icon={<WalletIcon />}
                                colorClass="text-emerald-600"
                            />
                            <DashboardCard 
                                title="Your Active Goals"
                                value={activeGoalsCount}
                                linkText="View Goals"
                                onClick={() => setIsGoalsModalOpen(true)}
                                icon={<FlagIcon />}
                                colorClass="text-rose-600"
                            />
                            <DashboardCard 
                                title="Outstanding Loans (Owed to You)"
                                value={`₱${lendingSummary.outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                                linkText="Manage Lending"
                                onClick={() => setIsLendingModalOpen(true)}
                                icon={<GiftIcon />}
                                colorClass="text-amber-600"
                            />
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