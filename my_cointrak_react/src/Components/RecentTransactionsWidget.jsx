import { useContext, useEffect, useState, useCallback } from "react";
// We no longer need the Link component here
import { AppContext } from "../Context/AppContext.jsx";

export default function RecentTransactionsWidget() {
  const { token } = useContext(AppContext);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getTransactions = useCallback(async (page = 1) => {
    if (!token) return;
    try {
      setLoading(true);
      // We can fetch a reasonable number per page, like 10
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transactions?page=${page}&per_page=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Could not load transactions.");
      }
      const data = await res.json();
      setTransactions(Array.isArray(data.data) ? data.data : []);
      const { data: _, ...paginationData } = data;
      setPagination(paginationData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    getTransactions();
  }, [getTransactions]);

  return (
    <div className="dashboard-section">
      {/* --- START OF FIX --- */}
      {/* The header is now just a simple title, as it's the main list view. */}
      <h3 className="font-bold text-2xl text-gray-800 mb-6">Your Personal Transactions</h3>
      {/* --- END OF FIX --- */}
      
      {loading ? (
        <p className="text-gray-500">Loading transactions...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <>
          <div className="dashboard-card p-0">
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <div key={transaction.id} className="transaction-item border-b last:border-b-0 border-gray-100">
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
              ))
            ) : (
              <div className="p-4 text-center text-gray-600 italic">
                You have no personal transactions yet.
              </div>
            )}
          </div>
          
          {/* The pagination controls allow the user to browse all transactions */}
          {pagination && pagination.last_page > 1 && (
            <div className="flex justify-between items-center mt-6">
              <button onClick={() => getTransactions(pagination.current_page - 1)} disabled={pagination.current_page === 1} className="pagination-btn">
                &larr; Previous
              </button>
              <span className="pagination-text">
                Page {pagination.current_page} of {pagination.last_page}
              </span>
              <button onClick={() => getTransactions(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page} className="pagination-btn">
                Next &rarr;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}