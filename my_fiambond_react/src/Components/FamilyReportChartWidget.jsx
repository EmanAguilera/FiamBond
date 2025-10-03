import { memo } from 'react';

// --- CHART IMPORTS ---
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * A memoized presentational component that displays a family's financial report chart and summary.
 * It receives all data and state via props from a parent component.
 * @param {object} props - The component props.
 * @param {object} props.family - The family member's data.
 * @param {object} props.report - The financial report data to display.
 */
function FamilyReportChartWidget({ family, report }) {
    
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: `Family Inflow vs. Outflow for ${family.first_name}` },
        },
    };
    
    // Parent component now handles loading, error, and data fetching logic.

    return (
        <div className="dashboard-card font-mono text-slate-800">
            {/* The period buttons have been moved to the parent component */}
            
            {report ? (
                <>
                    <div className="mb-8 relative" style={{ height: '350px' }}>
                        {report.chartData?.datasets?.length > 0 ? (
                            <Bar options={chartOptions} data={report.chartData} />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p>Not enough data for a chart.</p>
                            </div>
                        )}
                    </div>
                    {/* This summary section is now styled to match Home.jsx for consistency */}
                    <div className="space-y-3 text-sm">
                        <p><span className="font-bold">Summary for:</span> {report.reportTitle}</p>
                        <hr className="border-dashed" />
                        <p><span className="font-bold">Total Inflow:</span> +₱{parseFloat(report.totalInflow).toFixed(2)}</p>
                        <p><span className="font-bold">Total Outflow:</span> -₱{parseFloat(report.totalOutflow).toFixed(2)}</p>
                        <p className={`font-bold ${report.netPosition >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            Net Position: ₱{parseFloat(report.netPosition).toFixed(2)}
                        </p>
                        <hr className="border-dashed" />
                        <p className="font-bold">Analysis:</p>
                        <ul className="list-disc pl-6">
                            <li>{report.transactionCount} individual transactions were logged in this period.</li>
                        </ul>
                    </div>
                </>
            ) : (
                <p className="text-center py-10">No report data available.</p>
            )}
        </div>
    );
};

// Use React.memo to prevent unnecessary re-renders if props have not changed.
export default memo(FamilyReportChartWidget);