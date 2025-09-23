import { useState, useCallback, useContext, useEffect, memo } from 'react'; // Import memo
import { AppContext } from '../Context/AppContext';

// --- CHART IMPORTS ---
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- SKELETON LOADER COMPONENT ---
// This placeholder mimics the entire layout of the ledger view. It's the most
// important optimization for a consistent user experience.
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

function FamilyLedgerView({ family, onBack }) {
    const { token } = useContext(AppContext);
    const [report, setReport] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('monthly');

    const getReport = useCallback(async (page = 1) => {
        // Only show the full skeleton on the very first load.
        // Subsequent page changes will not trigger the full skeleton.
        if (page === 1) setLoading(true); 
        setError(null);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/${family.id}/report?period=${period}&page=${page}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                throw new Error(errorData?.message || "Could not process the report request.");
            }
            const data = await res.json();
            setReport(data);
            setTransactions(data.transactions.data || []);
            const { data: _, ...paginationData } = data.transactions;
            setPagination(paginationData);
        } catch (err) {
            console.error('Failed to fetch family report:', err);
            setError(err.message);
            setReport(null);
        } finally {
            setLoading(false);
        }
    }, [token, family.id, period]);

    useEffect(() => {
        getReport();
    }, [getReport, period]);
    
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: `Family Inflow vs. Outflow for ${family.first_name}` },
        },
    };
    
    // --- RENDER LOGIC ---
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
            
            {report ? (
                <>
                    <div className="mb-8 relative" style={{ height: '350px' }}>
                        {report.chartData?.datasets?.length > 0 ? (
                            <Bar options={chartOptions} data={report.chartData} />
                        ) : (
                            <div className="flex items-center justify-center h-full"><p>Not enough data for a chart.</p></div>
                        )}
                    </div>
                    <div className="space-y-3 text-sm mb-8">
                        <p><span className="font-bold">Summary for:</span> {report.reportTitle}</p>
                        <hr className="border-dashed" />
                        <p className="flex justify-between"><span>Total Inflow:</span> <span className="text-green-600 font-semibold">+₱{parseFloat(report.totalInflow).toFixed(2)}</span></p>
                        <p className="flex justify-between"><span>Total Outflow:</span> <span className="text-red-500 font-semibold">-₱{parseFloat(report.totalOutflow).toFixed(2)}</span></p>
                        <p className={`flex justify-between font-bold text-base ${report.netPosition >= 0 ? 'text-green-700' : 'text-red-700'}`}><span>Net Position:</span> <span>₱{parseFloat(report.netPosition).toFixed(2)}</span></p>
                    </div>
                    <h3 className="font-bold text-lg mb-4">Transactions for this Period</h3>
                    <div className="dashboard-card p-0">
                        {transactions.length > 0 ? transactions.map((transaction) => (
                            <div key={transaction.id} className="transaction-item border-b last:border-b-0 border-gray-100">
                                <div className="min-w-0 pr-4">
                                    <p className="transaction-description break-words">{transaction.description}</p>
                                    <small className="transaction-date">
                                    {new Date(transaction.created_at).toLocaleDateString()}
                                    {transaction.user && ` • By: ${transaction.user.full_name}`}
                                    </small>
                                </div>
                                <p className={`transaction-amount flex-shrink-0 ${transaction.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                                    {transaction.type === 'income' ? '+' : '-'} ₱{parseFloat(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        )) : <p className="p-4 text-center italic">No transactions in this period.</p>}
                    </div>
                    {pagination && pagination.last_page > 1 && (
                        <div className="flex justify-between items-center mt-6">
                            <button onClick={() => getReport(pagination.current_page - 1)} disabled={pagination.current_page === 1} className="pagination-btn">&larr; Previous</button>
                            <span className="pagination-text">Page {pagination.current_page} of {pagination.last_page}</span>
                            <button onClick={() => getReport(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page} className="pagination-btn">Next &rarr;</button>
                        </div>
                    )}
                </>
            ) : <p className="text-center py-10">No report data available.</p>}
        </div>
    );
};

// Wrap the component in memo() for performance optimization.
export default memo(FamilyLedgerView);