import { useContext, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../Context/AppContext.jsx";

// --- CHART IMPORTS ---
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// --- WIDGET IMPORTS ---
import Modal from "../Components/Modal";
import GoalManager from "../Components/GoalManager"; 
import RecentTransactionsWidget from "../Components/RecentTransactionsWidget";
import FamilyLedgersWidget from "../Components/FamilyLedgersWidget";
import CreateTransactionWidget from "../Components/CreateTransactionWidget"; // Import the new widget

// Register the chart components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Home() {
  const { user, token } = useContext(AppContext);

  // State hooks for controlling modal visibility
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [isCreateTransactionModalOpen, setIsCreateTransactionModalOpen] = useState(false); // State for the new modal

  // --- STATE FOR THE DASHBOARD ---
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(null);
  const [activeGoalsCount, setActiveGoalsCount] = useState(0);
  const [goalsCountLoading, setGoalsCountLoading] = useState(true);
  const [familyCount, setFamilyCount] = useState(0);
  const [familyCountLoading, setFamilyCountLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportError, setReportError] = useState(null);
  const [period, setPeriod] = useState('monthly');

  // --- DATA FETCHING ---
  const getSummaryData = useCallback(async () => {
    if (!token) return;
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Could not load summary data.");
      const data = await res.json();
      setSummaryData({ netPosition: data.balance });
    } catch (err) {
      setSummaryError(err.message);
    } finally {
      setSummaryLoading(false);
    }
  }, [token]);
  
  const getActiveGoalsCount = useCallback(async () => {
    if (!token) return;
    setGoalsCountLoading(true);
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
    } finally {
        setGoalsCountLoading(false);
    }
  }, [token]);

  const getFamilyCount = useCallback(async () => {
    if (!token) return;
    setFamilyCountLoading(true);
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
    } finally {
      setFamilyCountLoading(false);
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
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Could not process the financial report.");
      }
      setReport(await res.json());
    } catch (err) {
      setReportError(err.message);
      setReport(null);
    } finally {
      setReportLoading(false);
    }
  }, [token, period]);

  // --- START OF THE FIX ---

  // OPTIMIZATION: This effect fetches core stats that only depend on the user's token.
  // It runs only once when the user logs in and won't re-run unnecessarily when the report period changes.
  useEffect(() => {
    if (token) {
      getSummaryData();
      getActiveGoalsCount();
      getFamilyCount();
    } else {
      // Reset state if the user logs out
      setSummaryData(null);
      setActiveGoalsCount(0);
      setFamilyCount(0);
    }
  }, [token, getSummaryData, getActiveGoalsCount, getFamilyCount]);

  // OPTIMIZATION: This effect is now dedicated to fetching the financial report.
  // It re-runs ONLY when the 'token' or the 'period' state changes.
  // This is what makes the period filter buttons feel fast and responsive.
  useEffect(() => {
    if (token) {
      getReport();
    } else {
      // Reset report if the user logs out
      setReport(null);
    }
  }, [token, getReport]); // getReport is memoized and only updates when 'token' or 'period' changes.

  // --- END OF THE FIX ---


  // This function will be called on successful transaction creation
  function handleTransactionSuccess() {
    setIsCreateTransactionModalOpen(false); // Close the modal
    // Re-fetch all relevant data to update the dashboard immediately
    getSummaryData();
    getReport();
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Personal Inflow vs. Outflow' },
    },
  };

  return (
    <>
      {user ? (
        <div className="p-4 md:p-10">
          <header className="dashboard-header">
            {/* This is now a button that opens the modal */}
            <button 
              onClick={() => setIsCreateTransactionModalOpen(true)}
              className="primary-btn max-w-xs sm:max-w-[200px]"
            >
              + Add Transaction
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div 
              className="dashboard-card-interactive" 
              onClick={() => setIsTransactionsModalOpen(true)}
              role="button"
              tabIndex="0"
            >
              <h4 className="font-bold text-gray-600">Current Money (Net)</h4>
              {summaryLoading ? <div className="h-8 w-3/4 bg-slate-200 animate-pulse mt-2 rounded"></div> :
               summaryError ? <p className="text-red-500 text-sm">Could not load data</p> :
               summaryData && (
                <p className={`text-3xl font-bold mt-2 ${summaryData.netPosition >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  ₱{parseFloat(summaryData.netPosition).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
              <span className="text-link text-sm mt-2">View Transactions &rarr;</span>
            </div>
            <div 
              className="dashboard-card-interactive" 
              onClick={() => setIsGoalsModalOpen(true)}
              role="button"
              tabIndex="0"
            >
              <h4 className="font-bold text-gray-600">Active Personal Goals</h4>
              {goalsCountLoading ? <div className="h-8 w-1/4 bg-slate-200 animate-pulse mt-2 rounded"></div> :
              (
                <p className="text-3xl font-bold text-slate-800 mt-2">{activeGoalsCount}</p>
              )}
              <span className="text-link text-sm mt-2">View Goals &rarr;</span>
            </div>
            <div 
              className="dashboard-card-interactive" 
              onClick={() => setIsFamilyModalOpen(true)}
              role="button"
              tabIndex="0"
            >
              <h4 className="font-bold text-gray-600">Your Families</h4>
              {familyCountLoading ? <div className="h-8 w-1/4 bg-slate-200 animate-pulse mt-2 rounded"></div> :
              (
                 <p className="text-3xl font-bold text-slate-800 mt-2">{familyCount}</p>
              )}
              <span className="text-link text-sm mt-2">View Ledgers &rarr;</span>
            </div>
          </div>

          <div className="dashboard-section">
            <div className="w-full mx-auto flex justify-center gap-4 mb-6">
              <button onClick={() => setPeriod('weekly')} className={period === 'weekly' ? 'active-period-btn' : 'period-btn'}>Weekly</button>
              <button onClick={() => setPeriod('monthly')} className={period === 'monthly' ? 'active-period-btn' : 'period-btn'}>Monthly</button>
              <button onClick={() => setPeriod('yearly')} className={period === 'yearly' ? 'active-period-btn' : 'period-btn'}>Yearly</button>
            </div>

            <div className="content-card font-mono text-slate-800">
              {reportLoading ? (
                <p className="text-center py-10">Generating Your Financial Report...</p>
              ) : reportError ? (
                <p className="error text-center py-10">{reportError}</p>
              ) : report ? (
                <>
                  <div className="mb-8 relative" style={{ height: '350px' }}>
                    {report.chartData && report.chartData.datasets && report.chartData.datasets.length > 0 ? (
                      <Bar options={chartOptions} data={report.chartData} />
                    ) : (
                      <div className="flex items-center justify-center h-full"><p>Not enough data to display a chart for this period.</p></div>
                    )}
                  </div>
                  <div className="space-y-3 text-sm">
                    <p><span className="font-bold">Summary for:</span> {report.reportTitle}</p>
                    <hr className="border-dashed" />
                    <p><span className="font-bold">Total Inflow:</span> +₱{parseFloat(report.totalInflow).toFixed(2)}</p>
                    <p><span className="font-bold">Total Outflow:</span> -₱{parseFloat(report.totalOutflow).toFixed(2)}</p>
                    <p className={`font-bold ${report.netPosition >= 0 ? 'text-green-700' : 'text-red-700'}`}>Net Position: ₱{parseFloat(report.netPosition).toFixed(2)}</p>
                    <hr className="border-dashed" />
                    <p className="font-bold">Analysis:</p>
                    <ul className="list-disc pl-6"><li>{report.transactionCount} individual transactions were logged in this period.</li></ul>
                  </div>
                </>
              ) : (
                <p className="text-center py-10">No report data available for the selected period.</p>
              )}
            </div>
          </div>
          
        </div>
      ) : (
        <div className="hero-section">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-headline">
                Take Control of Your Finances
              </h1>
              <p className="hero-subheadline">
                Cointrak is the simplest way to manage your personal and family finances. Track your income, monitor expenses, and achieve your financial goals with ease.
              </p>
              <div className="hero-cta">
                <Link to="/register" className="primary-btn text-lg">
                  Get Started for Free
                </Link>
                <Link to="/login" className="text-link text-lg">
                  Login to your account
                </Link>
              </div>
              <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-700 rounded-r-lg">
                <p className="font-bold">Disclaimer:</p>
                <p className="text-sm">This is a demo application. It does not involve real money, monetary transactions, or any blockchain technology.</p>
              </div>
            </div>
            <div className="hero-visual">
              <img
                src="/CoinTrak_Image.png"
                alt="A family happily managing their finances on a tablet with an overlay of financial charts"
                className="rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}

       {/* --- MODALS --- */}
      {/* --- THIS IS THE UPDATED MODAL --- */}
      <Modal 
        isOpen={isGoalsModalOpen} 
        onClose={() => setIsGoalsModalOpen(false)}
        title="Manage Your Financial Goals" // Updated title
      >
        <GoalManager /> {/* Use the new component */}
      </Modal>

      <Modal 
        isOpen={isTransactionsModalOpen} 
        onClose={() => setIsTransactionsModalOpen(false)}
        title="Your Personal Transactions"
      >
        <RecentTransactionsWidget />
      </Modal>
      
      <Modal 
        isOpen={isFamilyModalOpen} 
        onClose={() => setIsFamilyModalOpen(false)}
        title="Your Family Ledgers"
      >
        <FamilyLedgersWidget />
      </Modal>
      
      <Modal
        isOpen={isCreateTransactionModalOpen}
        onClose={() => setIsCreateTransactionModalOpen(false)}
        title="Add a New Transaction"
      >
        <CreateTransactionWidget onSuccess={handleTransactionSuccess} />
      </Modal>
      
    </>
  );
}