import { useContext, useEffect, useState, useCallback } from "react";
import { AppContext } from "../../Context/AppContext.jsx";

export default function Reports() {
  const { token } = useContext(AppContext);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const getReport = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/reports/monthly", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setReport(data);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (token) getReport();
  }, [token, getReport]);

  if (loading) {
    return <h1 className="title">Generating Ledger...</h1>;
  }

  return (
    <div className="w-2/3 mx-auto font-mono text-slate-800">
      <h1 className="text-2xl font-bold mb-4 border-b-2 border-slate-800 pb-2">Monthly Ledger</h1>
      {report ? (
        <div className="space-y-3 text-sm">
          <p><span className="font-bold">Summary for:</span> {report.monthName}</p>
          <hr className="border-dashed" />
          <p><span className="font-bold">Total Inflow:</span> +${parseFloat(report.totalInflow).toFixed(2)}</p>
          <p><span className="font-bold">Total Outflow:</span> -${parseFloat(report.totalOutflow).toFixed(2)}</p>
          <p className={`font-bold ${report.netPosition >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            Net Position: ${parseFloat(report.netPosition).toFixed(2)}
          </p>
          <hr className="border-dashed" />
          <p className="font-bold">Analysis:</p>
          <ul className="list-disc pl-6">
            <li>{report.transactionCount} individual transactions were logged.</li>
            <li>{report.spendingHabit}</li>
            {report.consecutiveDecline >= 2 && (
              <li className="text-red-700">Your Net Position has decreased for the past {report.consecutiveDecline + 1} consecutive months.</li>
            )}
          </ul>
          <hr className="border-dashed mt-4"/>
          <p className="text-right text-xs pt-2">End of Report.</p>
        </div>
      ) : (
        <p>Could not generate the report.</p>
      )}
    </div>
  );
}