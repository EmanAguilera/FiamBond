import React, { useState, lazy, Suspense, useContext, useCallback, useEffect, useMemo } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ScrollView, 
    SafeAreaView, 
    ActivityIndicator, 
    Alert, 
    Modal as RNModal,
    Dimensions
} from 'react-native';
import { AppContext } from '../../Context/AppContext.jsx';
import { db } from '../../config/firebase-config';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import Svg, { Path } from 'react-native-svg';

// --- WIDGET IMPORTS (LAZY) ---
const FamilyReportChartWidget = lazy(() => import('../../Components/Family/Analytics/FamilyReportChartWidget.jsx'));
const LoanTrackingWidget = lazy(() => import('../../Components/Personal/Loan/LoanTrackingWidget'));
const GoalListsWidget = lazy(() => import("../../Components/Personal/Goal/GoalListsWidget.jsx"));
const CreateLoanWidget = lazy(() => import('../../Components/Personal/Loan/Setup/CreateLoanWidget'));
const CreateFamilyTransactionWidget = lazy(() => import('../../Components/Family/Finance/CreateFamilyTransactionWidget'));
const CreateFamilyGoalWidget = lazy(() => import('../../Components/Family/Goal/CreateFamilyGoalWidget'));
const FamilyTransactionsWidget = lazy(() => import('../../Components/Family/Finance/FamilyTransactionsWidget'));
const ManageMembersWidget = lazy(() => import('../../Components/Family/Members/ManageMembersWidget.jsx')); 

// --- ICONS ---
const Icons = {
    Plus: <Svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><Path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></Svg>,
    Back: <Svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><Path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></Svg>,
    Users: <Svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><Path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" /></Svg>,
    Wallet: <Svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><Path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></Svg>,
    Flag: <Svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><Path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2z" /></Svg>,
    Gift: <Svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><Path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></Svg>
};

// --- REUSABLE BUTTON ---
const Btn = ({ onClick, type = 'sec', icon, children, className = '' }) => {
    const styles = {
        pri: "bg-indigo-600 border-transparent",
        sec: "bg-white border-slate-300",
        ghost: "bg-transparent border-transparent"
    };
    const textStyles = {
        pri: "text-white",
        sec: "text-slate-600",
        ghost: "text-slate-500"
    };
    return (
        <TouchableOpacity 
            onPress={onClick} 
            activeOpacity={0.7}
            className={`${styles[type]} px-4 py-3 rounded-xl border flex-row items-center justify-center gap-2 ${className}`}
        >
            <View className="w-4 h-4">{icon}</View>
            <Text className={`${textStyles[type]} font-bold text-sm`}>{children}</Text>
        </TouchableOpacity>
    );
};

// --- DASHBOARD CARD ---
const DashboardCard = ({ title, value, subtext, linkText, onClick, icon, colorClass }) => (
    <TouchableOpacity 
        onPress={onClick} 
        activeOpacity={0.9} 
        className="bg-white border border-slate-200 rounded-3xl p-6 mb-4 shadow-sm"
    >
        <View className="flex-row justify-between items-start">
            <Text className="font-bold text-slate-500 text-xs uppercase tracking-widest">{title}</Text>
            <View className={`w-8 h-8 ${colorClass}`}>{icon}</View>
        </View>
        <View className="mt-2">
            <Text className={`text-3xl font-bold ${colorClass}`}>{value}</Text>
            {subtext && <Text className="text-slate-400 text-xs font-medium mt-1">{subtext}</Text>}
        </View>
        <Text className="text-indigo-600 text-xs mt-4 font-bold">{linkText} →</Text>
    </TouchableOpacity>
);

// --- DATA HELPER ---
const formatDataForChart = (transactions) => {
    if (!transactions || transactions.length === 0) return { labels: [], datasets: [] };
    const data = {};
    transactions.forEach(tx => {
        if (tx.created_at && typeof tx.created_at.toDate === 'function') {
            const date = tx.created_at.toDate().toLocaleDateString();
            if (!data[date]) data[date] = { income: 0, expense: 0 };
            if (tx.type === 'income') data[date].income += tx.amount;
            else data[date].expense += tx.amount;
        }
    });
    const labels = Object.keys(data).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    return {
        labels,
        datasets: [
            { label: 'Inflow', data: labels.map(label => data[label].income) },
            { label: 'Outflow', data: labels.map(label => data[label].expense) }
        ]
    };
};

export default function FamilyRealm({ family, onBack, onDataChange, onFamilyUpdate }) {
    const { user } = useContext(AppContext);
    const API_URL = 'http://localhost:3000/api'; // Replace with mobile IP for physical devices

    const [modals, setModals] = useState({
        loan: false,
        transaction: false,
        goal: false,
        goalsList: false,
        familyTransactions: false,
        loanList: false,
        members: false
    });
    
    const [loading, setLoading] = useState(true);
    const [familyNotFound, setFamilyNotFound] = useState(false);
    const [summaryData, setSummaryData] = useState(null);
    const [activeGoalsCount, setActiveGoalsCount] = useState(0);
    const [activeLoansCount, setActiveLoansCount] = useState(0);
    const [report, setReport] = useState(null);
    const [reportLoading, setReportLoading] = useState(true);
    const [reportError, setReportError] = useState(null);
    const [period, setPeriod] = useState('monthly');
    const [familyMembers, setFamilyMembers] = useState([]);

    const toggleModal = (key, val) => setModals(prev => ({ ...prev, [key]: val }));

    // --- FETCH DATA LOGIC ---
    const getFamilyMembers = useCallback(async () => {
        if (!family) return;
        try {
            const famRes = await fetch(`${API_URL}/families/${family.id}`);
            if (!famRes.ok) return;
            const freshFamily = await famRes.json();
            const memberIds = freshFamily.member_ids || [];
            
            if (memberIds.length === 0) { setFamilyMembers([]); return; }

            const usersRef = collection(db, "users");
            const safeMemberIds = memberIds.slice(0, 10); 
            const q = query(usersRef, where(documentId(), "in", safeMemberIds));
            const usersSnapshot = await getDocs(q);
            
            const fetchedMembers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFamilyMembers(fetchedMembers);
        } catch (error) { console.error("Failed to fetch members", error); }
    }, [family]);

    const getFamilyBalance = useCallback(async () => {
        if (!user || !family || familyNotFound) return;
        try {
            const response = await fetch(`${API_URL}/transactions?family_id=${family.id}`);
            if (response.ok) {
                const transactions = await response.json();
                let netPosition = 0;
                transactions.forEach(tx => {
                    tx.type === 'income' ? netPosition += tx.amount : netPosition -= tx.amount;
                });
                setSummaryData({ netPosition });
            }
        } catch (error) { console.error(error); }
    }, [user, family, familyNotFound]);

    const getFamilyActiveGoalsCount = useCallback(async () => {
        if (!user || !family || familyNotFound) return;
        try {
            const response = await fetch(`${API_URL}/goals?family_id=${family.id}`);
            if (response.ok) {
                const data = await response.json();
                setActiveGoalsCount(data.filter(g => g.status === 'active').length);
            }
        } catch (error) { console.error(error); }
    }, [user, family, familyNotFound]);

    const getFamilyActiveLoansCount = useCallback(async () => {
        if (!user || !family || familyNotFound) return;
        try {
            const response = await fetch(`${API_URL}/loans?family_id=${family.id}`);
            if (response.ok) {
                const loans = await response.json();
                setActiveLoansCount(loans.filter(l => l.status === 'outstanding' || l.status === 'pending_confirmation').length);
            }
        } catch (error) { console.error(error); }
    }, [user, family, familyNotFound]);

    const getFamilyReport = useCallback(async () => {
        if (!user || !family || familyNotFound) return;
        setReportLoading(true); setReportError(null);
        try {
            const endDate = new Date();
            const startDate = new Date();
            if (period === 'weekly') startDate.setDate(endDate.getDate() - 7);
            else if (period === 'yearly') startDate.setFullYear(endDate.getFullYear() - 1);
            else startDate.setMonth(endDate.getMonth() - 1);
            
            const response = await fetch(`${API_URL}/transactions?family_id=${family.id}&startDate=${startDate.toISOString()}`);
            if (!response.ok) throw new Error('API Error');
            
            const transactions = (await response.json()).map(tx => ({ 
                ...tx, 
                id: tx._id, 
                created_at: { toDate: () => new Date(tx.created_at) } 
            }));

            let totalInflow = 0, totalOutflow = 0;
            transactions.forEach(tx => { tx.type === 'income' ? totalInflow += tx.amount : totalOutflow += tx.amount; });

            setReport({ 
                chartData: formatDataForChart(transactions), 
                totalInflow, 
                totalOutflow, 
                netPosition: totalInflow - totalOutflow, 
                reportTitle: `Funds Report: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
                transactionCount: transactions.length 
            });
        } catch (error) { setReportError("No data"); } finally { setReportLoading(false); }
    }, [user, family, period, familyNotFound]);

    const handleRealmRefresh = useCallback(async () => {
        if (familyNotFound) return;
        setModals({ loan: false, transaction: false, goal: false, goalsList: false, familyTransactions: false, loanList: false, members: false });
        await Promise.all([ getFamilyBalance(), getFamilyActiveGoalsCount(), getFamilyActiveLoansCount(), getFamilyReport(), getFamilyMembers() ]);
        if (onDataChange) onDataChange();
    }, [getFamilyBalance, getFamilyActiveGoalsCount, getFamilyActiveLoansCount, getFamilyReport, getFamilyMembers, onDataChange, familyNotFound]);

    useEffect(() => {
        const fetchAllData = async () => {
            if (!family || !user) return;
            setLoading(true);
            try {
                const checkResponse = await fetch(`${API_URL}/families/${family.id}`);
                if (checkResponse.status === 404) { setFamilyNotFound(true); return; }
                await Promise.all([ getFamilyBalance(), getFamilyActiveGoalsCount(), getFamilyActiveLoansCount(), getFamilyReport(), getFamilyMembers() ]);
            } catch (error) { console.error(error); } finally { setLoading(false); }
        };
        fetchAllData();
    }, [family, user]); 

    useEffect(() => { if (!loading && !familyNotFound) getFamilyReport(); }, [period, loading, familyNotFound]);

    const handleMembersUpdate = (updatedFamily) => { 
        getFamilyMembers(); 
        if (onFamilyUpdate) onFamilyUpdate(updatedFamily); 
    };
    
    if (loading) return (
        <SafeAreaView className="flex-1 bg-white items-center justify-center">
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text className="mt-4 text-slate-500 font-bold">Loading Family Realm...</Text>
        </SafeAreaView>
    );

    if (familyNotFound) return (
        <SafeAreaView className="flex-1 bg-white items-center justify-center p-10">
            <Text className="text-xl font-bold text-slate-800">Family Not Found</Text>
            <TouchableOpacity onPress={onBack} className="mt-6 bg-indigo-600 px-6 py-3 rounded-xl">
                <Text className="text-white font-bold">Go Back</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <ScrollView className="px-5 pt-6" showsVerticalScrollIndicator={false}>
                
                {/* --- HEADER --- */}
                <View className="mb-8">
                    <TouchableOpacity 
                        onPress={onBack} 
                        className="flex-row items-center bg-white border border-slate-200 px-3 py-2 rounded-xl self-start mb-6"
                    >
                        <View className="w-4 h-4 mr-2">{Icons.Back}</View>
                        <Text className="text-slate-500 font-bold text-xs uppercase">Back to Personal</Text>
                    </TouchableOpacity>

                    <View className="flex-row items-center">
                        <View className="w-1.5 h-12 bg-indigo-600 rounded-full mr-4" />
                        <View>
                            <Text className="text-3xl font-bold text-slate-800 tracking-tight">{family.family_name}</Text>
                            <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Family Realm</Text>
                        </View>
                    </View>
                </View>

                {/* --- ACTIONS GRID --- */}
                <View className="flex-row flex-wrap gap-2 mb-10">
                    <Btn onClick={() => toggleModal('transaction', true)} type="pri" icon={Icons.Plus} className="w-[100%]">Transaction</Btn>
                    <Btn onClick={() => toggleModal('goal', true)} icon={Icons.Plus} className="w-[48%]">Goal</Btn>
                    <Btn onClick={() => toggleModal('loan', true)} icon={Icons.Plus} className="w-[48%]">Loan</Btn>
                    <Btn onClick={() => toggleModal('members', true)} icon={Icons.Users} className="w-full">Members</Btn>
                </View>

                {/* --- DASHBOARD CARDS --- */}
                <DashboardCard 
                    title="Family Funds" 
                    value={summaryData ? `₱${summaryData.netPosition.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '₱0.00'} 
                    subtext="Available Balance" 
                    linkText="View Transactions" 
                    onClick={() => toggleModal('familyTransactions', true)} 
                    icon={Icons.Wallet} 
                    colorClass="text-emerald-600"
                />
                <DashboardCard 
                    title="Active Goals" 
                    value={activeGoalsCount} 
                    subtext="Targets in Progress" 
                    linkText="View Goals" 
                    onClick={() => toggleModal('goalsList', true)} 
                    icon={Icons.Flag} 
                    colorClass="text-rose-600"
                />
                <DashboardCard 
                    title="Outstanding Loans" 
                    value={activeLoansCount} 
                    subtext="Total Receivables" 
                    linkText="Manage Lending" 
                    onClick={() => toggleModal('loanList', true)} 
                    icon={Icons.Gift} 
                    colorClass="text-amber-600"
                />

                {/* --- REPORT SECTION --- */}
                <View className="bg-white rounded-[32px] p-6 mb-12 shadow-sm border border-slate-100">
                    <View className="flex-row justify-center bg-slate-100 p-1 rounded-xl mb-6">
                        {['weekly', 'monthly', 'yearly'].map(p => (
                            <TouchableOpacity 
                                key={p} 
                                onPress={() => setPeriod(p)} 
                                className={`flex-1 py-2 rounded-lg items-center ${period === p ? 'bg-white shadow-sm' : ''}`}
                            >
                                <Text className={`capitalize text-[10px] font-bold ${period === p ? 'text-indigo-600' : 'text-slate-500'}`}>{p}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {reportLoading ? (
                        <View className="h-40 items-center justify-center">
                            <ActivityIndicator color="#4f46e5" />
                        </View>
                    ) : reportError ? (
                        <View className="h-40 items-center justify-center">
                            <Text className="text-rose-400 font-bold">No data available</Text>
                        </View>
                    ) : (
                        <Suspense fallback={<ActivityIndicator />}>
                            <FamilyReportChartWidget family={family} report={report} />
                        </Suspense>
                    )}
                </View>

                {/* Footer Spacing */}
                <View className="h-10" />
            </ScrollView>

            {/* --- NATIVE MODALS --- */}
            {Object.entries(modals).map(([key, isOpen]) => (
                <RNModal 
                    key={key} 
                    visible={isOpen} 
                    animationType="slide" 
                    presentationStyle="pageSheet"
                    onRequestClose={() => toggleModal(key, false)}
                >
                    <SafeAreaView className="flex-1 bg-white">
                        <View className="flex-row justify-between items-center p-5 border-b border-slate-100">
                            <Text className="text-xl font-bold text-slate-800 capitalize">
                                {key.replace('List', ' List').replace('family', 'Family ')}
                            </Text>
                            <TouchableOpacity onPress={() => toggleModal(key, false)} className="bg-slate-100 px-4 py-2 rounded-full">
                                <Text className="text-slate-600 font-bold text-xs">Close</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
                            <Suspense fallback={<ActivityIndicator size="large" className="mt-10" />}>
                                {key === 'loan' && <CreateLoanWidget family={family} members={familyMembers} onSuccess={handleRealmRefresh} />}
                                {key === 'transaction' && <CreateFamilyTransactionWidget family={family} onSuccess={handleRealmRefresh} />}
                                {key === 'goal' && <CreateFamilyGoalWidget family={family} onSuccess={handleRealmRefresh} />}
                                {key === 'familyTransactions' && <FamilyTransactionsWidget family={family} />}
                                {key === 'goalsList' && <GoalListsWidget family={family} onDataChange={handleRealmRefresh} />}
                                {key === 'loanList' && <LoanTrackingWidget family={family} onDataChange={handleRealmRefresh} />}
                                {key === 'members' && <ManageMembersWidget family={family} onFamilyUpdate={handleMembersUpdate}/>}
                            </Suspense>
                        </ScrollView>
                    </SafeAreaView>
                </RNModal>
            ))}
        </SafeAreaView>
    );
}