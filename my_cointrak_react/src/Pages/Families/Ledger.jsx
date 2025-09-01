import { useContext, useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { AppContext } from "../../Context/AppContext.jsx";

export default function FamilyLedger() {
  const { token } = useContext(AppContext);
  const { id } = useParams(); // Get family ID from URL
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const getReport = useCallback(async () => {
    setLoading(true);
    // Fetch from the new family report endpoint
    const res = await fetch(`/api/families/${id}/report`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setReport(data);
    }
    setLoading(false);
  }, [token, id]);

  useEffect(() => {
    if (token) getReport();
  }, [token, getReport]);

  if (loading) {
    return <h1 className="title">Generating Family Ledger...</h1>;
  }

  return (
    <div className="w-2/3 mx-auto font-mono text-slate-800">
      <h1 className="text-2xl font-bold mb-4 border-b-2 border-slate-800 pb-2">Family Monthly Ledger</h1>
      {report ? (
        <>
            <div className="space-y-3 text-sm mb-8">
                <p><span className="font-bold">Family:</span> {report.familyName}</p>
                <p><span className="font-bold">Summary for:</span> {report.monthName}</p>
                <hr className="border-dashed" />
                <p><span className="font-bold">Total Inflow:</span> +₱{parseFloat(report.totalInflow).toFixed(2)}</p>
                <p><span className="font-bold">Total Outflow:</span> -₱{parseFloat(report.totalOutflow).toFixed(2)}</p>
                <p className={`font-bold ${report.netPosition >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    Net Position: ₱{parseFloat(report.netPosition).toFixed(2)}
                </p>
                <hr className="border-dashed" />
                <p className="font-bold">Analysis:</p>
                <ul className="list-disc pl-6">
                    <li>{report.transactionCount} individual transactions were logged.</li>
                </ul>
                <hr className="border-dashed mt-4"/>
            </div>
            
            <h3 className="font-bold text-xl mb-4">Transactions for {report.monthName}</h3>
            <div className="dashboard-card p-0">
                {report.transactions.length > 0 ? report.transactions.map((transaction) => (
                    <div
                        key={transaction.id}
                        className="transaction-item border-b last:border-b-0 border-gray-100"
                    >
                        <div>
                            <p className="transaction-description">{transaction.description}</p>
                            <small className="transaction-date">
                                {new Date(transaction.created_at).toLocaleDateString()}
                            </small>
                        </div>
                        <p className={`transaction-amount ${transaction.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                            {transaction.type === 'income' ? '+' : '-'} ₱{parseFloat(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                )) : <p className="p-4">No transactions for this family this month.</p>}
            </div>
        </>
      ) : (
        <p>Could not generate the family report.</p>
      )}
    </div>
  );
}