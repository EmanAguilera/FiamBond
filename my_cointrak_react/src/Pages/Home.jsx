import { useContext, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../Context/AppContext.jsx";

export default function Home() {
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [familySummaries, setFamilySummaries] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [familyPagination, setFamilyPagination] = useState(null);
  const { user, token } = useContext(AppContext);

  // This function's ONLY job is to fetch a page of transactions.
  const getTransactions = useCallback(async (page = 1) => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transactions?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Safely set transactions only if data.data is an array
        setTransactions(Array.isArray(data.data) ? data.data : []);

        // Store the pagination metadata
        const { data: _, ...paginationData } = data;
        setPagination(paginationData);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }, [token]);

  // This function gets the TOTAL personal balance from the new API endpoint.
  const getBalance = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  }, [token]);

  // This function fetches the summaries for the family cards.
  const getFamilySummaries = useCallback(async (page = 1) => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/summaries?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        
        // The summaries are now in the 'data' key
        setFamilySummaries(Array.isArray(data.data) ? data.data : []);

        // Store the family pagination metadata
        const { data: _, ...paginationData } = data;
        setFamilyPagination(paginationData);
      } else {
        console.error(`Failed to fetch family summaries. Server responded with status: ${res.status}`);
        setFamilySummaries([]);
      }
    } catch (error) {
      console.error("A network or other error occurred while fetching family summaries:", error);
    }
  }, [token]);

  // This calls all the necessary functions when the component loads or the token changes.
  useEffect(() => {
    if (token) {
      getBalance();
      getTransactions();
      getFamilySummaries(); // This will fetch page 1 by default
    } else {
      // Clear all data on logout
      setTransactions([]);
      setBalance(0);
      setFamilySummaries([]);
      setPagination(null);
    }
    // Dependency array includes all functions used inside the effect.
  }, [token, getBalance, getTransactions, getFamilySummaries]);

  return (
    <>
      {user ? (
        <div className="p-4 md:p-10">
          <div className="dashboard-section">
            <div className="dashboard-header">
              <h2 className="dashboard-title">Welcome back, {user.first_name}!</h2>
              <Link to="/transactions/create" className="primary-btn max-w-xs sm:max-w-[200px]">
                + Add Transaction
              </Link>
            </div>

            <div className="dashboard-card text-center mb-8">
              <p className="text-lg text-slate-600 mb-2">Current Personal Balance</p>
              <p className={`balance-amount ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₱{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <h3 className="font-bold text-2xl text-gray-800 mb-6">Your Family Ledgers</h3>
            {familySummaries.length > 0 ? (
              // Add a div wrapper to hold the grid and the pagination
              <div className="mb-12"> 
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {familySummaries.map((summary) => (
                    // ... the mapping logic is unchanged ...
                    <div key={summary.id} className="dashboard-card p-6 flex flex-col justify-between">
                      <div>
                          <h4 className="font-bold text-xl mb-4">{summary.first_name}</h4>
                          <div className="space-y-2 text-sm">
                          <p className="flex justify-between">
                              <span>Total Inflow:</span>
                              <span className="font-semibold text-green-600">+₱{parseFloat(summary.totalInflow).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </p>
                          <p className="flex justify-between">
                              <span>Total Outflow:</span>
                              <span className="font-semibold text-red-500">-₱{parseFloat(summary.totalOutflow).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </p>
                          <hr className="border-dashed my-2"/>
                          <p className={`flex justify-between font-bold text-base ${summary.netPosition >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              <span>Net Position:</span>
                              <span>₱{parseFloat(summary.netPosition).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </p>
                          </div>
                      </div>
                      <div className="mt-6">
                        <Link to={`/families/${summary.id}/ledger`} className="text-link font-bold">
                          View Full Ledger &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* --- NEW FAMILY PAGINATION CONTROLS --- */}
                {familyPagination && familyPagination.last_page > 1 && (
                  <div className="flex justify-between items-center mt-6">
                    <button
                      onClick={() => getFamilySummaries(familyPagination.current_page - 1)}
                      disabled={familyPagination.current_page === 1}
                      className="secondary-btn disabled:opacity-50"
                    >
                      &larr; Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {familyPagination.current_page} of {familyPagination.last_page}
                    </span>
                    <button
                      onClick={() => getFamilySummaries(familyPagination.current_page + 1)}
                      disabled={familyPagination.current_page === familyPagination.last_page}
                      className="secondary-btn disabled:opacity-50"
                    >
                      Next &rarr;
                    </button>
                  </div>
                )}
                {/* --- END OF NEW CONTROLS --- */}
                
              </div>
            ) : (
              <div className="dashboard-card text-center mb-12">
                <p className="text-gray-500">You are not a member of any families yet. Create or join one to see its ledger here.</p>
              </div>
            )}

            <h3 className="font-bold text-2xl text-gray-800 mb-6">Your Recent Personal Transactions</h3>
            {transactions.length > 0 ? (
              <div className="dashboard-card p-0 mb-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="transaction-item border-b last:border-b-0 border-gray-100"
                  >
                    <div>
                      <p className="transaction-description">{transaction.description}</p>
                      <small className="transaction-date">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </small>
                    </div>
                    <p className={`transaction-amount ${transaction.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {transaction.type === 'income' ? '+' : '-'} ₱{parseFloat(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 mb-12">You have no personal transactions yet.</p>
            )}

            {pagination && pagination.last_page > 1 && (
              <div className="flex justify-between items-center mt-4 mb-12">
                <button
                  onClick={() => getTransactions(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="secondary-btn disabled:opacity-50"
                >
                  &larr; Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {pagination.current_page} of {pagination.last_page}
                </span>
                <button
                  onClick={() => getTransactions(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="secondary-btn disabled:opacity-50"
                >
                  Next &rarr;
                </button>
              </div>
            )}
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