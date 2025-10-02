// src/Components/FamilyTransactionsWidget.jsx

import { useContext, useEffect, useState, useCallback } from "react";
import { AppContext } from "../Context/AppContext.jsx";

// Reusable Skeleton Loader
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
  </div>
);

export default function FamilyTransactionsWidget({ family }) {
  const { token } = useContext(AppContext);
  const [transactions, setTransactions] =useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getTransactions = useCallback(async (page = 1) => {
    if (!token) return;
    if (page === 1) setLoading(true);
    setError(null);

    try {
      // Use the new API endpoint for fetching family-specific transactions
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/${family.id}/transactions?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Could not load family transactions.");
      
      const data = await res.json();
      setTransactions(data.data || []);
      const { data: _, ...paginationData } = data;
      setPagination(paginationData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, family.id]);

  useEffect(() => {
    getTransactions(1);
  }, [getTransactions]);

  if (loading) return <TransactionListSkeleton />;
  if (error) return <p className="error text-center py-4">{error}</p>;

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
                  {/* Display which member made the transaction */}
                  {transaction.user && ` • By: ${transaction.user.full_name}`}
                </small>
              </div>
              <p className={`transaction-amount flex-shrink-0 ${transaction.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                {transaction.type === 'income' ? '+' : '-'} ₱{parseFloat(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-600 italic">This family has no transactions yet.</div>
        )}
      </div>
      
      {pagination && pagination.last_page > 1 && (
        <div className="flex justify-between items-center mt-6">
          <button onClick={() => getTransactions(pagination.current_page - 1)} disabled={pagination.current_page === 1} className="pagination-btn">&larr; Previous</button>
          <span className="pagination-text">Page {pagination.current_page} of {pagination.last_page}</span>
          <button onClick={() => getTransactions(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page} className="pagination-btn">Next &rarr;</button>
        </div>
      )}
    </div>
  );
}