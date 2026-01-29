'use client'; // Required due to chart library usage (react-chartjs-2) and React hooks (memo)

import { memo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register the necessary chart components (Essential client-side operation)
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- ICONS (Kept as is) ---
const ArrowUpIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>);
const ArrowDownIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>);
const ScaleIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path></svg>);
const ChartIcon = () => (<svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>);


// --- "AI ADVISOR" FOR THE FAMILY REPORT (Kept as is) ---
const FamilyFinancialAnalysis = ({ report }) => {
    const { netPosition, transactionCount } = report;
    const netFormatted = `₱${Math.abs(netPosition).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    let title, narrative, recommendation;

    if (netPosition > 0) {
        title = "Positive Family Cash Flow";
        narrative = `The family demonstrated strong collective financial management, generating a positive cash flow of ${netFormatted}. This is an excellent result.`;
        recommendation = "Discuss as a group how to best allocate this surplus. It could be a great opportunity to contribute more towards a shared family goal.";
    } else {
        title = "Family Spending Review Needed";
        narrative = `The family's collective expenses exceeded its income, resulting in a net outflow of ${netFormatted}.`;
        recommendation = `It would be beneficial to review the ${transactionCount} family transactions together to understand spending patterns and identify areas for potential savings.`;
    }

    return (
        <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-800">Analyst's Summary</h3>
            <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                <p className="font-semibold text-gray-800">{title}</p>
                <p className="mt-1 text-sm text-gray-600">{narrative}</p>
                <p className="mt-3 text-sm font-semibold text-gray-800">Next Steps:</p>
                <p className="mt-1 text-sm text-gray-600">{recommendation}</p>
            </div>
        </div>
    );
};


function FamilyReportChartWidget({ family, report }) {
    
    const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { size: 12 } } }, title: { display: false }, }, scales: { y: { grid: { drawBorder: false } }, x: { grid: { display: false } } } };
    if (!report || !family) { return (<div className="dashboard-card text-center py-10"><p className="text-gray-500 italic">No report data available.</p></div>); }
    const hasChartData = report.chartData?.datasets?.length > 0 && report.chartData?.labels?.length > 0;

    return (
        <div className="dashboard-card p-4 sm:p-6">
            <div>
                <h3 className="text-xl font-bold text-gray-800">Family Financial Summary</h3>
                <p className="text-sm text-gray-500">{report.reportTitle} for <span className="font-semibold">{family.family_name}</span></p>
            </div>
            
            {/* --- STAT CARDS --- */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                {/* Inflow Card - Light Green Theme */}
                <div className="bg-green-50/50 p-4 rounded-lg border border-green-200/80 flex items-center">
                    <div className="bg-green-100 text-green-600 p-2 rounded-lg"><ArrowUpIcon /></div>
                    <div className="ml-3">
                        <p className="text-sm text-green-800 font-semibold">Total Inflow</p>
                        <p className="text-xl font-bold text-green-600">₱{parseFloat(report.totalInflow).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>
                {/* Outflow Card - Light Red Theme */}
                <div className="bg-red-50/50 p-4 rounded-lg border border-red-200/80 flex items-center">
                    <div className="bg-red-100 text-red-600 p-2 rounded-lg"><ArrowDownIcon /></div>
                    <div className="ml-3">
                        <p className="text-sm text-red-800 font-semibold">Total Outflow</p>
                        <p className="text-xl font-bold text-red-600">₱{parseFloat(report.totalOutflow).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>
                {/* Net Position Card - Light Blue Theme (Consistent) */}
                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-200/80 flex items-center">
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-lg"><ScaleIcon /></div>
                    <div className="ml-3">
                        <p className="text-sm text-blue-800 font-semibold">Net Position</p>
                        <p className={`text-xl font-bold ${report.netPosition >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            ₱{parseFloat(report.netPosition).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            </div>

            {/* --- CHART SECTION --- */}
            <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Breakdown of Family Spending</h3>
                <div className="relative" style={{ height: '300px' }}>
                    {hasChartData ? (
                        <Bar options={chartOptions} data={report.chartData} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg">
                            <ChartIcon />
                            <p className="text-gray-500 font-semibold mt-2">Not enough data to generate a chart</p>
                            <p className="text-xs text-gray-400">Add family transactions to see a breakdown.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- GENERATED ESSAY FOR THE FAMILY --- */}
            <FamilyFinancialAnalysis report={report} />

        </div>
    );
};

export default memo(FamilyReportChartWidget);