// src/pages/Home.jsx

import { useContext, useEffect, useState, useCallback, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../Context/AppContext.jsx";

// --- WIDGET IMPORTS (Code Splitting with React.lazy) ---
const Modal = lazy(() => import("../Components/Modal"));
const GoalListsWidget = lazy(() => import("../Components/GoalListsWidget"));
const CreateGoalWidget = lazy(() => import("../Components/CreateGoalWidget"));
const RecentTransactionsWidget = lazy(() => import("../Components/RecentTransactionsWidget"));
const CreateTransactionWidget = lazy(() => import("../Components/CreateTransactionWidget"));
const FamilyManagementWidget = lazy(() => import("../Components/FamilyManagementWidget"));
const CreateFamilyWidget = lazy(() => import("../Components/CreateFamilyWidget"));
const FamilyRealm = lazy(() => import('../Components/FamilyRealm'));

// --- NEWLY SEPARATED CHART COMPONENT ---
// Ensure you have created this component file as described previously
const PersonalReportChartWidget = lazy(() => import('../Components/PersonalReportChartWidget.jsx'));


// --- SKELETON COMPONENT ---
// This placeholder UI is shown during the initial full-page data load.
const DashboardSkeleton = () => (
  <div className="p-4 md:p-10 animate-pulse">
    <header className="dashboard-header mb-8">
      <div className="flex flex-wrap gap-4">
        <div className="h-10 w-40 bg-slate-200 rounded"></div>
        <div className="h-10 w-32 bg-slate-200 rounded"></div>
        <div className="h-10 w-32 bg-slate-200 rounded"></div>
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


export default function Home() {
  const { user, token } = useContext(AppContext);

  // --- STATE FOR MODAL VISIBILITY ---
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
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
  const [familyCount, setFamilyCount] = useState(0);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportError, setReportError] = useState(null);
  const [period, setPeriod] = useState('monthly');

  // --- DATA FETCHING FUNCTIONS (Using token from context) ---
  const getSummaryData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Could not load summary data.");
      const data = await res.json();
      setSummaryData({ netPosition: data.balance });
    } catch (err) {
      console.error("Failed to fetch summary data:", err);
      setSummaryError("Network error. Please check your connection.");
    }
  }, [token]);
  
  const getActiveGoalsCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/goals/active-personal-count`, {
          headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveGoalsCount(data.count || 0);
      }
    } catch (error) {
        console.error("Error fetching active goals count:", error);
    }
  }, [token]);

  const getFamilyCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/summaries?page=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFamilyCount(data.total || 0);
      }
    } catch (error) { 
      console.error("Error fetching family count:", error); 
    }
  }, [token]);

  const getReport = useCallback(async () => {
    if (!token) return;
    setReportLoading(true);
    setReportError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reports?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Could not process the financial report.");
      setReport(await res.json());
    } catch (err) {
      console.error("Failed to fetch report:", err);
      setReportError("Network error. Please try again.");
      setReport(null);
    } finally {
      setReportLoading(false);
    }
  }, [token, period]);

  // --- EFFECT FOR INITIAL DATA FETCHING ---
  useEffect(() => {
    if (token) {
      const fetchInitialData = async () => {
        setIsInitialLoading(true);
        await Promise.all([
          getSummaryData(),
          getActiveGoalsCount(),
          getFamilyCount(),
          getReport()
        ]);
        setIsInitialLoading(false);
      };
      fetchInitialData();
    } else {
      setIsInitialLoading(false);
    }
  }, [token, getSummaryData, getActiveGoalsCount, getFamilyCount, getReport]);

  // --- EFFECT FOR PERIOD CHANGES ONLY ---
  useEffect(() => {
    // Avoid re-fetching on the initial load, as the first useEffect already handles it
    if (!isInitialLoading && token) {
      getReport();
    }
  }, [period, isInitialLoading, token, getReport]);

  // --- SUCCESS HANDLERS (for child components) ---
  const handleTransactionSuccess = useCallback(() => {
    setIsCreateTransactionModalOpen(false);
    getSummaryData(); // Re-fetch balance
    getReport();      // Re-fetch report
  }, [getSummaryData, getReport]);
  
  const handleGoalSuccess = useCallback(() => {
    setIsCreateGoalModalOpen(false);
    getActiveGoalsCount(); // Re-fetch goal count
  }, [getActiveGoalsCount]);

  const handleFamilySuccess = useCallback(() => {
    setIsCreateFamilyModalOpen(false);
    getFamilyCount(); // Re-fetch family count
  }, [getFamilyCount]);

  // --- HANDLERS FOR FAMILY REALM NAVIGATION ---
  const handleEnterFamilyRealm = (family) => {
    setActiveFamilyRealm(family);
    setIsFamilyModalOpen(false); // Close modal after selection
  };
  
  const handleExitFamilyRealm = () => {
    setActiveFamilyRealm(null);
  };

  return (
    <>
      {/* --- MODALS (Lazy Loaded) --- */}
      <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">Loading...</div>}>
        {isTransactionsModalOpen && <Modal isOpen={isTransactionsModalOpen} onClose={() => setIsTransactionsModalOpen(false)} title="Your Personal Transactions"><RecentTransactionsWidget /></Modal>}
        {isGoalsModalOpen && <Modal isOpen={isGoalsModalOpen} onClose={() => setIsGoalsModalOpen(false)} title="Your Financial Goals"><GoalListsWidget /></Modal>}
        {isFamilyModalOpen && <Modal isOpen={isFamilyModalOpen} onClose={() => setIsFamilyModalOpen(false)} title="Family Management"><FamilyManagementWidget onEnterRealm={handleEnterFamilyRealm} /></Modal>}
        {isCreateTransactionModalOpen && <Modal isOpen={isCreateTransactionModalOpen} onClose={() => setIsCreateTransactionModalOpen(false)} title="Add a New Transaction"><CreateTransactionWidget onSuccess={handleTransactionSuccess} /></Modal>}
        {isCreateGoalModalOpen && <Modal isOpen={isCreateGoalModalOpen} onClose={() => setIsCreateGoalModalOpen(false)} title="Create a New Goal"><CreateGoalWidget onSuccess={handleGoalSuccess} /></Modal>}
        {isCreateFamilyModalOpen && <Modal isOpen={isCreateFamilyModalOpen} onClose={() => setIsCreateFamilyModalOpen(false)} title="Create a New Family"><CreateFamilyWidget onSuccess={handleFamilySuccess} /></Modal>}
      </Suspense>

      {/* --- MAIN VIEW LOGIC --- */}
      {activeFamilyRealm ? (
        // RENDER THE FAMILY REALM VIEW IF A FAMILY IS SELECTED
        <Suspense fallback={<DashboardSkeleton />}>
            <FamilyRealm family={activeFamilyRealm} onBack={handleExitFamilyRealm} />
        </Suspense>
      ) : user ? (
        // RENDER THE PERSONAL DASHBOARD IF LOGGED IN
        isInitialLoading ? <DashboardSkeleton /> : (
          <div className="p-4 md:p-10">
            <header className="dashboard-header">
              <div className="flex flex-wrap gap-4">
                <button onClick={() => setIsCreateTransactionModalOpen(true)} className="primary-btn">+ Add Transaction</button>
                <button onClick={() => setIsCreateGoalModalOpen(true)} className="secondary-btn">+ Add Goal</button>
                <button onClick={() => setIsCreateFamilyModalOpen(true)} className="secondary-btn">+ Add Family</button>
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
                <h4 className="font-bold text-gray-600">Active Personal Goals</h4>
                <p className="text-3xl font-bold text-slate-800 mt-2">{activeGoalsCount}</p>
                <span className="text-link text-sm mt-2">View Goals &rarr;</span>
              </div>

              <div className="dashboard-card-interactive" onClick={() => setIsFamilyModalOpen(true)} role="button" tabIndex="0">
                <h4 className="font-bold text-gray-600">Your Families</h4>
                <p className="text-3xl font-bold text-slate-800 mt-2">{familyCount}</p>
                <span className="text-link text-sm mt-2">Manage Families &rarr;</span>
              </div>
            </div>

            {/* --- REFACTORED REPORT SECTION --- */}
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
        // RENDER THE HERO SECTION IF NOT LOGGED IN
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