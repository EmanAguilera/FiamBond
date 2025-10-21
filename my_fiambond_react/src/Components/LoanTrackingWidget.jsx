// Components/LoanTrackingWidget.jsx

import { useContext, useState, useEffect, useCallback } from "react";
import { AppContext } from "../Context/AppContext.jsx";
import { db } from '../config/firebase-config'; // Adjust path
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    getDocs, 
    documentId 
} from 'firebase/firestore';

// --- FULL SKELETON LOADER COMPONENT ---
const LoanListSkeleton = () => (
    <div className="animate-pulse">
        <h3 className="font-bold text-lg text-gray-800 mb-2">Family Lending</h3>
        <div className="dashboard-card p-0">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex justify-between items-center p-4 border-b last:border-b-0 border-slate-100">
                    {/* Left Side Skeleton */}
                    <div>
                        <div className="h-5 w-48 bg-slate-200 rounded"></div>
                        <div className="h-4 w-32 bg-slate-200 rounded mt-2"></div>
                        <div className="h-4 w-24 bg-slate-200 rounded mt-2"></div>
                    </div>
                    {/* Right Side Skeleton */}
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
    // This function expects a JavaScript Date object, not a Firestore Timestamp
    if (!deadline || outstanding <= 0) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date
    const deadlineDate = deadline; // Already a Date object
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


// --- LOAN ITEM SUB-COMPONENT ---
const LoanItem = ({ loan }) => {
    const { user } = useContext(AppContext);
    // Use user.uid for comparison
    const isBorrower = user.uid === loan.debtor.id;
    const outstanding = parseFloat(loan.amount) - parseFloat(loan.repaid_amount);
    
    // Handle Firestore Timestamps by converting them to JS Dates
    const creationDate = loan.created_at?.toDate().toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
    const deadlineDate = loan.deadline?.toDate();

    return (
        <div className="p-4 border-b last:border-b-0 border-gray-100">
            <div className="flex justify-between items-start">
                {/* Left Side: Loan Details */}
                <div className="min-w-0 pr-4">
                    <p className="font-semibold text-gray-800 break-words">{loan.description}</p>
                    <div className="mt-1 text-xs text-gray-500 space-y-1">
                        <p>Date Created: {creationDate}</p>
                        {/* Access enriched data */}
                        <p>From: {loan.creditor.full_name} To: {loan.debtor.full_name}</p>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                        Total Loan: <span className="font-mono">₱{parseFloat(loan.amount).toFixed(2)}</span>
                    </p>
                    {deadlineDate && (
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-gray-500">
                                Due: {deadlineDate.toLocaleDateString()}
                            </p>
                           <DeadlineNotification deadline={deadlineDate} outstanding={outstanding} />
                        </div>
                    )}
                </div>

                {/* Right Side: Outstanding Amount */}
                <div className="text-right flex-shrink-0">
                    <p className={`font-bold text-lg ${outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        <span className="font-mono">₱{outstanding.toFixed(2)}</span>
                    </p>
                    <small className="text-xs text-gray-500">Outstanding</small>
                </div>
            </div>

            {/* Repayment Button (Conditional) */}
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

// --- MAIN WIDGET COMPONENT ---
export default function LoanTrackingWidget({ family }) {
    const { user } = useContext(AppContext);
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const getLoans = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            // Step 1: Fetch all loans for the given family
            const loansQuery = query(
                collection(db, "loans"),
                where("family_id", "==", family.id),
                orderBy("created_at", "desc")
            );
            const loansSnapshot = await getDocs(loansQuery);
            const fetchedLoans = loansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (fetchedLoans.length === 0) {
                setLoans([]);
                return;
            }

            // Step 2: Enrich the data with user names
            const userIds = new Set();
            fetchedLoans.forEach(loan => {
                userIds.add(loan.creditor_id);
                userIds.add(loan.debtor_id);
            });

            const usersQuery = query(collection(db, "users"), where(documentId(), "in", [...userIds]));
            const usersSnapshot = await getDocs(usersQuery);
            const usersMap = {};
            usersSnapshot.forEach(doc => {
                usersMap[doc.id] = { id: doc.id, ...doc.data() };
            });

            // Step 3: Merge user data into each loan object
            const enrichedLoans = fetchedLoans.map(loan => ({
                ...loan,
                creditor: usersMap[loan.creditor_id] || { full_name: "Unknown User" },
                debtor: usersMap[loan.debtor_id] || { full_name: "Unknown User" }
            }));

            setLoans(enrichedLoans);

        } catch (err) {
            console.error("Failed to fetch loans:", err);
            setError("Could not fetch loan activity.");
        } finally {
            setLoading(false);
        }
    }, [user, family.id]);

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