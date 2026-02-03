'use client';

import { useContext, useEffect, useState, useCallback, Suspense, ReactNode } from "react";
import dynamic from "next/dynamic";
import { AppContext } from "../../../Context/AppContext";
import { db } from '../../../config/firebase-config';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { API_BASE_URL } from "@/src/config/apiConfig"; // <--- ADDED IMPORT

// --- DYNAMIC IMPORTS ---
const Modal = dynamic(() => import('../../Modal'), { ssr: false });
const MakeRepaymentWidget = dynamic(() => import('./Actions/MakeRepaymentWidget'), { ssr: false });
const RecordPersonalRepaymentWidget = dynamic(() => import('./Actions/RecordPersonalRepaymentWidget'), { ssr: false });
const LoanConfirmationWidget = dynamic(() => import('./Actions/LoanConfirmationWidget'), { ssr: false });
const RepaymentConfirmationWidget = dynamic(() => import('./Actions/RepaymentConfirmationWidget'), { ssr: false });

// --- INTERFACES ---
interface UserProfile {
    id: string;
    full_name: string;
    [key: string]: any;
}

interface Loan {
    id: string;
    _id?: string;
    family_id: string | null;
    creditor_id: string;
    debtor_id: string | null;
    debtor_name?: string;
    amount: number;
    total_owed?: number;
    repaid_amount?: number;
    status: string;
    description: string;
    attachment_url?: string;
    created_at: { toDate: () => Date; toMillis: () => number };
    deadline?: { toDate: () => Date } | null;
    pending_repayment?: {
        receipt_url?: string;
    };
    repayment_receipts?: any[];
    creditor?: UserProfile;
    debtor?: UserProfile;
}

interface LoanTrackingWidgetProps {
    family?: { id: string; family_name: string; } | null;
    onDataChange?: () => void;
}

interface CollapsibleSectionProps {
    title: string;
    colorClass: string;
    count: number;
    isOpen: boolean;
    onClick: () => void;
    children: ReactNode;
}

// --- SKELETON (kept as is) ---
const LoanListSkeleton = () => (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden p-4">
        <div className="flex border-b border-slate-200 mb-4">
            <div className="h-10 w-1/2 bg-slate-100 rounded-t"></div>
            <div className="h-10 w-1/2 bg-white rounded-t"></div>
        </div>
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 bg-white border border-slate-200 rounded-lg">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <div className="h-6 w-48 bg-slate-200 rounded"></div>
                            <div className="h-4 w-32 bg-slate-100 rounded"></div>
                        </div>
                        <div className="h-7 w-28 bg-slate-200 rounded"></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// --- HELPER COMPONENTS (kept as is) ---
const DeadlineNotification = ({ deadline, outstanding }: { deadline: Date | undefined; outstanding: number }) => {
    if (!deadline || outstanding <= 0) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const timeDiff = deadline.getTime() - today.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (dayDiff < 0) return <span className="text-rose-600 font-bold ml-2">(Overdue)</span>;
    if (dayDiff <= 7) return <span className="text-amber-600 font-bold ml-2">(Due Soon)</span>;
    return null;
};

const ChevronDownIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
);

const CollapsibleSection = ({ title, colorClass, count, isOpen, onClick, children }: CollapsibleSectionProps) => (
    <div className="border border-slate-200 rounded-lg overflow-hidden mb-3">
        <button 
            onClick={onClick} 
            className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
        >
            <div className="flex items-center gap-3">
                <h4 className={`font-bold text-lg ${colorClass}`}>{title}</h4>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 shadow-sm`}>{count}</span>
            </div>
            <ChevronDownIcon className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && <div className="p-4 bg-white border-t border-slate-200 space-y-3">{children}</div>}
    </div>
);

// --- LOAN ITEM (kept as is) ---
const LoanItem = ({ loan, onRepaymentSuccess }: { loan: Loan; onRepaymentSuccess: () => void }) => {
    const { user } = useContext(AppContext);
    
    const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
    const [isRecordRepaymentModalOpen, setIsRecordRepaymentModalOpen] = useState(false);
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [isRepayConfirmModalOpen, setIsRepayConfirmModalOpen] = useState(false);
    
    if (!user) return null;

    const isPersonalLoan = !loan.family_id;
    const isCreditor = user.uid === loan.creditor_id;
    const isBorrower = user.uid === loan.debtor_id;
    const totalOwed = loan.total_owed || loan.amount; 
    const outstanding = totalOwed - (loan.repaid_amount || 0);
    
    const isPendingInitialConfirmation = isBorrower && loan.status === 'pending_confirmation';
    const isPendingRepaymentConfirmation = isCreditor && !!loan.pending_repayment;
    const isRepaid = loan.status === 'paid' || loan.status === 'repaid';
    const isDebtorWaitingForApproval = isBorrower && !!loan.pending_repayment;
    
    const creationDate = loan.created_at?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const deadlineDate = loan.deadline?.toDate();
    
    const handleSuccess = () => {
        setIsRepaymentModalOpen(false);
        setIsRecordRepaymentModalOpen(false);
        setIsConfirmationModalOpen(false);
        setIsRepayConfirmModalOpen(false);
        if (onRepaymentSuccess) onRepaymentSuccess();
    };
    
    const debtorDisplayName = loan.debtor?.full_name || loan.debtor_name || 'Borrower';
    const creditorDisplayName = loan.creditor?.full_name || 'Creditor';

    const isActionRequired = isPendingInitialConfirmation || isPendingRepaymentConfirmation;
    const borderClass = isActionRequired ? 'border-amber-400 bg-amber-50' : 'border-slate-200';
    const opacityClass = isRepaid ? 'opacity-75 bg-slate-50' : 'bg-white';

    return (
        <div className={`rounded-lg border shadow-sm transition-all hover:shadow-md p-4 ${borderClass} ${opacityClass}`}>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        {isActionRequired && <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-200 px-1.5 py-0.5 rounded">Action Required</span>}
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${isPersonalLoan ? 'bg-slate-100 text-slate-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {isPersonalLoan ? 'Personal' : 'Family'}
                        </span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg leading-tight">{loan.description}</h3>
                </div>
                <div className="text-right">
                    {isRepaid ? (
                        <span className="block font-bold text-emerald-600 text-lg">REPAID</span>
                    ) : (
                        <div className="flex flex-col items-end">
                            <span className={`block font-bold text-lg ${isCreditor ? 'text-emerald-600' : 'text-rose-600'}`}>
                                ₱{outstanding.toLocaleString('en-US', {minimumFractionDigits: 2})}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">{isCreditor ? 'You lent' : 'You owe'}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="text-xs text-slate-500 space-y-1 mb-3">
                <p>
                    {isCreditor ? `Lending to: ${debtorDisplayName}` : `Borrowed from: ${creditorDisplayName}`}
                    <span className="mx-2">•</span>
                    Created: {creationDate}
                </p>
                
                <div className="flex items-center gap-2">
                    {deadlineDate && !isRepaid && (
                        <span>
                            Deadline: <strong className="text-slate-700">{deadlineDate.toLocaleDateString()}</strong>
                            <DeadlineNotification deadline={deadlineDate} outstanding={outstanding} />
                        </span>
                    )}
                    
                    {(loan.attachment_url || loan.pending_repayment?.receipt_url) && (
                        <>
                            <span className="text-slate-300">|</span>
                            {loan.attachment_url && (
                                <a href={loan.attachment_url} target="_blank" rel="noopener noreferrer" className="font-bold text-indigo-600 hover:underline">
                                    View Loan Receipt
                                </a>
                            )}
                            {loan.pending_repayment?.receipt_url && (
                                <a href={loan.pending_repayment.receipt_url} target="_blank" rel="noopener noreferrer" className="font-bold text-indigo-600 hover:underline ml-2">
                                    View Payment Proof
                                </a>
                            )}
                        </>
                    )}
                </div>
            </div>

            {!isRepaid && (
                <div className={`pt-3 border-t ${isActionRequired ? 'border-amber-200' : 'border-slate-100'} flex justify-end gap-2`}>
                    
                    {isPendingInitialConfirmation && (
                        <button onClick={() => setIsConfirmationModalOpen(true)} className="px-3 py-1.5 text-xs font-bold text-white bg-amber-500 rounded hover:bg-amber-600 transition-colors shadow-sm">
                            Confirm Funds Received
                        </button>
                    )}

                    {isPendingRepaymentConfirmation && (
                        <button onClick={() => setIsRepayConfirmModalOpen(true)} className="px-3 py-1.5 text-xs font-bold text-white bg-amber-500 rounded hover:bg-amber-600 transition-colors shadow-sm">
                            Confirm Repayment
                        </button>
                    )}

                    {isDebtorWaitingForApproval && (
                        <span className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-100 rounded">
                            Waiting for lender approval...
                        </span>
                    )}

                    {!isPendingInitialConfirmation && !isPendingRepaymentConfirmation && !isDebtorWaitingForApproval && (
                        <>
                            {isBorrower && outstanding > 0 && (
                                <button onClick={() => setIsRepaymentModalOpen(true)} className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors">
                                    Make Repayment
                                </button>
                            )}
                            {isCreditor && outstanding > 0 && loan.status === 'outstanding' && !loan.pending_repayment && (
                                <button
                                    onClick={() => setIsRecordRepaymentModalOpen(true)}
                                    disabled={!isPersonalLoan}
                                    className={`px-3 py-1.5 text-xs font-bold text-white rounded transition-colors shadow-sm ${!isPersonalLoan ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                >
                                    Record Repayment
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}
            
            <Suspense fallback={<div/>}>
                {isRepaymentModalOpen && <Modal isOpen={isRepaymentModalOpen} onClose={() => setIsRepaymentModalOpen(false)} title="Make a Repayment"><MakeRepaymentWidget loan={loan} onSuccess={handleSuccess} /></Modal>}
                {isRecordRepaymentModalOpen && <Modal isOpen={isRecordRepaymentModalOpen} onClose={() => setIsRecordRepaymentModalOpen(false)} title="Record Repayment Received"><RecordPersonalRepaymentWidget loan={loan} onSuccess={handleSuccess} /></Modal>}
                {isConfirmationModalOpen && <Modal isOpen={isConfirmationModalOpen} onClose={() => setIsConfirmationModalOpen(false)} title="Confirm Loan Receipt"><LoanConfirmationWidget loan={loan} onSuccess={handleSuccess} /></Modal>}
                {isRepayConfirmModalOpen && <Modal isOpen={isRepayConfirmModalOpen} onClose={() => setIsRepayConfirmModalOpen(false)} title="Confirm Repayment"><RepaymentConfirmationWidget loan={loan} onSuccess={handleSuccess} /></Modal>}
            </Suspense>
        </div>
    );
};

// --- MAIN WIDGET ---
export default function LoanTrackingWidget({ family, onDataChange }: LoanTrackingWidgetProps) {
    const { user } = useContext(AppContext);
    // REMOVED: const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    const [activeTab, setActiveTab] = useState<'outstanding' | 'history'>('outstanding');
    const [openSection, setOpenSection] = useState<string | null>('actionRequired');

    const [categorizedLoans, setCategorizedLoans] = useState<{
        actionRequired: Loan[];
        lent: Loan[];
        borrowed: Loan[];
        repaid: Loan[];
    }>({ actionRequired: [], lent: [], borrowed: [], repaid: [] });
    
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const handleToggleSection = (section: string) => {
        setOpenSection(prev => (prev === section ? null : section));
    };

    const getLoans = useCallback(async () => {
        if (!user) return; 
        setLoading(true); 
        setError(null);
        
        // ⭐️ CRITICAL FIX: Guard Clause for db 
        if (!db) {
            console.warn("Firestore not initialized. Cannot fetch user details.");
        }
        
        try {
            // UPDATED: Using the imported API_BASE_URL
            const response = await fetch(`${API_BASE_URL}/loans?user_id=${user.uid}`);
            if (!response.ok) throw new Error("Failed to fetch loans");
            
            const rawLoans: any[] = await response.json();
            let filteredLoans = rawLoans;
            if (family && family.id) {
                filteredLoans = rawLoans.filter((l) => l.family_id === family.id);
            }

            const allLoans: Loan[] = filteredLoans.map((l) => ({
                ...l,
                id: l._id, 
                created_at: l.created_at ? { toDate: () => new Date(l.created_at), toMillis: () => new Date(l.created_at).getTime() } : { toDate: () => new Date(), toMillis: () => Date.now() },
                deadline: l.deadline ? { toDate: () => new Date(l.deadline) } : null,
                repayment_receipts: l.repayment_receipts?.map((r: any) => ({ ...r, recorded_at: { toDate: () => new Date(r.recorded_at) } }))
            }));

            const userIds = new Set<string>();
            allLoans.forEach((loan) => { 
                if (loan.creditor_id) userIds.add(loan.creditor_id); 
                if (loan.debtor_id) userIds.add(loan.debtor_id); 
            });
            
            const usersMap: Record<string, UserProfile> = {};
            if (userIds.size > 0 && db) { 
                const usersQuery = query(collection(db, "users"), where(documentId(), "in", [...userIds])); 
                const usersSnapshot = await getDocs(usersQuery); 
                usersSnapshot.forEach(doc => { usersMap[doc.id] = { id: doc.id, full_name: "Unknown", ...doc.data() } as UserProfile; }); 
            }
            
            const enrichedLoans = allLoans
                .map((loan) => ({ 
                    ...loan, 
                    creditor: usersMap[loan.creditor_id] || { id: 'unknown', full_name: "Unknown" }, 
                    debtor: loan.debtor_id ? usersMap[loan.debtor_id] : undefined 
                }))
                .sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis());

            const actionRequired: Loan[] = [];
            const lent: Loan[] = [];
            const borrowed: Loan[] = [];
            const repaid: Loan[] = [];
            
            for (const loan of enrichedLoans) {
                if (loan.status === 'paid' || loan.status === 'repaid') { 
                    repaid.push(loan); 
                    continue; 
                }
                const isCreditor = user.uid === loan.creditor_id;
                
                if ((loan.status === 'pending_confirmation') || (isCreditor && !!loan.pending_repayment)) {
                    actionRequired.push(loan);
                } else if (isCreditor) {
                    lent.push(loan); 
                } else {
                    borrowed.push(loan); 
                }
            }
            setCategorizedLoans({ actionRequired, lent, borrowed, repaid });

        } catch (err: any) { 
            console.error("Failed to fetch loans:", err); 
            setError(err instanceof Error ? err.message : "Could not fetch loan activity."); 
        } finally { 
            setLoading(false); 
        }
    }, [user, family]); // UPDATED dependency array: API_BASE_URL is a constant, so it's removed.

    useEffect(() => { getLoans(); }, [getLoans]);

    const handleRepaymentSuccess = () => { 
        getLoans(); 
        if (onDataChange) { onDataChange(); } 
    };

    if (loading) return <LoanListSkeleton />;
    if (error) return <p className="text-center text-rose-500 py-6 bg-rose-50 rounded-lg border border-rose-100">{error}</p>;
    
    const { actionRequired, lent, borrowed, repaid } = categorizedLoans;
    const hasNoOutstandingLoans = actionRequired.length === 0 && lent.length === 0 && borrowed.length === 0;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex border-b border-slate-200">
                <button 
                    onClick={() => setActiveTab('outstanding')} 
                    className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${activeTab === 'outstanding' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    Outstanding Loans
                </button>
                <button 
                    onClick={() => setActiveTab('history')} 
                    className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${activeTab === 'history' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    Loan History
                </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-4">
                {activeTab === 'outstanding' && (
                    <div className="space-y-2">
                        {hasNoOutstandingLoans ? (
                            <p className="text-center text-slate-400 italic py-6">You have no outstanding loans.</p>
                        ) : (
                            <>
                                {actionRequired.length > 0 && (
                                    <CollapsibleSection title="Action Required" colorClass="text-amber-700" count={actionRequired.length} isOpen={openSection === 'actionRequired'} onClick={() => handleToggleSection('actionRequired')}>
                                        {actionRequired.map(loan => <LoanItem key={loan.id} loan={loan} onRepaymentSuccess={handleRepaymentSuccess} />)}
                                    </CollapsibleSection>
                                )}
                                {lent.length > 0 && (
                                    <CollapsibleSection title="Money You've Lent" colorClass="text-indigo-700" count={lent.length} isOpen={openSection === 'lent'} onClick={() => handleToggleSection('lent')}>
                                        {lent.map(loan => <LoanItem key={loan.id} loan={loan} onRepaymentSuccess={handleRepaymentSuccess} />)}
                                    </CollapsibleSection>
                                )}
                                {borrowed.length > 0 && (
                                    <CollapsibleSection title="Money You've Borrowed" colorClass="text-rose-700" count={borrowed.length} isOpen={openSection === 'borrowed'} onClick={() => handleToggleSection('borrowed')}>
                                        {borrowed.map(loan => <LoanItem key={loan.id} loan={loan} onRepaymentSuccess={handleRepaymentSuccess} />)}
                                    </CollapsibleSection>
                                )}
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div>
                        {repaid.length === 0 ? (
                            <p className="text-center text-slate-400 italic py-6">You have no repaid loans in your history.</p>
                        ) : (
                            <div className="space-y-3">
                                {repaid.map(loan => <LoanItem key={loan.id} loan={loan} onRepaymentSuccess={handleRepaymentSuccess} />)}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}