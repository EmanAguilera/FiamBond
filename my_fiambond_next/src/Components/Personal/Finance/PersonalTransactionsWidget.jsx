'use client'; // Required due to the use of useState, useEffect, useContext, and browser APIs

import { useContext, useEffect, useState, useMemo } from "react";
import { AppContext } from "../../../Context/AppContext.jsx";
import { API_BASE_URL } from '@/src/config/apiConfig';

// --- STYLED SKELETON LOADER ---
const TransactionListSkeleton = () => (
  <div className="animate-pulse">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center p-4 border-b last:border-b-0 border-slate-100">
        <div className="h-10 w-10 rounded-full bg-slate-200"></div>
        <div className="ml-4 flex-grow">
          <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
          <div className="h-3 w-1/4 bg-slate-200 rounded mt-2"></div>
        </div>
        <div className="h-5 w-20 bg-slate-200 rounded"></div>
      </div>
    ))}
  </div>
);

// --- HELPER: DATE FORMATTING ---
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

// --- STYLED TRANSACTION ITEM ---
const TransactionItem = ({ transaction }) => {
    const isIncome = transaction.type === 'income';
    
    return (
        <div className="flex items-center p-4 border-b last:border-b-0 border-slate-50 hover:bg-slate-50/50 transition-colors">
            <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                {isIncome ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6"></path></svg>
                )}
            </div>
            
            <div className="ml-4 flex-grow min-w-0">
                <p className="font-bold text-slate-700 truncate">{transaction.description}</p>
                <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-xs text-slate-400">
                        {transaction.created_at.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                    {transaction.attachment_url && (
                        <a 
                            href={transaction.attachment_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-500 hover:text-indigo-700"
                            onClick={(e) => e.stopPropagation()}
                        >
                            Receipt
                        </a>
                    )}
                </div>
            </div>
            
            <div className={`ml-4 font-bold text-right ${isIncome ? 'text-emerald-600' : 'text-rose-500'}`}>
                {isIncome ? '+' : '-'} ₱{parseFloat(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
        </div>
    );
};

export default function PersonalTransactionsWidget() {
  const { user } = useContext(AppContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/transactions?user_id=${user.uid}`);
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

            const data = await response.json();

            // Shim the .toDate() method to keep compatibility with existing UI logic
            const formattedData = data.map(tx => ({
                ...tx,
                id: tx._id, 
                created_at: { 
                    toDate: () => new Date(tx.created_at) 
                }
            }));

            setTransactions(formattedData);
        } catch (err) {
            console.error("Failed to fetch:", err);
            setError("Could not load your recent activity.");
        } finally {
            setLoading(false);
        }
    };

    fetchTransactions();
  }, [user]);

  // Use useMemo to group transactions only when the list changes
  const groupedTransactions = useMemo(() => {
    return transactions.reduce((acc, transaction) => {
      const dateKey = transaction.created_at.toDate().toDateString();
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(transaction);
      return acc;
    }, {});
  }, [transactions]);

  if (loading && transactions.length === 0) return <TransactionListSkeleton />;
  if (error) return <div className="p-8 text-center text-rose-500 font-medium text-sm">{error}</div>;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {Object.keys(groupedTransactions).length > 0 ? (
            <div className="divide-y divide-slate-100">
                {Object.keys(groupedTransactions)
                  .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                  .map(dateKey => (
                    <div key={dateKey}>
                        <h4 className="bg-slate-50/80 px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                            {formatDateHeader(dateKey)}
                        </h4>
                        <div className="divide-y divide-slate-50">
                            {groupedTransactions[dateKey].map(tx => (
                                <TransactionItem key={tx.id} transaction={tx} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            !loading && (
                <div className="p-12 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <p className="text-slate-400 text-sm italic">No recent transactions found.</p>
                </div>
            )
        )}
    </div>
  );
}