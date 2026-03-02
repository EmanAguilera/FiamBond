"use client";

import React, { useState, useContext, useCallback, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, RefreshControl, Alert } from 'react-native';
import { AppContext } from '../../context/AppContext';
import { db } from '../../config/firebase-config';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { API_BASE_URL } from "../../config/apiConfig";

// System & UI Components
import { Icons, Btn, DashboardCard } from "../../components/realm/RealmSharedUI";
import { useRealmData } from "../../hooks/useRealmData";
import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";
import Modal from "../../components/ui/Modal";

// Widgets
import UnifiedCorporateLedgerWidget from '../../components/management/UnifiedCorporateLedgerWidget';
import CreateUnifiedTransactionWidget from '../../components/finance/CreateUnifiedTransactionWidget';
import UnifiedTransactionsListWidget from '../../components/finance/UnifiedTransactionsListWidget';
import CreateUnifiedGoalWidget from "../../components/goal/CreateUnifiedGoalWidget";
import UnifiedGoalListWidget from "../../components/goal/UnifiedGoalListWidget";
import UnifiedManagerWidget from '../../components/management/UnifiedManagerWidget';
import UnifiedReportChartWidget from "../../components/analytics/UnifiedReportChartWidget";

export default function CompanyRealmScreen({ company, onBack, onDataChange }) {
    const context = useContext(AppContext);
    const user = context?.user;

    // Modal States
    const [modals, setModals] = useState({
        accounting: false, 
        addGoal: false, 
        manageEmp: false,
        viewTx: false, 
        viewGoals: false,
        payrollHistory: false
    });
    
    const toggle = (key, val) => setModals(prev => ({ ...prev, [key]: val }));

    const [members, setMembers] = useState([]);
    const [payrollCount, setPayrollCount] = useState(0);

    const { 
        transactions = [], 
        summaryData = { netPosition: 0 }, 
        activeGoalsCount = 0, 
        report, 
        period, 
        setPeriod, 
        loading,
        refreshing,
        error, 
        refresh 
    } = useRealmData(user, 'company', company?.id);

    const corporateDisplayName = useMemo(() => {
        if (!company) return "";
        const isGeneric = company.name?.toLowerCase() === 'company' || company.name?.toLowerCase() === 'my company';
        const userLastName = user?.full_name ? user.full_name.split(' ').pop() : '';
        return isGeneric && userLastName ? `${userLastName} ` : company.name;
    }, [company, user]);

    const companyPayrollConfig = useMemo(() => ({
        filterFn: (tx) => 
            (tx.category === 'Payroll' || tx.category === 'Cash Advance') || 
            (tx.description && (tx.description.toLowerCase().includes('salary') || tx.description.toLowerCase().includes('advance'))),
        columnLabels: ["Employee / Description", "Category"],
        getMainLabel: (tx) => tx.description || "Unnamed Disbursement",
        getSubLabel: (tx) => tx.category || "General Payroll",
    }), []);

    const initCompanyData = useCallback(async () => {
        if (!company?.id) return;
        try {
            let compRes = await fetch(`${API_BASE_URL}/companies/${company.id}`);
            if (compRes.ok) {
                const companyData = await compRes.json();
                const memberIds = companyData.member_ids || [];
                if (memberIds.length > 0) {
                    const snap = await getDocs(query(collection(db, "users"), where(documentId(), "in", memberIds.slice(0, 10))));
                    setMembers(snap.docs.map(d => ({ 
                        id: d.id, 
                        full_name: d.data().full_name || 'Unnamed Employee' 
                    })));
                }

                const txRes = await fetch(`${API_BASE_URL}/transactions?company_id=${company.id}`);
                if (txRes.ok) {
                    const txs = await txRes.json();
                    setPayrollCount(txs.filter(companyPayrollConfig.filterFn).length);
                }
            }
        } catch (e) { console.error("Company Init Error:", e); }
    }, [company?.id, companyPayrollConfig]);

    useEffect(() => { initCompanyData(); }, [initCompanyData]);

    const handleRefresh = () => {
        if (refresh) refresh(); 
        initCompanyData(); 
        if (onDataChange) onDataChange();
    };

    if (loading && !refreshing) {
        return <UnifiedLoadingWidget type="fullscreen" message="Loading Corporate Assets..." variant="indigo" />;
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <ScrollView 
                className="flex-1 px-4 pt-4"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#4F46E5" />
                }
            >
                {error && (
                    <View className="mb-4 p-3 bg-rose-100 border border-rose-200 rounded-2xl">
                        <Text className="text-rose-700 text-center font-bold text-[10px]">⚠️ CORPORATE API OFFLINE</Text>
                    </View>
                )}

                {/* --- HEADER --- */}
                <View className="mb-8">
                    <TouchableOpacity 
                        onPress={onBack} 
                        className="flex-row items-center bg-white border border-slate-200 px-3 py-2 rounded-xl w-32 mb-6"
                    >
                        <Text className="text-slate-500 mr-2">{Icons.Back}</Text>
                        <Text className="text-slate-500 font-bold text-xs uppercase">Personal</Text>
                    </TouchableOpacity>

                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <View className="w-1.5 h-12 bg-indigo-600 rounded-full mr-4 shadow-lg shadow-indigo-300" />
                            <View>
                                <Text className="text-3xl font-black text-slate-900 tracking-tighter">
                                    {corporateDisplayName}
                                </Text>
                                <Text className="text-slate-500 font-black text-[10px] uppercase tracking-[2px]">
                                    Company Realm
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* --- ACTION BUTTONS --- */}
                <View className="flex-row flex-wrap gap-2 mb-8">
                    <TouchableOpacity 
                        onPress={() => toggle('accounting', true)}
                        className="flex-1 bg-indigo-600 py-4 rounded-2xl items-center flex-row justify-center"
                    >
                        <Text className="text-white font-bold mr-2">{Icons.Plus}</Text>
                        <Text className="text-white font-bold">Accounting</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        onPress={() => toggle('manageEmp', true)}
                        className="bg-white border border-slate-200 px-6 py-4 rounded-2xl items-center flex-row"
                    >
                        <Text className="text-slate-600 mr-2">{Icons.Users}</Text>
                        <Text className="text-slate-600 font-bold">Staff</Text>
                    </TouchableOpacity>
                </View>

                {/* --- DASHBOARD CARDS --- */}
                <View className="flex-row flex-wrap justify-between mb-6">
                    <View className="w-full mb-4">
                        <DashboardCard 
                            title="Company Funds" 
                            value={`₱${(summaryData?.netPosition || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
                            subtext="Available Balance" 
                            onClick={() => toggle('viewTx', true)} 
                            icon={Icons.Wallet} 
                            colorClass="text-emerald-600" 
                        />
                    </View>
                    <View className="w-[48%]">
                        <DashboardCard 
                            title="Goals" 
                            value={activeGoalsCount} 
                            subtext="Targets" 
                            onClick={() => toggle('viewGoals', true)} 
                            icon={Icons.Flag} 
                            colorClass="text-rose-600" 
                        />
                    </View>
                    <View className="w-[48%]">
                        <DashboardCard 
                            title="Payroll" 
                            value={payrollCount} 
                            subtext="Records" 
                            onClick={() => toggle('payrollHistory', true)} 
                            icon={Icons.Printer} 
                            colorClass="text-indigo-600" 
                        />
                    </View>
                </View>

                {/* --- ANALYTICS --- */}
                <View className="mb-10">
                    <UnifiedReportChartWidget 
                        report={report} 
                        realm="company" 
                        period={period} 
                        setPeriod={setPeriod} 
                    />
                </View>
            </ScrollView>

            {/* --- MODALS --- */}
            <Modal isOpen={modals.accounting} onClose={() => toggle('accounting', false)} title="Accounting">
                <CreateUnifiedTransactionWidget 
                    companyData={company?.id} 
                    members={members} 
                    onSuccess={() => { toggle('accounting', false); handleRefresh(); }} 
                />
            </Modal>
            
            <Modal isOpen={modals.viewTx} onClose={() => toggle('viewTx', false)} title="Corporate Ledger">
                <UnifiedTransactionsListWidget companyData={company} onDataChange={handleRefresh} />
            </Modal>

            <Modal isOpen={modals.manageEmp} onClose={() => toggle('manageEmp', false)} title="Employee Access">
                <UnifiedManagerWidget 
                    type="company" 
                    mode="members" 
                    realmData={company} 
                    members={members} 
                    onUpdate={handleRefresh} 
                />
            </Modal>
        </SafeAreaView>
    );
}