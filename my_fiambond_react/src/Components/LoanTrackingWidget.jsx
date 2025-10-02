// LoanTrackingWidget.jsx
import { useContext, useState, useEffect, useCallback } from "react";
import { AppContext } from "../Context/AppContext.jsx";

const LoanItem = ({ loan, onRepay }) => {
    const { user } = useContext(AppContext);
    const isBorrower = user.id === loan.debtor.id;
    const outstanding = parseFloat(loan.amount) - parseFloat(loan.repaid_amount);

    return (
        <div className="p-3 border rounded-md bg-gray-50">
            <p className="font-semibold text-gray-800 break-words">{loan.description}</p>
            <small className="text-xs text-gray-500">
                From: {loan.creditor.full_name} To: {loan.debtor.full_name}
            </small>
            <div className="text-sm mt-2">
                <p>Total Loan: <span className="font-mono">₱{parseFloat(loan.amount).toFixed(2)}</span></p>
                <p className={`font-bold ${outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    Outstanding: <span className="font-mono">₱{outstanding.toFixed(2)}</span>
                </p>
            </div>
            {isBorrower && outstanding > 0 && (
                <button onClick={() => onRepay(loan)} className="secondary-btn-sm w-full mt-2">Make Repayment</button>
            )}
        </div>
    );
};

export default function LoanTrackingWidget({ family }) {
  const { token } = useContext(AppContext);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getLoans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/${family.id}/loans`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Could not fetch loans.");
      const data = await res.json();
      setLoans(data.loans || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, family.id]);

  useEffect(() => {
    getLoans();
  }, [getLoans]);

  const handleRepay = (loan) => {
      const outstanding = loan.amount - loan.repaid_amount;
      alert(`This would open a repayment modal for the loan regarding "${loan.description}" with an outstanding balance of ₱${outstanding.toFixed(2)}.`);
      // After a successful repayment, you would call getLoans() again to refresh the list.
  };

  if (loading) return <p className="text-center py-4">Loading loans...</p>;
  if (error) return <p className="error text-center py-4">{error}</p>;

  return (
    <div className="space-y-3">
        <h3 className="font-bold text-lg text-gray-800">Family Lending</h3>
        {loans.length > 0 ? (
            loans.map(loan => <LoanItem key={loan.id} loan={loan} onRepay={handleRepay} />)
        ) : (
            <p className="text-center italic text-gray-500 py-4">No lending activity in this family yet.</p>
        )}
    </div>
  );
}