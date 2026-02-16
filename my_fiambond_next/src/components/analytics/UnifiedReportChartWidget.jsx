'use client';

import { memo } from 'react';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
} from 'chart.js';

// 🏎️ Simplex Move: Import your unified loader
import UnifiedLoadingWidget from '../../components/ui/UnifiedLoadingWidget';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- UNIVERSAL ICONS ---
const ArrowUpIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>);
const ArrowDownIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>);
const ScaleIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path></svg>);
const ChartIcon = () => (<svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>);

// --- REUSABLE STAT CARD ---
const StatCard = ({ label, value, colorClass, icon }) => (
    <div className={`${colorClass} p-4 rounded-lg border flex items-center`}>
        <div className="p-2 rounded-lg opacity-80">{icon}</div>
        <div className="ml-3">
            <p className="text-sm font-semibold opacity-70">{label}</p>
            <p className="text-xl font-bold">
                ₱{parseFloat(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
        </div>
    </div>
);

// --- DYNAMIC ANALYST SUMMARY ---
const UnifiedAnalysis = ({ report, realm }) => {
    const { totalInflow, netPosition, transactionCount } = report;
    const netFormatted = `₱${Math.abs(netPosition || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    
    let config = { title: "", narrative: "", recommendation: "" };

    switch (realm) {
        case 'admin':
            config.title = totalInflow > 0 ? "Healthy Platform Growth" : "Revenue Stagnation Detected";
            config.narrative = `The system generated ₱${totalInflow.toLocaleString()} in subscription revenue.`;
            config.recommendation = "Focus on user retention and marketing campaigns.";
            break;
        case 'company':
            config.title = netPosition > 0 ? "Profitable Operations" : "Operational Deficit Detected";
            config.narrative = `The company generated a net position of ${netFormatted}.`;
            config.recommendation = "Conduct a thorough audit of expense entries.";
            break;
        case 'family':
            config.title = netPosition > 0 ? "Positive Family Cash Flow" : "Family Spending Review Needed";
            config.narrative = `Collective family expenses resulted in a net position of ${netFormatted}.`;
            config.recommendation = "Review transactions together to identify savings.";
            break;
        default: 
            config.title = netPosition > 0 ? "Good Financial Management" : "Spending Review Recommended";
            config.narrative = `Your net position is ${netFormatted} across ${transactionCount} transactions.`;
            config.recommendation = "Identify the cause of high outflow to stay within income.";
    }

    return (
        <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-bold text-gray-800">Financial Analysis Summary</h3>
            <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="font-semibold text-slate-800">{config.title}</p>
                <p className="mt-1 text-sm text-slate-600">{config.narrative}</p>
                <p className="mt-3 text-xs font-bold text-slate-400 uppercase tracking-wide">Strategic Advice:</p>
                <p className="mt-1 text-sm text-slate-700">{config.recommendation}</p>
            </div>
        </div>
    );
};

// --- MAIN WIDGET ---
function UnifiedReportChartWidget({ report, realm, period, setPeriod }) {
    const chartOptions = { 
        responsive: true, 
        maintainAspectRatio: false, 
        plugins: { 
            legend: { position: 'top', labels: { boxWidth: 12, font: { size: 12 } } } 
        }, 
        scales: { 
            y: { grid: { drawBorder: false } }, 
            x: { grid: { display: false } } 
        } 
    };

    // 🛡️ Guard Clause: Gagamitin ang Unified Widget para sa mas magandang Performance score
    if (!report) return (
        <div className="dashboard-section bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-lg overflow-hidden">
             <UnifiedLoadingWidget 
                type="section" 
                message={`Calculating ${realm} insights...`} 
                variant="indigo" 
             />
        </div>
    );

    const hasChartData = report.chartData?.datasets?.some(d => d.data.some(val => val > 0));

    const labels = {
        inflow: realm === 'admin' ? "Total Revenue" : (realm === 'company' ? "Total Revenue" : "Total Inflow"),
        outflow: realm === 'admin' ? "Operational Costs" : (realm === 'company' ? "Total Expenses" : "Total Outflow")
    };

    return (
        <div className="dashboard-section">
            {setPeriod && (
                <div className="flex justify-center gap-2 mb-6 bg-slate-100 p-1 rounded-xl w-fit mx-auto">
                    {['weekly', 'monthly', 'yearly'].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-1 text-sm rounded-lg capitalize transition ${
                                period === p ? 'bg-white shadow-sm font-semibold text-slate-800' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}

            <div className="dashboard-card p-4 sm:p-6 bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-lg">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 capitalize">{realm} Financial Overview</h3>
                    <p className="text-sm text-gray-500">{report.reportTitle}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <StatCard label={labels.inflow} value={report.totalInflow} icon={<ArrowUpIcon />} colorClass="bg-emerald-50 text-emerald-600 border-emerald-200" />
                    <StatCard label={labels.outflow} value={report.totalOutflow} icon={<ArrowDownIcon />} colorClass="bg-rose-50 text-rose-600 border-rose-200" />
                    <StatCard label="Net Position" value={report.netPosition} icon={<ScaleIcon />} colorClass={`bg-slate-50 border-slate-200 ${report.netPosition >= 0 ? 'text-indigo-600' : 'text-rose-600'}`} />
                </div>

                <div className="mt-8">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Visual Performance</h3>
                    <div className="relative" style={{ height: '300px' }}>
                        {hasChartData ? (
                            <Bar options={chartOptions} data={report.chartData} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg border border-dashed">
                                <ChartIcon />
                                <p className="text-gray-500 font-semibold mt-2 text-sm text-center px-4">Insufficient data to visualize performance.</p>
                            </div>
                        )}
                    </div>
                </div>

                <UnifiedAnalysis report={report} realm={realm} />
            </div>
        </div>
    );
}

export default memo(UnifiedReportChartWidget);