import { useContext, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../Context/AppContext.jsx";

export default function RecentTransactionsWidget() {
  const { token } = useContext(AppContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getRecentTransactions = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transactions?per_page=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Could not load recent transactions.");
      const data = await res.json();
      setTransactions(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    getRecentTransactions();
  }, [getRecentTransactions]);

  return (
    <div className="dashboard-section">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-2xl text-gray-800">Your Recent Personal Transactions</h3>
        <Link to="/transactions" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
          View All &rarr;
        </Link>
      </div>
      {loading ? (<p className="text-gray-500">Loading transactions...</p>) : error ? (<p className="error">{error}</p>) : (
        <div className="dashboard-card p-0">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div key={transaction.id} className="transaction-item border-b last:border-b-0 border-gray-100">
                <div>
                  <p className="transaction-description">{transaction.description}</p>
                  <small className="transaction-date">{new Date(transaction.created_at).toLocaleDateString()}</small>
                </div>
                <p className={`transaction-amount ${transaction.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                  {transaction.type === 'income' ? '+' : '-'} ₱{parseFloat(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-600 italic">
              You have no personal transactions yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}