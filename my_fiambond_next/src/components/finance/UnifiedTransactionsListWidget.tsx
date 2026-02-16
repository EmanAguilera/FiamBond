'use client'; 

import { useContext, useEffect, useState, useMemo, memo } from "react";
import { AppContext } from "../../context/AppContext.jsx";
import { API_BASE_URL } from '../../config/apiConfig.js';
import { db } from '../../config/firebase-config.js';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    documentId,
    orderBy,
    Firestore
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';

// 🏎️ Simplex Move: Import your unified loader
import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";

// --- TYPES ---
type Realm = 'personal' | 'company' | 'family' | 'admin';

interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  created_at: { toDate: () => Date } | string; 
  attachment_url?: string;
  user?: { full_name: string; email?: string };
  adminMeta?: {
      plan: string;
      accessType: string;
  };
}

interface UnifiedProps {
    companyData?: { id: string | number; name?: string };
    familyData?: { id: string; family_name?: string };
    adminMode?: boolean; 
}

const formatDateHeader = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return 'Today';
    now.setDate(now.getDate() - 1);
    if (date.toDateString() === now.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const TransactionItem = ({ transaction, realm }: { transaction: Transaction, realm: Realm }) => {
    const isIncome = transaction.type === 'income';
    const isShared = realm !== 'personal';

    const dateObj = typeof transaction.created_at === 'string'
        ? new Date(transaction.created_at)
        : transaction.created_at.toDate();
    
    const timeDisplay = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    return (
        <div className="flex items-center p-4 border-b last:border-b-0 border-slate-50 hover:bg-slate-50/50 transition-colors">
            <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center 
                ${realm === 'admin' ? 'bg-indigo-50 text-indigo-600' : isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                {realm === 'admin' ? (
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                ) : isIncome ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6"></path></svg>
                )}
            </div>

            <div className="ml-4 flex-grow min-w-0 text-left">
                <p className="font-bold text-slate-700 truncate">{transaction.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    {isShared && (
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                            {transaction.user?.full_name || 'System'} 
                            {transaction.adminMeta && ` • ${transaction.adminMeta.accessType} • ${transaction.adminMeta.plan}`}
                        </p>
                    )}
                    {!isShared && <p className="text-xs text-slate-400">{timeDisplay}</p>}
                    
                    {transaction.attachment_url && (
                        <a href={transaction.attachment_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-indigo-500 uppercase">Receipt</a>
                    )}
                </div>
            </div>

            <div className={`ml-4 font-black text-right ${realm === 'admin' || isIncome ? 'text-emerald-600' : 'text-rose-500'}`}>
                {isIncome || realm === 'admin' ? '+' : '-'} ₱{transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
        </div>
    );
};

// --- MAIN WIDGET ---

export const UnifiedTransactionsListWidget = ({ companyData, familyData, adminMode }: UnifiedProps) => {
  const { user } = useContext(AppContext) as any;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const realm: Realm = adminMode ? 'admin' : companyData ? 'company' : familyData ? 'family' : 'personal';

  useEffect(() => {
    if (!user || !db) return;
    
    const fetchData = async () => {
        setLoading(true);
        try {
            let results: Transaction[] = [];

            if (realm === 'admin') {
                const q = query(collection(db as Firestore, "premiums"), orderBy("granted_at", "desc"));
                const snap = await getDocs(q);
                const rawPremiums = snap.docs.filter(d => d.data().user_id !== user.uid);

                if (rawPremiums.length > 0) {
                    const userIds = [...new Set(rawPremiums.map(d => d.data().user_id))];
                    const usersMap: Record<string, any> = {};
                    const uSnap = await getDocs(query(collection(db as Firestore, "users"), where(documentId(), "in", userIds.slice(0, 10))));
                    uSnap.forEach(d => { usersMap[d.id] = d.data(); });

                    results = rawPremiums.map(d => {
                        const data = d.data();
                        return {
                            id: d.id,
                            user_id: data.user_id,
                            description: `Premium Subscription Inflow`,
                            amount: data.amount || 0,
                            type: 'income',
                            created_at: data.granted_at,
                            user: usersMap[data.user_id] || { full_name: "Unknown User" },
                            adminMeta: {
                                plan: String(data.plan_cycle || 'Monthly').toUpperCase(),
                                accessType: String(data.access_type || 'Company').toUpperCase()
                            }
                        };
                    });
                }
            } else {
                let apiUrl = `${API_BASE_URL}/transactions?user_id=${user.uid}`;
                if (realm === 'company') apiUrl = `${API_BASE_URL}/transactions?company_id=${companyData?.id}`;
                if (realm === 'family') apiUrl = `${API_BASE_URL}/transactions?family_id=${familyData?.id}`;

                const res = await fetch(apiUrl);
                if (!res.ok) throw new Error();
                const raw = await res.json();
                
                let mapped = raw.map((tx: any) => ({
                    ...tx,
                    id: tx._id,
                    created_at: { toDate: () => new Date(tx.created_at) }
                }));

                if (realm === 'personal') mapped = mapped.filter((tx: any) => !tx.family_id && !tx.company_id);

                if (realm !== 'personal' && mapped.length > 0) {
                    const uIds = [...new Set(mapped.map((tx: any) => tx.user_id))];
                    const usersMap: Record<string, any> = {};
                    const uSnap = await getDocs(query(collection(db as Firestore, "users"), where(documentId(), "in", uIds.slice(0, 10))));
                    uSnap.forEach(d => { usersMap[d.id] = d.data(); });
                    mapped = mapped.map((tx: any) => ({ ...tx, user: usersMap[tx.user_id] }));
                }
                results = mapped;
            }
            
            setTransactions(results);
        } catch (err) {
            toast.error("Failed to load transactions.");
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [user, realm, companyData?.id, familyData?.id]);

  const grouped = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      const dateKey = (tx.created_at as any).toDate ? (tx.created_at as any).toDate().toDateString() : new Date(tx.created_at as any).toDateString();
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(tx);
      return acc;
    }, {} as Record<string, Transaction[]>);
  }, [transactions]);
  
  // 🛡️ Loading Guard: Unified section loader instead of pulse skeletons
  if (loading) return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden min-h-[400px]">
        <UnifiedLoadingWidget 
            type="section" 
            message="Fetching transaction matrix..." 
            variant="slate" 
        />
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {Object.keys(grouped).length > 0 ? (
            <div className="divide-y divide-slate-100">
                {Object.keys(grouped)
                    .sort((a,b) => new Date(b).getTime() - new Date(a).getTime())
                    .map(dateKey => (
                        <div key={dateKey}>
                            <h4 className="bg-slate-50/50 px-6 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 sticky top-0 z-10 backdrop-blur-sm">
                                {formatDateHeader(dateKey)}
                            </h4>
                            <div className="divide-y divide-slate-50">
                                {grouped[dateKey].map(tx => (
                                    <TransactionItem key={tx.id} transaction={tx} realm={realm} />
                                ))}
                            </div>
                        </div>
                    ))}
            </div>
        ) : (
            <div className="p-16 text-center text-slate-400 italic text-sm">No transactions found.</div>
        )}
    </div>
  );
};

export default memo(UnifiedTransactionsListWidget);