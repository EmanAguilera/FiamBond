import { memo } from 'react';

// --- CHART IMPORTS ---
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// This is now a simple "presentational" component.
// It receives data via props and renders it without managing its own state.
function FamilyReportChartWidget({ family, report }) {
    
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: `Family Inflow vs. Outflow for ${family.first_name}` },
        },
    };
    
    // No more loading, error, or data fetching logic here. The parent handles it all.

    return (
        <div className="dashboard-card">
            {/* The period buttons have been moved to the FamilyRealm parent component */}
            
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
                    <div className="space-y-3 text-sm font-mono">
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
                    </div>
                </>
            ) : (
                <p className="text-center py-10">No report data available.</p>
            )}
        </div>
    );
};

// Use memo to prevent re-rendering if the props haven't changed.
export default memo(FamilyReportChartWidget);