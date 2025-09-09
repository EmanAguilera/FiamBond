import { useContext, useEffect, useState, useCallback } from "react";
import { AppContext } from "../../Context/AppContext.jsx";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Reports() {
  const { token } = useContext(AppContext);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // New state for handling errors
  const [period, setPeriod] = useState('monthly');

  const getReport = useCallback(async () => {
    setLoading(true);
    setError(null); // Clear previous errors on a new request

    try {
      // NOTE: Corrected the API endpoint to be more standard
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reports?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // Handle server-side errors (e.g., 500)
        const errorData = await res.json().catch(() => null);
        const message = errorData?.message || "The server could not process the report request.";
        throw new Error(message);
      }

      const data = await res.json();
      setReport(data);

    } catch (err) {
      // Handle network errors or errors thrown from the !res.ok block
      console.error('Failed to fetch report:', err);
      setError(err.message);
      setReport(null); // Ensure no old report data is displayed
    }

    setLoading(false);
  }, [token, period]);

  useEffect(() => {
    if (token) getReport();
  }, [token, getReport]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Inflow vs. Outflow',
      },
    },
  };

  return (
    <>
      <h1 className="title">Financial Ledger</h1>
      
      <div className="w-full max-w-4xl mx-auto flex justify-center gap-4 mb-6">
        <button onClick={() => setPeriod('weekly')} className={period === 'weekly' ? 'active-period-btn' : 'period-btn'}>Weekly</button>
        <button onClick={() => setPeriod('monthly')} className={period === 'monthly' ? 'active-period-btn' : 'period-btn'}>Monthly</button>
        <button onClick={() => setPeriod('yearly')} className={period === 'yearly' ? 'active-period-btn' : 'period-btn'}>Yearly</button>
      </div>
      
      <div className="w-full max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md font-mono text-slate-800">
        {loading ? (
          <p className="text-center">Generating Ledger...</p>
        ) : error ? (
          <p className="error text-center">{error}</p> // Display the specific error message
        ) : report ? (
          <>
            <div className="mb-8" style={{ height: '400px', position: 'relative' }}>
              {report.chartData && report.chartData.datasets && report.chartData.datasets.length > 0 ? (
                <Bar options={{...chartOptions, maintainAspectRatio: false}} data={report.chartData} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p>Not enough data to display a chart for this period.</p>
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
              <hr className="border-dashed mt-4"/>
              <p className="text-right text-xs pt-2">End of Report.</p>
            </div>
          </>
        ) : (
          <p className="text-center">No report data available for the selected period.</p>
        )}
      </div>
    </>
  );
}