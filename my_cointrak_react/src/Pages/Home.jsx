import { useContext, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../Context/AppContext.jsx";

// --- CHART IMPORTS ---
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// --- WIDGET IMPORTS ---
import ActiveGoalsWidget from "../Components/ActiveGoalsWidget";
import RecentTransactionsWidget from "../Components/RecentTransactionsWidget";

// Register the chart components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Home() {
  const { user, token } = useContext(AppContext);

  // --- STATE FOR THE ENTIRE DASHBOARD ---

  // State for the main Financial Report
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportError, setReportError] = useState(null);
  const [period, setPeriod] = useState('monthly'); // Default period for the report

  // State for Family Ledgers
  const [familySummaries, setFamilySummaries] = useState([]);
  const [familyPagination, setFamilyPagination] = useState(null);

  // --- DATA FETCHING FOR THE DASHBOARD ---

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

  const getFamilySummaries = useCallback(async (page = 1) => {
    // Family summary fetching logic remains the same...
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/summaries?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFamilySummaries(Array.isArray(data.data) ? data.data : []);
        const { data: _, ...paginationData } = data;
        setFamilyPagination(paginationData);
      }
    } catch (error) { console.error("Error fetching family summaries:", error); }
  }, [token]);

  // Main effect to fetch all dashboard data
  useEffect(() => {
    if (token) {
      getReport(); // Now fetches the main report
      getFamilySummaries();
    } else {
      setReport(null);
      setFamilySummaries([]);
      setFamilyPagination(null);
    }
  }, [token, getReport, getFamilySummaries]);


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
            <h2 className="dashboard-title">Welcome back, {user.first_name}!</h2>
            <Link to="/transactions/create" className="primary-btn max-w-xs sm:max-w-[200px]">
              + Add Transaction
            </Link>
          </header>

          {/* --- FINANCIAL REPORT WIDGET SECTION (MOVED FROM REPORTS PAGE) --- */}
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
          
          {/* --- FAMILY LEDGERS SECTION --- */}
          <div className="dashboard-section">
            <h3 className="font-bold text-2xl text-gray-800 mb-6">Your Family Ledgers</h3>
            {/* ... Family Summaries JSX remains the same ... */}
            {familySummaries.length > 0 ? (
              <div className="mb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {familySummaries.map((summary) => (
                    <div key={summary.id} className="dashboard-card p-6 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-xl mb-4">{summary.first_name}</h4>
                        <div className="space-y-2 text-sm">
                          <p className="flex justify-between"><span>Total Inflow:</span><span className="font-semibold text-green-600">+₱{parseFloat(summary.totalInflow).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                          <p className="flex justify-between"><span>Total Outflow:</span><span className="font-semibold text-red-500">-₱{parseFloat(summary.totalOutflow).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                          <hr className="border-dashed my-2"/>
                          <p className={`flex justify-between font-bold text-base ${summary.netPosition >= 0 ? 'text-green-700' : 'text-red-700'}`}><span>Net Position:</span><span>₱{parseFloat(summary.netPosition).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                        </div>
                      </div>
                      <div className="mt-6"><Link to={`/families/${summary.id}/ledger`} className="text-link font-bold">View Full Ledger &rarr;</Link></div>
                    </div>
                  ))}
                </div>
                {familyPagination && familyPagination.last_page > 1 && (
                  <div className="flex justify-between items-center mt-6">
                    <button onClick={() => getFamilySummaries(familyPagination.current_page - 1)} disabled={familyPagination.current_page === 1} className="pagination-btn">&larr; Previous</button>
                    <span className="pagination-text">Page {familyPagination.current_page} of {familyPagination.last_page}</span>
                    <button onClick={() => getFamilySummaries(familyPagination.current_page + 1)} disabled={familyPagination.current_page === familyPagination.last_page} className="pagination-btn">Next &rarr;</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="dashboard-card text-center mb-12"><p className="text-gray-500">You are not a member of any families yet.</p></div>
            )}
          </div>
          
          {/* --- OTHER WIDGETS --- */}
          <div className="space-y-8">
            <ActiveGoalsWidget />
            <RecentTransactionsWidget />
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
    </>
  );
}