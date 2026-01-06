import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';

// --- ICON PLACEHOLDER (Replicated from Personal/Family Widgets) ---
const Icon = ({ name, isIncome, style }) => {
    let iconText = '';
    switch (name) {
        case 'Plus': iconText = isIncome ? '▲' : '▼'; break;
        case 'Receipt': iconText = '📄'; break;
        default: iconText = '?';
    }
    const color = isIncome ? styles.iconGreen : styles.iconRed;
    return <Text style={[styles.iconBase, color, style]}>{iconText}</Text>;
};

// --- STYLED SKELETON LOADER ---
const TransactionListSkeleton = () => (
    <View style={styles.skeletonContainer}>
        <ActivityIndicator size="large" color="#94A3B8" style={{marginBottom: 16}} />
        {[...Array(6)].map((_, i) => (
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

    // Ensure we have a valid Date object
    const dateObj = transaction.created_at?.toDate 
        ? transaction.created_at.toDate() 
        : new Date(transaction.created_at || Date.now());

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
            {/* Icon Circle */}
            <View style={[styles.iconWrapper, backgroundStyle]}>
                <Icon name={'Plus'} isIncome={isIncome} style={transactionTypeStyle} />
            </View>

            {/* Description & Metadata */}
            <View style={styles.detailsWrapper}>
                <Text style={styles.descriptionText} numberOfLines={1}>{transaction.description}</Text>
                <View style={styles.subDetails}>
                    <Text style={styles.timeText}>
                        {dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </Text>
                    {transaction.attachment_url && (
                        <TouchableOpacity onPress={handleReceiptPress} style={styles.receiptButton}>
                            <Icon name="Receipt" style={styles.receiptIcon} />
                            <Text style={styles.receiptText}>Receipt</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Amount */}
            <Text style={[styles.amountText, transactionTypeStyle]}>
                {isIncome ? '+' : '-'} ₱{parseFloat(transaction.amount.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
        </TouchableOpacity>
    );
};

const CompanyLedgerListWidget = ({ transactions, loading }) => {
    
    // Group transactions by Date
    const groupedTransactions = useMemo(() => {
        if (!transactions) return {};
        
        return transactions.reduce((acc, transaction) => {
            const dateObj = transaction.created_at?.toDate 
                ? transaction.created_at.toDate() 
                : new Date(transaction.created_at || Date.now());

            const dateKey = dateObj.toDateString();
            
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(transaction);
            return acc;
        }, {});
    }, [transactions]);

    // Loading State
    if (loading) return <TransactionListSkeleton />;

    // Empty State
    if (!transactions || transactions.length === 0) {
        return <View style={styles.emptyListContainer}><Text style={styles.emptyListText}>No financial activity recorded.</Text></View>;
    }

    return (
        <View style={styles.widgetContainer}>
            <ScrollView style={styles.listScrollView} contentContainerStyle={styles.listContent}>
                {Object.keys(groupedTransactions)
                    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                    .map(dateKey => (
                        <View key={dateKey}>
                            {/* Sticky Date Header */}
                            <View style={styles.dateHeader}>
                                <Text style={styles.dateHeaderText}>
                                    {formatDateHeader(dateKey)}
                                </Text>
                            </View>
                            <View>
                                {groupedTransactions[dateKey].map(transaction => (
                                    <TransactionItem key={transaction.id || transaction._id} transaction={transaction} />
                                ))}
                            </View>
                        </View>
                    ))}
            </ScrollView>
        </View>
    );
};

export default CompanyLedgerListWidget;


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

    // --- Widget Container ---
    widgetContainer: {
        flex: 1,
        maxHeight: 400, // Reasonable max height for a list
        backgroundColor: 'white',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#E5E7EB', // border-gray-200
        overflow: 'hidden',
    },
    listScrollView: {
        // divide-y divide-gray-200 is handled by item border
    },
    listContent: {
        // Ensures content fills the area
    },
    
    // --- Date Header ---
    dateHeader: {
        backgroundColor: '#F9FAFB', // bg-gray-50
        paddingHorizontal: 16, // px-4
        paddingVertical: 8, // py-2
        borderBottomWidth: 1,
        borderColor: '#E5E7EB', // border-gray-200
        // sticky top-0 z-10 simulation in RN ScrollView
    },
    dateHeaderText: {
        fontSize: 14, // text-sm
        fontWeight: 'bold',
        color: '#374151', // text-gray-700
    },
    
    // --- Transaction Item ---
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
        color: '#3B82F6', // text-blue-600
        fontSize: 14,
    },
    receiptText: {
        fontSize: 12, // text-xs
        color: '#3B82F6', // text-blue-600
        textDecorationLine: 'underline',
        fontWeight: '600',
    },
    amountText: {
        marginLeft: 16, // ml-4
        fontWeight: '600', // font-semibold
        textAlign: 'right',
        fontSize: 16,
    },

    // --- Empty List ---
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

    // --- Skeleton Loader Styles ---
    skeletonContainer: { 
        padding: 16, 
        backgroundColor: 'white',
        borderRadius: 8,
    },
    skeletonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderColor: '#F3F4F6', // border-gray-100
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