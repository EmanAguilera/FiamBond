'use client';

import React, { useContext, useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, Platform, LayoutAnimation, UIManager, Alert, Linking } from "react-native";
import { AppContext } from "@/context/AppContext";
import { API_BASE_URL } from "@/config/apiConfig";
import { ChevronDown, ExternalLink } from 'lucide-react-native';

// 🏎️ Simplex Move: Import unified loader
import UnifiedLoadingWidget from "@/components/ui/UnifiedLoadingWidget";

import { 
    MakeRepaymentWidget, 
    RecordPersonalRepaymentWidget, 
    LoanConfirmationWidget, 
    RepaymentConfirmationWidget 
} from './UnifiedLoanManager';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- HELPERS ---
const DeadlineNotification = ({ deadline, outstanding }: { deadline: Date | undefined; outstanding: number }) => {
    if (!deadline || outstanding <= 0) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dayDiff = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (dayDiff < 0) return <View className="px-2 py-0.5 rounded-full bg-rose-100 ml-2"><Text className="text-[10px] font-bold text-rose-700">OVERDUE</Text></View>;
    if (dayDiff <= 7) return <View className="px-2 py-0.5 rounded-full bg-amber-100 ml-2"><Text className="text-[10px] font-bold text-amber-700">DUE SOON</Text></View>;
    return null;
};

// --- LOAN ITEM COMPONENT ---
const LoanItem = ({ loan, onRepaymentSuccess }: { loan: any; onRepaymentSuccess: () => void }) => {
    const { user } = useContext(AppContext as any) as { user: any } || {};
    const [modals, setModals] = useState({ repay: false, record: false, confirm: false, repayConfirm: false });
    
    if (!user) return null;

    const isPersonalLoan = !loan.family_id;
    const isCreditor = user.uid === loan.creditor_id;
    const isBorrower = user.uid === loan.debtor_id;
    const totalOwed = loan.total_owed || loan.amount; 
    const outstanding = totalOwed - (loan.repaid_amount || 0);
    
    const isRepaid = loan.status === 'paid' || loan.status === 'repaid';
    const isPendingInitialConfirmation = isBorrower && loan.status === 'pending_confirmation';
    const isPendingRepaymentConfirmation = isCreditor && !!loan.pending_repayment;
    const isDebtorWaitingForApproval = isBorrower && !!loan.pending_repayment;
    
    const creationDate = loan.created_at?.toDate ? loan.created_at.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
    const deadlineDate = loan.deadline ? (loan.deadline.toDate ? loan.deadline.toDate() : new Date(loan.deadline)) : null;

    const debtorDisplayName = loan.debtor?.full_name || loan.debtor_name || 'Borrower';
    const creditorDisplayName = loan.creditor?.full_name || 'Creditor';

    const toggleWidget = (key: keyof typeof modals) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setModals(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <View 
            className={`rounded-xl border shadow-md p-4 mb-4 border-slate-200 
                ${isRepaid ? 'bg-slate-50 opacity-80' : 'bg-white'}`}
        >
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-2 mb-2">
                        <View className={`px-2 py-1 rounded-full ${isPersonalLoan ? 'bg-slate-100' : 'bg-indigo-50'}`}>
                            <Text className={`text-[10px] uppercase font-bold ${isPersonalLoan ? 'text-slate-600' : 'text-indigo-600'}`}>
                                {isPersonalLoan ? 'Personal' : 'Family'}
                            </Text>
                        </View>
                    </View>
                    <Text className="font-extrabold text-gray-800 text-xl leading-tight">{loan.description}</Text>
                </View>
                
                <View className="text-right flex-shrink-0">
                    {isRepaid ? (
                        <Text className="font-extrabold text-emerald-600 text-2xl">REPAID</Text>
                    ) : (
                        <View className="items-end">
                            <Text className={`font-extrabold text-2xl ${isCreditor ? 'text-emerald-600' : 'text-rose-600'}`}>
                                ₱{outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </Text>
                            <Text className="text-xs text-slate-400 font-medium">Outstanding {isCreditor ? 'Lent' : 'Owed'}</Text>
                        </View>
                    )}
                </View>
            </View>

            <View className="text-xs text-slate-500 space-y-1 mb-3">
                <View className="flex-row items-center flex-wrap">
                    <Text className="text-[11px] text-slate-500">
                        {isCreditor ? `Lending to: ${debtorDisplayName}` : `Borrowed from: ${creditorDisplayName}`}
                        <Text className="mx-2 text-slate-300">•</Text>
                        Created: {creationDate}
                    </Text>

                    {/* Receipt Link Section - Synced with HTML */}
                    {loan.receipt_url && (
                        <View className="flex-row items-center">
                            <Text className="mx-2 text-slate-300">|</Text>
                            <TouchableOpacity onPress={() => Linking.openURL(loan.receipt_url)}>
                                <Text className="font-bold text-indigo-600 text-[11px]">View Loan Receipt</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {deadlineDate && !isRepaid && (
                    <View className="flex-row items-center mt-1">
                        <Text className="text-[11px] text-slate-500">Deadline: <Text className="font-bold text-slate-700">{deadlineDate.toLocaleDateString()}</Text></Text>
                        <DeadlineNotification deadline={deadlineDate} outstanding={outstanding} />
                    </View>
                )}
            </View>

            {!isRepaid && (
                <View className="pt-3 border-t border-slate-100 flex-row justify-end gap-2">
                    {isPendingInitialConfirmation && (
                        <TouchableOpacity onPress={() => toggleWidget('confirm')} className="px-4 py-2 bg-amber-500 rounded-lg">
                            <Text className="text-white font-bold text-[11px]">Confirm Funds Received</Text>
                        </TouchableOpacity>
                    )}
                    {isPendingRepaymentConfirmation && (
                        <TouchableOpacity onPress={() => toggleWidget('repayConfirm')} className="px-4 py-2 bg-amber-500 rounded-lg">
                            <Text className="text-white font-bold text-[11px]">Confirm Repayment</Text>
                        </TouchableOpacity>
                    )}
                    {isDebtorWaitingForApproval ? (
                         <View className="px-4 py-2 bg-amber-100 rounded-lg"><Text className="text-amber-700 font-bold text-[11px]">Awaiting Approval</Text></View>
                    ) : (
                        !isPendingInitialConfirmation && !isPendingRepaymentConfirmation && (
                            <>
                                {isBorrower && (
                                    <TouchableOpacity onPress={() => toggleWidget('repay')} className="px-4 py-2 bg-indigo-600 rounded-lg">
                                        <Text className="text-white font-bold text-[11px]">Make Repayment</Text>
                                    </TouchableOpacity>
                                )}
                                {isCreditor && (
                                    <TouchableOpacity 
                                        onPress={() => toggleWidget('record')} 
                                        disabled={!isPersonalLoan}
                                        className={`px-4 py-2 rounded-lg ${!isPersonalLoan ? 'bg-slate-300' : 'bg-emerald-600'}`}
                                    >
                                        <Text className="text-white font-bold text-[11px]">Record Repayment</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )
                    )}
                </View>
            )}

            {modals.repay && <View className="mt-4"><MakeRepaymentWidget loan={loan} onSuccess={() => { toggleWidget('repay'); onRepaymentSuccess(); }} /></View>}
            {modals.record && <View className="mt-4"><RecordPersonalRepaymentWidget loan={loan} onSuccess={() => { toggleWidget('record'); onRepaymentSuccess(); }} /></View>}
            {modals.confirm && <View className="mt-4"><LoanConfirmationWidget loan={loan} onSuccess={() => { toggleWidget('confirm'); onRepaymentSuccess(); }} /></View>}
            {modals.repayConfirm && <View className="mt-4"><RepaymentConfirmationWidget loan={loan} onSuccess={() => { toggleWidget('repayConfirm'); onRepaymentSuccess(); }} /></View>}
        </View>
    );
};

// --- MAIN TRACKING WIDGET ---
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
                created_at: { toDate: () => new Date(l.created_at) },
                deadline: l.deadline ? { toDate: () => new Date(l.deadline) } : null,
            })).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            const actionRequired = allLoans.filter((l: any) => l.status === 'pending_confirmation' || (l.creditor_id === user.uid && !!l.pending_repayment));
            const repaid = allLoans.filter((l: any) => l.status === 'paid' || l.status === 'repaid');
            const lent = allLoans.filter((l: any) => l.status !== 'repaid' && l.status !== 'paid' && l.creditor_id === user.uid && !actionRequired.some((ar: any) => ar.id === l.id));
            const borrowed = allLoans.filter((l: any) => l.status !== 'repaid' && l.status !== 'paid' && l.debtor_id === user.uid && !actionRequired.some((ar: any) => ar.id === l.id));

            setCategorizedLoans({ actionRequired, lent, borrowed, repaid });
        } catch (err) {
            console.error(err);
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
        <View className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            {/* Tabs Synced with Grid UI */}
            <View className="flex-row p-1 bg-slate-100 border-b border-slate-200">
                <TouchableOpacity 
                    onPress={() => setActiveTab('outstanding')} 
                    className={`flex-1 py-2.5 rounded-lg items-center ${activeTab === 'outstanding' ? 'bg-white shadow-sm' : ''}`}
                >
                    <Text className={`font-bold text-sm ${activeTab === 'outstanding' ? 'text-indigo-700' : 'text-slate-500'}`}>Outstanding Loans</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => setActiveTab('history')} 
                    className={`flex-1 py-2.5 rounded-lg items-center ${activeTab === 'history' ? 'bg-white shadow-sm' : ''}`}
                >
                    <Text className={`font-bold text-sm ${activeTab === 'history' ? 'text-indigo-700' : 'text-slate-500'}`}>Loan History</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="p-4" style={{ maxHeight: 600 }}>
                {activeTab === 'outstanding' ? (
                    <View className="space-y-4">
                        {[
                            { id: 'actionRequired', label: 'Action Required', color: 'text-amber-700' },
                            { id: 'lent', label: "Money You've Lent", color: 'text-emerald-700' },
                            { id: 'borrowed', label: "Money You've Borrowed", color: 'text-indigo-700' }
                        ].map((section) => (
                            categorizedLoans[section.id].length > 0 && (
                                <View key={section.id} className="mb-3 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <TouchableOpacity onPress={() => toggle(section.id)} className="flex-row justify-between items-center p-4 bg-slate-50">
                                        <View className="flex-row items-center gap-3">
                                            <Text className={`font-extrabold text-lg ${section.color}`}>{section.label}</Text>
                                            <View className="bg-white border border-slate-300 px-3 py-0.5 rounded-full">
                                                <Text className="text-xs font-bold text-slate-600">{categorizedLoans[section.id].length}</Text>
                                            </View>
                                        </View>
                                        <ChevronDown size={18} color="#94a3b8" style={{ transform: [{ rotate: openSection === section.id ? '180deg' : '0deg' }] }} />
                                    </TouchableOpacity>
                                    {openSection === section.id && (
                                        <View className="p-4 bg-white border-t border-slate-200">
                                            {categorizedLoans[section.id].map((loan: any) => (
                                                <LoanItem key={loan.id} loan={loan} onRepaymentSuccess={getLoans} />
                                            ))}
                                        </View>
                                    )}
                                </View>
                            )
                        ))}
                    </View>
                ) : (
                    <View className="space-y-4">
                        {categorizedLoans.repaid.length > 0 ? (
                            categorizedLoans.repaid.map((loan: any) => (
                                <LoanItem key={loan.id} loan={loan} onRepaymentSuccess={getLoans} />
                            ))
                        ) : (
                            <Text className="text-center text-slate-400 py-10 italic">No loan history.</Text>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}