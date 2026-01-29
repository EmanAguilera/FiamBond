'use client'; // Required due to the use of useState, useEffect, useContext, and Firebase client-side SDK

import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../../Context/AppContext.jsx";
// Hybrid Approach: Keep Firebase imports ONLY for User Profile lookup
import { db } from '../../../config/firebase-config.js';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    documentId
} from 'firebase/firestore';

// Remove 'Transaction' from here to avoid conflict with local interface
import { User } from "../../../types/index"; 

// --- TypeScript Interfaces (Kept for clarity) ---
interface Family {
  id: string;
  family_name: string;
}

interface FamilyTransactionsWidgetProps {
  family: Family;
}

// Local Transaction Interface (Matches API + Shim)
interface Transaction {
  id: string;
  user_id: string;
  family_id: string | null;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  created_at: any; // using any for the shim object (.toDate)
  attachment_url?: string;
  user?: User | { full_name: string };
}

// --- STYLED SKELETON LOADER (Kept as is) ---
const TransactionListSkeleton = () => (
  <div className="animate-pulse">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="flex items-center p-4 border-b last:border-b-0 border-gray-100">
        <div className="h-10 w-10 rounded-full bg-slate-200"></div>
        <div className="ml-4 flex-grow">
          <div className="h-5 w-3/4 bg-slate-200 rounded"></div>
          <div className="h-4 w-1/3 bg-slate-200 rounded mt-2"></div>
        </div>
        <div className="h-6 w-28 bg-slate-200 rounded"></div>
      </div>
    ))}
  </div>
);

// --- HELPER FUNCTION TO FORMAT DATE HEADERS (Kept as is) ---
const formatDateHeader = (dateString: string): string => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = new Date(dateString);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

// --- STYLED TRANSACTION ITEM COMPONENT (Kept as is) ---
const TransactionItem = ({ transaction }: { transaction: Transaction }) => {
    const isIncome = transaction.type === 'income';
    const Icon = () => (<svg className={`w-5 h-5 ${isIncome ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">{isIncome ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6"></path>}</svg>);
    const ReceiptIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>);

    return (
        <div className="flex items-center p-4 border-b last:border-b-0 border-gray-100 hover:bg-gray-50 transition-colors duration-150">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isIncome ? 'bg-green-100' : 'bg-red-100'}`}>
                <Icon />
            </div>
            <div className="ml-4 flex-grow min-w-0">
                <p className="font-semibold text-gray-800 truncate">{transaction.description}</p>
                <div className="flex items-center gap-3 mt-1">
                    <p className="text-sm text-gray-500">By: {transaction.user?.full_name || 'Unknown'}</p>
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

export default function FamilyTransactionsWidget({ family }: FamilyTransactionsWidgetProps) {
  const { user } = useContext(AppContext);
  // ⭐️ Next.js change: Replace import.meta.env.VITE_API_URL with process.env.NEXT_PUBLIC_API_URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // State typing retained from original .tsx
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [groupedTransactions, setGroupedTransactions] = useState<{ [key: string]: Transaction[] }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !family?.id) return;
    
    const fetchTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Call Node.js Backend
            const response = await fetch(`${API_URL}/transactions?family_id=${family.id}`);
            
            if (!response.ok) throw new Error('Failed to fetch transactions');
            
            const rawTransactions = await response.json();

            // 2. Transform Data (Shim: Create fake Firebase Timestamp for compatibility)
            const fetchedTransactions = rawTransactions.map((tx: any) => ({
                ...tx,
                id: tx._id,
                created_at: { toDate: () => new Date(tx.created_at) }
            }));

            if (fetchedTransactions.length === 0) {
              setTransactions([]);
              setLoading(false);
              return;
            }

            // 3. Enrich with User Data (Firebase Hybrid)
            const userIds = [...new Set(fetchedTransactions.map((tx: any) => tx.user_id))];
            const usersMap: { [key: string]: any } = {};
            
            // ⭐️ CRITICAL FIX: Add Guard Clause for 'db'
            if (!db) {
                console.warn("Firestore not initialized. Cannot fetch user details.");
                // We still proceed with the transactions but without user names
            } else if (userIds.length > 0) {
                // Limit to 10 for Firebase 'in' query limitation
                // This line is now safe because it's inside the 'if (!db)' block
                const usersQuery = query(collection(db, "users"), where(documentId(), "in", userIds.slice(0, 10)));
                const usersSnapshot = await getDocs(usersQuery);
                usersSnapshot.forEach(doc => { usersMap[doc.id] = doc.data(); });
            }
            
            const enrichedTransactions = fetchedTransactions.map((tx: any) => ({
                ...tx,
                user: usersMap[tx.user_id] || { full_name: "Unknown" }
            }));
            
            setTransactions(enrichedTransactions);

        } catch (err) {
            console.error("Failed to fetch family transactions:", err);
            setError("Could not load transactions.");
        } finally {
            setLoading(false);
        }
    };

    fetchTransactions();
  }, [user, family.id, API_URL]);

  // Effect to group transactions by date
  useEffect(() => {
    const groups = transactions.reduce((acc, transaction) => {
      const dateKey = transaction.created_at.toDate().toDateString();
      if (!acc[dateKey]) { acc[dateKey] = []; }
      acc[dateKey].push(transaction);
      return acc;
    }, {} as { [key: string]: Transaction[] });
    setGroupedTransactions(groups);
  }, [transactions]);
  
  if (loading && transactions.length === 0) return <TransactionListSkeleton />;
  if (error) return <p className="error text-center py-4 text-rose-500">{error}</p>;

  return (
    <div className="dashboard-card p-0">
        {Object.keys(groupedTransactions).length > 0 ? (
            <div className="divide-y divide-gray-200">
                {Object.keys(groupedTransactions).sort((a,b) => new Date(b).getTime() - new Date(a).getTime()).map(dateKey => (
                    <div key={dateKey}>
                        <h4 className="bg-gray-50 px-4 py-2 text-sm font-bold text-gray-700 border-b border-gray-200">
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
            !loading && <div className="p-6 text-center text-gray-500 italic">This family has no transactions yet.</div>
        )}
    </div>
  );
}