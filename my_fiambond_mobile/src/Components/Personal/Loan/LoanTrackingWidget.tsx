import React, { useContext, useState, useEffect, useCallback, lazy, Suspense} from "react";
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator, 
    //Alert, 
    Linking, 
    Modal as RNModal,
    SafeAreaView
} from "react-native";
import { AppContext } from "../../../Context/AppContext"; 
import { db } from '../../../config/firebase-config'; 
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { 
    ChevronDown, 
    AlertCircle, 
    ExternalLink, 
    CheckCircle2, 
    Clock, 
    History 
} from "lucide-react-native";

// --- WIDGET IMPORTS ---
const MakeRepaymentWidget = lazy(() => import('./Actions/MakeRepaymentWidget'));
const RecordPersonalRepaymentWidget = lazy(() => import('./Actions/RecordPersonalRepaymentWidget'));
const LoanConfirmationWidget = lazy(() => import('./Actions/LoanConfirmationWidget'));
const RepaymentConfirmationWidget = lazy(() => import('./Actions/RepaymentConfirmationWidget'));

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
        amount: number;
    };
    repayment_receipts?: any[];
    creditor?: UserProfile;
    debtor?: UserProfile;
}

interface LoanTrackingWidgetProps {
    family?: { id: string; family_name: string; } | null;
    onDataChange?: () => void;
}

// --- SKELETON ---
const LoanListSkeleton = () => (
    <View className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
        <View className="flex-row border-b border-slate-100 mb-6">
            <View className="h-12 flex-1 bg-slate-50 rounded-t-2xl" />
            <View className="h-12 flex-1 bg-white" />
        </View>
        <View className="space-y-4">
            {[1, 2, 3].map((i) => (
                <View key={i} className="p-5 bg-slate-50 rounded-3xl">
                    <View className="h-6 w-3/4 bg-slate-200 rounded-lg mb-2" />
                    <View className="h-4 w-1/2 bg-slate-100 rounded-lg" />
                </View>
            ))}
        </View>
    </View>
);

// --- HELPER COMPONENTS ---
const DeadlineNotification = ({ deadline, outstanding }: { deadline: Date | undefined; outstanding: number }) => {
    if (!deadline || outstanding <= 0) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const timeDiff = deadline.getTime() - today.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (dayDiff < 0) return <Text className="text-rose-600 font-bold ml-2">(Overdue)</Text>;
    if (dayDiff <= 7) return <Text className="text-amber-600 font-bold ml-2">(Due Soon)</Text>;
    return null;
};

const CollapsibleSection = ({ title, colorClass, count, isOpen, onClick, children }: any) => (
    <View className="border border-slate-100 rounded-3xl overflow-hidden mb-4 bg-white shadow-sm">
        <TouchableOpacity 
            onPress={onClick} 
            activeOpacity={0.7}
            className="w-full flex-row justify-between items-center p-5 bg-slate-50"
        >
            <View className="flex-row items-center gap-3">
                <Text className={`font-bold text-base ${colorClass}`}>{title}</Text>
                <View className="bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    <Text className="text-[10px] font-bold text-slate-500">{count}</Text>
                </View>
            </View>
            <ChevronDown size={20} color="#94a3b8" style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }} />
        </TouchableOpacity>
        {isOpen && <View className="p-4 space-y-4">{children}</View>}
    </View>
);

// --- LOAN ITEM ---
const LoanItem = ({ loan, onRepaymentSuccess }: { loan: Loan; onRepaymentSuccess: () => void }) => {
    const { user } = useContext(AppContext) as any;
    
    const [modals, setModals] = useState({
        repayment: false,
        record: false,
        confirmReceipt: false,
        confirmRepayment: false
    });
    
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
        setModals({ repayment: false, record: false, confirmReceipt: false, confirmRepayment: false });
        onRepaymentSuccess();
    };

    const isActionRequired = isPendingInitialConfirmation || isPendingRepaymentConfirmation;

    return (
        <View className={`rounded-3xl border p-5 mb-3 ${isActionRequired ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100 bg-white'}`}>
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-2">
                        {isActionRequired && (
                            <View className="bg-amber-200 px-2 py-0.5 rounded-full">
                                <Text className="text-[8px] font-bold text-amber-900 uppercase">Action Required</Text>
                            </View>
                        )}
                        <View className={`${isPersonalLoan ? 'bg-slate-100' : 'bg-indigo-100'} px-2 py-0.5 rounded-full`}>
                            <Text className={`text-[8px] font-bold uppercase ${isPersonalLoan ? 'text-slate-600' : 'text-indigo-600'}`}>
                                {isPersonalLoan ? 'Personal' : 'Family'}
                            </Text>
                        </View>
                    </View>
                    <Text className="font-bold text-slate-800 text-lg leading-tight">{loan.description}</Text>
                </View>
                <View className="items-end">
                    {isRepaid ? (
                        <Text className="font-bold text-emerald-600 text-lg">REPAID</Text>
                    ) : (
                        <>
                            <Text className={`font-bold text-lg ${isCreditor ? 'text-emerald-600' : 'text-rose-600'}`}>
                                ₱{outstanding.toLocaleString('en-US', {minimumFractionDigits: 2})}
                            </Text>
                            <Text className="text-[10px] text-slate-400 font-bold uppercase">{isCreditor ? 'Lent' : 'Owe'}</Text>
                        </>
                    )}
                </View>
            </View>

            <View className="space-y-1 mb-4">
                <Text className="text-xs text-slate-500">
                    {isCreditor ? `Lending to: ${loan.debtor?.full_name || loan.debtor_name}` : `Borrowed from: ${loan.creditor?.full_name}`}
                </Text>
                <Text className="text-[10px] text-slate-400">Created: {creationDate}</Text>
                
                {deadlineDate && !isRepaid && (
                    <View className="flex-row items-center mt-1">
                        <Clock size={12} color="#64748b" />
                        <Text className="text-xs text-slate-600 ml-1">
                            Due: <Text className="font-bold">{deadlineDate.toLocaleDateString()}</Text>
                        </Text>
                        <DeadlineNotification deadline={deadlineDate} outstanding={outstanding} />
                    </View>
                )}
            </View>

            <View className="flex-row gap-2 flex-wrap">
                {loan.attachment_url && (
                    <TouchableOpacity onPress={() => Linking.openURL(loan.attachment_url!)} className="flex-row items-center bg-slate-100 px-3 py-1.5 rounded-full">
                        <ExternalLink size={12} color="#475569" />
                        <Text className="text-[10px] font-bold text-slate-600 ml-1">Loan Receipt</Text>
                    </TouchableOpacity>
                )}
                {loan.pending_repayment?.receipt_url && (
                    <TouchableOpacity onPress={() => Linking.openURL(loan.pending_repayment!.receipt_url!)} className="flex-row items-center bg-indigo-50 px-3 py-1.5 rounded-full">
                        <ExternalLink size={12} color="#4f46e5" />
                        <Text className="text-[10px] font-bold text-indigo-600 ml-1">Payment Proof</Text>
                    </TouchableOpacity>
                )}
            </View>

            {!isRepaid && (
                <View className="mt-5 pt-4 border-t border-slate-50 flex-row justify-end gap-2">
                    {isPendingInitialConfirmation && (
                        <TouchableOpacity onPress={() => setModals({...modals, confirmReceipt: true})} className="bg-amber-500 px-4 py-2 rounded-xl">
                            <Text className="text-white font-bold text-xs">Confirm Receipt</Text>
                        </TouchableOpacity>
                    )}

                    {isPendingRepaymentConfirmation && (
                        <TouchableOpacity onPress={() => setModals({...modals, confirmRepayment: true})} className="bg-indigo-600 px-4 py-2 rounded-xl">
                            <Text className="text-white font-bold text-xs">Confirm Repayment</Text>
                        </TouchableOpacity>
                    )}

                    {isDebtorWaitingForApproval && (
                        <View className="bg-amber-100 px-4 py-2 rounded-xl">
                            <Text className="text-amber-700 font-bold text-xs italic">Awaiting Approval...</Text>
                        </View>
                    )}

                    {!isPendingInitialConfirmation && !isPendingRepaymentConfirmation && !isDebtorWaitingForApproval && (
                        <>
                            {isBorrower && outstanding > 0 && (
                                <TouchableOpacity onPress={() => setModals({...modals, repayment: true})} className="bg-indigo-50 px-4 py-2 rounded-xl">
                                    <Text className="text-indigo-600 font-bold text-xs">Repay</Text>
                                </TouchableOpacity>
                            )}
                            {isCreditor && outstanding > 0 && loan.status === 'outstanding' && !loan.pending_repayment && (
                                <TouchableOpacity 
                                    onPress={() => setModals({...modals, record: true})}
                                    disabled={!isPersonalLoan}
                                    className={`px-4 py-2 rounded-xl ${!isPersonalLoan ? 'bg-slate-200' : 'bg-indigo-600'}`}
                                >
                                    <Text className="text-white font-bold text-xs">Record Received</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            )}

            {/* --- NATIVE MODAL WRAPPERS --- */}
            {Object.entries(modals).map(([key, visible]) => (
                <RNModal key={key} visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModals({...modals, [key]: false})}>
                    <SafeAreaView className="flex-1 bg-white">
                        <View className="flex-row justify-between p-5 border-b border-slate-100">
                            <Text className="text-lg font-bold text-slate-800">Action</Text>
                            <TouchableOpacity onPress={() => setModals({...modals, [key]: false})}><Text className="text-indigo-600 font-bold">Close</Text></TouchableOpacity>
                        </View>
                        <ScrollView className="p-5">
                            <Suspense fallback={<ActivityIndicator className="mt-10" />}>
                                {key === 'repayment' && <MakeRepaymentWidget loan={loan} onSuccess={handleSuccess} />}
                                {key === 'record' && <RecordPersonalRepaymentWidget loan={loan} onSuccess={handleSuccess} />}
                                {key === 'confirmReceipt' && <LoanConfirmationWidget loan={loan} onSuccess={handleSuccess} />}
                                {key === 'confirmRepayment' && <RepaymentConfirmationWidget loan={loan} onSuccess={handleSuccess} />}
                            </Suspense>
                        </ScrollView>
                    </SafeAreaView>
                </RNModal>
            ))}
        </View>
    );
};

export default function LoanTrackingWidget({ family, onDataChange }: LoanTrackingWidgetProps) {
    const { user } = useContext(AppContext) as any;
    const API_URL = 'https://super-duper-engine-57wjxxp4jxq2p64w-3000.app.github.dev/api';

    const [activeTab, setActiveTab] = useState<'outstanding' | 'history'>('outstanding');
    const [openSection, setOpenSection] = useState<string | null>('actionRequired');
    const [categorizedLoans, setCategorizedLoans] = useState<any>({ actionRequired: [], lent: [], borrowed: [], repaid: [] });
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const getLoans = useCallback(async () => {
        if (!user) return; 
        setLoading(true); 
        try {
            const response = await fetch(`${API_URL}/loans?user_id=${user.uid}`);
            const rawLoans = await response.json();
            let filteredLoans = rawLoans;
            if (family?.id) filteredLoans = rawLoans.filter((l: any) => l.family_id === family.id);

            const allLoans: Loan[] = filteredLoans.map((l: any) => ({
                ...l,
                id: l._id, 
                created_at: l.created_at ? { toDate: () => new Date(l.created_at), toMillis: () => new Date(l.created_at).getTime() } : { toDate: () => new Date(), toMillis: () => Date.now() },
                deadline: l.deadline ? { toDate: () => new Date(l.deadline) } : null,
            }));

            const userIds = new Set<string>();
            allLoans.forEach(l => { userIds.add(l.creditor_id); if(l.debtor_id) userIds.add(l.debtor_id); });
            
            const usersMap: any = {};
            if (userIds.size > 0) {
                const usersQuery = query(collection(db, "users"), where(documentId(), "in", Array.from(userIds).slice(0, 10))); 
                const snap = await getDocs(usersQuery);
                snap.forEach(doc => usersMap[doc.id] = { id: doc.id, ...doc.data() });
            }
            
            const enriched = allLoans.map(l => ({ 
                ...l, 
                creditor: usersMap[l.creditor_id], 
                debtor: l.debtor_id ? usersMap[l.debtor_id] : undefined 
            })).sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis());

            const actionRequired: Loan[] = [], lent: Loan[] = [], borrowed: Loan[] = [], repaid: Loan[] = [];
            
            enriched.forEach(l => {
                if (l.status === 'paid' || l.status === 'repaid') repaid.push(l);
                else {
                    const isCreditor = user.uid === l.creditor_id;
                    if (l.status === 'pending_confirmation' || (isCreditor && !!l.pending_repayment)) actionRequired.push(l);
                    else isCreditor ? lent.push(l) : borrowed.push(l);
                }
            });
            setCategorizedLoans({ actionRequired, lent, borrowed, repaid });
        } catch (err) {
            setError("Could not fetch loans.");
        } finally {
            setLoading(false);
        }
    }, [user, family]);

    useEffect(() => { getLoans(); }, [getLoans]);

    if (loading) return <LoanListSkeleton />;

    return (
        <View className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            {/* --- TABS --- */}
            <View className="flex-row border-b border-slate-100">
                <TouchableOpacity onPress={() => setActiveTab('outstanding')} className={`flex-1 py-4 flex-row justify-center items-center gap-2 ${activeTab === 'outstanding' ? 'bg-indigo-50 border-b-2 border-indigo-600' : ''}`}>
                    <Clock size={16} color={activeTab === 'outstanding' ? '#4f46e5' : '#94a3b8'} />
                    <Text className={`text-sm font-bold ${activeTab === 'outstanding' ? 'text-indigo-700' : 'text-slate-400'}`}>Active</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('history')} className={`flex-1 py-4 flex-row justify-center items-center gap-2 ${activeTab === 'history' ? 'bg-indigo-50 border-b-2 border-indigo-600' : ''}`}>
                    <History size={16} color={activeTab === 'history' ? '#4f46e5' : '#94a3b8'} />
                    <Text className={`text-sm font-bold ${activeTab === 'history' ? 'text-indigo-700' : 'text-slate-400'}`}>History</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="p-4 h-[500px]" showsVerticalScrollIndicator={false}>
                {activeTab === 'outstanding' ? (
                    <View>
                        {categorizedLoans.actionRequired.length > 0 && (
                            <CollapsibleSection title="Action Required" colorClass="text-amber-600" count={categorizedLoans.actionRequired.length} isOpen={openSection === 'actionRequired'} onClick={() => setOpenSection(openSection === 'actionRequired' ? null : 'actionRequired')}>
                                {categorizedLoans.actionRequired.map((l: any) => <LoanItem key={l.id} loan={l} onRepaymentSuccess={getLoans} />)}
                            </CollapsibleSection>
                        )}
                        <CollapsibleSection title="Lent" colorClass="text-indigo-600" count={categorizedLoans.lent.length} isOpen={openSection === 'lent'} onClick={() => setOpenSection(openSection === 'lent' ? null : 'lent')}>
                            {categorizedLoans.lent.map((l: any) => <LoanItem key={l.id} loan={l} onRepaymentSuccess={getLoans} />)}
                        </CollapsibleSection>
                        <CollapsibleSection title="Borrowed" colorClass="text-rose-600" count={categorizedLoans.borrowed.length} isOpen={openSection === 'borrowed'} onClick={() => setOpenSection(openSection === 'borrowed' ? null : 'borrowed')}>
                            {categorizedLoans.borrowed.map((l: any) => <LoanItem key={l.id} loan={l} onRepaymentSuccess={getLoans} />)}
                        </CollapsibleSection>
                    </View>
                ) : (
                    <View className="space-y-3">
                        {categorizedLoans.repaid.map((l: any) => <LoanItem key={l.id} loan={l} onRepaymentSuccess={getLoans} />)}
                        {categorizedLoans.repaid.length === 0 && <Text className="text-center text-slate-400 italic py-10">No repaid loans found.</Text>}
                    </View>
                )}
                <View className="h-10" />
            </ScrollView>
        </View>
    );
}