'use client';

import React, { useContext, useEffect, useState, useCallback, Suspense, ReactNode } from "react";
import dynamic from "next/dynamic";
import { AppContext } from "../../../Context/AppContext";
import { db } from '../../../config/firebase-config';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { API_BASE_URL } from "@/src/config/apiConfig";
import { toast } from 'react-hot-toast';

// --- DYNAMIC IMPORTS ---
// Assuming these are TSX/JSX files
const Modal = dynamic(() => import('../../Modal'), { ssr: false });
const MakeRepaymentWidget = dynamic(() => import('./Actions/MakeRepaymentWidget'), { ssr: false });
const RecordPersonalRepaymentWidget = dynamic(() => import('./Actions/RecordPersonalRepaymentWidget'), { ssr: false });
const LoanConfirmationWidget = dynamic(() => import('./Actions/LoanConfirmationWidget'), { ssr: false });
const RepaymentConfirmationWidget = dynamic(() => import('./Actions/RepaymentConfirmationWidget'), { ssr: false });

// --- INTERFACES ---
interface UserProfile {
    id: string;
    full_name: string;
    display_name?: string; // Added for robustness
    [key: string]: any;
}

interface FirestoreDate {
    toDate: () => Date;
    toMillis: () => number;
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
    created_at: FirestoreDate;
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

// --- SKELETON (Retained fixed UI) ---
const LoanListSkeleton: React.FC = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-t-2xl border-b border-slate-200">
            <div className="h-10 w-full bg-slate-100 rounded-lg animate-pulse"></div>
            <div className="h-10 w-full bg-slate-50 rounded-lg animate-pulse"></div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse"></div>
                            <div className="h-4 w-32 bg-slate-100 rounded animate-pulse"></div>
                        </div>
                        <div className="h-7 w-20 bg-indigo-100 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <div className="h-8 w-1/4 bg-slate-100 rounded-lg animate-pulse"></div>
                        <div className="h-8 w-1/4 bg-indigo-100 rounded-lg animate-pulse"></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// --- HELPER COMPONENTS (Retained fixed UI, restored types) ---
const DeadlineNotification: React.FC<{ deadline: Date | undefined; outstanding: number }> = ({ deadline, outstanding }) => {
    if (!deadline || outstanding <= 0) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const timeDiff = deadline.getTime() - today.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (dayDiff < 0) return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-700 ml-2">(OVERDUE)</span>;
    if (dayDiff <= 7) return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700 ml-2">(DUE SOON)</span>;
    return null;
};

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
);

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, colorClass, count, isOpen, onClick, children }) => (
    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-3">
        <button 
            onClick={onClick} 
            className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
        >
            <div className="flex items-center gap-3">
                <h4 className={`font-extrabold text-lg ${colorClass}`}>{title}</h4>
                <span className={`text-xs font-bold px-3 py-1 rounded-full bg-white border border-slate-300 text-slate-600 shadow-sm`}>{count}</span>
            </div>
            <ChevronDownIcon className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && <div className="p-4 bg-white border-t border-slate-200 space-y-4">{children}</div>}
    </div>
);

// --- LOAN ITEM (Retained fixed UI, restored types) ---
const LoanItem: React.FC<{ loan: Loan; onRepaymentSuccess: () => void }> = ({ loan, onRepaymentSuccess }) => {
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
    
    const handleSuccess = useCallback(() => {
        setIsRepaymentModalOpen(false);
        setIsRecordRepaymentModalOpen(false);
        setIsConfirmationModalOpen(false);
        setIsRepayConfirmModalOpen(false);
        if (onRepaymentSuccess) onRepaymentSuccess();
    }, [onRepaymentSuccess]);
    
    const debtorDisplayName = loan.debtor?.full_name || loan.debtor_name || 'Borrower';
    const creditorDisplayName = loan.creditor?.full_name || loan.creditor?.display_name || 'Creditor';

    const isActionRequired = isPendingInitialConfirmation || isPendingRepaymentConfirmation;
    const borderClass = isActionRequired ? 'border-amber-400 bg-amber-50/70' : 'border-slate-200';
    const opacityClass = isRepaid ? 'opacity-80 bg-slate-50' : 'bg-white';
    const totalRepaidAmount = loan.repaid_amount || 0;

    return (
        <div className={`rounded-xl border shadow-md transition-all hover:shadow-lg p-4 ${borderClass} ${opacityClass}`}>
            <div className="flex justify-between items-start mb-3">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        {isActionRequired && <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-200 px-2 py-1 rounded-full">Action Required</span>}
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${isPersonalLoan ? 'bg-slate-100 text-slate-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {isPersonalLoan ? 'Personal' : 'Family'}
                        </span>
                    </div>
                    <h3 className="font-extrabold text-gray-800 text-xl leading-tight">{loan.description}</h3>
                </div>
                <div className="text-right flex-shrink-0">
                    {isRepaid ? (
                        <span className="block font-extrabold text-emerald-600 text-2xl">REPAID</span>
                    ) : (
                        <div className="flex flex-col items-end">
                            <span className={`block font-extrabold text-2xl ${isCreditor ? 'text-emerald-600' : 'text-rose-600'}`}>
                                ₱{outstanding.toLocaleString('en-US', {minimumFractionDigits: 2})}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">{isCreditor ? 'Outstanding Lent' : 'Outstanding Owed'}</span>
                            {totalRepaidAmount > 0 && <span className="text-[10px] text-slate-400 font-medium mt-1">₱{totalRepaidAmount.toLocaleString('en-US', {minimumFractionDigits: 2})} repaid</span>}
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
                
                <div className="flex items-center flex-wrap gap-2">
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
                <div className={`pt-3 border-t ${isActionRequired ? 'border-amber-300' : 'border-slate-100'} flex justify-end gap-2`}>
                    
                    {isPendingInitialConfirmation && (
                        <button onClick={() => setIsConfirmationModalOpen(true)} className="px-4 py-2 text-xs font-bold text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors shadow-md shadow-amber-100 active:scale-95">
                            Confirm Funds Received
                        </button>
                    )}

                    {isPendingRepaymentConfirmation && (
                        <button onClick={() => setIsRepayConfirmModalOpen(true)} className="px-4 py-2 text-xs font-bold text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors shadow-md shadow-amber-100 active:scale-95">
                            Confirm Repayment
                        </button>
                    )}

                    {isDebtorWaitingForApproval && (
                        <span className="px-4 py-2 text-xs font-bold text-amber-700 bg-amber-100 rounded-lg">
                            Waiting for lender approval...
                        </span>
                    )}

                    {!isPendingInitialConfirmation && !isPendingRepaymentConfirmation && !isDebtorWaitingForApproval && (
                        <>
                            {isBorrower && outstanding > 0 && (
                                <button onClick={() => setIsRepaymentModalOpen(true)} className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-md shadow-indigo-100 active:scale-95">
                                    Make Repayment
                                </button>
                            )}
                            {isCreditor && outstanding > 0 && loan.status === 'outstanding' && !loan.pending_repayment && (
                                <button
                                    onClick={() => setIsRecordRepaymentModalOpen(true)}
                                    disabled={!isPersonalLoan}
                                    className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition-colors shadow-md active:scale-95 ${!isPersonalLoan ? 'bg-slate-400 cursor-not-allowed shadow-slate-100' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'}`}
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

    const [activeTab, setActiveTab] = useState<'outstanding' | 'history'>('outstanding');
    const [openSection, setOpenSection] = useState<'actionRequired' | 'lent' | 'borrowed' | null>('actionRequired');

    const [categorizedLoans, setCategorizedLoans] = useState<{
        actionRequired: Loan[];
        lent: Loan[];
        borrowed: Loan[];
        repaid: Loan[];
    }>({ actionRequired: [], lent: [], borrowed: [], repaid: [] });
    
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const handleToggleSection = (section: 'actionRequired' | 'lent' | 'borrowed' | null) => {
        setOpenSection(prev => (prev === section ? null : section));
    };

    const getLoans = useCallback(async () => {
        if (!user) return; 
        setLoading(true); 
        setError(null);
        
        if (!db) {
            console.warn("Firestore not initialized. Cannot fetch user details.");
            // Proceed without Firebase details if necessary, but log a warning.
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/loans?user_id=${user.uid}`);
            if (!response.ok) throw new Error("Failed to fetch loans");
            
            const rawLoans: any[] = await response.json();
            let filteredLoans = rawLoans;
            if (family && family.id) {
                filteredLoans = rawLoans.filter((l) => l.family_id === family.id);
            }

            // Type assertion for allLoans
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
                const idsArray = Array.from(userIds);
                const chunks: string[][] = [];
                for (let i = 0; i < idsArray.length; i += 10) {
                    chunks.push(idsArray.slice(i, i + 10));
                }

                for (const chunk of chunks) {
                    if (chunk.length === 0) continue;
                    // Type casting the query for Firebase compatibility
                    const usersQuery = query(collection(db, "users"), where(documentId(), "in", chunk as string[])); 
                    const usersSnapshot = await getDocs(usersQuery); 
                    usersSnapshot.forEach(doc => { usersMap[doc.id] = { id: doc.id, full_name: "Unknown", ...doc.data() } as UserProfile; }); 
                }
            }
            
            const enrichedLoans: Loan[] = allLoans
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

        } catch (err) { 
            console.error("Failed to fetch loans:", err); 
            setError("Could not fetch loan activity."); 
            toast.error("Failed to fetch loans.");
        } finally { 
            setLoading(false); 
        }
    }, [user, family]);

    useEffect(() => { getLoans(); }, [getLoans]);

    const handleRepaymentSuccess = useCallback(() => { 
        getLoans(); 
        if (onDataChange) { onDataChange(); } 
    }, [getLoans, onDataChange]);

    if (loading) return <LoanListSkeleton />;
    if (error) return <p className="text-center text-rose-500 py-4 bg-rose-50 rounded-xl border border-rose-100">{error}</p>;
    
    const { actionRequired, lent, borrowed, repaid } = categorizedLoans;
    const hasNoOutstandingLoans = actionRequired.length === 0 && lent.length === 0 && borrowed.length === 0;

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            {/* Tabs - Fixed UI */}
            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-t-2xl border-b border-slate-200">
                <button 
                    onClick={() => setActiveTab('outstanding')} 
                    className={`py-2.5 rounded-lg font-bold transition-all ${activeTab === 'outstanding' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-indigo-700'}`}
                >
                    Outstanding Loans
                </button>
                <button 
                    onClick={() => setActiveTab('history')} 
                    className={`py-2.5 rounded-lg font-bold transition-all ${activeTab === 'history' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-indigo-700'}`}
                >
                    Loan History
                </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-4">
                {activeTab === 'outstanding' && (
                    <div className="space-y-4">
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
                                    <CollapsibleSection title="Money You've Lent" colorClass="text-emerald-700" count={lent.length} isOpen={openSection === 'lent'} onClick={() => handleToggleSection('lent')}>
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
                            <div className="space-y-4">
                                {repaid.map(loan => <LoanItem key={loan.id} loan={loan} onRepaymentSuccess={handleRepaymentSuccess} />)}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}