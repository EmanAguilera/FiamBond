import React, { useState, useCallback, useContext, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator,
    Platform 
} from 'react-native';
import { AppContext } from '../../../Context/AppContext.jsx';

// --- RN SKELETON LOADER COMPONENT ---
const FamilyLedgerSkeleton = () => (
    <View style={styles.skeletonContainer}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonPeriodButtons}>
            <View style={styles.skeletonPeriodBtn} />
            <View style={styles.skeletonPeriodBtn} />
            <View style={styles.skeletonPeriodBtn} />
        </View>
        <View style={styles.skeletonChart} />
        <View style={styles.skeletonSummary}>
            <View style={styles.skeletonSummaryTitle} />
            <View style={styles.skeletonDivider} />
            <View style={styles.skeletonSummaryRow} />
            <View style={styles.skeletonSummaryRow} />
            <View style={styles.skeletonSummaryRowLarge} />
        </View>
        <View style={styles.skeletonTransactionsHeader} />
        <View style={styles.skeletonListWrapper}>
            {[...Array(4)].map((_, i) => (
                <View key={i} style={styles.skeletonTransactionItem}>
                    <View>
                        <View style={styles.skeletonTransactionDesc} />
                        <View style={styles.skeletonTransactionDate} />
                    </View>
                    <View style={styles.skeletonTransactionAmount} />
                </View>
            ))}
        </View>
    </View>
);

// --- Helper function to format data for the chart (UNCHANGED) ---
const formatDataForChart = (transactions) => {
    if (!transactions || transactions.length === 0) {
        return { labels: [], datasets: [] };
    }

    const data = {}; 

    transactions.forEach(tx => {
        // Shim ensures tx.created_at.toDate() exists
        const date = tx.created_at.toDate().toLocaleDateString();
        if (!data[date]) {
            data[date] = { income: 0, expense: 0 };
        }
        if (tx.type === 'income') {
            data[date].income += tx.amount;
        } else {
            data[date].expense += tx.amount;
        }
    });

    const labels = Object.keys(data).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());
    
    return {
        labels,
        datasets: [
            {
                label: 'Inflow (₱)',
                data: labels.map(label => data[label].income),
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
            },
            {
                label: 'Outflow (₱)',
                data: labels.map(label => data[label].expense),
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
        ],
    };
};


function FamilyLedgerView({ family, onBack }) {
    const { user } = useContext(AppContext);
    const API_URL = 'http://localhost:3000/api'; // Simplified URL

    const [allTransactions, setAllTransactions] = useState([]);
    const [reportSummary, setReportSummary] = useState(null);
    const [chartData, setChartData] = useState(null);
    
    const [currentPage, setCurrentPage] = useState(1);
    const TRANSACTIONS_PER_PAGE = 10;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('monthly');

    const getReport = useCallback(async () => {
        if (!user || !family.id) return;
        setLoading(true);
        setError(null);

        try {
            // 1. Calculate start date based on period
            const now = new Date();
            let startDate;
            if (period === 'weekly') {
                startDate = new Date(now.setDate(now.getDate() - 7));
            } else if (period === 'yearly') {
                startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            } else { // monthly is default
                startDate = new Date(now.setMonth(now.getMonth() - 1));
            }

            // 2. Fetch from Node.js Backend
            const queryParams = new URLSearchParams({
                family_id: family.id,
                startDate: startDate.toISOString()
            });

            const response = await fetch(`${API_URL}/transactions?${queryParams}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch family report data.');
            }

            const fetchedData = await response.json();

            // 3. Transform Data (Shim for UI compatibility)
            const fetchedTransactions = fetchedData.map(doc => ({
                id: doc._id,
                ...doc,
                // Create a fake Firebase Timestamp object for compatibility with existing UI code
                created_at: { 
                    toDate: () => new Date(doc.created_at) 
                }
            }));

            setAllTransactions(fetchedTransactions);

            // 4. Process the data on the client
            let totalInflow = 0;
            let totalOutflow = 0;
            fetchedTransactions.forEach(tx => {
                if (tx.type === 'income') totalInflow += tx.amount;
                else totalOutflow += tx.amount;
            });

            setReportSummary({
                totalInflow,
                totalOutflow,
                netPosition: totalInflow - totalOutflow,
                reportTitle: `Report from ${startDate.toLocaleDateString()}`
            });
            
            setChartData(formatDataForChart(fetchedTransactions));
            setCurrentPage(1);

        } catch (err) {
            console.error('Failed to fetch family report:', err);
            setError("Could not process the report request. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, [user, family.id, period]); // Removed API_URL dependency

    useEffect(() => {
        getReport();
    }, [getReport]);
    
    // --- Client-Side Pagination Logic ---
    const pageCount = Math.ceil(allTransactions.length / TRANSACTIONS_PER_PAGE);
    const paginatedTransactions = allTransactions.slice(
        (currentPage - 1) * TRANSACTIONS_PER_PAGE,
        currentPage * TRANSACTIONS_PER_PAGE
    );

    
    if (loading) {
        return <FamilyLedgerSkeleton />;
    }

    if (error) {
        return <Text style={styles.errorText}>{error}</Text>;
    }

    return (
        <ScrollView style={styles.mainContainer}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Text style={styles.backButtonText}>&larr; Back to Families List</Text>
            </TouchableOpacity>
            
            <View style={styles.periodButtonsWrapper}>
                <TouchableOpacity onPress={() => setPeriod('weekly')} style={[styles.periodButton, period === 'weekly' && styles.periodButtonActive]}>
                    <Text style={[styles.periodButtonText, period === 'weekly' && styles.periodButtonTextActive]}>Weekly</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPeriod('monthly')} style={[styles.periodButton, period === 'monthly' && styles.periodButtonActive]}>
                    <Text style={[styles.periodButtonText, period === 'monthly' && styles.periodButtonTextActive]}>Monthly</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPeriod('yearly')} style={[styles.periodButton, period === 'yearly' && styles.periodButtonActive]}>
                    <Text style={[styles.periodButtonText, period === 'yearly' && styles.periodButtonTextActive]}>Yearly</Text>
                </TouchableOpacity>
            </View>
            
            {reportSummary && chartData ? (
                <>
                    <View style={styles.chartArea}>
                        {chartData.datasets?.length > 0 && chartData.labels?.length > 0 ? (
                            <View style={styles.chartPlaceholder}>
                                <Text style={styles.chartPlaceholderText}>Chart: Inflow vs. Outflow for {family.family_name}</Text>
                                {/* In a real app: Bar Chart Component goes here */}
                            </View>
                        ) : (
                            <View style={styles.chartNoData}>
                                <Text style={styles.chartNoDataText}>Not enough data for a chart in this period.</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.summarySection}>
                        <Text style={styles.summaryTitle}><Text style={styles.fontBold}>Summary for:</Text> {reportSummary.reportTitle}</Text>
                        <View style={styles.divider} />
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Total Inflow:</Text> 
                            <Text style={styles.summaryInflow}>+₱{reportSummary.totalInflow.toFixed(2)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Total Outflow:</Text> 
                            <Text style={styles.summaryOutflow}>-₱{reportSummary.totalOutflow.toFixed(2)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryNet, reportSummary.netPosition >= 0 ? styles.textGreen700 : styles.textRed700]}>Net Position:</Text>
                            <Text style={[styles.summaryNet, reportSummary.netPosition >= 0 ? styles.textGreen700 : styles.textRed700]}>₱{reportSummary.netPosition.toFixed(2)}</Text>
                        </View>
                    </View>
                    <Text style={styles.transactionsHeader}>Transactions for this Period</Text>
                    <View style={styles.listContainer}>
                        {paginatedTransactions.length > 0 ? paginatedTransactions.map((transaction) => (
                            <View key={transaction.id} style={styles.transactionItem}>
                                <View style={styles.transactionDetails}>
                                    <Text style={styles.transactionDescription}>{transaction.description}</Text>
                                    <Text style={styles.transactionDate}>
                                    {transaction.created_at.toDate().toLocaleDateString()}
                                    </Text>
                                </View>
                                <Text style={[styles.transactionAmount, transaction.type === 'income' ? styles.textGreen600 : styles.textRed500]}>
                                    {transaction.type === 'income' ? '+' : '-'} ₱{parseFloat(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Text>
                            </View>
                        )) : <Text style={styles.emptyListTextItem}>No transactions in this period.</Text>}
                    </View>
                    {pageCount > 1 && (
                        <View style={styles.paginationControls}>
                            <TouchableOpacity onPress={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} style={styles.paginationButton}>
                                <Text style={styles.paginationText}>&larr; Previous</Text>
                            </TouchableOpacity>
                            <Text style={styles.paginationPageInfo}>Page {currentPage} of {pageCount}</Text>
                            <TouchableOpacity onPress={() => setCurrentPage(p => p + 1)} disabled={currentPage === pageCount} style={styles.paginationButton}>
                                <Text style={styles.paginationText}>Next &rarr;</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </>
            ) : <Text style={styles.chartNoData}>No report data available.</Text>}
        </ScrollView>
    );
};

export default FamilyLedgerView;

// --- REACT NATIVE STYLESHEET ---
const styles = StyleSheet.create({
    // Utility Styles
    fontBold: { fontWeight: 'bold' },
    textGreen700: { color: '#047857' }, // text-green-700
    textRed700: { color: '#B91C1C' },   // text-red-700
    textGreen600: { color: '#059669' }, // text-green-600
    textRed500: { color: '#EF4444' },   // text-red-500
    
    mainContainer: {
        flex: 1,
        padding: 16,
    },
    errorText: {
        color: '#EF4444', 
        textAlign: 'center', 
        paddingVertical: 40, 
        backgroundColor: '#FFF1F2', 
        borderRadius: 8, 
        borderWidth: 1, 
        borderColor: '#FECACA',
    },
    
    // Back Button
    backButton: {
        marginBottom: 24, // mb-6
        alignSelf: 'flex-start',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: 'white',
    },
    backButtonText: {
        color: '#334155',
        fontWeight: '500',
        fontSize: 14,
    },

    // Period Buttons
    periodButtonsWrapper: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16, // gap-4
        marginBottom: 24, // mb-6
    },
    periodButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    periodButtonActive: {
        backgroundColor: 'white',
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    periodButtonText: {
        color: '#475569',
        fontWeight: '500',
    },
    periodButtonTextActive: {
        color: '#1F2937',
        fontWeight: 'bold',
    },

    // Chart Area
    chartArea: {
        marginBottom: 32, // mb-8
    },
    chartPlaceholder: {
        height: 350, // h-[350px]
        width: '100%',
        backgroundColor: '#F1F5F9', // bg-slate-100
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chartPlaceholderText: {
        color: '#475569',
        fontSize: 16,
    },
    chartNoData: {
        height: 350,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chartNoDataText: {
        color: '#6B7280',
        fontSize: 16,
    },

    // Summary Section
    summarySection: {
        marginBottom: 32, // mb-8
        paddingHorizontal: 4, // slight padding for aesthetic
    },
    summaryTitle: {
        fontSize: 14, // text-sm
        color: '#6B7280',
        marginBottom: 8,
    },
    divider: {
        borderBottomWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#E5E7EB', // border-dashed
        marginVertical: 8,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    summaryInflow: {
        fontSize: 14,
        fontWeight: '600', // font-semibold
        color: '#059669', // text-green-600
    },
    summaryOutflow: {
        fontSize: 14,
        fontWeight: '600', // font-semibold
        color: '#EF4444', // text-red-500
    },
    summaryNet: {
        fontWeight: 'bold',
        fontSize: 16, // text-base
    },

    // Transactions List
    transactionsHeader: {
        fontWeight: 'bold',
        fontSize: 18, // text-lg
        marginBottom: 16, // mb-4
    },
    listContainer: {
        // dashboard-card p-0
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
    },
    transactionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16, // p-4
        borderBottomWidth: 1,
        borderColor: '#F3F4F6', // border-gray-100
    },
    transactionDetails: {
        flexShrink: 1,
        paddingRight: 16, // pr-4
    },
    transactionDescription: {
        fontSize: 16,
        color: '#1F2937',
        // break-words is handled by default wrapping in RN
    },
    transactionDate: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '600', // font-semibold
        flexShrink: 0,
        marginLeft: 16,
    },
    emptyListTextItem: {
        padding: 16,
        textAlign: 'center',
        fontStyle: 'italic',
        color: '#6B7280',
    },

    // Pagination
    paginationControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24, // mt-6
    },
    paginationButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: 'white',
    },
    paginationText: {
        color: '#475569',
        fontWeight: '500',
    },
    paginationPageInfo: {
        color: '#475569',
        fontSize: 14,
    },

    // Skeleton Styles
    skeletonContainer: { padding: 16, },
    skeletonTitle: { height: 32, width: 160, backgroundColor: '#E2E8F0', borderRadius: 6, marginBottom: 24 },
    skeletonPeriodButtons: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 24 },
    skeletonPeriodBtn: { height: 36, width: 80, backgroundColor: '#E2E8F0', borderRadius: 4 },
    skeletonChart: { height: 350, width: '100%', backgroundColor: '#E2E8F0', borderRadius: 8, marginBottom: 32 },
    skeletonSummary: { marginBottom: 32, gap: 12 },
    skeletonSummaryTitle: { height: 20, width: '50%', backgroundColor: '#E2E8F0', borderRadius: 4 },
    skeletonDivider: { borderBottomWidth: 1, borderStyle: 'dashed', borderColor: '#E5E7EB', marginVertical: 8 },
    skeletonSummaryRow: { height: 20, width: '100%', backgroundColor: '#E2E8F0', borderRadius: 4 },
    skeletonSummaryRowLarge: { height: 24, width: '100%', backgroundColor: '#E2E8F0', borderRadius: 4, marginTop: 4 },
    skeletonTransactionsHeader: { height: 28, width: '33%', backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 16 },
    skeletonListWrapper: { backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
    skeletonTransactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#F3F4F6' },
    skeletonTransactionDesc: { height: 20, width: 160, backgroundColor: '#E2E8F0', borderRadius: 4 },
    skeletonTransactionDate: { height: 16, width: 128, backgroundColor: '#E2E8F0', borderRadius: 4, marginTop: 8 },
    skeletonTransactionAmount: { height: 24, width: 96, backgroundColor: '#E2E8F0', borderRadius: 4 },
});