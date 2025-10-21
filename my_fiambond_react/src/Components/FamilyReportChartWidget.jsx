// Components/FamilyReportChartWidget.jsx

import { memo } from 'react';

// --- CHART IMPORTS ---
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * A memoized presentational component that displays a family's financial report chart and summary.
 * It receives all data and state via props from its parent component (FamilyRealm).
 * @param {object} props - The component props.
 * @param {object} props.family - The family's data, including family_name.
 * @param {object} props.report - The processed financial report data to display.
 */
function FamilyReportChartWidget({ family, report }) {
    
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            // Use the correct field name 'family_name' to display the chart title
            title: { display: true, text: `Family Inflow vs. Outflow for ${family.family_name}` },
        },
    };
    
    // The parent component (FamilyRealm) handles loading, error, and data fetching logic.

    return (
        <div className="dashboard-card font-mono text-slate-800">
            {report ? (
                <>
                    <div className="mb-8 relative" style={{ height: '350px' }}>
                        {/* Check if there is valid chart data to display */}
                        {report.chartData?.datasets?.length > 0 && report.chartData?.labels?.length > 0 ? (
                            <Bar options={chartOptions} data={report.chartData} />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p>Not enough data for a chart.</p>
                            </div>
                        )}
                    </div>
                    {/* The summary section displays the processed data from the report prop */}
                    <div className="space-y-3 text-sm">
                        <p><span className="font-bold">Summary for:</span> {report.reportTitle}</p>
                        <hr className="border-dashed" />
                        <p className="flex justify-between">
                            <span>Total Inflow:</span> 
                            <span className="text-green-600 font-semibold">+₱{parseFloat(report.totalInflow).toFixed(2)}</span>
                        </p>
                        <p className="flex justify-between">
                            <span>Total Outflow:</span> 
                            <span className="text-red-500 font-semibold">-₱{parseFloat(report.totalOutflow).toFixed(2)}</span>
                        </p>
                        <p className={`flex justify-between font-bold text-base ${report.netPosition >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            <span>Net Position:</span> 
                            <span>₱{parseFloat(report.netPosition).toFixed(2)}</span>
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