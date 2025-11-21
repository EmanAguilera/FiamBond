import { useState, useCallback, useContext, useEffect, memo } from 'react';
import { AppContext } from '../../Context/AppContext.jsx';
// Removed Firebase Imports

// --- CHART IMPORTS ---
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- FULL SKELETON LOADER COMPONENT (UNCHANGED) ---
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
    const { user } = useContext(AppContext);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
            // We pass the startDate as an ISO string query param
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
    }, [user, family.id, period, API_URL]);

    useEffect(() => {
        getReport();
    }, [getReport]);
    
    // --- Client-Side Pagination Logic (UNCHANGED) ---
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
            title: { display: true, text: `Family Inflow vs. Outflow for ${family.family_name}` },
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