import { useContext, useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { AppContext } from "../../Context/AppContext.jsx";
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function FamilyLedger() {
  const { token } = useContext(AppContext);
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');

  const getReport = useCallback(async () => {
    setLoading(true);

    // --- FIX IS HERE ---
    // Use the full API URL from the environment variable.
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/${id}/report?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // --- END OF FIX ---

    if (res.ok) {
      const data = await res.json();
      setReport(data);
    } else {
      setReport(null);
    }
    setLoading(false);
  }, [token, id, period]);

  useEffect(() => {
    if (token) getReport();
  }, [token, getReport]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Family Inflow vs. Outflow' },
    },
  };

  return (
    <div className="w-full max-w-4xl mx-auto font-mono text-slate-800">
      <h1 className="title">Family Ledger</h1> {/* Corrected title */}
      
      <div className="w-full mx-auto flex justify-center gap-4 mb-6">
        <button onClick={() => setPeriod('weekly')} className={period === 'weekly' ? 'active-period-btn' : 'period-btn'}>Weekly</button>
        <button onClick={() => setPeriod('monthly')} className={period === 'monthly' ? 'active-period-btn' : 'period-btn'}>Monthly</button>
        <button onClick={() => setPeriod('yearly')} className={period === 'yearly' ? 'active-period-btn' : 'period-btn'}>Yearly</button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        {loading ? (
          <p className="text-center">Generating Family Ledger...</p>
        ) : report ? (
          <>
            <div className="mb-8 relative" style={{ height: '400px' }}>
              {report.chartData && report.chartData.datasets ? (
                <Bar options={chartOptions} data={report.chartData} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p>Not enough data to display a chart for this period.</p>
                </div>
              )}
            </div>

            <div className="space-y-3 text-sm mb-8">
              <p><span className="font-bold">Family:</span> {report.familyName}</p>
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
            </div>
            
            <h3 className="font-bold text-xl mb-4">Transactions for {report.reportTitle}</h3>
            <div className="dashboard-card p-0">
              {report.transactions.length > 0 ? report.transactions.map((transaction) => (
                <div key={transaction.id} className="transaction-item border-b last:border-b-0 border-gray-100">
                  <div>
                    <p className="transaction-description">{transaction.description}</p>
                    <small className="transaction-date">{new Date(transaction.created_at).toLocaleDateString()}</small>
                  </div>
                  <p className={`transaction-amount ${transaction.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                    {transaction.type === 'income' ? '+' : '-'} ₱{parseFloat(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              )) : <p className="p-4">No transactions for this family in this period.</p>}
            </div>
          </>
        ) : (
          <p className="text-center">Could not generate the family report.</p>
        )}
      </div>
    </div>
  );
}