import React, { useState, useCallback, useContext, useEffect, memo } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator, 
    Dimensions 
} from 'react-native';
import { BarChart } from "react-native-gifted-charts";
import { AppContext } from '../../../Context/AppContext.jsx';

const { width } = Dimensions.get('window');

// --- FULL SKELETON LOADER COMPONENT ---
const FamilyLedgerSkeleton = () => (
    <View className="animate-pulse p-4">
        <View className="h-8 w-40 bg-slate-200 rounded-md mb-6" />
        <View className="flex-row justify-center gap-4 mb-6">
            <View className="h-10 w-20 bg-slate-200 rounded-xl" />
            <View className="h-10 w-20 bg-slate-200 rounded-xl" />
            <View className="h-10 w-20 bg-slate-200 rounded-xl" />
        </View>
        <View className="mb-8 h-[300px] w-full bg-slate-100 rounded-3xl" />
        <View className="space-y-3 mb-8">
            <View className="h-5 w-1/2 bg-slate-200 rounded" />
            <View className="h-[1px] bg-slate-100 w-full my-2" />
            <View className="h-5 w-full bg-slate-200 rounded" />
            <View className="h-5 w-full bg-slate-200 rounded" />
        </View>
        <View className="h-7 w-1/3 bg-slate-200 rounded mb-4" />
        <View className="bg-white rounded-3xl border border-slate-100">
            {[1, 2, 3, 4].map((i) => (
                <View key={i} className="p-4 border-b border-slate-50 flex-row justify-between items-center">
                    <View>
                        <View className="h-4 w-32 bg-slate-200 rounded mb-2" />
                        <View className="h-3 w-20 bg-slate-100 rounded" />
                    </View>
                    <View className="h-5 w-16 bg-slate-200 rounded" />
                </View>
            ))}
        </View>
    </View>
);

// --- Helper function to format data for Gifted Charts ---
const formatDataForChart = (transactions) => {
    if (!transactions || transactions.length === 0) return [];

    const data = {}; 
    transactions.forEach(tx => {
        const date = tx.created_at.toDate().toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
        if (!data[date]) data[date] = { income: 0, expense: 0 };
        if (tx.type === 'income') data[date].income += tx.amount;
        else data[date].expense += tx.amount;
    });

    const sortedLabels = Object.keys(data).sort((a,b) => new Date(a) - new Date(b));
    const barData = [];

    sortedLabels.forEach(label => {
        // Inflow Bar
        barData.push({
            value: data[label].income,
            label: label,
            spacing: 2,
            labelWidth: 30,
            labelTextStyle: { color: '#94a3b8', fontSize: 10 },
            frontColor: '#10b981', // emerald-500
        });
        // Outflow Bar
        barData.push({
            value: data[label].expense,
            frontColor: '#f43f5e', // rose-500
        });
    });
    
    return barData;
};


function FamilyLedgerView({ family, onBack }) {
    const { user } = useContext(AppContext);
    const API_URL = 'http://192.168.1.4:3000'; // Replace with mobile-accessible IP

    const [allTransactions, setAllTransactions] = useState([]);
    const [reportSummary, setReportSummary] = useState(null);
    const [barData, setBarData] = useState([]);
    
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
            const now = new Date();
            let startDate;
            if (period === 'weekly') startDate = new Date(now.setDate(now.getDate() - 7));
            else if (period === 'yearly') startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            else startDate = new Date(now.setMonth(now.getMonth() - 1));

            const response = await fetch(`${API_URL}/transactions?family_id=${family.id}&startDate=${startDate.toISOString()}`);
            
            if (!response.ok) throw new Error('Failed to fetch family report data.');

            const fetchedData = await response.json();

            // Transform Data (Shim for compatibility)
            const fetchedTransactions = fetchedData.map(doc => ({
                id: doc._id,
                ...doc,
                created_at: { toDate: () => new Date(doc.created_at) }
            }));

            setAllTransactions(fetchedTransactions);

            let totalInflow = 0, totalOutflow = 0;
            fetchedTransactions.forEach(tx => {
                tx.type === 'income' ? totalInflow += tx.amount : totalOutflow += tx.amount;
            });

            setReportSummary({
                totalInflow,
                totalOutflow,
                netPosition: totalInflow - totalOutflow,
                reportTitle: `Since ${startDate.toLocaleDateString()}`
            });
            
            setBarData(formatDataForChart(fetchedTransactions));
            setCurrentPage(1);

        } catch (err) {
            setError("Could not load the ledger. Check your connection.");
        } finally {
            setLoading(false);
        }
    }, [user, family.id, period]);

    useEffect(() => { getReport(); }, [getReport]);
    
    // Pagination
    const pageCount = Math.ceil(allTransactions.length / TRANSACTIONS_PER_PAGE);
    const paginatedTransactions = allTransactions.slice(
        (currentPage - 1) * TRANSACTIONS_PER_PAGE,
        currentPage * TRANSACTIONS_PER_PAGE
    );
    
    if (loading) return <FamilyLedgerSkeleton />;
    if (error) return (
        <View className="p-10 items-center justify-center">
            <Text className="text-rose-500 font-bold text-center">{error}</Text>
        </View>
    );

    return (
        <ScrollView className="flex-1 bg-white p-4" showsVerticalScrollIndicator={false}>
            {/* Back Button */}
            <TouchableOpacity onPress={onBack} className="bg-slate-100 self-start px-4 py-2 rounded-xl mb-6">
                <Text className="text-slate-600 font-bold text-xs">← Back to List</Text>
            </TouchableOpacity>

            {/* Period Selector */}
            <View className="flex-row justify-center bg-slate-50 p-1 rounded-2xl mb-8">
                {['weekly', 'monthly', 'yearly'].map(p => (
                    <TouchableOpacity 
                        key={p} 
                        onPress={() => setPeriod(p)} 
                        className={`flex-1 py-2.5 items-center rounded-xl ${period === p ? 'bg-indigo-600' : ''}`}
                    >
                        <Text className={`capitalize font-bold text-xs ${period === p ? 'text-white' : 'text-slate-400'}`}>{p}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            
            {reportSummary && (
                <>
                    {/* Chart Container */}
                    <View className="mb-8 items-center bg-slate-50 p-4 rounded-[32px] border border-slate-100">
                        <Text className="text-slate-800 font-bold mb-6 text-sm">Shared Ledger Activity</Text>
                        {barData.length > 0 ? (
                            <BarChart
                                data={barData}
                                barWidth={16}
                                initialSpacing={10}
                                spacing={14}
                                hideRules
                                noOfSections={4}
                                yAxisThickness={0}
                                xAxisThickness={0}
                                yAxisTextStyle={{ color: '#94a3b8', fontSize: 10 }}
                                isAnimated
                            />
                        ) : (
                            <View className="h-40 items-center justify-center">
                                <Text className="text-slate-400 italic text-xs">No chart data for this period.</Text>
                            </View>
                        )}
                    </View>

                    {/* Summary Cards */}
                    <View className="space-y-3 mb-10 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Period Summary</Text>
                        <View className="flex-row justify-between items-center">
                            <Text className="text-slate-600 text-sm">Total Inflow</Text>
                            <Text className="text-emerald-600 font-bold text-base">+₱{reportSummary.totalInflow.toLocaleString()}</Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                            <Text className="text-slate-600 text-sm">Total Outflow</Text>
                            <Text className="text-rose-600 font-bold text-base">-₱{reportSummary.totalOutflow.toLocaleString()}</Text>
                        </View>
                        <View className="h-[1px] bg-slate-50 my-1" />
                        <View className="flex-row justify-between items-center">
                            <Text className="text-slate-800 font-bold text-base">Net Position</Text>
                            <Text className={`font-black text-lg ${reportSummary.netPosition >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                ₱{reportSummary.netPosition.toLocaleString()}
                            </Text>
                        </View>
                    </View>

                    {/* Transaction List */}
                    <Text className="font-bold text-slate-800 text-lg mb-4">Transactions for this Period</Text>
                    <View className="bg-white border border-slate-100 rounded-3xl overflow-hidden mb-10">
                        {paginatedTransactions.length > 0 ? paginatedTransactions.map((tx) => (
                            <View key={tx.id} className="p-5 border-b border-slate-50 flex-row justify-between items-center">
                                <View className="flex-1 mr-4">
                                    <Text className="text-slate-800 font-bold text-sm" numberOfLines={1}>{tx.description}</Text>
                                    <Text className="text-slate-400 text-[10px] mt-1">{tx.created_at.toDate().toLocaleDateString()}</Text>
                                </View>
                                <Text className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                    {tx.type === 'income' ? '+' : '-'} ₱{parseFloat(tx.amount).toLocaleString()}
                                </Text>
                            </View>
                        )) : (
                            <View className="p-10 items-center">
                                <Text className="text-slate-400 italic">No transactions found.</Text>
                            </View>
                        )}
                    </View>

                    {/* Pagination */}
                    {pageCount > 1 && (
                        <View className="flex-row justify-between items-center mb-20 px-2">
                            <TouchableOpacity 
                                onPress={() => setCurrentPage(p => p - 1)} 
                                disabled={currentPage === 1}
                                className={`px-4 py-2 rounded-xl bg-white border border-slate-200 ${currentPage === 1 ? 'opacity-30' : ''}`}
                            >
                                <Text className="text-slate-600 font-bold text-xs">← Prev</Text>
                            </TouchableOpacity>
                            <Text className="text-slate-400 text-xs font-bold uppercase tracking-tighter">Page {currentPage} / {pageCount}</Text>
                            <TouchableOpacity 
                                onPress={() => setCurrentPage(p => p + 1)} 
                                disabled={currentPage === pageCount}
                                className={`px-4 py-2 rounded-xl bg-white border border-slate-200 ${currentPage === pageCount ? 'opacity-30' : ''}`}
                            >
                                <Text className="text-slate-600 font-bold text-xs">Next →</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </>
            )}
        </ScrollView>
    );
};

export default memo(FamilyLedgerView);