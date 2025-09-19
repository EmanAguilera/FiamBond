import { useContext, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../Context/AppContext.jsx";
import ActiveGoalsWidget from "../Components/ActiveGoalsWidget";
import RecentTransactionsWidget from "../Components/RecentTransactionsWidget";

export default function Home() {
  const { user, token } = useContext(AppContext);

  // State managed by Home.jsx (top-level concerns)
  const [balance, setBalance] = useState(0);
  const [familySummaries, setFamilySummaries] = useState([]);
  const [familyPagination, setFamilyPagination] = useState(null);

  // Data fetching for Home.jsx concerns
  const getBalance = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setBalance((await res.json()).balance);
    } catch (error) { console.error("Error fetching balance:", error); }
  }, [token]);

  const getFamilySummaries = useCallback(async (page = 1) => {
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

  // Effect now only fetches data relevant to this page
  useEffect(() => {
    if (token) {
      getBalance();
      getFamilySummaries();
    } else {
      setBalance(0);
      setFamilySummaries([]);
      setFamilyPagination(null);
    }
  }, [token, getBalance, getFamilySummaries]);

  return (
    <>
      {user ? (
        <div className="p-4 md:p-10">
          <div className="dashboard-section">
            <header className="dashboard-header">
              <h2 className="dashboard-title">Welcome back, {user.first_name}!</h2>
              <Link to="/transactions/create" className="primary-btn max-w-xs sm:max-w-[200px]">
                + Add Transaction
              </Link>
            </header>

            <div className="dashboard-card text-center mb-8">
              <p className="text-lg text-slate-600 mb-2">Current Personal Balance</p>
              <p className={`balance-amount ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₱{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <h3 className="font-bold text-2xl text-gray-800 mb-6">Your Family Ledgers</h3>
            {familySummaries.length > 0 ? (
              <div className="mb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {familySummaries.map((summary) => (
                    <div key={summary.id} className="dashboard-card p-6 flex flex-col justify-between">
                      {/* Family card content */}
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
            
            <div className="space-y-8">
              {/* Widgets are now self-contained and easy to manage */}
              <ActiveGoalsWidget />
              <RecentTransactionsWidget />
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
    </>
  );
}