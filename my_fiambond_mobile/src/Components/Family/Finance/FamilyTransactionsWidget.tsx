import React, { useContext, useEffect, useState, useMemo } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    ActivityIndicator, 
    TouchableOpacity, 
    Linking,
    Alert 
} from "react-native";
import { AppContext } from "../../../Context/AppContext.jsx";
// Hybrid Approach: Keep Firebase imports ONLY for User Profile lookup
import { db } from '../../../config/firebase-config';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    documentId
} from 'firebase/firestore';

// --- TypeScript Interfaces ---
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
  created_at: { toDate: () => Date; [key: string]: any } | string; // Handle both shim and string
  attachment_url?: string;
  user?: { full_name: string };
}

// Interfaces for Context Fix (Error 2339)
interface User { 
    uid: string; 
    [key: string]: any; 
}
interface AppContextType { 
    user: User | null; 
    [key: string]: any; 
}

// Interface for Icon Props (Error 7031, 2741)
interface IconProps {
    name: 'Plus' | 'Receipt' | string;
    isIncome?: boolean;
    style?: any;
    size?: number;
}


// --- ICON PLACEHOLDER (Fixed for TS) ---
const Icon = ({ name, isIncome, style, size = 20 }: IconProps) => { 
    let iconText = '';
    switch (name) {
        case 'Plus': iconText = isIncome ? '▲' : '▼'; break;
        case 'Receipt': iconText = '📄'; break;
        default: iconText = '?';
    }
    const color = isIncome ? styles.iconGreen : styles.iconRed;
    return <Text style={[styles.iconBase, color, { fontSize: size, lineHeight: size }, style]}>{iconText}</Text>;
};

// --- STYLED SKELETON LOADER ---
const TransactionListSkeleton = () => (
  <View style={styles.skeletonContainer}>
    {[...Array(8)].map((_, i) => (
      <View key={i} style={styles.skeletonItem}>
        <View style={styles.skeletonCircle} />
        <View style={styles.skeletonTextWrapper}>
          <View style={styles.skeletonTextMain} />
          <View style={styles.skeletonTextSub} />
        </View>
        <View style={styles.skeletonTextAmount} />
      </View>
    ))}
  </View>
);

// --- HELPER FUNCTION TO FORMAT DATE HEADERS ---
const parseDate = (dateVal: any): Date => {
    if (dateVal && dateVal.toDate) return dateVal.toDate();
    if (dateVal) return new Date(dateVal);
    return new Date();
};

const formatDateHeader = (dateString: string): string => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = new Date(dateString);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

// --- STYLED TRANSACTION ITEM COMPONENT ---
const TransactionItem = ({ transaction }: { transaction: Transaction }) => {
    const isIncome = transaction.type === 'income';
    const transactionTypeStyle = isIncome ? styles.incomeText : styles.expenseText;
    const backgroundStyle = isIncome ? styles.incomeBg : styles.expenseBg;

    const handleReceiptPress = () => {
        if (transaction.attachment_url) {
            Linking.openURL(transaction.attachment_url).catch(err => 
                Alert.alert("Error", "Failed to open receipt link: " + err.message)
            );
        }
    };

    return (
        <TouchableOpacity style={styles.itemContainer} activeOpacity={0.7}>
            <View style={[styles.iconWrapper, backgroundStyle]}>
                <Icon name={'Plus'} isIncome={isIncome} style={transactionTypeStyle} />
            </View>
            <View style={styles.detailsWrapper}>
                <Text style={styles.descriptionText} numberOfLines={1}>{transaction.description}</Text>
                <View style={styles.subDetails}>
                    <Text style={styles.byText}>By: {transaction.user?.full_name || 'Unknown'}</Text>
                    {transaction.attachment_url && (
                        <TouchableOpacity onPress={handleReceiptPress} style={styles.receiptButton}>
                            <Icon name="Receipt" isIncome={false} style={styles.receiptIcon} size={14} /> 
                            <Text style={styles.receiptText}>View Receipt</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            <Text style={[styles.amountText, transactionTypeStyle]}>
                {isIncome ? '+' : '-'} ₱{parseFloat(transaction.amount.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
        </TouchableOpacity>
    );
};

export default function FamilyTransactionsWidget({ family }: FamilyTransactionsWidgetProps) {
  // FIX: Assert context type with non-null assertion (!)
  const { user } = useContext(AppContext)! as AppContextType; 
  const API_URL = 'http://localhost:3000/api'; 

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [groupedTransactions, setGroupedTransactions] = useState<{ [key: string]: Transaction[] }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // FIX: Use optional chaining to safely check user.uid. The check prevents the effect from running when user is null.
    if (!user?.uid || !family?.id) return; 
    
    const fetchTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Call Node.js Backend
            const response = await fetch(`${API_URL}/transactions?family_id=${family.id}`);
            
            if (!response.ok) throw new Error('Failed to fetch transactions');
            
            const rawTransactions = await response.json();

            // 2. Transform Data
            const fetchedTransactions: Transaction[] = rawTransactions.map((tx: any) => ({
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
            
            if (userIds.length > 0) {
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
    // FIX: The dependency array now uses user?.uid to safely trigger the effect when the user changes.
  }, [user?.uid, family.id]); 

  // Effect to group transactions by date
  useEffect(() => {
    const groups = transactions.reduce((acc, transaction) => {
      const dateKey = parseDate(transaction.created_at).toDateString(); 
      if (!acc[dateKey]) { acc[dateKey] = []; }
      acc[dateKey].push(transaction);
      return acc;
    }, {} as { [key: string]: Transaction[] });
    setGroupedTransactions(groups);
  }, [transactions]);
  
  if (loading && transactions.length === 0) return <TransactionListSkeleton />;
  if (error) return <Text style={styles.errorText}>{error}</Text>;

  return (
    <View style={styles.mainCard}>
        {Object.keys(groupedTransactions).length > 0 ? (
            <ScrollView style={styles.listWrapper}>
                {Object.keys(groupedTransactions).sort((a,b) => new Date(b).getTime() - new Date(a).getTime()).map(dateKey => (
                    <View key={dateKey}>
                        <Text style={styles.dateHeader}>
                            {formatDateHeader(dateKey)}
                        </Text>
                        <View style={styles.transactionsGroup}>
                            {groupedTransactions[dateKey].map(transaction => (
                                <TransactionItem key={transaction.id} transaction={transaction} />
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>
        ) : (
            !loading && (
                <View style={styles.emptyListContainer}>
                    <Text style={styles.emptyListText}>This family has no transactions yet.</Text>
                </View>
            )
        )}
    </View>
  );
}

// --- REACT NATIVE STYLESHEET ---
const styles = StyleSheet.create({
    // Global & Utility
    iconBase: { 
        fontSize: 20, 
        lineHeight: 20, 
        fontWeight: 'bold' 
    },
    iconGreen: { color: '#059669' }, 
    iconRed: { color: '#DC2626' },   
    incomeText: { color: '#059669' }, 
    expenseText: { color: '#EF4444' }, 
    incomeBg: { backgroundColor: '#D1FAE5' }, 
    expenseBg: { backgroundColor: '#FEE2E2' }, 
    
    // Main Card/Container
    mainCard: {
        borderRadius: 12,
        backgroundColor: 'white',
        padding: 0, 
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    listWrapper: {
        
    },
    
    // Date Header
    dateHeader: {
        backgroundColor: '#F9FAFB', 
        paddingHorizontal: 16, 
        paddingVertical: 8, 
        fontSize: 14, 
        fontWeight: 'bold',
        color: '#374151', 
        borderBottomWidth: 1,
        borderColor: '#E5E7EB', 
        borderTopWidth: 1, 
    },
    transactionsGroup: {
        
    },
    
    // Transaction Item
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16, 
        borderBottomWidth: 1,
        borderColor: '#F3F4F6', 
    },
    iconWrapper: {
        flexShrink: 0,
        width: 40, 
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailsWrapper: {
        marginLeft: 16, 
        flexGrow: 1,
        minWidth: 0,
    },
    descriptionText: {
        fontWeight: '600', 
        color: '#1F2937', 
        fontSize: 16,
    },
    subDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12, 
        marginTop: 4, 
    },
    byText: {
        fontSize: 14, 
        color: '#6B7280', 
    },
    receiptButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4, 
    },
    receiptIcon: {
        color: '#3B82F6', 
        fontSize: 14,
    },
    receiptText: {
        fontSize: 12, 
        color: '#3B82F6', 
        textDecorationLine: 'underline',
    },
    amountText: {
        marginLeft: 16, 
        fontWeight: '600', 
        textAlign: 'right',
        fontSize: 16,
    },

    // Empty List/Error
    emptyListContainer: {
        padding: 24, 
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyListText: {
        color: '#6B7280', 
        fontStyle: 'italic',
        fontSize: 16,
    },
    errorText: {
        color: '#EF4444', 
        textAlign: 'center',
        paddingVertical: 16, 
        fontSize: 16,
    },

    // Skeleton Loader Styles
    skeletonContainer: {
        
    },
    skeletonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderColor: '#E5E7EB', 
    },
    skeletonCircle: {
        height: 40,
        width: 40,
        borderRadius: 20,
        backgroundColor: '#E2E8F0', 
    },
    skeletonTextWrapper: {
        marginLeft: 16,
        flexGrow: 1,
    },
    skeletonTextMain: {
        height: 20, 
        width: '75%', 
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
    },
    skeletonTextSub: {
        height: 16, 
        width: '33%', 
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
        marginTop: 8, 
    },
    skeletonTextAmount: {
        height: 24, 
        width: 112, 
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
        marginLeft: 16,
    },
});