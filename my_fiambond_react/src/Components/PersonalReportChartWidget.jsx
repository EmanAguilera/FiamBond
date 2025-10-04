// src/Components/PersonalReportChartWidget.jsx

import { memo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register the necessary chart components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function PersonalReportChartWidget({ report }) {
    
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Personal Inflow vs. Outflow' },
        },
    };

    return (
        // This outer div uses the same classes for consistent styling
        <div className="content-card font-mono text-slate-800">
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

// Memoize the component to prevent re-renders when props haven't changed
export default memo(PersonalReportChartWidget);