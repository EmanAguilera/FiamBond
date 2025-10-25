import { useContext, useState, useEffect, useCallback, lazy, Suspense } from "react";
import { AppContext } from "../Context/AppContext.jsx";
import { db } from '../config/firebase-config';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    documentId 
} from 'firebase/firestore';

// --- LAZY LOADED COMPONENTS FOR REPAYMENT ---
const Modal = lazy(() => import('./Modal.jsx'));
const MakeRepaymentWidget = lazy(() => import('./MakeRepaymentWidget.tsx'));


// --- FULL SKELETON LOADER COMPONENT ---
const LoanListSkeleton = () => (
    <div className="animate-pulse">
        <h3 className="font-bold text-lg text-gray-800 mb-2"></h3>
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
    today.setHours(0, 0, 0, 0);
    const deadlineDate = deadline;
    const timeDiff = deadlineDate.getTime() - today.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (dayDiff < 0) return <span className="text-xs font-semibold text-red-600">Overdue</span>;
    if (dayDiff <= 7) return <span className="text-xs font-semibold text-yellow-600">Due Soon</span>;
    return null;
};

// --- LOAN ITEM SUB-COMPONENT ---
const LoanItem = ({ loan, onRepaymentSuccess }) => {
    const { user } = useContext(AppContext);
    const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
    
    const isBorrower = user.uid === loan.debtor.id;
    const outstanding = parseFloat(loan.amount) - parseFloat(loan.repaid_amount);
    
    const creationDate = loan.created_at?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const deadlineDate = loan.deadline?.toDate();

    const handleSuccess = () => {
        setIsRepaymentModalOpen(false);
        if (onRepaymentSuccess) {
            onRepaymentSuccess();
        }
    };

    return (
        <>
            <Suspense fallback={<div/>}>
                {isRepaymentModalOpen && (
                    <Modal isOpen={isRepaymentModalOpen} onClose={() => setIsRepaymentModalOpen(false)} title="Make a Repayment">
                        <MakeRepaymentWidget loan={loan} onSuccess={handleSuccess} />
                    </Modal>
                )}
            </Suspense>

            <div className="p-4 border-b last:border-b-0 border-gray-100">
                <div className="flex justify-between items-start">
                    <div className="min-w-0 pr-4">
                        <p className="font-semibold text-gray-800 break-words">{loan.description}</p>
                        <div className="mt-1 text-xs text-gray-500 space-y-1">
                            <p>Date Created: {creationDate}</p>
                            <p>From: {loan.creditor.full_name} To: {loan.debtor.full_name}</p>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            Total Loan: <span className="font-mono">₱{parseFloat(loan.amount).toFixed(2)}</span>
                        </p>
                        {deadlineDate && (
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-gray-500">Due: {deadlineDate.toLocaleDateString()}</p>
                               <DeadlineNotification deadline={deadlineDate} outstanding={outstanding} />
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
                    <button onClick={() => setIsRepaymentModalOpen(true)} className="secondary-btn-sm w-full mt-3">
                        Make Repayment
                    </button>
                )}
            </div>
        </>
    );
};

// --- MAIN WIDGET COMPONENT ---
export default function LoanTrackingWidget({ family, onDataChange }) {
    const { user } = useContext(AppContext);
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const getLoans = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const loansRef = collection(db, "loans");

            let lentQuery = query(loansRef, where("creditor_id", "==", user.uid));
            let borrowedQuery = query(loansRef, where("debtor_id", "==", user.uid));

            if (family && family.id) {
                lentQuery = query(lentQuery, where("family_id", "==", family.id));
                borrowedQuery = query(borrowedQuery, where("family_id", "==", family.id));
            }

            const [lentSnapshot, borrowedSnapshot] = await Promise.all([
                getDocs(lentQuery),
                getDocs(borrowedQuery)
            ]);

            const userLoansMap = new Map();
            lentSnapshot.forEach(doc => userLoansMap.set(doc.id, { id: doc.id, ...doc.data() }));
            borrowedSnapshot.forEach(doc => userLoansMap.set(doc.id, { id: doc.id, ...doc.data() }));

            const fetchedLoans = Array.from(userLoansMap.values());

            if (fetchedLoans.length === 0) {
                setLoans([]);
                return;
            }

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

            const enrichedLoans = fetchedLoans
                .map(loan => ({
                    ...loan,
                    creditor: usersMap[loan.creditor_id] || { full_name: "Unknown User" },
                    debtor: usersMap[loan.debtor_id] || { full_name: "Unknown User" }
                }))
                .sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis());

            setLoans(enrichedLoans);

        } catch (err) {
            console.error("Failed to fetch loans:", err);
            setError("Could not fetch loan activity.");
        } finally {
            setLoading(false);
        }
    // THE FIX IS HERE: Add the full 'family' object to the dependency array.
    }, [user, family]);

    useEffect(() => {
        getLoans();
    }, [getLoans]);

    const handleRepaymentSuccess = () => {
        getLoans();
        if (onDataChange) {
            onDataChange();
        }
    };

    if (loading) return <LoanListSkeleton />;
    if (error) return <p className="error text-center py-4">{error}</p>;
    
    const title = family ? `Lending for ${family.family_name}` : "All Your Lending Activity";

    return (
        <div>
            <h3 className="font-bold text-lg text-gray-800 mb-2">{title}</h3>
            <div className="dashboard-card p-0">
                {loans.length > 0 ? (
                    loans.map(loan => <LoanItem key={loan.id} loan={loan} onRepaymentSuccess={handleRepaymentSuccess} />)
                ) : (
                    <p className="text-center italic text-gray-500 py-4 px-3">
                        {family ? "No lending activity in this family yet." : "You have no personal lending activity yet."}
                    </p>
                )}
            </div>
        </div>
    );
}