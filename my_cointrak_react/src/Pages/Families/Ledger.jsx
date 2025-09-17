import { useContext, useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { AppContext } from "../../Context/AppContext.jsx";
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function FamilyLedger() {
  const { token } = useContext(AppContext);
  const { id } = useParams();

  // --- REWORKED STATE ---
  // State for the main report data (totals, chart, title)
  const [report, setReport] = useState(null);
  // Separate state for the list of transactions on the current page
  const [transactions, setTransactions] = useState([]);
  // State for the pagination metadata
  const [pagination, setPagination] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('monthly');

  // --- REWORKED FETCHING LOGIC ---
  const getReport = useCallback(async (page = 1) => {
    // We only want the main "loading" spinner on the initial load, not for page changes.
    if (page === 1) {
      setLoading(true);
    }
    setError(null);

    try {
      // Append the page number to the request
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/${id}/report?period=${period}&page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "The server could not process the report request.");
      }

      const data = await res.json();
      
      // Set the main report state (everything EXCEPT the transactions list)
      setReport(data);
      // Set the transactions list from the nested 'data' property
      setTransactions(data.transactions.data);
      // Set the pagination metadata from the 'transactions' object
      const { data: _, ...paginationData } = data.transactions;
      setPagination(paginationData);

    } catch (err) {
      console.error('Failed to fetch family report:', err);
      setError(err.message);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [token, id, period]);

  // This useEffect will re-run the report whenever the period (weekly/monthly/yearly) changes.
  useEffect(() => {
    if (token) {
      getReport(); // Fetch page 1 of the new period
    }
  }, [period, getReport, token]); // Now depends on 'period'

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
      <h1 className="title">Family Ledger</h1>
      
      <div className="w-full mx-auto flex justify-center gap-4 mb-6">
        <button onClick={() => setPeriod('weekly')} className={period === 'weekly' ? 'active-period-btn' : 'period-btn'}>Weekly</button>
        <button onClick={() => setPeriod('monthly')} className={period === 'monthly' ? 'active-period-btn' : 'period-btn'}>Monthly</button>
        <button onClick={() => setPeriod('yearly')} className={period === 'yearly' ? 'active-period-btn' : 'period-btn'}>Yearly</button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        {loading ? (
          <p className="text-center">Generating Family Ledger...</p>
        ) : error ? (
          <p className="error text-center">{error}</p>
        ) : report ? (
          <>
            {/* The chart and summary section remains mostly the same, using data from 'report' state */}
            <div className="mb-8 relative" style={{ height: '400px' }}>
              {report.chartData && report.chartData.datasets && report.chartData.datasets.length > 0 ? (
                <Bar options={chartOptions} data={report.chartData} />
              ) : (
                <div className="flex items-center justify-center h-full"><p>Not enough data to display a chart for this period.</p></div>
              )}
            </div>

            <div className="space-y-3 text-sm mb-8">
              <p><span className="font-bold">Family:</span> {report.familyName}</p>
              <p><span className="font-bold">Summary for:</span> {report.reportTitle}</p>
              <hr className="border-dashed" />
              <p><span className="font-bold">Total Inflow:</span> +₱{parseFloat(report.totalInflow).toFixed(2)}</p>
              <p><span className="font-bold">Total Outflow:</span> -₱{parseFloat(report.totalOutflow).toFixed(2)}</p>
              <p className={`font-bold ${report.netPosition >= 0 ? 'text-green-700' : 'text-red-700'}`}>Net Position: ₱{parseFloat(report.netPosition).toFixed(2)}</p>
              <hr className="border-dashed" />
              <p className="font-bold">Analysis:</p>
              <ul className="list-disc pl-6"><li>{report.transactionCount} individual transactions were logged in this period.</li></ul>
              <hr className="border-dashed mt-4"/>
            </div>
            
            <h3 className="font-bold text-xl mb-4">Transactions for {report.reportTitle}</h3>
            <div className="dashboard-card p-0">
              {/* --- MAPPING OVER THE NEW 'transactions' STATE --- */}
              {transactions.length > 0 ? transactions.map((transaction) => (
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

            {/* --- PAGINATION CONTROLS --- */}
            {pagination && pagination.last_page > 1 && (
              <div className="flex justify-between items-center mt-6">
                <button onClick={() => getReport(pagination.current_page - 1)} disabled={pagination.current_page === 1} className="secondary-btn disabled:opacity-50">&larr; Previous</button>
                <span className="text-sm text-gray-600">Page {pagination.current_page} of {pagination.last_page}</span>
                <button onClick={() => getReport(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page} className="secondary-btn disabled:opacity-50">Next &rarr;</button>
              </div>
            )}
          </>
        ) : (
          <p className="text-center">No report data available for this period.</p>
        )}
      </div>
    </div>
  );
}