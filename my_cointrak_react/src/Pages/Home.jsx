import { useContext, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../Context/AppContext.jsx";

export default function Home() {
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [familySummaries, setFamilySummaries] = useState([]);
  const { user, token } = useContext(AppContext);

  const getTransactions = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const personalTransactions = data.filter(tx => tx.family_id === null || tx.family_id === undefined);
        setTransactions(personalTransactions);
        const total = personalTransactions.reduce((acc, transaction) => {
          return transaction.type === 'income' ? acc + parseFloat(transaction.amount) : acc - parseFloat(transaction.amount);
        }, 0);
        setBalance(total);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }, [token]);

  const getFamilySummaries = useCallback(async () => {
    if (!token) {
      console.log("Attempted to fetch family summaries, but no token was available yet.");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/summaries`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setFamilySummaries(data);
      } else {
        console.error(`Failed to fetch family summaries. Server responded with status: ${res.status}`);
        setFamilySummaries([]);
      }
    } catch (error)
    {
      console.error("A network or other error occurred while fetching family summaries:", error);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      getTransactions();
      getFamilySummaries();
    } else {
      setTransactions([]);
      setBalance(0);
      setFamilySummaries([]);
    }
  }, [token, getTransactions, getFamilySummaries]);

  return (
    <>
      {user ? (
        // FIX: Reduced padding for mobile (p-4) and kept larger padding for medium screens and up (md:p-10)
        <div className="p-4 md:p-10">
          <div className="dashboard-section">
            {/* The dashboard-header class now handles responsiveness from the CSS file */}
            <div className="dashboard-header">
              <h2 className="dashboard-title">Welcome back, {user.first_name}!</h2>
              {/* FIX: Set max-width on mobile to prevent button from being too wide if text is long */}
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
              // FIX: This grid layout is already responsive, perfect for mobile.
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {familySummaries.map((summary) => (
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
            ) : (
              <div className="dashboard-card text-center mb-12">
                <p className="text-gray-500">You are not a member of any families yet. Create or join one to see its ledger here.</p>
              </div>
            )}

            <h3 className="font-bold text-2xl text-gray-800 mb-6">Your Recent Personal Transactions</h3>
            {transactions.length > 0 ? (
              <div className="dashboard-card p-0 mb-12">
                  {transactions.slice(0, 5).map((transaction) => (
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
          </div>
        </div>
      ) : (
        <div className="hero-section">
          {/* FIX: Added responsive flex-direction and alignment */}
          <div className="hero-content flex-col lg:flex-row">
            {/* FIX: Added responsive text alignment and width */}
            <div className="hero-text w-full lg:w-1/2 text-center lg:text-left">
              <h1 className="hero-headline">
                Take Control of Your Finances
              </h1>
              <p className="hero-subheadline">
                Cointrak is the simplest way to manage your personal and family finances. Track your income, monitor expenses, and achieve your financial goals with ease.
              </p>
              {/* FIX: This container now handles responsive button layout and alignment */}
              <div className="hero-cta">
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link to="/register" className="primary-btn text-lg w-full sm:w-auto">
                    Get Started for Free
                  </Link>
                  <Link to="/login" className="text-link text-lg">
                    Login to your account
                  </Link>
                </div>
                {/* FIX: The disclaimer is now centered on mobile and left-aligned on larger screens */}
                <div className="mt-6 text-center lg:text-left">
                    <p className="text-xs text-slate-500 max-w-md mx-auto lg:mx-0">
                        <strong>Disclaimer:</strong> Cointrak is for financial tracking and planning purposes only. It does not handle real money and is not a bank, wallet, or blockchain-based service.
                    </p>
                </div>
              </div>
            </div>

            {/* FIX: Added margin-top for spacing on mobile and responsive width */}
            <div className="hero-visual w-full lg:w-1/2 mt-10 lg:mt-0">
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