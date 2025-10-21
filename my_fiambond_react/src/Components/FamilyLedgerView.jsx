import { useState, useCallback, useContext, useEffect, memo } from 'react';
import { AppContext } from '../Context/AppContext.jsx';
import { db } from '../config/firebase-config'; // Adjust path
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';

// --- CHART IMPORTS ---
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- FULL SKELETON LOADER COMPONENT ---
const FamilyLedgerSkeleton = () => (
    <div className="animate-pulse">
        <div className="h-8 w-40 bg-slate-200 rounded-md mb-6"></div>
        <div className="w-full mx-auto flex justify-center gap-4 mb-6">
            <div className="h-9 w-20 bg-slate-200 rounded"></div>
            <div className="h-9 w-20 bg-slate-200 rounded"></div>
            <div className="h-9 w-20 bg-slate-200 rounded"></div>
        </div>
        <div className="mb-8 h-[350px] w-full bg-slate-200 rounded-lg"></div>
        <div className="space-y-3 text-sm mb-8">
            <div className="h-5 w-1/2 bg-slate-200 rounded"></div>
            <hr className="border-dashed" />
            <div className="h-5 w-full bg-slate-200 rounded"></div>
            <div className="h-5 w-full bg-slate-200 rounded"></div>
            <div className="h-6 w-full bg-slate-200 rounded mt-1"></div>
        </div>
        <div className="h-7 w-1/3 bg-slate-200 rounded mb-4"></div>
        <div className="dashboard-card p-0">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="flex justify-between items-center p-4 border-b last:border-b-0 border-slate-100">
                    <div>
                        <div className="h-5 w-40 bg-slate-200 rounded"></div>
                        <div className="h-4 w-32 bg-slate-200 rounded mt-2"></div>
                    </div>
                    <div className="h-6 w-24 bg-slate-200 rounded"></div>
                </div>
            ))}
        </div>
    </div>
);

// --- Helper function to format data for the chart ---
const formatDataForChart = (transactions) => {
    if (!transactions || transactions.length === 0) {
        return { labels: [], datasets: [] };
    }

    const data = {}; // e.g., { '10/21/2025': { income: 100, expense: 50 } }

    transactions.forEach(tx => {
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

    const labels = Object.keys(data).sort((a,b) => new Date(a) - new Date(b));
    
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
    const { user } = useContext(AppContext); // Use user, not token

    // State is now split into raw data and processed data
    const [allTransactions, setAllTransactions] = useState([]);
    const [reportSummary, setReportSummary] = useState(null);
    const [chartData, setChartData] = useState(null);
    
    // State for pagination
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

            // 2. Build the Firestore Query
            const transactionsRef = collection(db, "transactions");
            const q = query(
                transactionsRef,
                where("family_id", "==", family.id),
                where("created_at", ">=", Timestamp.fromDate(startDate)),
                orderBy("created_at", "desc")
            );

            // 3. Fetch the data
            const querySnapshot = await getDocs(q);
            const fetchedTransactions = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
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
            setCurrentPage(1); // Reset to first page on new fetch

        } catch (err) {
            console.error('Failed to fetch family report:', err);
            // Check for a common error and provide a helpful message
            if (err.code === 'failed-precondition') {
                setError("Query requires an index. Please create a composite index for 'transactions' on 'family_id' and 'created_at'.");
            } else {
                setError("Could not process the report request.");
            }
        } finally {
            setLoading(false);
        }
    }, [user, family.id, period]);

    useEffect(() => {
        getReport();
    }, [getReport]); // getReport already depends on period
    
    // --- Client-Side Pagination Logic ---
    const pageCount = Math.ceil(allTransactions.length / TRANSACTIONS_PER_PAGE);
    const paginatedTransactions = allTransactions.slice(
        (currentPage - 1) * TRANSACTIONS_PER_PAGE,
        currentPage * TRANSACTIONS_PER_PAGE
    );

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: `Family Inflow vs. Outflow for ${family.family_name}` }, // Used family_name
        },
    };
    
    if (loading) {
        return <FamilyLedgerSkeleton />;
    }

    if (error) {
        return <p className="error text-center py-10">{error}</p>;
    }

    return (
        <div>
            <button onClick={onBack} className="secondary-btn-sm mb-6">&larr; Back to Families List</button>
            <div className="w-full mx-auto flex justify-center gap-4 mb-6">
                <button onClick={() => setPeriod('weekly')} className={period === 'weekly' ? 'active-period-btn' : 'period-btn'}>Weekly</button>
                <button onClick={() => setPeriod('monthly')} className={period === 'monthly' ? 'active-period-btn' : 'period-btn'}>Monthly</button>
                <button onClick={() => setPeriod('yearly')} className={period === 'yearly' ? 'active-period-btn' : 'period-btn'}>Yearly</button>
            </div>
            
            {reportSummary && chartData ? (
                <>
                    <div className="mb-8 relative" style={{ height: '350px' }}>
                        {chartData.datasets?.length > 0 && chartData.labels?.length > 0 ? (
                            <Bar options={chartOptions} data={chartData} />
                        ) : (
                            <div className="flex items-center justify-center h-full"><p>Not enough data for a chart in this period.</p></div>
                        )}
                    </div>
                    <div className="space-y-3 text-sm mb-8">
                        <p><span className="font-bold">Summary for:</span> {reportSummary.reportTitle}</p>
                        <hr className="border-dashed" />
                        <p className="flex justify-between"><span>Total Inflow:</span> <span className="text-green-600 font-semibold">+₱{reportSummary.totalInflow.toFixed(2)}</span></p>
                        <p className="flex justify-between"><span>Total Outflow:</span> <span className="text-red-500 font-semibold">-₱{reportSummary.totalOutflow.toFixed(2)}</span></p>
                        <p className={`flex justify-between font-bold text-base ${reportSummary.netPosition >= 0 ? 'text-green-700' : 'text-red-700'}`}><span>Net Position:</span> <span>₱{reportSummary.netPosition.toFixed(2)}</span></p>
                    </div>
                    <h3 className="font-bold text-lg mb-4">Transactions for this Period</h3>
                    <div className="dashboard-card p-0">
                        {paginatedTransactions.length > 0 ? paginatedTransactions.map((transaction) => (
                            <div key={transaction.id} className="transaction-item border-b last:border-b-0 border-gray-100">
                                <div className="min-w-0 pr-4">
                                    <p className="transaction-description break-words">{transaction.description}</p>
                                    <small className="transaction-date">
                                    {transaction.created_at.toDate().toLocaleDateString()}
                                    {/* Note: Displaying "By: Full Name" requires an additional query to the 'users' collection using the 'user_id' from the transaction. This is a good candidate for optimization with Cloud Functions or client-side data caching. */}
                                    </small>
                                </div>
                                <p className={`transaction-amount flex-shrink-0 ${transaction.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                                    {transaction.type === 'income' ? '+' : '-'} ₱{parseFloat(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        )) : <p className="p-4 text-center italic">No transactions in this period.</p>}
                    </div>
                    {pageCount > 1 && (
                        <div className="flex justify-between items-center mt-6">
                            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="pagination-btn">&larr; Previous</button>
                            <span className="pagination-text">Page {currentPage} of {pageCount}</span>
                            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === pageCount} className="pagination-btn">Next &rarr;</button>
                        </div>
                    )}
                </>
            ) : <p className="text-center py-10">No report data available.</p>}
        </div>
    );
};

export default memo(FamilyLedgerView);