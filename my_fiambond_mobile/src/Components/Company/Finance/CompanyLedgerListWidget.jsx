import React, { memo, useMemo } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    Linking, 
    Alert 
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

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

// --- STYLED SKELETON LOADER ---
const TransactionListSkeleton = () => (
    <View className="animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} className="flex-row items-center p-4 border-b border-slate-50">
                <View className="h-10 w-10 rounded-full bg-slate-200" />
                <View className="ml-4 flex-1">
                    <View className="h-4 w-3/4 bg-slate-200 rounded mb-2" />
                    <View className="h-3 w-1/4 bg-slate-200 rounded" />
                </View>
                <View className="h-5 w-20 bg-slate-200 rounded" />
            </View>
        ))}
    </View>
);

// --- HELPER: FORMAT DATE HEADERS ---
const formatDateHeader = (dateString) => { // Removed type annotation
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

// --- TRANSACTION ITEM ---
const TransactionItem = ({ transaction }) => { // Removed type annotation
    const isIncome = transaction.type === 'income';

    const handleOpenReceipt = async (url) => { // Removed type annotation
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            Alert.alert("Error", "Cannot open receipt URL");
        }
    };

    // Date Shim
    const dateObj = transaction.created_at?.toDate 
        ? transaction.created_at.toDate() 
        : new Date(transaction.created_at || Date.now());

    return (
        <View className="flex-row items-center p-4 border-b border-slate-50 bg-white">
            {/* Icon Circle */}
            <View className={`w-10 h-10 rounded-full items-center justify-center ${isIncome ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                {isIncome ? <IncomeIcon /> : <ExpenseIcon />}
            </View>

            {/* Description & Metadata */}
            <View className="ml-4 flex-1">
                <Text className="font-bold text-slate-800 text-sm" numberOfLines={1}>
                    {transaction.description}
                </Text>
                <View className="flex-row items-center mt-1">
                    <Text className="text-[10px] text-slate-400 mr-3">
                        {dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </Text>
                    {transaction.attachment_url && (
                        <TouchableOpacity 
                            onPress={() => handleOpenReceipt(transaction.attachment_url)}
                            className="flex-row items-center"
                        >
                            <ReceiptIcon />
                            <Text className="text-[10px] font-bold text-indigo-600 underline ml-1">Receipt</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Amount */}
            <View className="ml-2 items-end">
                <Text className={`font-bold text-sm ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isIncome ? '+' : '-'} ₱{parseFloat(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
            </View>
        </View>
    );
};

const CompanyLedgerListWidget = ({ transactions, loading }) => { // Removed type annotations
    
    // Group transactions logic
    const groupedTransactions = useMemo(() => {
        if (!transactions) return {};
        
        return transactions.reduce((acc, transaction) => { // Removed type annotation
            const dateObj = transaction.created_at?.toDate 
                ? transaction.created_at.toDate() 
                : new Date(transaction.created_at || Date.now());

            const dateKey = dateObj.toDateString();
            
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(transaction);
            return acc;
        }, {});
    }, [transactions]);

    if (loading) return <TransactionListSkeleton />;

    if (!transactions || transactions.length === 0) {
        return (
            <View className="p-20 items-center justify-center">
                <Text className="text-slate-400 italic text-sm text-center">
                    No financial activity recorded yet.
                </Text>
            </View>
        );
    }

    return (
        <View className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
            <ScrollView showsVerticalScrollIndicator={false} className="max-h-[500px]">
                {Object.keys(groupedTransactions)
                    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                    .map(dateKey => (
                        <View key={dateKey}>
                            {/* Date Header Section */}
                            <View className="bg-slate-50 px-5 py-2 border-y border-slate-100">
                                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {formatDateHeader(dateKey)}
                                </Text>
                            </View>
                            
                            <View>
                                {groupedTransactions[dateKey].map((transaction) => ( // Removed type annotation
                                    <TransactionItem 
                                        key={transaction.id || transaction._id} 
                                        transaction={transaction} 
                                    />
                                ))}
                            </View>
                        </View>
                    ))}
                
                {/* Footer Spacing */}
                <View className="h-10" />
            </ScrollView>
        </View>
    );
};

export default memo(CompanyLedgerListWidget);