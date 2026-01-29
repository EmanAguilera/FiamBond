'use client'; // Required due to chart library usage (react-chartjs-2) and React hooks (memo)

import { memo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- ICONS (Kept as is) ---
const ArrowUpIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>);
const ArrowDownIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>);
const ScaleIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path></svg>);
const ChartIcon = () => (<svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>);

// --- BUSINESS ANALYST COMPONENT (Kept as is) ---
const CompanyFinancialAnalysis = ({ report }) => {
    const { netPosition, transactionCount } = report;
    const netFormatted = `₱${Math.abs(netPosition).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    let title, narrative, recommendation;

    if (netPosition > 0) {
        title = "Profitable Operations";
        narrative = `The company generated a net profit of ${netFormatted}, indicating strong operational efficiency and healthy revenue streams against current expenses.`;
        recommendation = "Consider reinvesting surplus capital into growth strategies, employee bonuses, or reserve funds for future expansion.";
    } else {
        title = "Operational Deficit Detected";
        narrative = `The company's expenses exceeded revenue, resulting in a net operating loss of ${netFormatted} across ${transactionCount} transactions.`;
        recommendation = `Conduct a thorough audit of the ${transactionCount} expense entries to identify cost-cutting opportunities or strategies to boost short-term revenue.`;
    }

    return (
        <div className="mt-8 border-t border-slate-100 pt-6">
            <h3 className="text-lg font-bold text-gray-800">Financial Analysis</h3>
            <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="font-semibold text-slate-800">{title}</p>
                <p className="mt-1 text-sm text-slate-600">{narrative}</p>
                <p className="mt-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Strategic Advice:</p>
                <p className="mt-1 text-sm text-slate-700">{recommendation}</p>
            </div>
        </div>
    );
};

// --- MAIN CHART WIDGET ---
function CompanyReportChartWidget({ report }) {
    
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
    
    if (!report) { 
        return (
            <div className="bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-lg p-6 text-center py-10">
                <p className="text-gray-500 italic">No financial data available.</p>
            </div>
        ); 
    }

    const hasChartData = report.chartData?.datasets?.length > 0 && report.chartData?.labels?.length > 0;

    return (
        <div className="bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-lg p-4 sm:p-6">
            <div>
                <h3 className="text-xl font-bold text-gray-800">Company Financial Overview</h3>
                <p className="text-sm text-gray-500">{report.reportTitle}</p>
            </div>
            
            {/* --- STAT CARDS --- */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                {/* Revenue - Green */}
                <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-200/80 flex items-center">
                    <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg"><ArrowUpIcon /></div>
                    <div className="ml-3">
                        <p className="text-sm text-emerald-800 font-semibold">Total Revenue</p>
                        <p className="text-xl font-bold text-emerald-600">₱{parseFloat(report.totalInflow).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>
                {/* Expenses - Red */}
                <div className="bg-rose-50/50 p-4 rounded-lg border border-rose-200/80 flex items-center">
                    <div className="bg-rose-100 text-rose-600 p-2 rounded-lg"><ArrowDownIcon /></div>
                    <div className="ml-3">
                        <p className="text-sm text-rose-800 font-semibold">Total Expenses</p>
                        <p className="text-xl font-bold text-rose-600">₱{parseFloat(report.totalOutflow).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>
                {/* Profit/Loss - Blue/Red */}
                <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-200/80 flex items-center">
                    <div className="bg-slate-100 text-slate-600 p-2 rounded-lg"><ScaleIcon /></div>
                    <div className="ml-3">
                        <p className="text-sm text-slate-800 font-semibold">Net Profit/Loss</p>
                        <p className={`text-xl font-bold ${report.netPosition >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                            ₱{parseFloat(report.netPosition).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            </div>

            {/* --- CHART SECTION --- */}
            <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Revenue vs. Expenses</h3>
                <div className="relative" style={{ height: '300px' }}>
                    {hasChartData ? (
                        <Bar options={chartOptions} data={report.chartData} />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg">
                            <ChartIcon />
                            <p className="text-gray-500 font-semibold mt-2">Insufficient Data</p>
                            <p className="text-xs text-gray-400">Record transactions to visualize performance.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- ANALYSIS --- */}
            <CompanyFinancialAnalysis report={report} />

        </div>
    );
};

export default memo(CompanyReportChartWidget);