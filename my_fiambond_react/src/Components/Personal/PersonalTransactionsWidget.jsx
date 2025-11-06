import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../Context/AppContext.jsx";
import { db } from '../../config/firebase-config';
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    limit, 
    startAfter, 
    getDocs 
} from 'firebase/firestore';

// --- STYLED SKELETON LOADER ---
const TransactionListSkeleton = () => (
  <div className="animate-pulse">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="flex items-center p-4 border-b last:border-b-0 border-gray-100">
        <div className="h-10 w-10 rounded-full bg-slate-200"></div>
        <div className="ml-4 flex-grow">
          <div className="h-5 w-3/4 bg-slate-200 rounded"></div>
          <div className="h-4 w-1/4 bg-slate-200 rounded mt-2"></div>
        </div>
        <div className="h-6 w-28 bg-slate-200 rounded"></div>
      </div>
    ))}
  </div>
);

const TRANSACTIONS_PER_PAGE = 15;

// --- HELPER FUNCTION TO FORMAT DATE HEADERS ---
const formatDateHeader = (dateString) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = new Date(dateString);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
    });
};

// --- STYLED TRANSACTION ITEM COMPONENT ---
const TransactionItem = ({ transaction }) => {
    const isIncome = transaction.type === 'income';
    const Icon = () => (
        <svg className={`w-5 h-5 ${isIncome ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            {isIncome 
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path> 
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6"></path>
            }
        </svg>
    );
    const ReceiptIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    );

    return (
        <div className="flex items-center p-4 border-b last:border-b-0 border-gray-100 hover:bg-gray-50 transition-colors duration-150">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isIncome ? 'bg-green-100' : 'bg-red-100'}`}>
                <Icon />
            </div>
            <div className="ml-4 flex-grow min-w-0">
                <p className="font-semibold text-gray-800 truncate">{transaction.description}</p>
                <div className="flex items-center gap-3 mt-1">
                    <p className="text-sm text-gray-500">
                        {transaction.created_at.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                    {transaction.attachment_url && (
                        <a 
                            href={transaction.attachment_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline hover:text-blue-800"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ReceiptIcon />
                            View Receipt
                        </a>
                    )}
                </div>
            </div>
            <div className={`ml-4 font-semibold text-right ${isIncome ? 'text-green-600' : 'text-red-500'}`}>
                {isIncome ? '+' : '-'} ₱{parseFloat(transaction.amount.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
        </div>
    );
};


export default function PersonalTransactionsWidget() {
  const { user } = useContext(AppContext);
  const [transactions, setTransactions] = useState([]);
  const [groupedTransactions, setGroupedTransactions] = useState({});
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Effect for the INITIAL data load. Runs only when the user changes.
  useEffect(() => {
    if (!user) return;
    
    const fetchInitialTransactions = async () => {
        setLoading(true);
        setError(null);
        setHasMore(true);
        try {
            const firstPageQuery = query(
                collection(db, "transactions"),
                where("user_id", "==", user.uid),
                where("family_id", "==", null),
                orderBy("created_at", "desc"),
                limit(TRANSACTIONS_PER_PAGE)
            );
            const documentSnapshots = await getDocs(firstPageQuery);
            const newLastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1] || null;
            
            setLastVisible(newLastVisible);
            if (documentSnapshots.docs.length < TRANSACTIONS_PER_PAGE) {
                setHasMore(false);
            }
            const fetchedTransactions = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTransactions(fetchedTransactions);
        } catch (err) {
            console.error("Failed to fetch initial transactions:", err);
            setError("Could not load transactions.");
        } finally {
            setLoading(false);
        }
    };

    fetchInitialTransactions();
  }, [user]);

  // Function for loading MORE pages.
  const handleLoadMore = async () => {
    if (!lastVisible || !hasMore || loading) return;

    setLoading(true);
    try {
        const nextPageQuery = query(
            collection(db, "transactions"),
            where("user_id", "==", user.uid),
            where("family_id", "==", null),
            orderBy("created_at", "desc"),
            startAfter(lastVisible),
            limit(TRANSACTIONS_PER_PAGE)
        );
        const documentSnapshots = await getDocs(nextPageQuery);
        const newLastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1] || null;
        
        setLastVisible(newLastVisible);
        if (documentSnapshots.docs.length < TRANSACTIONS_PER_PAGE) {
            setHasMore(false);
        }
        const fetchedTransactions = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTransactions(prev => [...prev, ...fetchedTransactions]);
    } catch (err) {
        console.error("Failed to fetch more transactions:", err);
        setError("Could not load more transactions.");
    } finally {
        setLoading(false);
    }
  };

  // Effect to group transactions by date whenever the main list changes.
  useEffect(() => {
    const groups = transactions.reduce((acc, transaction) => {
      const dateKey = transaction.created_at.toDate().toDateString();
      if (!acc[dateKey]) { 
          acc[dateKey] = []; 
      }
      acc[dateKey].push(transaction);
      return acc;
    }, {});
    setGroupedTransactions(groups);
  }, [transactions]);
  
  // Initial loading state
  if (loading && transactions.length === 0) return <TransactionListSkeleton />;
  
  // Error state
  if (error) return <p className="error text-center py-4">{error}</p>;

  return (
    <div className="dashboard-card p-0">
        {Object.keys(groupedTransactions).length > 0 ? (
            <div className="divide-y divide-gray-200">
                {Object.keys(groupedTransactions).sort((a,b) => new Date(b).getTime() - new Date(a).getTime()).map(dateKey => (
                    <div key={dateKey}>
                        <h4 className="bg-gray-50 px-4 py-2 text-sm font-bold text-gray-700 border-b border-gray-200 sticky top-0 z-10">
                            {formatDateHeader(dateKey)}
                        </h4>
                        <div>
                            {groupedTransactions[dateKey].map(transaction => (
                                <TransactionItem key={transaction.id} transaction={transaction} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        ) : (
             // Only show this message if not loading and still no transactions
            !loading && <div className="p-6 text-center text-gray-500 italic">You have no personal transactions yet.</div>
        )}
      
      {hasMore && (
        <div className="p-4 bg-white border-t border-gray-200">
          <button 
            onClick={handleLoadMore} 
            disabled={loading} 
            className="w-full px-4 py-2 font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-colors duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}