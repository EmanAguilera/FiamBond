// src/Components/FamilyTransactionsWidget.jsx

import { useContext, useEffect, useState, useCallback } from "react";
import { AppContext } from "../Context/AppContext.jsx";
import { db } from '../config/firebase-config'; // Adjust path
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    limit, 
    startAfter, 
    getDocs, 
    documentId 
} from 'firebase/firestore';

// --- FULL SKELETON LOADER COMPONENT ---
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

const TRANSACTIONS_PER_PAGE = 10;

export default function FamilyTransactionsWidget({ family }) {
  const { user } = useContext(AppContext);
  const [transactions, setTransactions] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getTransactions = useCallback(async (isInitialLoad = false) => {
    // This part of the function remains the same
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      let transactionsQuery = query(
        collection(db, "transactions"),
        where("family_id", "==", family.id),
        orderBy("created_at", "desc"),
        limit(TRANSACTIONS_PER_PAGE)
      );

      if (!isInitialLoad && lastVisible) {
        transactionsQuery = query(transactionsQuery, startAfter(lastVisible));
      }

      const documentSnapshots = await getDocs(transactionsQuery);
      const newLastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
      setLastVisible(newLastVisible);
      
      if (documentSnapshots.docs.length < TRANSACTIONS_PER_PAGE) {
        setHasMore(false);
      }

      const fetchedTransactions = documentSnapshots.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (fetchedTransactions.length === 0) {
        if (isInitialLoad) setTransactions([]);
        setLoading(false); // Make sure to stop loading if nothing is found
        return;
      }

      const userIds = [...new Set(fetchedTransactions.map(tx => tx.user_id))];
      const usersRef = collection(db, "users");
      const usersQuery = query(usersRef, where(documentId(), "in", userIds));
      const usersSnapshot = await getDocs(usersQuery);
      const usersMap = {};
      usersSnapshot.forEach(doc => {
          usersMap[doc.id] = doc.data();
      });

      const enrichedTransactions = fetchedTransactions.map(tx => ({
          ...tx,
          user: usersMap[tx.user_id] || { full_name: "Unknown User" }
      }));

      if (isInitialLoad) {
        setTransactions(enrichedTransactions);
      } else {
        setTransactions(prev => [...prev, ...enrichedTransactions]);
      }

    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      setError("Could not load family transactions.");
    } finally {
      setLoading(false);
    }
  }, [user, family.id, lastVisible]);

  // Initial load effect
  useEffect(() => {
    // We only want to run this once when the component mounts.
    // The getTransactions function is wrapped in useCallback, so it's safe to include.
    getTransactions(true);
  }, [getTransactions]); // <-- THE FIX IS HERE

  const handleLoadMore = () => {
    getTransactions(false);
  };

  if (loading && transactions.length === 0) return <TransactionListSkeleton />;
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
                  {transaction.created_at.toDate().toLocaleDateString()}
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
      
      {hasMore && (
        <div className="flex justify-center mt-6">
          <button onClick={handleLoadMore} disabled={loading} className="pagination-btn">
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}