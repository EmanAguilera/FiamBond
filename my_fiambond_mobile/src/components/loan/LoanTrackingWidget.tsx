'use client';

import React, { useContext, useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, Platform, LayoutAnimation, UIManager, Alert } from "react-native";
import { AppContext } from "@/context/AppContext";
import { API_BASE_URL } from "@/config/apiConfig";
import { ChevronDown } from 'lucide-react-native';

// 🏎️ Simplex Move: Import unified loader
import UnifiedLoadingWidget from "@/components/ui/UnifiedLoadingWidget";

// Assuming these were updated to RN as well
import { 
    MakeRepaymentWidget, 
    RecordPersonalRepaymentWidget, 
    LoanConfirmationWidget, 
    RepaymentConfirmationWidget 
} from './UnifiedLoanManager';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- FULL LOGIC HELPERS ---
const DeadlineNotification = ({ deadline, outstanding }: { deadline: Date | undefined; outstanding: number }) => {
    if (!deadline || outstanding <= 0) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dayDiff = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (dayDiff < 0) return <View className="px-2 py-0.5 rounded-full bg-rose-100 ml-2"><Text className="text-[10px] font-bold text-rose-700">OVERDUE</Text></View>;
    if (dayDiff <= 7) return <View className="px-2 py-0.5 rounded-full bg-amber-100 ml-2"><Text className="text-[10px] font-bold text-amber-700">DUE SOON</Text></View>;
    return null;
};

// --- LOAN ITEM ---
const LoanItem = ({ loan, onRepaymentSuccess }: { loan: any; onRepaymentSuccess: () => void }) => {
    // ⭐️ Nuclear Fix for Context
    const { user } = useContext(AppContext as any) as { user: any } || {};
    
    const [modals, setModals] = useState({
        repay: false,
        record: false,
        confirm: false,
        repayConfirm: false
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
    
    // Safety check for date formatting
    const creationDate = loan.created_at?.toDate ? loan.created_at.toDate().toLocaleDateString() : 'N/A';
    const deadlineDate = loan.deadline?.toDate ? loan.deadline.toDate() : null;
    
    const debtorDisplayName = loan.debtor?.full_name || loan.debtor_name || 'Borrower';
    const creditorDisplayName = loan.creditor?.full_name || 'Creditor';
    const isActionRequired = isPendingInitialConfirmation || isPendingRepaymentConfirmation;

    const toggleWidget = (key: keyof typeof modals) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setModals(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <View className={`rounded-2xl border mb-3 p-4 shadow-sm ${isActionRequired ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white'}`}>
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-2 mb-1">
                        {isActionRequired && <View className="bg-amber-200 px-2 py-0.5 rounded-full"><Text className="text-[9px] font-black text-amber-800 uppercase">Action Required</Text></View>}
                        <View className={`px-2 py-0.5 rounded-full ${isPersonalLoan ? 'bg-slate-100' : 'bg-indigo-50'}`}>
                            <Text className={`text-[9px] font-black uppercase ${isPersonalLoan ? 'text-slate-600' : 'text-indigo-600'}`}>
                                {isPersonalLoan ? 'Personal' : 'Family'}
                            </Text>
                        </View>
                    </View>
                    <Text className="font-extrabold text-slate-800 text-lg">{loan.description}</Text>
                </View>
                
                <View className="items-end">
                    <Text className={`font-black text-xl ${isRepaid ? 'text-emerald-600' : isCreditor ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isRepaid ? 'REPAID' : `₱${outstanding.toLocaleString()}`}
                    </Text>
                    <Text className="text-[10px] text-slate-400 font-bold uppercase">{isCreditor ? 'Outstanding Lent' : 'Outstanding Owed'}</Text>
                </View>
            </View>

            <View className="border-t border-slate-50 pt-2 mb-3">
                <Text className="text-[11px] text-slate-500 font-medium">
                    {isCreditor ? `Lending to: ${debtorDisplayName}` : `Borrowed from: ${creditorDisplayName}`}
                    <Text className="text-slate-300">  •  </Text>
                    {creationDate}
                </Text>
                
                <View className="flex-row items-center flex-wrap mt-1">
                    {deadlineDate && !isRepaid && (
                        <View className="flex-row items-center">
                            <Text className="text-[11px] text-slate-500">Deadline: <Text className="font-bold text-slate-700">{deadlineDate.toLocaleDateString()}</Text></Text>
                            <DeadlineNotification deadline={deadlineDate} outstanding={outstanding} />
                        </View>
                    )}
                </View>
            </View>

            {!isRepaid && (
                <View className="flex-row justify-end gap-2 pt-2 border-t border-slate-50">
                    {isPendingInitialConfirmation && (
                        <TouchableOpacity onPress={() => toggleWidget('confirm')} className="px-4 py-2 bg-amber-500 rounded-lg shadow-sm">
                            <Text className="text-white font-bold text-[11px]">Confirm Funds Received</Text>
                        </TouchableOpacity>
                    )}
                    {isPendingRepaymentConfirmation && (
                        <TouchableOpacity onPress={() => toggleWidget('repayConfirm')} className="px-4 py-2 bg-amber-500 rounded-lg shadow-sm">
                            <Text className="text-white font-bold text-[11px]">Confirm Repayment</Text>
                        </TouchableOpacity>
                    )}
                    {isDebtorWaitingForApproval && (
                        <View className="px-4 py-2 bg-amber-100 rounded-lg"><Text className="text-amber-700 font-bold text-[11px]">Waiting for approval...</Text></View>
                    )}
                    {!isPendingInitialConfirmation && !isPendingRepaymentConfirmation && !isDebtorWaitingForApproval && (
                        <>
                            {isBorrower && outstanding > 0 && (
                                <TouchableOpacity onPress={() => toggleWidget('repay')} className="px-4 py-2 bg-indigo-600 rounded-lg">
                                    <Text className="text-white font-bold text-[11px]">Make Repayment</Text>
                                </TouchableOpacity>
                            )}
                            {isCreditor && outstanding > 0 && loan.status === 'outstanding' && (
                                <TouchableOpacity 
                                    onPress={() => toggleWidget('record')} 
                                    disabled={!isPersonalLoan}
                                    className={`px-4 py-2 rounded-lg ${!isPersonalLoan ? 'bg-slate-300' : 'bg-emerald-600'}`}
                                >
                                    <Text className="text-white font-bold text-[11px]">Record Repayment</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            )}

            {/* In-place Widget Injection */}
            {modals.repay && <View className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100"><MakeRepaymentWidget loan={loan} onSuccess={() => { toggleWidget('repay'); onRepaymentSuccess(); }} /></View>}
            {modals.record && <View className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100"><RecordPersonalRepaymentWidget loan={loan} onSuccess={() => { toggleWidget('record'); onRepaymentSuccess(); }} /></View>}
            {modals.confirm && <View className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100"><LoanConfirmationWidget loan={loan} onSuccess={() => { toggleWidget('confirm'); onRepaymentSuccess(); }} /></View>}
            {modals.repayConfirm && <View className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100"><RepaymentConfirmationWidget loan={loan} onSuccess={() => { toggleWidget('repayConfirm'); onRepaymentSuccess(); }} /></View>}
        </View>
    );
};

// --- MAIN COMPONENT ---
export default function LoanTrackingWidget({ family, onDataChange }: any) {
    const { user } = useContext(AppContext as any) as { user: any } || {};
    const [activeTab, setActiveTab] = useState<'outstanding' | 'history'>('outstanding');
    const [openSection, setOpenSection] = useState<string | null>('actionRequired');
    const [categorizedLoans, setCategorizedLoans] = useState<any>({ actionRequired: [], lent: [], borrowed: [], repaid: [] });
    const [loading, setLoading] = useState(true);

    const getLoans = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/loans?user_id=${user.uid}`);
            const rawLoans = await response.json();
            
            let filteredLoans = rawLoans;
            if (family?.id) { filteredLoans = rawLoans.filter((l: any) => l.family_id === family.id); }

            const allLoans = filteredLoans.map((l: any) => ({
                ...l,
                id: l._id, 
                created_at: { toDate: () => new Date(l.created_at), toMillis: () => new Date(l.created_at).getTime() },
                deadline: l.deadline ? { toDate: () => new Date(l.deadline) } : null,
            })).sort((a: any, b: any) => b.created_at.toMillis() - a.created_at.toMillis());

            const actionRequired = allLoans.filter((l: any) => l.status === 'pending_confirmation' || (l.creditor_id === user.uid && !!l.pending_repayment));
            const repaid = allLoans.filter((l: any) => l.status === 'paid' || l.status === 'repaid');
            const lent = allLoans.filter((l: any) => l.status !== 'repaid' && l.status !== 'paid' && l.creditor_id === user.uid && !actionRequired.some((ar: any) => ar.id === l.id));
            const borrowed = allLoans.filter((l: any) => l.status !== 'repaid' && l.status !== 'paid' && l.debtor_id === user.uid && !actionRequired.some((ar: any) => ar.id === l.id));

            setCategorizedLoans({ actionRequired, lent, borrowed, repaid });
        } catch (err) {
            Alert.alert("Error", "Failed to fetch loans.");
        } finally {
            setLoading(false);
        }
    }, [user, family]);

    useEffect(() => { getLoans(); }, [getLoans]);

    const toggle = (s: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setOpenSection(openSection === s ? null : s);
    };

    if (loading) return <UnifiedLoadingWidget type="section" message="Updating Ledger..." />;

    return (
        <View className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
            <View className="flex-row p-1 bg-slate-100 rounded-t-3xl border-b border-slate-200">
                <TouchableOpacity onPress={() => setActiveTab('outstanding')} className={`flex-1 py-3 rounded-2xl items-center ${activeTab === 'outstanding' ? 'bg-white shadow-sm' : ''}`}>
                    <Text className={`font-black text-xs uppercase ${activeTab === 'outstanding' ? 'text-indigo-700' : 'text-slate-500'}`}>Outstanding</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('history')} className={`flex-1 py-3 rounded-2xl items-center ${activeTab === 'history' ? 'bg-white shadow-sm' : ''}`}>
                    <Text className={`font-black text-xs uppercase ${activeTab === 'history' ? 'text-indigo-700' : 'text-slate-500'}`}>History</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="p-4" style={{ maxHeight: 600 }}>
                {activeTab === 'outstanding' ? (
                    <>
                        {['actionRequired', 'lent', 'borrowed'].map((section: any) => (
                            categorizedLoans[section].length > 0 && (
                                <View key={section} className="mb-4 border border-slate-200 rounded-2xl overflow-hidden">
                                    <TouchableOpacity onPress={() => toggle(section)} className="flex-row justify-between p-4 bg-slate-50">
                                        <Text className="font-black text-slate-700 uppercase text-[11px] tracking-widest">{section.replace(/([A-Z])/g, ' $1')}</Text>
                                        <ChevronDown size={16} color="#64748b" style={{ transform: [{ rotate: openSection === section ? '180deg' : '0deg' }] }} />
                                    </TouchableOpacity>
                                    {openSection === section && (
                                        <View className="p-3">
                                            {categorizedLoans[section].map((loan: any) => <LoanItem key={loan.id} loan={loan} onRepaymentSuccess={getLoans} />)}
                                        </View>
                                    )}
                                </View>
                            )
                        ))}
                    </>
                ) : (
                    categorizedLoans.repaid.map((loan: any) => <LoanItem key={loan.id} loan={loan} onRepaymentSuccess={getLoans} />)
                )}
            </ScrollView>
        </View>
    );
}