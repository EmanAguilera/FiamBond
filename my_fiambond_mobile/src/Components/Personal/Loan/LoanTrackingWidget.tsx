import React, { useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator, 
    Dimensions,
    Alert,
    Linking,
    Platform,
    ViewStyle // Added to correctly type the imported Modal (if used)
} from "react-native";
import { AppContext } from "../../../Context/AppContext.jsx";
import { db } from '../../../config/firebase-config';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';

// --- DIRECTLY IMPORTED COMPONENTS ---
import Modal from '../../Modal.jsx'; // Assuming this is your custom RN Modal
import MakeRepaymentWidget from './Actions/MakeRepaymentWidget';
import RecordPersonalRepaymentWidget from './Actions/RecordPersonalRepaymentWidget';
import LoanConfirmationWidget from './Actions/LoanConfirmationWidget';
import RepaymentConfirmationWidget from './Actions/RepaymentConfirmationWidget';

// --- INTERFACES ---
interface UserProfile {
    id: string;
    full_name: string;
    [key: string]: any;
}

interface DateWrapper {
    toDate: () => Date;
    toMillis: () => number;
}

// FIX 5: Final robust Loan interface to eliminate conflicts (using string | null | undefined for IDs)
// FIX 2719: Adjusted to be compatible with external components: 
// - debtor_id is now string | undefined (removed null)
// - creditor is now required (non-optional) as it's guaranteed by data fetching
interface Loan {
    id: string;
    _id?: string;
    family_id: string | null;
    creditor_id: string;
    debtor_id: string | undefined; // FIX: Removed 'null' for compatibility with external action widgets
    debtor_name?: string;
    amount: number;
    total_owed?: number;
    repaid_amount?: number;
    status: string;
    description: string;
    attachment_url?: string;
    created_at: DateWrapper | any;
    deadline?: DateWrapper | null;
    pending_repayment?: {
        receipt_url?: string;
        amount: number | string;
        [key: string]: any;
    } | null;
    repayment_receipts?: any[];
    creditor: UserProfile; // FIX: Made non-optional for compatibility with external confirmation widget
    debtor?: UserProfile; // Keep optional
}

interface LoanTrackingWidgetProps {
    family?: { id: string; family_name: string; } | null;
    onDataChange?: () => void;
}

interface CollapsibleSectionProps {
    title: string;
    color: string; 
    count: number;
    isOpen: boolean;
    onClick: () => void;
    children: ReactNode;
}

// Interfaces for Context Fix
interface User { 
    uid: string; 
    [key: string]: any; 
}
interface AppContextType { 
    user: User | null; 
    [key: string]: any; 
}

// FIX 2322: Add ModalProps interface to satisfy type checker for component children
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    style?: ViewStyle | ViewStyle[]; // Added an optional style prop just in case
}

// Use a type assertion to allow passing children to the imported Modal component
const TypedModal = Modal as React.FC<ModalProps>;


// --- SKELETON (Style names corrected) ---
const LoanListSkeleton = () => (
// ... (LoanListSkeleton content remains the same)
  <View style={styles.skeletonContainer}>
    <View style={styles.skeletonTabWrapper}>
        <View style={styles.skeletonTab} />
        <View style={styles.skeletonTabInactive} />
    </View>
    <View style={styles.skeletonGoalList}>
        {[...Array(3)].map((_, i) => (
            <View key={i} style={styles.skeletonGoalItem}> 
                <View style={styles.skeletonCircle} /> 
                <View style={styles.skeletonGoalDetails}>
                    <View style={styles.skeletonGoalTitle} /> 
                    <View style={styles.skeletonGoalSubtitle} /> 
                </View>
                <View style={styles.skeletonGoalAmount} /> 
            </View>
        ))}
    </View>
  </View>
);

// --- HELPER COMPONENTS ---
const DeadlineNotification = ({ deadline, outstanding }: { deadline: Date | undefined; outstanding: number }) => {
// ... (DeadlineNotification content remains the same)
    if (!deadline || outstanding <= 0) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const timeDiff = deadline.getTime() - today.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (dayDiff < 0) return <Text style={styles.deadlineOverdue}>(Overdue)</Text>;
    if (dayDiff <= 7) return <Text style={styles.deadlineDueSoon}>(Due Soon)</Text>;
    return null;
};

const ChevronDownIcon = ({ isOpen }: { isOpen: boolean }) => (
    <Text style={[styles.chevronIcon, isOpen && styles.chevronOpen]}>⌄</Text>
);

const CollapsibleSection = ({ title, color, count, isOpen, onClick, children }: CollapsibleSectionProps) => (
// ... (CollapsibleSection content remains the same)
    <View style={styles.collapsibleWrapper}>
        <TouchableOpacity 
            onPress={onClick} 
            style={styles.collapsibleButton}
        >
            <View style={styles.collapsibleTitleArea}>
                <Text style={[styles.collapsibleTitle, { color }]}>{title}</Text>
                <View style={styles.collapsibleCountBadge}>
                    <Text style={styles.collapsibleCountText}>{count}</Text>
                </View>
            </View>
            <ChevronDownIcon isOpen={isOpen} />
        </TouchableOpacity>
        {isOpen && <View style={styles.collapsibleContent}>{children}</View>}
    </View>
);

// --- LOAN ITEM ---
const LoanItem = ({ loan, onRepaymentSuccess }: { loan: Loan; onRepaymentSuccess: () => void }) => {
    const { user } = useContext(AppContext)! as AppContextType;
    
    const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
    const [isRecordRepaymentModalOpen, setIsRecordRepaymentModalOpen] = useState(false);
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [isRepayConfirmModalOpen, setIsRepayConfirmModalOpen] = useState(false);
    
    if (!user) return null;

    const isPersonalLoan = !loan.family_id;
    const isCreditor = user.uid === loan.creditor_id;
    const isBorrower = user.uid === loan.debtor_id;
    const totalOwed = loan.total_owed || loan.amount; 
    const outstanding = Number(totalOwed) - Number(loan.repaid_amount || 0);
    
    const isPendingInitialConfirmation = isBorrower && loan.status === 'pending_confirmation';
    const isPendingRepaymentConfirmation = isCreditor && !!loan.pending_repayment;
    const isRepaid = loan.status === 'paid' || loan.status === 'repaid';
    const isDebtorWaitingForApproval = isBorrower && !!loan.pending_repayment;
    
    const creationDate = (loan.created_at?.toDate?.() || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const deadlineDate = loan.deadline?.toDate?.(); 
    
    const handleSuccess = () => {
        setIsRepaymentModalOpen(false);
        setIsRecordRepaymentModalOpen(false);
        setIsConfirmationModalOpen(false);
        setIsRepayConfirmModalOpen(false);
        if (onRepaymentSuccess) onRepaymentSuccess();
    };
    
    // loan.creditor is guaranteed to be UserProfile by the data fetching logic
    const debtorDisplayName = loan.debtor?.full_name || loan.debtor_name || 'Borrower';
    const creditorDisplayName = loan.creditor.full_name || 'Creditor'; // loan.creditor is now non-optional

    const isActionRequired = isPendingInitialConfirmation || isPendingRepaymentConfirmation;
    const borderStyle = isActionRequired ? styles.loanItemActionRequiredBorder : styles.loanItemDefaultBorder;
    const backgroundStyle = isActionRequired ? styles.loanItemActionRequiredBg : (isRepaid ? styles.loanItemRepaidBg : styles.loanItemDefaultBg);

    const amountColor = isCreditor ? styles.textEmerald600 : styles.textRose600;

    const handleViewReceipt = (url: string | undefined) => {
        if (url) {
            Linking.openURL(url).catch(err => 
                Alert.alert("Error", "Failed to open receipt link: " + err.message)
            );
        }
    };

    return (
        <View style={[styles.loanItemWrapper, borderStyle, backgroundStyle]}>
            <View style={styles.loanItemHeader}>
                <View>
                    <View style={styles.loanItemBadges}>
                        {isActionRequired && <Text style={styles.badgeActionRequired}>Action Required</Text>}
                        <Text style={[styles.badgeBase, isPersonalLoan ? styles.badgePersonal : styles.badgeFamily]}>
                            {isPersonalLoan ? 'Personal' : 'Family'}
                        </Text>
                    </View>
                    <Text style={styles.loanDescriptionTitle}>{loan.description}</Text>
                </View>
                <View style={styles.loanAmountArea}>
                    {isRepaid ? (
                        <Text style={styles.loanRepaidText}>REPAID</Text>
                    ) : (
                        <View style={styles.loanOutstandingWrapper}>
                            <Text style={[styles.loanOutstandingAmount, amountColor]}>
                                ₱{outstanding.toLocaleString('en-US', {minimumFractionDigits: 2})}
                            </Text>
                            <Text style={styles.loanOutstandingLabel}>{isCreditor ? 'You lent' : 'You owe'}</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.loanSubDetails}>
                <Text style={styles.loanSubDetailText}>
                    {isCreditor ? `Lending to: ${debtorDisplayName}` : `Borrowed from: ${creditorDisplayName}`}
                    <Text style={styles.dotSeparator}> • </Text>
                    Created: {creationDate}
                </Text>
                
                <View style={styles.loanLinksWrapper}>
                    {deadlineDate && !isRepaid && (
                        <Text style={styles.loanDeadlineText}>
                            Deadline: <Text style={styles.loanDeadlineValue}>{deadlineDate.toLocaleDateString()}</Text>
                            <DeadlineNotification deadline={deadlineDate} outstanding={outstanding} />
                        </Text>
                    )}
                    
                    {(loan.attachment_url || loan.pending_repayment?.receipt_url) && (
                        <>
                            <Text style={styles.linkSeparator}>|</Text>
                            {loan.attachment_url && (
                                <TouchableOpacity onPress={() => handleViewReceipt(loan.attachment_url)}>
                                    <Text style={styles.linkText}>View Loan Receipt</Text>
                                </TouchableOpacity>
                            )}
                            {loan.pending_repayment?.receipt_url && (
                                <TouchableOpacity onPress={() => handleViewReceipt(loan.pending_repayment?.receipt_url)} style={loan.attachment_url ? {marginLeft: 8} : {}}>
                                    <Text style={styles.linkText}>View Payment Proof</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            </View>

            {!isRepaid && (
                <View style={[styles.loanActions, isActionRequired && styles.loanActionsActionRequired]}>
                    
                    {isPendingInitialConfirmation && (
                        <TouchableOpacity onPress={() => setIsConfirmationModalOpen(true)} style={styles.actionButtonConfirm}>
                            <Text style={styles.actionButtonConfirmText}>Confirm Funds Received</Text>
                        </TouchableOpacity>
                    )}

                    {isPendingRepaymentConfirmation && (
                        <TouchableOpacity onPress={() => setIsRepayConfirmModalOpen(true)} style={styles.actionButtonConfirm}>
                            <Text style={styles.actionButtonConfirmText}>Confirm Repayment</Text>
                        </TouchableOpacity>
                    )}

                    {isDebtorWaitingForApproval && (
                        <View style={styles.waitingApprovalBadge}>
                            <Text style={styles.waitingApprovalText}>
                                Waiting for lender approval...
                            </Text>
                        </View>
                    )}

                    {!isPendingInitialConfirmation && !isPendingRepaymentConfirmation && !isDebtorWaitingForApproval && (
                        <>
                            {isBorrower && outstanding > 0 && (
                                <TouchableOpacity onPress={() => setIsRepaymentModalOpen(true)} style={styles.actionButtonRepay}>
                                    <Text style={styles.actionButtonRepayText}>Make Repayment</Text>
                                </TouchableOpacity>
                            )}
                            {isCreditor && outstanding > 0 && loan.status === 'outstanding' && !loan.pending_repayment && (
                                <TouchableOpacity
                                    onPress={() => setIsRecordRepaymentModalOpen(true)}
                                    disabled={!isPersonalLoan}
                                    style={[styles.actionButtonRecord, !isPersonalLoan && styles.actionButtonDisabled]}
                                >
                                    <Text style={styles.actionButtonRecordText}>Record Repayment</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            )}
            
            {/* Modals (Using TypedModal to resolve the 'children' type error) */}
            {isRepaymentModalOpen && <TypedModal isOpen={isRepaymentModalOpen} onClose={() => setIsRepaymentModalOpen(false)} title="Make a Repayment"><View><MakeRepaymentWidget loan={loan} onSuccess={handleSuccess} /></View></TypedModal>}
            {isRecordRepaymentModalOpen && <TypedModal isOpen={isRecordRepaymentModalOpen} onClose={() => setIsRecordRepaymentModalOpen(false)} title="Record Repayment Received"><View><RecordPersonalRepaymentWidget loan={loan} onSuccess={handleSuccess} /></View></TypedModal>}
            {isConfirmationModalOpen && <TypedModal isOpen={isConfirmationModalOpen} onClose={() => setIsConfirmationModalOpen(false)} title="Confirm Loan Receipt"><View><LoanConfirmationWidget loan={loan} onSuccess={handleSuccess} /></View></TypedModal>}
            {isRepayConfirmModalOpen && <TypedModal isOpen={isRepayConfirmModalOpen} onClose={() => setIsRepayConfirmModalOpen(false)} title="Confirm Repayment"><View><RepaymentConfirmationWidget loan={loan} onSuccess={handleSuccess} /></View></TypedModal>}
        </View>
    );
};

// --- MAIN WIDGET ---
export default function LoanTrackingWidget({ family, onDataChange }: LoanTrackingWidgetProps) {
// ... (rest of the component remains the same)

// ... (getLoans content remains the same, but the logic now returns the new Loan type)
    const { user } = useContext(AppContext)! as AppContextType;
    const API_URL = 'http://localhost:3000/api';

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
        if (!user || !user.uid) return; 
        setLoading(true); 
        setError(null);
        try {
            // ... (Fetch logic remains the same)
            const response = await fetch(`${API_URL}/loans?user_id=${user.uid}`);
            if (!response.ok) throw new Error("Failed to fetch loans");
            
            const rawLoans: any[] = await response.json();
            let filteredLoans = rawLoans;
            if (family && family.id) {
                filteredLoans = rawLoans.filter((l) => l.family_id === family.id);
            }

            // Hydrate Objects and Map to Loan Interface
            const allLoans: Loan[] = filteredLoans.map((l) => ({
                ...l,
                id: l._id || l.id, 
                created_at: l.created_at ? { toDate: () => new Date(l.created_at), toMillis: () => new Date(l.created_at).getTime() } : { toDate: () => new Date(), toMillis: () => Date.now() },
                deadline: l.deadline ? { toDate: () => new Date(l.deadline), toMillis: () => new Date(l.deadline).getTime() } : null,
                repaid_amount: Number(l.repaid_amount) || 0, 
                total_owed: Number(l.total_owed) || Number(l.amount), 
                pending_repayment: l.pending_repayment ? { ...l.pending_repayment, amount: Number(l.pending_repayment.amount) } : null, 
                repayment_receipts: l.repayment_receipts?.map((r: any) => ({ ...r, recorded_at: { toDate: () => new Date(r.recorded_at) } }))
            })) as Loan[]; 

            // Fetch Users
            const userIds = new Set<string>();
            allLoans.forEach((loan) => { 
                if (loan.creditor_id) userIds.add(loan.creditor_id); 
                // Ensure to only add non-null debtor IDs for the query
                if (loan.debtor_id) userIds.add(loan.debtor_id);
            });
            
            const usersMap: Record<string, UserProfile> = {};
            if (userIds.size > 0) { 
                const safeIds = [...userIds].slice(0, 10); 
                const usersQuery = query(collection(db, "users"), where(documentId(), "in", safeIds)); 
                const usersSnapshot = await getDocs(usersQuery); 
                usersSnapshot.forEach(doc => { usersMap[doc.id] = { id: doc.id, full_name: "Unknown", ...doc.data() } as UserProfile; }); 
            }
            
            const enrichedLoans = allLoans
                .map((loan) => ({ 
                    ...loan, 
                    // Guarantees creditor is present (even as 'Unknown')
                    creditor: usersMap[loan.creditor_id] || { id: 'unknown', full_name: "Unknown" }, 
                    debtor: loan.debtor_id ? usersMap[loan.debtor_id] : undefined 
                }))
                .sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis());

            // Categorization
            // ... (Categorization logic remains the same)
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
                const isBorrower = user.uid === loan.debtor_id;
                
                if ((loan.status === 'pending_confirmation') || (isCreditor && !!loan.pending_repayment)) {
                    actionRequired.push(loan);
                } else if (isCreditor) {
                    lent.push(loan); 
                } else if (isBorrower) { 
                    borrowed.push(loan); 
                }
            }
            setCategorizedLoans({ actionRequired, lent, borrowed, repaid });


        } catch (err) { 
            console.error("Failed to fetch loans:", err); 
            setError("Could not fetch loan activity."); 
        } finally { 
            setLoading(false); 
        }
    }, [user?.uid, family]); 

    useEffect(() => { getLoans(); }, [getLoans]);

    const handleRepaymentSuccess = () => { 
        getLoans(); 
        if (onDataChange) { onDataChange(); } 
    };

    if (loading) return <LoanListSkeleton />;
    if (error) return <Text style={styles.errorTextBase}>{error}</Text>;
    
    const { actionRequired, lent, borrowed, repaid } = categorizedLoans;
    const hasNoOutstandingLoans = actionRequired.length === 0 && lent.length === 0 && borrowed.length === 0;
// ... (rest of the component remains the same)
    return (
        <View style={styles.mainWidgetContainer}>
            <View style={styles.tabBar}>
                <TouchableOpacity 
                    onPress={() => setActiveTab('outstanding')} 
                    style={[styles.tabButton, activeTab === 'outstanding' && styles.tabButtonActive]}
                >
                    <Text style={[styles.tabText, activeTab === 'outstanding' ? styles.tabTextActive : styles.tabTextInactive]}>
                        Outstanding Loans
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => setActiveTab('history')} 
                    style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
                >
                    <Text style={[styles.tabText, activeTab === 'history' ? styles.tabTextActive : styles.tabTextInactive]}>
                        Loan History
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.loanListScrollView}>
                <View style={styles.loanListContent}>
                    {activeTab === 'outstanding' && (
                        <View>
                            {hasNoOutstandingLoans ? (
                                <Text style={styles.emptyListText}>You have no outstanding loans.</Text>
                            ) : (
                                <View style={styles.collapsibleList}>
                                    {actionRequired.length > 0 && (
                                        <CollapsibleSection title="Action Required" color="#D97706" count={actionRequired.length} isOpen={openSection === 'actionRequired'} onClick={() => handleToggleSection('actionRequired')}>
                                            {actionRequired.map(loan => <LoanItem key={loan.id} loan={loan} onRepaymentSuccess={handleRepaymentSuccess} />)}
                                        </CollapsibleSection>
                                    )}
                                    {lent.length > 0 && (
                                        <CollapsibleSection title="Money You've Lent" color="#4F46E5" count={lent.length} isOpen={openSection === 'lent'} onClick={() => handleToggleSection('lent')}>
                                            {lent.map(loan => <LoanItem key={loan.id} loan={loan} onRepaymentSuccess={handleRepaymentSuccess} />)}
                                        </CollapsibleSection>
                                    )}
                                    {borrowed.length > 0 && (
                                        <CollapsibleSection title="Money You've Borrowed" color="#DC2626" count={borrowed.length} isOpen={openSection === 'borrowed'} onClick={() => handleToggleSection('borrowed')}>
                                            {borrowed.map(loan => <LoanItem key={loan.id} loan={loan} onRepaymentSuccess={handleRepaymentSuccess} />)}
                                        </CollapsibleSection>
                                    )}
                                </View>
                            )}
                        </View>
                    )}

                    {activeTab === 'history' && (
                        <View>
                            {repaid.length === 0 ? (
                                <Text style={styles.emptyListText}>You have no repaid loans in your history.</Text>
                            ) : (
                                <View style={styles.repaidList}>
                                    {repaid.map(loan => <LoanItem key={loan.id} loan={loan} onRepaymentSuccess={handleRepaymentSuccess} />)}
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

// FIX 2532: Define the reusable style object outside of StyleSheet.create
const actionButtonBase = {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
};

// --- REACT NATIVE STYLESHEET ---
const styles = StyleSheet.create({
    // --- COLORS ---
    textAmber600: { color: '#D97706' },
    textAmber700: { color: '#B45309' },
    textIndigo600: { color: '#4F46E5' },
    textIndigo700: { color: '#3730A3' },
    textEmerald600: { color: '#059669' },
    textRose600: { color: '#DC2626' },
    textRose700: { color: '#B91C1C' },
    textSlate400: { color: '#94A3B8' },
    textSlate500: { color: '#64748B' },
    textSlate700: { color: '#334155' },
    textGray800: { color: '#1F2937' },
    bgAmber50: { backgroundColor: '#FFFBEB' },
    bgAmber200: { backgroundColor: '#FDE68A' },
    bgIndigo50: { backgroundColor: '#EEF2FF' },
    bgSlate50: { backgroundColor: '#F8FAFC' },
    bgWhite: { backgroundColor: 'white' },
    borderSlate200: { borderColor: '#E2E8F0' },
    borderAmber200: { borderColor: '#FDE68A' },
    borderAmber400: { borderColor: '#FBBF24' },
    
    // --- MAIN WIDGET CONTAINER ---
    mainWidgetContainer: {
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        overflow: 'hidden',
    },
    loanListScrollView: {
        maxHeight: Dimensions.get('window').height * 0.6, // max-h-[60vh] simulation
    },
    loanListContent: {
        padding: 16, // p-4
    },
    collapsibleList: {
        gap: 8, // space-y-2
    },
    repaidList: {
        gap: 12, // space-y-3
    },
    emptyListText: {
        textAlign: 'center',
        color: '#9CA3AF',
        fontStyle: 'italic',
        paddingVertical: 24, // py-6
    },
    errorTextBase: {
        textAlign: 'center',
        color: '#F43F5E',
        paddingVertical: 24,
        backgroundColor: '#FFF1F2',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FECACA',
        margin: 16,
    },
    
    // --- TAB BAR ---
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#E2E8F0',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12, // py-3
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabButtonActive: {
        backgroundColor: '#EEF2FF', // bg-indigo-50
        borderBottomWidth: 2,
        borderColor: '#4F46E5', // border-indigo-600
    },
    tabText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    tabTextActive: {
        color: '#4F46E5', // text-indigo-700
    },
    tabTextInactive: {
        color: '#64748B', // text-slate-500
    },

    // --- LOAN ITEM STYLES ---
    loanItemWrapper: {
        borderRadius: 8,
        borderWidth: 1,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    loanItemDefaultBorder: { borderColor: '#E2E8F0' },
    loanItemActionRequiredBorder: { borderColor: '#FBBF24' },
    loanItemDefaultBg: { backgroundColor: 'white' },
    loanItemActionRequiredBg: { backgroundColor: '#FFFBEB' },
    loanItemRepaidBg: { backgroundColor: '#F8FAFC', opacity: 0.85 },
    loanItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8, // mb-2
    },
    loanItemBadges: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // gap-2
        marginBottom: 4, // mb-1
    },
    badgeBase: {
        fontSize: 10,
        fontWeight: 'bold',
        paddingHorizontal: 6, // px-1.5
        paddingVertical: 2, // py-0.5
        borderRadius: 4,
        textTransform: 'uppercase',
    },
    badgeActionRequired: {
        backgroundColor: '#FDE68A', // bg-amber-200
        color: '#92400E', // text-amber-800
    },
    badgePersonal: {
        backgroundColor: '#F1F5F9', // bg-slate-100
        color: '#475569', // text-slate-600
    },
    badgeFamily: {
        backgroundColor: '#EEF2FF', // bg-indigo-50
        color: '#4F46E5', // text-indigo-600
    },
    loanDescriptionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        lineHeight: 20,
    },
    loanAmountArea: {
        alignItems: 'flex-end',
    },
    loanRepaidText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#059669', // text-emerald-600
    },
    loanOutstandingWrapper: {
        alignItems: 'flex-end',
    },
    loanOutstandingAmount: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    loanOutstandingLabel: {
        fontSize: 12,
        color: '#9CA3AF', // text-slate-400
        fontWeight: '500',
    },
    loanSubDetails: {
        fontSize: 12,
        color: '#64748B',
        gap: 4,
    },
    loanSubDetailText: {
        fontSize: 12,
        color: '#64748B',
    },
    dotSeparator: {
        marginHorizontal: 8,
    },
    loanLinksWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    linkSeparator: {
        color: '#D1D5DB',
        marginHorizontal: 4,
    },
    linkText: {
        fontWeight: 'bold',
        color: '#4F46E5',
        fontSize: 12,
        textDecorationLine: 'underline',
    },
    loanDeadlineText: {
        fontSize: 12,
        color: '#64748B',
    },
    loanDeadlineValue: {
        fontWeight: 'bold',
        color: '#334155', // text-slate-700
    },
    deadlineOverdue: {
        color: '#DC2626',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    deadlineDueSoon: {
        color: '#D97706',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    
    // Action Buttons
    loanActions: {
        paddingTop: 12, // pt-3
        borderTopWidth: 1,
        borderColor: '#F1F5F9', // border-slate-100
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8, // gap-2
    },
    loanActionsActionRequired: {
        borderColor: '#FDE68A', // border-amber-200
    },
    // actionButtonBase is now a constant outside of StyleSheet.create
    actionButtonConfirm: {
        ...actionButtonBase,
        backgroundColor: '#F59E0B', // bg-amber-500
    },
    actionButtonConfirmText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'white',
    },
    actionButtonRepay: {
        ...actionButtonBase,
        backgroundColor: '#EEF2FF', // bg-indigo-50
        borderColor: '#C7D2FE',
        borderWidth: 1,
    },
    actionButtonRepayText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#4F46E5',
    },
    actionButtonRecord: {
        ...actionButtonBase,
        backgroundColor: '#4F46E5', // bg-indigo-600
    },
    actionButtonRecordText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'white',
    },
    actionButtonDisabled: {
        backgroundColor: '#9CA3AF', // bg-slate-400
        opacity: 0.8,
    },
    waitingApprovalBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        backgroundColor: '#FFFBEB', // bg-amber-100
        alignItems: 'center',
        justifyContent: 'center',
    },
    waitingApprovalText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#D97706', // text-amber-700
    },
    
    // --- COLLAPSIBLE SECTION STYLES ---
    collapsibleWrapper: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        marginBottom: 12, // mb-3
    },
    collapsibleButton: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16, // p-4
        backgroundColor: '#F8FAFC', // bg-slate-50
    },
    collapsibleTitleArea: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12, // gap-3
    },
    collapsibleTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    collapsibleCountBadge: {
        fontSize: 12,
        fontWeight: 'bold',
        paddingHorizontal: 8, // px-2
        paddingVertical: 2, // py-0.5
        borderRadius: 16,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0.5 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    collapsibleCountText: {
        color: '#475569', // text-slate-600
        fontSize: 12,
        fontWeight: 'bold',
    },
    chevronIcon: {
        fontSize: 20,
        color: '#9CA3AF',
        transform: [{ rotate: '0deg' }],
    },
    chevronOpen: {
        transform: [{ rotate: '180deg' }],
    },
    collapsibleContent: {
        padding: 16, // p-4
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderColor: '#E2E8F0',
        gap: 12, // space-y-3
    },
    
    // --- SKELETON STYLES (Corrected to match JSX) ---
    skeletonContainer: {
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        padding: 16,
    },
    skeletonTabWrapper: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
    },
    skeletonTab: {
        height: 40,
        width: '50%',
        backgroundColor: '#F1F5F9',
    },
    skeletonTabInactive: {
        height: 40,
        width: '50%',
        backgroundColor: 'white',
    },
    skeletonGoalList: {
        gap: 16,
    },
    skeletonGoalItem: {
        padding: 16,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    skeletonCircle: { 
        height: 40,
        width: 40,
        borderRadius: 20,
        backgroundColor: '#E2E8F0',
    },
    skeletonGoalDetails: { 
        marginLeft: 16,
        flexGrow: 1,
        gap: 8,
    },
    skeletonGoalTitle: {
        height: 24,
        width: 192,
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
    },
    skeletonGoalSubtitle: {
        height: 16,
        width: 128,
        backgroundColor: '#F1F5F9',
        borderRadius: 4,
        marginTop: 8, 
    },
    skeletonGoalAmount: {
        height: 28,
        width: 112,
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
        marginLeft: 16,
    },
});