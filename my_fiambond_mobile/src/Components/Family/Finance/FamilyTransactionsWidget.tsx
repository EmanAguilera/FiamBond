import React, { useContext, useEffect, useState } from "react";
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    ActivityIndicator, 
    Linking, 
    Alert 
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { AppContext } from "../../../Context/AppContext.jsx";
import { db } from '../../../config/firebase-config.js';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    documentId
} from 'firebase/firestore';

// --- INTERFACES ---
interface UserProfile {
    id: string;
    full_name: string;
    [key: string]: any;
}

interface Transaction {
    id: string;
    user_id: string;
    family_id: string | null;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    created_at: { toDate: () => Date };
    attachment_url?: string;
    user?: UserProfile | { full_name: string };
}

interface FamilyTransactionsWidgetProps {
    family: { id: string; family_name: string };
}

// --- ICONS ---
const IncomeIcon = () => (
    <Svg className="w-5 h-5" fill="none" stroke="#16a34a" strokeWidth="2" viewBox="0 0 24 24">
        <Path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </Svg>
);

const ExpenseIcon = () => (
    <Svg className="w-5 h-5" fill="none" stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24">
        <Path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
    </Svg>
);

const ReceiptIcon = () => (
    <Svg className="w-4 h-4" fill="none" stroke="#64748b" strokeWidth="2" viewBox="0 0 24 24">
        <Path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </Svg>
);

// --- SKELETON LOADER ---
const TransactionListSkeleton = () => (
    <View className="animate-pulse">
        {[...Array(8)].map((_, i) => (
            <View key={i} className="flex-row items-center p-4 border-b border-slate-50">
                <View className="h-10 w-10 rounded-full bg-slate-200" />
                <View className="ml-4 flex-1">
                    <View className="h-4 w-3/4 bg-slate-200 rounded mb-2" />
                    <View className="h-3 w-1/3 bg-slate-200 rounded" />
                </View>
                <View className="h-5 w-20 bg-slate-200 rounded" />
            </View>
        ))}
    </View>
);

// --- HELPERS ---
const formatDateHeader = (dateString: string): string => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = new Date(dateString);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

// --- TRANSACTION ITEM ---
const TransactionItem = ({ transaction }: { transaction: Transaction }) => {
    const isIncome = transaction.type === 'income';

    const handleOpenReceipt = async (url: string) => {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            Alert.alert("Error", "Cannot open this URL");
        }
    };

    return (
        <View className="flex-row items-center p-4 border-b border-slate-50 bg-white">
            <View className={`w-10 h-10 rounded-full items-center justify-center ${isIncome ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                {isIncome ? <IncomeIcon /> : <ExpenseIcon />}
            </View>
            
            <View className="ml-4 flex-1">
                <Text className="font-bold text-slate-800 text-sm" numberOfLines={1}>
                    {transaction.description}
                </Text>
                <View className="flex-row items-center mt-1">
                    <Text className="text-[10px] text-slate-500 mr-3">By: {transaction.user?.full_name || 'Unknown'}</Text>
                    {transaction.attachment_url && (
                        <TouchableOpacity 
                            onPress={() => handleOpenReceipt(transaction.attachment_url!)}
                            className="flex-row items-center gap-1"
                        >
                            <ReceiptIcon />
                            <Text className="text-[10px] text-indigo-600 font-bold underline">Receipt</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View className="ml-2 items-end">
                <Text className={`font-bold text-sm ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isIncome ? '+' : '-'} ₱{Number(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
            </View>
        </View>
    );
};

export default function FamilyTransactionsWidget({ family }: FamilyTransactionsWidgetProps) {
    const { user } = useContext(AppContext) as any;
    const API_URL = 'https://super-duper-engine-57wjxxp4jxq2p64w-3000.app.github.dev/api'; // Replace with local IP for dev

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
                const response = await fetch(`${API_URL}/transactions?family_id=${family.id}`);
                if (!response.ok) throw new Error('Failed to fetch transactions');
                
                const rawTransactions = await response.json();

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

                const userIds = [...new Set(fetchedTransactions.map((tx: any) => tx.user_id))];
                const usersMap: { [key: string]: any } = {};
                
                if (userIds.length > 0) {
                    const usersQuery = query(collection(db, "users"), where(documentId(), "in", userIds.slice(0, 10)));
                    const usersSnapshot = await getDocs(usersQuery);
                    usersSnapshot.forEach(doc => { usersMap[doc.id] = doc.data(); });
                }
                
                const enriched = fetchedTransactions.map((tx: any) => ({
                    ...tx,
                    user: usersMap[tx.user_id] || { full_name: "Unknown" }
                }));
                
                setTransactions(enriched);
            } catch (err) {
                setError("Could not load transactions.");
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [user, family.id]);

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
    
    if (error) return (
        <View className="p-10 items-center">
            <Text className="text-rose-500 font-bold">{error}</Text>
        </View>
    );

    return (
        <ScrollView className="flex-1 bg-white rounded-3xl overflow-hidden shadow-sm" showsVerticalScrollIndicator={false}>
            {Object.keys(groupedTransactions).length > 0 ? (
                <View>
                    {Object.keys(groupedTransactions)
                        .sort((a,b) => new Date(b).getTime() - new Date(a).getTime())
                        .map(dateKey => (
                            <View key={dateKey}>
                                <View className="bg-slate-50 px-5 py-2 border-y border-slate-100">
                                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {formatDateHeader(dateKey)}
                                    </Text>
                                </View>
                                <View>
                                    {groupedTransactions[dateKey].map(transaction => (
                                        <TransactionItem key={transaction.id} transaction={transaction} />
                                    ))}
                                </View>
                            </View>
                        ))}
                </View>
            ) : (
                !loading && (
                    <View className="p-20 items-center justify-center">
                        <Text className="text-slate-400 italic text-center">No transactions recorded yet.</Text>
                    </View>
                )
            )}
            <View className="h-20" />
        </ScrollView>
    );
}