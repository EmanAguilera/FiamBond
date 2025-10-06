import { useContext, useState, useEffect, useCallback } from "react";
import { AppContext } from "../Context/AppContext.jsx";

const LoanListSkeleton = () => (
    <div className="animate-pulse">
        <h3 className="font-bold text-lg text-gray-800 mb-2">Family Lending</h3>
        <div className="dashboard-card p-0">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between items-center p-4 border-b last:border-b-0 border-slate-100">
                    <div>
                        <div className="h-5 w-48 bg-slate-200 rounded"></div>
                        <div className="h-4 w-32 bg-slate-200 rounded mt-2"></div>
                        <div className="h-4 w-24 bg-slate-200 rounded mt-2"></div>
                    </div>
                    <div className="text-right">
                        <div className="h-6 w-28 bg-slate-200 rounded"></div>
                        <div className="h-4 w-20 bg-slate-200 rounded mt-1 ml-auto"></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// --- DEADLINE NOTIFICATION HELPER ---
const DeadlineNotification = ({ deadline, outstanding }) => {
    if (!deadline || outstanding <= 0) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate.getTime() - today.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (dayDiff < 0) {
        return <span className="text-xs font-semibold text-red-600">Overdue</span>;
    }
    if (dayDiff <= 7) {
        return <span className="text-xs font-semibold text-yellow-600">Due Soon</span>;
    }
    return null;
};

const LoanItem = ({ loan }) => {
    const { user } = useContext(AppContext);
    const isBorrower = user.id === loan.debtor.id;
    const outstanding = parseFloat(loan.amount) - parseFloat(loan.repaid_amount);

    return (
        <div className="p-4 border-b last:border-b-0 border-gray-100">
            <div className="flex justify-between items-start">
                <div className="min-w-0 pr-4">
                    <p className="font-semibold text-gray-800 break-words">{loan.description}</p>
                    <small className="text-xs text-gray-500">
                        From: {loan.creditor.full_name} To: {loan.debtor.full_name}
                    </small>
                     <p className="text-sm text-gray-600 mt-1">
                        Total Loan: <span className="font-mono">₱{parseFloat(loan.amount).toFixed(2)}</span>
                    </p>
                    {/* Display Deadline Info */}
                    {loan.deadline && (
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-500">
                                Due: {new Date(loan.deadline).toLocaleDateString()}
                            </p>
                           <DeadlineNotification deadline={loan.deadline} outstanding={outstanding} />
                        </div>
                    )}
                </div>

                <div className="text-right flex-shrink-0">
                    <p className={`font-bold text-lg ${outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        <span className="font-mono">₱{outstanding.toFixed(2)}</span>
                    </p>
                    <small className="text-xs text-gray-500">Outstanding</small>
                </div>
            </div>

            {isBorrower && outstanding > 0 && (
                <button
                    onClick={() => alert('Repayment functionality would go here.')}
                    className="secondary-btn-sm w-full mt-3"
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
            setLoans(data.data || []);
        } catch (err) {
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
        <div>
            <h3 className="font-bold text-lg text-gray-800 mb-2">Family Lending</h3>
            <div className="dashboard-card p-0">
                {loans.length > 0 ? (
                    loans.map(loan => <LoanItem key={loan.id} loan={loan} />)
                ) : (
                    <p className="text-center italic text-gray-500 py-4 px-3">No lending activity in this family yet.</p>
                )}
            </div>
        </div>
    );
}