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
      // --- FIX IS HERE #1 ---
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
      // --- FIX IS HERE #2 ---
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
    } catch (error) {
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
        <div className="p-10">
          <div className="dashboard-section">
            <div className="dashboard-header">
              <h2 className="dashboard-title">Welcome back, {user.first_name}!</h2>
              <Link to="/transactions/create" className="primary-btn max-w-[200px]">
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
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-headline">
                Take Control of Your Finances
              </h1>
              <p className="hero-subheadline">
                Cointrak is the simplest way to manage your personal and family finances. Track your income, monitor expenses, and achieve your financial goals with ease.
              </p>
              <div className="hero-cta">
                <Link to="/register" className="primary-btn w-auto text-lg">
                  Get Started for Free
                </Link>
                <Link to="/login" className="text-link text-lg">
                  Login to your account
                </Link>
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