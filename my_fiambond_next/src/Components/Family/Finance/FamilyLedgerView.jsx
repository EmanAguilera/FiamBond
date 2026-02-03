'use client'; // Required due to the use of useState, useEffect, useCallback, useContext, and ChartJS/react-chartjs-2

import { useState, useCallback, useContext, useEffect, memo } from 'react';
import { AppContext } from '../../../Context/AppContext.jsx';
import { API_BASE_URL } from '@/src/config/apiConfig';

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

    const data = {}; 

    transactions.forEach(tx => {
        // Use the shimmed created_at date
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

    const labels = Object.keys(data).sort((a, b) => new Date(a) - new Date(b));
    
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
            const now = new Date();
            const startDate = new Date();
            const endDate = new Date();
            
            if (period === 'weekly') {
                startDate.setDate(endDate.getDate() - 7);
            } else if (period === 'yearly') {
                startDate.setFullYear(endDate.getFullYear() - 1);
            } else { // monthly is default
                startDate.setMonth(endDate.getMonth() - 1);
            }

            // Fetch from centralized API
            const queryParams = new URLSearchParams({
                family_id: family.id,
                startDate: startDate.toISOString()
            });

            const response = await fetch(`${API_BASE_URL}/transactions?${queryParams}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch family report data.');
            }

            const fetchedData = await response.json();

            // Transform Data (Shim for UI compatibility)
            const fetchedTransactions = fetchedData.map(doc => ({
                id: doc._id || doc.id,
                ...doc,
                created_at: { 
                    toDate: () => new Date(doc.created_at) 
                }
            }));

            setAllTransactions(fetchedTransactions);

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
                reportTitle: `Report from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`
            });
            
            setChartData(formatDataForChart(fetchedTransactions));
            setCurrentPage(1);

        } catch (err) {
            console.error('Failed to fetch family report:', err);
            setError("Could not process the report request. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, [user, family.id, period]);

    useEffect(() => {
        getReport();
    }, [getReport]);
    
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
    
    if (loading) return <FamilyLedgerSkeleton />;
    if (error) return <p className="error text-center py-10 font-bold text-rose-600">{error}</p>;

    return (
        <div>
            <button onClick={onBack} className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition mb-6">&larr; Back to Families List</button>
            
            <div className="w-full mx-auto flex justify-center gap-4 mb-6">
                {['weekly', 'monthly', 'yearly'].map(p => (
                    <button 
                        key={p} 
                        onClick={() => setPeriod(p)} 
                        className={`px-4 py-1.5 text-sm rounded-lg capitalize transition font-bold ${period === p ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 hover:text-slate-700 border border-slate-200'}`}
                    >
                        {p}
                    </button>
                ))}
            </div>
            
            {reportSummary && chartData ? (
                <>
                    <div className="mb-8 relative" style={{ height: '350px' }}>
                        {chartData.datasets?.length > 0 && chartData.labels?.length > 0 ? (
                            <Bar options={chartOptions} data={chartData} />
                        ) : (
                            <div className="flex items-center justify-center h-full bg-slate-50 rounded-lg"><p className='text-slate-500'>Not enough data for a chart in this period.</p></div>
                        )}
                    </div>
                    <div className="space-y-3 text-sm mb-8">
                        <p><span className="font-bold text-slate-700">Summary for:</span> {reportSummary.reportTitle}</p>
                        <hr className="border-dashed" />
                        <p className="flex justify-between"><span>Total Inflow:</span> <span className="text-green-600 font-semibold">+₱{reportSummary.totalInflow.toFixed(2)}</span></p>
                        <p className="flex justify-between"><span>Total Outflow:</span> <span className="text-red-500 font-semibold">-₱{reportSummary.totalOutflow.toFixed(2)}</span></p>
                        <p className={`flex justify-between font-bold text-base ${reportSummary.netPosition >= 0 ? 'text-green-700' : 'text-red-700'}`}><span>Net Position:</span> <span>₱{reportSummary.netPosition.toFixed(2)}</span></p>
                    </div>
                    <h3 className="font-bold text-lg mb-4 text-slate-800">Transactions for this Period</h3>
                    <div className="dashboard-card p-0 border border-slate-200 rounded-lg overflow-hidden">
                        {paginatedTransactions.length > 0 ? paginatedTransactions.map((transaction) => (
                            <div key={transaction.id} className="flex justify-between items-center p-4 border-b last:border-b-0 border-gray-100 hover:bg-gray-50 transition">
                                <div className="min-w-0 pr-4">
                                    <p className="font-semibold text-slate-700 break-words">{transaction.description}</p>
                                    <small className="text-slate-500 text-xs">
                                        {transaction.created_at.toDate().toLocaleDateString()}
                                    </small>
                                </div>
                                <p className={`flex-shrink-0 font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                                    {transaction.type === 'income' ? '+' : '-'} ₱{parseFloat(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        )) : <p className="p-4 text-center italic text-slate-500">No transactions in this period.</p>}
                    </div>
                    {pageCount > 1 && (
                        <div className="flex justify-between items-center mt-6">
                            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="px-4 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50">&larr; Previous</button>
                            <span className="text-sm text-slate-600">Page {currentPage} of {pageCount}</span>
                            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === pageCount} className="px-4 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50">Next &rarr;</button>
                        </div>
                    )}
                </>
            ) : <p className="text-center py-10 text-slate-500">No report data available.</p>}
        </div>
    );
};

export default memo(FamilyLedgerView);