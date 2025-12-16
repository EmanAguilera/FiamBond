import { memo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- ICONS ---
const ArrowUpIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>);
const ArrowDownIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>);
const ScaleIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path></svg>);
const ChartIcon = () => (<svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>);

// --- ANALYST SECTION ---
const AdminFinancialAnalysis = ({ report }) => {
    const { totalInflow, transactionCount } = report; 
    const revenueFormatted = `₱${totalInflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    let title, narrative, recommendation;

    if (totalInflow > 0) {
        title = "Healthy Platform Growth";
        narrative = `The system generated ${revenueFormatted} in subscription revenue from ${transactionCount} active transactions. This indicates consistent value delivery.`;
        recommendation = "Focus on user retention strategies to maintain this MRR, and consider marketing campaigns to attract more companies.";
    } else {
        title = "Revenue Stagnation Detected";
        narrative = `No subscription revenue was recorded for this specific period.`;
        recommendation = "Review your premium value proposition. Consider offering limited-time trials to standard users.";
    }

    return (
        <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-800">System Analyst's Summary</h3>
            <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                <p className="font-semibold text-gray-800">{title}</p>
                <p className="mt-1 text-sm text-gray-600">{narrative}</p>
                <p className="mt-3 text-sm font-semibold text-gray-800">Strategic Recommendation:</p>
                <p className="mt-1 text-sm text-gray-600">{recommendation}</p>
            </div>
        </div>
    );
};

// --- MAIN WIDGET ---
function AdminReportChartWidget({ report, period, setPeriod }) {
    
    const chartOptions = { 
        responsive: true, 
        maintainAspectRatio: false, 
        plugins: { 
            legend: { position: 'top', labels: { boxWidth: 12, font: { size: 12 } } }, 
            title: { display: false } 
        }, 
        scales: { 
            y: { grid: { drawBorder: false } }, 
            x: { grid: { display: false } } 
        } 
    };

    // Loading State
    if (!report) return (
        <div className="dashboard-section animate-pulse">
             <div className="w-full h-10 bg-slate-200 rounded mb-6 mx-auto max-w-sm"></div>
             <div className="h-96 bg-slate-200 rounded-xl"></div>
        </div>
    );

    const hasData = report.chartData?.labels?.length > 0;

    return (
        <div className="dashboard-section">
            
            {/* 1. PERIOD BUTTONS (Updated to match Personal Realm Style) */}
            <div className="flex justify-center gap-2 mb-6 bg-slate-100 p-1 rounded-xl w-fit mx-auto">
                {['weekly', 'monthly', 'yearly'].map((p) => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-4 py-1 text-sm rounded-lg capitalize transition ${
                            period === p
                                ? 'bg-white shadow-sm font-semibold text-slate-800'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        {p}
                    </button>
                ))}
            </div>

            {/* 2. MAIN CARD CONTAINER */}
            <div className="dashboard-card p-4 sm:p-6">
                
                {/* Header */}
                <div>
                    <h3 className="text-xl font-bold text-gray-800">System Financial Summary</h3>
                    <p className="text-sm text-gray-500">{report.reportTitle}</p>
                </div>
                
                {/* 3. STAT CARDS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    
                    {/* Revenue Card (Green) */}
                    <div className="bg-green-50/50 p-4 rounded-lg border border-green-200/80 flex items-center">
                        <div className="bg-green-100 text-green-600 p-2 rounded-lg"><ArrowUpIcon /></div>
                        <div className="ml-3">
                            <p className="text-sm text-green-800 font-semibold">Total Revenue</p>
                            <p className="text-xl font-bold text-green-600">₱{parseFloat(report.totalInflow).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>

                    {/* Operational Costs (Red) */}
                    <div className="bg-red-50/50 p-4 rounded-lg border border-red-200/80 flex items-center">
                        <div className="bg-red-100 text-red-600 p-2 rounded-lg"><ArrowDownIcon /></div>
                        <div className="ml-3">
                            <p className="text-sm text-red-800 font-semibold">Operational Costs</p>
                            <p className="text-xl font-bold text-red-600">₱{parseFloat(report.totalOutflow).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>

                    {/* Net Income (Blue) */}
                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-200/80 flex items-center">
                        <div className="bg-blue-100 text-blue-600 p-2 rounded-lg"><ScaleIcon /></div>
                        <div className="ml-3">
                            <p className="text-sm text-blue-800 font-semibold">Net Income</p>
                            <p className={`text-xl font-bold ${report.netPosition >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                ₱{parseFloat(report.netPosition).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 4. CHART SECTION */}
                <div className="mt-8">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Breakdown of Revenue</h3>
                    <div className="relative" style={{ height: '300px' }}>
                        {hasData ? (
                            <Bar options={chartOptions} data={report.chartData} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg">
                                <ChartIcon />
                                <p className="text-gray-500 font-semibold mt-2">No revenue data for this period</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 5. ANALYST SUMMARY */}
                <AdminFinancialAnalysis report={report} />

            </div>
        </div>
    );
};

export default memo(AdminReportChartWidget);