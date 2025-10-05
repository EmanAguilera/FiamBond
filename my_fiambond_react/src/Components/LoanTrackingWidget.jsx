import { useContext, useState, useEffect, useCallback } from "react";
import { AppContext } from "../Context/AppContext.jsx";

// --- SKELETON LOADER COMPONENT ---
// This component renders a placeholder UI that mimics the loan list's layout.
const LoanListSkeleton = () => (
    <div className="animate-pulse">
        <div className="space-y-2">
            <h3 className="font-bold text-lg text-gray-800 px-3 pt-3">Family Lending</h3>
            {[...Array(3)].map((_, i) => (
                <div key={i} className="p-3 border-b last:border-b-0 border-gray-100">
                    <div className="h-5 w-3/4 bg-slate-200 rounded mb-2"></div>
                    <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
                    <div className="mt-2 space-y-2">
                        <div className="h-4 w-1/3 bg-slate-200 rounded"></div>
                        <div className="h-5 w-1/2 bg-slate-200 rounded"></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// A self-contained component for displaying a single loan's details.
const LoanItem = ({ loan }) => {
    const { user } = useContext(AppContext);
    const isBorrower = user.id === loan.debtor.id;
    const outstanding = parseFloat(loan.amount) - parseFloat(loan.repaid_amount);

    return (
        <div className="p-3 border-b last:border-b-0 border-gray-100">
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
                <button
                    onClick={() => alert('Repayment functionality would go here.')}
                    className="secondary-btn-sm w-full mt-2"
                >
                    Make Repayment
                </button>
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
        setError(null);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/${family.id}/loans`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Could not fetch loan activity.");

            const data = await res.json();
            setLoans(data.data || []); // Use data.data for paginated API responses
        } catch (err)
        {
            console.error("Failed to fetch loans:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token, family.id]);

    useEffect(() => {
        getLoans();
    }, [getLoans]);

    if (loading) return <LoanListSkeleton />;
    if (error) return <p className="error text-center py-4">{error}</p>;

    return (
        <div className="space-y-2">
            <h3 className="font-bold text-lg text-gray-800 px-3 pt-3">Family Lending</h3>
            {loans.length > 0 ? (
                loans.map(loan => <LoanItem key={loan.id} loan={loan} />)
            ) : (
                <p className="text-center italic text-gray-500 py-4 px-3">No lending activity in this family yet.</p>
            )}
        </div>
    );
}