import React, { useContext, useEffect, useState } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    ActivityIndicator, 
    TouchableOpacity, 
    Linking 
} from "react-native";
import { AppContext } from "../../../Context/AppContext.jsx";

// --- ICON PLACEHOLDER (Replace with react-native-vector-icons) ---
const Icon = ({ name, isIncome, style }) => {
    let iconText = '';
    switch (name) {
        case 'Plus': iconText = '+'; break; // Plus/Minus for income/expense
        case 'Minus': iconText = '–'; break;
        case 'Receipt': iconText = '📄'; break;
        default: iconText = '?';
    }
    const color = isIncome ? styles.iconGreen : styles.iconRed;
    return <Text style={[styles.iconBase, color, style]}>{iconText}</Text>;
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
                <Icon name={isIncome ? 'Plus' : 'Minus'} isIncome={isIncome} style={transactionTypeStyle} />
            </View>
            <View style={styles.detailsWrapper}>
                <Text style={styles.descriptionText} numberOfLines={1}>{transaction.description}</Text>
                <View style={styles.subDetails}>
                    <Text style={styles.timeText}>
                        {/* We use .toDate() here because we shimmed it in the fetch function */}
                        {transaction.created_at.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </Text>
                    {transaction.attachment_url && (
                        <TouchableOpacity onPress={handleReceiptPress} style={styles.receiptButton}>
                            <Icon name="Receipt" style={styles.receiptIcon} />
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

export default function PersonalTransactionsWidget() {
  const { user } = useContext(AppContext);
  const [transactions, setTransactions] = useState([]);
  const [groupedTransactions, setGroupedTransactions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = 'http://localhost:3000/api'; // Simplified URL

  // Effect for the INITIAL data load.
  useEffect(() => {
    if (!user) return;
    
    const fetchTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Call your new Node.js Backend
            const response = await fetch(`${API_URL}/transactions?user_id=${user.uid}`);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            const data = await response.json();

            // 2. Transform Data to match old Firebase format
            const formattedData = data.map(tx => ({
                ...tx,
                id: tx._id, // Map MongoDB _id to id
                created_at: { 
                    toDate: () => new Date(tx.created_at) // Create the helper function
                }
            }));

            setTransactions(formattedData);
        } catch (err) {
            console.error("Failed to fetch transactions:", err);
            setError("Could not load transactions from FiamBond V3.");
        } finally {
            setLoading(false);
        }
    };

    fetchTransactions();
  }, [user]);

  // Effect to group transactions by date whenever the main list changes.
  useEffect(() => {
    const groups = transactions.reduce((acc, transaction) => {
      // The .toDate() works here because we added it in the transform step above
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
             // Only show this message if not loading and still no transactions
            !loading && (
                <View style={styles.emptyListContainer}>
                    <Text style={styles.emptyListText}>You have no personal transactions yet.</Text>
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
    iconGreen: { color: '#059669' }, // text-green-600
    iconRed: { color: '#DC2626' },   // text-red-600
    incomeText: { color: '#059669' }, // text-green-600
    expenseText: { color: '#EF4444' }, // text-red-500
    incomeBg: { backgroundColor: '#D1FAE5' }, // bg-green-100
    expenseBg: { backgroundColor: '#FEE2E2' }, // bg-red-100
    
    // Main Card/Container
    mainCard: {
        borderRadius: 12,
        backgroundColor: 'white',
        padding: 0, // dashboard-card p-0
        overflow: 'hidden',
    },
    listWrapper: {
        // divide-y divide-gray-200 is handled by item border
    },
    
    // Date Header
    dateHeader: {
        backgroundColor: '#F9FAFB', // bg-gray-50
        paddingHorizontal: 16, // px-4
        paddingVertical: 8, // py-2
        fontSize: 14, // text-sm
        fontWeight: 'bold',
        color: '#374151', // text-gray-700
        borderBottomWidth: 1,
        borderColor: '#E5E7EB', // border-gray-200
        borderTopWidth: 1, // Visual separator for groups
    },
    transactionsGroup: {
        // Container for transactions under a single date
    },
    
    // Transaction Item
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16, // p-4
        borderBottomWidth: 1,
        borderColor: '#F3F4F6', // border-gray-100
    },
    iconWrapper: {
        flexShrink: 0,
        width: 40, // w-10 h-10
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailsWrapper: {
        marginLeft: 16, // ml-4
        flexGrow: 1,
        minWidth: 0,
    },
    descriptionText: {
        fontWeight: '600', // font-semibold
        color: '#1F2937', // text-gray-800
        fontSize: 16,
    },
    subDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12, // gap-3
        marginTop: 4, // mt-1
    },
    timeText: {
        fontSize: 14, // text-sm
        color: '#6B7280', // text-gray-500
    },
    receiptButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4, // gap-1
    },
    receiptIcon: {
        color: '#3B82F6', // text-slate-500 -> text-blue-600
        fontSize: 14,
    },
    receiptText: {
        fontSize: 12, // text-xs
        color: '#3B82F6', // text-blue-600
        textDecorationLine: 'underline',
    },
    amountText: {
        marginLeft: 16, // ml-4
        fontWeight: '600', // font-semibold
        textAlign: 'right',
        fontSize: 16,
    },

    // Empty List/Error
    emptyListContainer: {
        padding: 24, // p-6
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyListText: {
        color: '#6B7280', // text-gray-500
        fontStyle: 'italic',
        fontSize: 16,
    },
    errorText: {
        color: '#EF4444', // error / text-red-500
        textAlign: 'center',
        paddingVertical: 16, // py-4
        fontSize: 16,
    },

    // Skeleton Loader Styles
    skeletonContainer: {
        // animate-pulse is hard to replicate purely with styles
    },
    skeletonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderColor: '#E5E7EB', // border-gray-100
    },
    skeletonCircle: {
        height: 40,
        width: 40,
        borderRadius: 20,
        backgroundColor: '#E2E8F0', // bg-slate-200
    },
    skeletonTextWrapper: {
        marginLeft: 16,
        flexGrow: 1,
    },
    skeletonTextMain: {
        height: 20, // h-5
        width: '75%', // w-3/4
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
    },
    skeletonTextSub: {
        height: 16, // h-4
        width: '25%', // w-1/4
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
        marginTop: 8, // mt-2
    },
    skeletonTextAmount: {
        height: 24, // h-6
        width: 112, // w-28
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
        marginLeft: 16,
    },
});