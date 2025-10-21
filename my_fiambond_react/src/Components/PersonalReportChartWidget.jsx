// src/Components/PersonalReportChartWidget.jsx

import { memo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register the necessary chart components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * A memoized presentational component that displays a personal financial report.
 * It is completely decoupled from the data source (Firebase/API) and relies
 * on its parent component to provide a processed 'report' object as a prop.
 *
 * NO CHANGES ARE NEEDED FOR THE FIREBASE REFACTOR.
 *
 * @param {object} props - The component props.
 * @param {object} props.report - The processed financial report data to display.
 */
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
        <div className="dashboard-card font-mono text-slate-800">
            {report ? (
                <>
                    <div className="mb-8 relative" style={{ height: '350px' }}>
                        {/* It checks for the chartData provided in the report prop */}
                        {report.chartData?.datasets?.length > 0 && report.chartData?.labels?.length > 0 ? (
                            <Bar options={chartOptions} data={report.chartData} />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p>Not enough data for a chart.</p>
                            </div>
                        )}
                    </div>
                    {/* It displays all summary fields from the report prop */}
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

// Memoize the component to prevent re-renders when props haven't changed
export default memo(PersonalReportChartWidget);