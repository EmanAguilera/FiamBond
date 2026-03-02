"use client";

import React, { useContext, useEffect, useState, useMemo, memo } from "react";
import { View, Text, TouchableOpacity, ScrollView, Linking } from "react-native";
import { AppContext } from "@/context/AppContext";
import { API_BASE_URL } from '@/config/apiConfig';
import { db } from '@/config/firebase-config';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    documentId,
    orderBy,
    Firestore
} from 'firebase/firestore';
import { Plus, Minus, ShieldCheck, ExternalLink } from 'lucide-react-native';
import UnifiedLoadingWidget from "@/components/ui/UnifiedLoadingWidget";

// --- TYPES ---
type Realm = 'personal' | 'company' | 'family' | 'admin';
interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  created_at: any; 
  attachment_url?: string;
  user?: { full_name: string; email?: string };
  adminMeta?: { plan: string; accessType: string; };
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
    const isIncome = transaction.type === 'income' || realm === 'admin';
    const isShared = realm !== 'personal';

    const dateObj = (transaction.created_at as any)?.toDate 
        ? (transaction.created_at as any).toDate() 
        : new Date(transaction.created_at);
    
    const timeDisplay = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    return (
        <View className="flex-row items-center p-4 border-b border-slate-50 bg-white">
            <View className={`w-10 h-10 rounded-xl items-center justify-center 
                ${realm === 'admin' ? 'bg-indigo-50' : isIncome ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                {realm === 'admin' ? (
                    <ShieldCheck size={20} color="#4f46e5" />
                ) : isIncome ? (
                    <Plus size={20} color="#10b981" />
                ) : (
                    <Minus size={20} color="#f43f5e" />
                )}
            </View>

            <View className="ml-4 flex-1">
                <Text className="font-bold text-slate-700 text-sm" numberOfLines={1}>
                    {transaction.description}
                </Text>
                <View className="flex-row items-center mt-1">
                    {isShared ? (
                        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                            {transaction.user?.full_name || 'System'} 
                            {transaction.adminMeta && ` • ${transaction.adminMeta.plan}`}
                        </Text>
                    ) : (
                        <Text className="text-xs text-slate-400">{timeDisplay}</Text>
                    )}
                    
                    {transaction.attachment_url && (
                        <TouchableOpacity 
                            onPress={() => Linking.openURL(transaction.attachment_url!)}
                            className="ml-2 flex-row items-center"
                        >
                            <Text className="text-[10px] font-black text-indigo-500 uppercase">Receipt</Text>
                            <ExternalLink size={10} color="#6366f1" style={{ marginLeft: 2 }} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View className="ml-2 items-end">
                <Text className={`font-black text-sm ${isIncome ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {isIncome ? '+' : '-'} ₱{transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
            </View>
        </View>
    );
};

export const UnifiedTransactionsListWidget = ({ companyData, familyData, adminMode }: UnifiedProps) => {
  /** * ⭐️ THE FINAL FIX: 
   * Cast AppContext to 'any' and define the shape to clear Error 2345.
   */
  const context = useContext(AppContext as any) as { user: any };
  const user = context?.user;

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
                const raw = await res.json();
                
                let mapped = raw.map((tx: any) => ({
                    ...tx,
                    id: tx._id,
                    created_at: tx.created_at 
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
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [user, realm, companyData?.id, familyData?.id]);

  const grouped = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      const dateKey = (tx.created_at as any)?.toDate 
        ? (tx.created_at as any).toDate().toDateString() 
        : new Date(tx.created_at).toDateString();
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(tx);
      return acc;
    }, {} as Record<string, Transaction[]>);
  }, [transactions]);
  
  if (loading) return (
    <View className="bg-white rounded-3xl border border-slate-100 overflow-hidden min-h-[300px] shadow-sm">
        <UnifiedLoadingWidget 
            type="section" 
            message="Fetching transaction matrix..." 
            variant="slate" 
        />
    </View>
  );

  return (
    <View className="bg-white rounded-3xl border border-slate-50 overflow-hidden shadow-xl shadow-slate-200/50">
        {Object.keys(grouped).length > 0 ? (
            <ScrollView showsVerticalScrollIndicator={false}>
                {Object.keys(grouped)
                    .sort((a,b) => new Date(b).getTime() - new Date(a).getTime())
                    .map(dateKey => (
                        <View key={dateKey}>
                            <View className="bg-slate-50/80 px-5 py-3 border-b border-slate-100">
                                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    {formatDateHeader(dateKey)}
                                </Text>
                            </View>
                            <View>
                                {grouped[dateKey].map(tx => (
                                    <TransactionItem key={tx.id} transaction={tx} realm={realm} />
                                ))}
                            </View>
                        </View>
                    ))}
            </ScrollView>
        ) : (
            <View className="p-20 items-center">
                <Text className="text-slate-400 italic text-sm">No transactions found.</Text>
            </View>
        )}
    </View>
  );
};

export default memo(UnifiedTransactionsListWidget);