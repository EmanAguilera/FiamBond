import { useContext, useState, useEffect, useCallback, lazy, Suspense } from "react";
import { AppContext } from "../../Context/AppContext.jsx";
import { db } from '../../config/firebase-config.js';
import { collection, query, where, getDocs, documentId, Timestamp } from 'firebase/firestore';
import { Loan, User } from "../../types";

// --- LAZY LOADED COMPONENTS ---
const Modal = lazy(() => import('../Modal.jsx'));
const MakeRepaymentWidget = lazy(() => import('./MakeRepaymentWidget'));
const RecordPersonalRepaymentWidget = lazy(() => import('./RecordPersonalRepaymentWidget'));
const LoanConfirmationWidget = lazy(() => import('./LoanConfirmationWidget'));
const RepaymentConfirmationWidget = lazy(() => import('./RepaymentConfirmationWidget'));

// --- TYPE DEFINITIONS ---
interface LoanTrackingWidgetProps {
    family?: { id: string; family_name: string; } | null;
    onDataChange?: () => void;
}

// --- SKELETON LOADER ---
const LoanListSkeleton = () => (
    <div className="animate-pulse">
        <div className="h-8 w-1/2 bg-slate-200 rounded mb-4"></div>
        <div className="h-10 w-full bg-slate-200 rounded mb-6"></div>
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 bg-white border border-slate-200 rounded-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="h-6 w-48 bg-slate-200 rounded"></div>
                            <div className="h-4 w-32 bg-slate-200 rounded mt-3"></div>
                        </div>
                        <div className="h-7 w-28 bg-slate-200 rounded"></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// --- DEADLINE NOTIFICATION HELPER ---
const DeadlineNotification = ({ deadline, outstanding }: { deadline: Date; outstanding: number; }) => {
    if (!deadline || outstanding <= 0) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const timeDiff = deadline.getTime() - today.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    if (dayDiff < 0) return <span className="text-xs font-semibold text-red-600">Overdue</span>;
    if (dayDiff <= 7) return <span className="text-xs font-semibold text-yellow-600">Due Soon</span>;
    return null;
};


// --- REFINED LOAN ITEM SUB-COMPONENT ---
const LoanItem = ({ loan, onRepaymentSuccess }: { loan: Loan; onRepaymentSuccess: () => void; }) => {
    const { user } = useContext(AppContext);
    const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
    const [isRecordRepaymentModalOpen, setIsRecordRepaymentModalOpen] = useState(false);
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [isRepayConfirmModalOpen, setIsRepayConfirmModalOpen] = useState(false);
    
    if (!user) return null;
    const isCreditor = user.uid === loan.creditor_id;
    const isBorrower = user.uid === loan.debtor_id;
    const totalOwed = loan.total_owed || loan.amount; 
    const outstanding = totalOwed - (loan.repaid_amount || 0);
    const isPendingInitialConfirmation = isBorrower && loan.status === 'pending_confirmation';
    const isPendingRepaymentConfirmation = isCreditor && !!loan.pending_repayment;
    const isRepaid = loan.status === 'repaid';
    const creationDate = loan.created_at?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const deadlineDate = loan.deadline?.toDate();
    const handleSuccess = () => { setIsRepaymentModalOpen(false); setIsRecordRepaymentModalOpen(false); setIsConfirmationModalOpen(false); setIsRepayConfirmModalOpen(false); if (onRepaymentSuccess) onRepaymentSuccess(); };
    const debtorDisplayName = loan.debtor?.full_name || loan.debtor_name || 'Borrower';
    const BellIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>);

    return (
        <div className={`bg-white border rounded-lg shadow-sm transition-all hover:shadow-md ${isPendingInitialConfirmation || isPendingRepaymentConfirmation ? 'border-amber-400' : 'border-gray-200'} ${isRepaid ? 'opacity-70' : ''}`}>
            <div className="p-4">
                <div className="flex justify-between items-start">
                    <div className="min-w-0 pr-4">
                        <p className="font-bold text-gray-800 break-words">{loan.description}</p>
                        <div className="mt-1 text-xs text-gray-500 space-y-1">
                            <p>From: <span className="font-medium text-gray-700">{loan.creditor.full_name}</span></p>
                            <p>To: <span className="font-medium text-gray-700">{debtorDisplayName}</span></p>
                        </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                        {isRepaid ? (
                            <span className="px-3 py-1 text-xs font-bold text-green-800 bg-green-100 rounded-full">REPAID</span>
                        ) : loan.status !== 'pending_confirmation' ? (
                            <>
                                <p className={`font-bold text-lg ${outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>₱{outstanding.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                                <small className="text-xs text-gray-500">Outstanding</small>
                            </>
                        ) : (
                            // Show a "Pending" status for the creditor before confirmation
                            isCreditor && <span className="px-3 py-1 text-xs font-bold text-gray-600 bg-gray-100 rounded-full">PENDING</span>
                        )}
                    </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                    <div>
                        <span>Created: </span>
                        <span className="font-semibold text-gray-600">{creationDate}</span>
                    </div>
                    
                    {deadlineDate && !isRepaid && (
                        <div className="flex items-center gap-2">
                            <span>Deadline: </span>
                            <span className="font-semibold text-gray-600">{deadlineDate.toLocaleDateString()}</span>
                            <DeadlineNotification deadline={deadlineDate} outstanding={outstanding} />
                        </div>
                    )}
                </div>
            </div>
            

            {!isRepaid && (
     <div className={`px-4 py-2.5 rounded-b-lg border-t flex justify-end items-center space-x-3 ${isPendingInitialConfirmation || isPendingRepaymentConfirmation ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
        
        {/* Action Required Buttons - NOW WITH YOUR PREFERRED DESIGN */}
        {isPendingInitialConfirmation && (
            <button 
                onClick={() => setIsConfirmationModalOpen(true)} 
                className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-amber-500 rounded-lg shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-75 transition-colors duration-200"
            >
                <BellIcon />
                Confirm Funds Receipt
            </button>
        )}
        {isPendingRepaymentConfirmation && (
            <button 
                onClick={() => setIsRepayConfirmModalOpen(true)} 
                className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-amber-500 rounded-lg shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-opacity-75 transition-colors duration-200"
            >
                <BellIcon />
                Confirm Repayment
            </button>
        )}
        
        {/* Standard Action Buttons - Unchanged */}
        {!isPendingInitialConfirmation && !isPendingRepaymentConfirmation && (
            <>
                {isBorrower && outstanding > 0 && (
                    <button 
                        onClick={() => setIsRepaymentModalOpen(true)} 
                        className="secondary-btn-sm text-xs"
                    >
                        Make Repayment
                    </button>
                )}
                {isCreditor && outstanding > 0 && loan.status === 'outstanding' && (
                    <button 
                        onClick={() => setIsRecordRepaymentModalOpen(true)} 
                        className="primary-btn-sm text-xs"
                    >
                        Record Repayment
                    </button>
                )}
            </>
        )}
    </div>
)}
            
            <Suspense fallback={<div/>}>{isRepaymentModalOpen && <Modal isOpen={isRepaymentModalOpen} onClose={() => setIsRepaymentModalOpen(false)} title="Make a Repayment"><MakeRepaymentWidget loan={loan} onSuccess={handleSuccess} /></Modal>}{isRecordRepaymentModalOpen && <Modal isOpen={isRecordRepaymentModalOpen} onClose={() => setIsRecordRepaymentModalOpen(false)} title="Record Repayment Received"><RecordPersonalRepaymentWidget loan={loan} onSuccess={handleSuccess} /></Modal>}{isConfirmationModalOpen && <Modal isOpen={isConfirmationModalOpen} onClose={() => setIsConfirmationModalOpen(false)} title="Confirm Loan Receipt"><LoanConfirmationWidget loan={loan} onSuccess={handleSuccess} /></Modal>}{isRepayConfirmModalOpen && <Modal isOpen={isRepayConfirmModalOpen} onClose={() => setIsRepayConfirmModalOpen(false)} title="Confirm Repayment"><RepaymentConfirmationWidget loan={loan} onSuccess={handleSuccess} /></Modal>}</Suspense>
        </div>
    );
};


// --- MAIN WIDGET COMPONENT (NO CHANGES BELOW THIS LINE) ---
export default function LoanTrackingWidget({ family, onDataChange }: LoanTrackingWidgetProps) {
    const { user } = useContext(AppContext);
    const [activeTab, setActiveTab] = useState<'outstanding' | 'history'>('outstanding');
    const [categorizedLoans, setCategorizedLoans] = useState<{ actionRequired: Loan[]; lent: Loan[]; borrowed: Loan[]; repaid: Loan[]; }>({ actionRequired: [], lent: [], borrowed: [], repaid: [] });
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const getLoans = useCallback(async () => {
        if (!user) return; setLoading(true); setError(null);
        try {
            const loansRef = collection(db, "loans");
            let lentQuery = query(loansRef, where("creditor_id", "==", user.uid));
            let borrowedQuery = query(loansRef, where("debtor_id", "==", user.uid));
            if (family && family.id) { lentQuery = query(lentQuery, where("family_id", "==", family.id)); borrowedQuery = query(borrowedQuery, where("family_id", "==", family.id)); }
            const [lentSnapshot, borrowedSnapshot] = await Promise.all([getDocs(lentQuery), getDocs(borrowedQuery)]);
            const userLoansMap = new Map<string, any>();
            lentSnapshot.forEach(doc => userLoansMap.set(doc.id, { id: doc.id, ...doc.data() }));
            borrowedSnapshot.forEach(doc => userLoansMap.set(doc.id, { id: doc.id, ...doc.data() }));
            const fetchedLoans = Array.from(userLoansMap.values());
            if (fetchedLoans.length === 0) { setCategorizedLoans({ actionRequired: [], lent: [], borrowed: [], repaid: [] }); setLoading(false); return; }
            const userIds = new Set<string>();
            fetchedLoans.forEach(loan => { if (loan.creditor_id) userIds.add(loan.creditor_id); if (loan.debtor_id) userIds.add(loan.debtor_id); });
            const usersMap: { [key: string]: User } = {};
            if (userIds.size > 0) { const usersQuery = query(collection(db, "users"), where(documentId(), "in", [...userIds])); const usersSnapshot = await getDocs(usersQuery); usersSnapshot.forEach(doc => { usersMap[doc.id] = { id: doc.id, ...doc.data() } as User; }); }
            const enrichedLoans: Loan[] = fetchedLoans.map((loan): Loan => ({ ...loan, creditor: usersMap[loan.creditor_id] || { id: 'unknown', full_name: "Unknown" }, debtor: loan.debtor_id ? usersMap[loan.debtor_id] : null })).sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis());
            const actionRequired: Loan[] = [], lent: Loan[] = [], borrowed: Loan[] = [], repaid: Loan[] = [];
            for (const loan of enrichedLoans) {
                if (loan.status === 'repaid') { repaid.push(loan); continue; }
                const isCreditor = user.uid === loan.creditor_id;
                const isBorrower = user.uid === loan.debtor_id;
                const isPendingInitialConfirmation = isBorrower && loan.status === 'pending_confirmation';
                const isPendingRepaymentConfirmation = isCreditor && !!loan.pending_repayment;
                if (isPendingInitialConfirmation || isPendingRepaymentConfirmation) { actionRequired.push(loan); }
                else if (isCreditor) { lent.push(loan); }
                else if (isBorrower) { borrowed.push(loan); }
            }
            setCategorizedLoans({ actionRequired, lent, borrowed, repaid });
        } catch (err) { console.error("Failed to fetch loans:", err); setError("Could not fetch loan activity."); } 
        finally { setLoading(false); }
    }, [user, family]);

    useEffect(() => { getLoans(); }, [getLoans]);
    const handleRepaymentSuccess = () => { getLoans(); if (onDataChange) { onDataChange(); } };

    if (loading) return <LoanListSkeleton />;
    if (error) return <p className="error text-center py-4">{error}</p>;
    
    const { actionRequired, lent, borrowed, repaid } = categorizedLoans;
    const hasNoOutstandingLoans = actionRequired.length === 0 && lent.length === 0 && borrowed.length === 0;
    const SectionHeader = ({ title, color, count }: { title: string, color: string, count: number }) => (<div className="flex items-center gap-3"><h4 className={`font-bold text-lg ${color}`}>{title}</h4><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color.replace('text', 'bg').replace('-700', '-100')} ${color.replace('text', 'text').replace('-700', '-800')}`}>{count}</span></div>);

    return (
        <div>
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-6">
                    <button onClick={() => setActiveTab('outstanding')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'outstanding' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Outstanding</button>
                    <button onClick={() => setActiveTab('history')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'history' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>History</button>
                </nav>
            </div>

            {activeTab === 'outstanding' && (
                <div>
                    {hasNoOutstandingLoans ? <p className="text-center italic text-gray-500 py-4 px-3">You have no outstanding loans.</p> : <div className="space-y-6">
                        {actionRequired.length > 0 && <section><SectionHeader title="Action Required" color="text-amber-700" count={actionRequired.length} /><div className="mt-2 space-y-3">{actionRequired.map(loan => <LoanItem key={loan.id} loan={loan} onRepaymentSuccess={handleRepaymentSuccess} />)}</div></section>}
                        {lent.length > 0 && <section><SectionHeader title="Money You've Lent" color="text-blue-700" count={lent.length} /><div className="mt-2 space-y-3">{lent.map(loan => <LoanItem key={loan.id} loan={loan} onRepaymentSuccess={handleRepaymentSuccess} />)}</div></section>}
                        {borrowed.length > 0 && <section><SectionHeader title="Money You've Borrowed" color="text-red-700" count={borrowed.length} /><div className="mt-2 space-y-3">{borrowed.map(loan => <LoanItem key={loan.id} loan={loan} onRepaymentSuccess={handleRepaymentSuccess} />)}</div></section>}
                    </div>}
                </div>
            )}
            {activeTab === 'history' && (
                <div>
                    {repaid.length === 0 ? <p className="text-center italic text-gray-500 py-4 px-3">You have no repaid loans in your history.</p> : <section><SectionHeader title="Completed Loans" color="text-gray-700" count={repaid.length} /><div className="mt-2 space-y-3">{repaid.map(loan => <LoanItem key={loan.id} loan={loan} onRepaymentSuccess={handleRepaymentSuccess} />)}</div></section>}
                </div>
            )}
        </div>
    );
}