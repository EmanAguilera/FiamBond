// src/Components/FamilyReportChartWidget.jsx

import { useState, useCallback, useContext, useEffect, memo } from 'react';
import { AppContext } from '../Context/AppContext';

// --- CHART IMPORTS ---
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- SKELETON LOADER ---
const ChartSkeleton = () => (
    <div className="animate-pulse">
        <div className="w-full mx-auto flex justify-center gap-4 mb-6">
            <div className="h-9 w-20 bg-slate-200 rounded"></div>
            <div className="h-9 w-20 bg-slate-200 rounded"></div>
            <div className="h-9 w-20 bg-slate-200 rounded"></div>
        </div>
        <div className="mb-8 h-[350px] w-full bg-slate-200 rounded-lg"></div>
        <div className="space-y-3 text-sm">
            <div className="h-5 w-1/2 bg-slate-200 rounded"></div>
            <hr className="border-dashed" />
            <div className="h-5 w-full bg-slate-200 rounded"></div>
            <div className="h-5 w-full bg-slate-200 rounded"></div>
            <div className="h-6 w-full bg-slate-200 rounded mt-1"></div>
        </div>
    </div>
);

function FamilyReportChartWidget({ family, onLoadingChange }) {
    const { token } = useContext(AppContext);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('monthly');

    const getReport = useCallback(async () => {
        setLoading(true); 
        setError(null);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/${family.id}/report?period=${period}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                throw new Error(errorData?.message || "Could not process the report request.");
            }
            setReport(await res.json());
        } catch (err) {
            console.error('Failed to fetch family report:', err);
            setError(err.message);
        } finally {
            onLoadingChange(false);
        }
    }, [token, family.id, period, onLoadingChange]);

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
    
    if (loading) return <ChartSkeleton />;
    if (error) return <p className="error text-center py-10">{error}</p>;

    return (
        <div className="dashboard-card">
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
                    <div className="space-y-3 text-sm font-mono">
                        <p><span className="font-bold">Summary for:</span> {report.reportTitle}</p>
                        <hr className="border-dashed" />
                        <p className="flex justify-between"><span>Total Inflow:</span> <span className="text-green-600 font-semibold">+₱{parseFloat(report.totalInflow).toFixed(2)}</span></p>
                        <p className="flex justify-between"><span>Total Outflow:</span> <span className="text-red-500 font-semibold">-₱{parseFloat(report.totalOutflow).toFixed(2)}</span></p>
                        <p className={`flex justify-between font-bold text-base ${report.netPosition >= 0 ? 'text-green-700' : 'text-red-700'}`}><span>Net Position:</span> <span>₱{parseFloat(report.netPosition).toFixed(2)}</span></p>
                    </div>
                </>
            ) : <p className="text-center py-10">No report data available.</p>}
        </div>
    );
};

export default memo(FamilyReportChartWidget);