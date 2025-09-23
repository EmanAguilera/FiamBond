import { useContext, useEffect, useState, useCallback } from "react";
import { AppContext } from "../Context/AppContext.jsx";

// --- SKELETON LOADER COMPONENT ---
// This component renders a placeholder UI that mimics the transaction list's layout.
// It is shown instantly while the real data is being fetched, providing a smooth
// loading experience instead of a blank space or simple text.
const TransactionListSkeleton = () => (
  <div className="animate-pulse">
    <div className="dashboard-card p-0">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex justify-between items-center p-4 border-b last:border-b-0 border-slate-100">
          <div>
            <div className="h-5 w-48 bg-slate-200 rounded"></div>
            <div className="h-4 w-24 bg-slate-200 rounded mt-2"></div>
          </div>
          <div className="h-6 w-28 bg-slate-200 rounded"></div>
        </div>
      ))}
    </div>
    <div className="flex justify-between items-center mt-6">
        <div className="h-8 w-24 bg-slate-200 rounded"></div>
        <div className="h-4 w-28 bg-slate-200 rounded"></div>
        <div className="h-8 w-24 bg-slate-200 rounded"></div>
    </div>
  </div>
);


export default function RecentTransactionsWidget() {
  const { token } = useContext(AppContext);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getTransactions = useCallback(async (page = 1) => {
    if (!token) {
        setLoading(false);
        return;
    }
    // Set loading to true only for the initial fetch, not for pagination clicks
    if (page === 1) {
        setLoading(true);
    }
    setError(null);

    try {
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
    // We only need to call getTransactions here for the initial load.
    // Subsequent calls will be handled by the pagination buttons.
    getTransactions(1);
  }, [getTransactions]);

  
  // --- RENDER LOGIC ---

  // While fetching the initial data, show the detailed skeleton loader.
  if (loading) {
    return <TransactionListSkeleton />;
  }
  
  // If an error occurs, show the error message.
  if (error) {
    return <p className="error text-center py-4">{error}</p>;
  }

  return (
    <div>
      <div className="dashboard-card p-0">
        {transactions.length > 0 ? (
          transactions.map((transaction) => (
            <div key={transaction.id} className="transaction-item border-b last:border-b-0 border-gray-100">
              <div className="min-w-0 pr-4">
                <p className="transaction-description break-words">{transaction.description}</p>
                <small className="transaction-date">
                  {new Date(transaction.created_at).toLocaleDateString()}
                </small>
              </div>
              <p className={`transaction-amount flex-shrink-0 ${transaction.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
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
    </div>
  );
}