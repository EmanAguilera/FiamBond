// CompanyRealm.jsx
import React, { useState, lazy, Suspense, useContext, useCallback, useEffect } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ScrollView, 
    SafeAreaView, 
    ActivityIndicator, 
    Modal as RNModal,
    Dimensions
} from 'react-native';
import { AppContext } from '../../Context/AppContext';
import { db } from '../../config/firebase-config';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import Svg, { Path } from 'react-native-svg';

// --- WIDGETS (Lazy Loaded) ---
const CompanyReportChartWidget = lazy(() => import('../../Components/Company/Analytics/CompanyReportChartWidget'));
const CreateCompanyTransactionWidget = lazy(() => import('../../Components/Company/Finance/CreateCompanyTransactionWidget'));
const ManageEmployeesWidget = lazy(() => import('../../Components/Company/Employees/ManageEmployeesWidget'));
const CompanyLedgerListWidget = lazy(() => import('../../Components/Company/Finance/CompanyLedgerListWidget'));
const CompanyEmployeeListWidget = lazy(() => import('../../Components/Company/Employees/CompanyEmployeeListWidget'));
const CompanyGoalListWidget = lazy(() => import('../../Components/Company/Goal/CompanyGoalListWidget'));
const CreateCompanyGoalWidget = lazy(() => import('../../Components/Company/Goal/CreateCompanyGoalWidget'));
const CompanyPayrollWidget = lazy(() => import('../../Components/Company/Payroll/CompanyPayrollWidget'));
const PayrollHistoryWidget = lazy(() => import('../../Components/Company/Payroll/PayrollHistoryWidget'));

// --- ICONS ---
const Icons = {
    Plus: <Svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><Path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></Svg>,
    Back: <Svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><Path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></Svg>,
    Users: <Svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><Path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" /></Svg>,
    Wallet: <Svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><Path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></Svg>,
    Target: <Svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><Path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></Svg>,
    Printer: <Svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><Path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></Svg>
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
            <Text className="font-bold text-slate-500 text-[10px] uppercase tracking-widest">{title}</Text>
            <View className={`w-7 h-7 ${colorClass}`}>{icon}</View>
        </View>
        <View className="mt-2">
            <Text className={`text-3xl font-bold ${colorClass}`}>{value}</Text>
            {subtext && <Text className="text-slate-400 text-xs font-medium mt-1">{subtext}</Text>}
        </View>
        <Text className="text-indigo-600 text-xs mt-4 font-bold">{linkText} →</Text>
    </TouchableOpacity>
);

// --- MAIN COMPONENT ---
export default function CompanyRealm({ route }) {
    const { companyId } = route.params;
    const { user } = useContext(AppContext);

    const [company, setCompany] = useState(null);
    const [members, setMembers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState(null);
    const [period, setPeriod] = useState('monthly');

    const [modals, setModals] = useState({
        addTx: false,
        addGoal: false,
        manageEmp: false,
        viewTx: false,
        viewGoals: false,
        runPayroll: false,
        payrollHistory: false,
        viewEmp: false
    });

    const toggle = (key, value) => setModals(prev => ({ ...prev, [key]: value }));

    const getMembers = useCallback(async () => {
        if (!company) return [];
        try {
            const usersQuery = query(collection(db, "users"), where(documentId(), "in", company.members));
            const usersSnapshot = await getDocs(usersQuery);
            return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch {
            return [];
        }
    }, [company]);

    const getTransactions = useCallback(async () => {
        try {
            const res = await fetch(`https://super-duper-engine-57wjxxp4jxq2p64w-3000.app.github.dev/api/transactions?company_id=${companyId}`);
            return await res.json();
        } catch {
            return [];
        }
    }, [companyId]);

    const getGoals = useCallback(async () => {
        try {
            const res = await fetch(`https://super-duper-engine-57wjxxp4jxq2p64w-3000.app.github.dev/api/goals?company_id=${companyId}`); 
            return await res.json();
        } catch {
            return [];
        }
    }, [companyId]);

    const getReport = useCallback(async () => {
        try {
            const res = await fetch(`https://super-duper-engine-57wjxxp4jxq2p64w-3000.app.github.dev/api/reports/company/${companyId}?period=${period}`);
            return await res.json();
        } catch {
            return null;
        }
    }, [companyId, period]);

    const handleRefresh = useCallback(async () => {
        setLoading(true);
        try {
            const companySnap = await getDocs(query(collection(db, "companies"), where(documentId(), "==", companyId)));
            if (!companySnap.empty) setCompany({ id: companySnap.docs[0].id, ...companySnap.docs[0].data() });
            
            setMembers(await getMembers());
            setTransactions(await getTransactions());
            setGoals(await getGoals());
            setReport(await getReport());
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to load company data.");
        } finally {
            setLoading(false);
        }
    }, [companyId, getMembers, getTransactions, getGoals, getReport]);

    useEffect(() => {
        handleRefresh();
    }, [handleRefresh]);

    useEffect(() => {
        if (period) getReport().then(setReport);
    }, [period]);

    if (loading || !company) return (
        <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text className="mt-4 text-slate-400 font-bold">Loading Company Realm...</Text>
        </SafeAreaView>
    );

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <ScrollView className="px-5 pt-6" showsVerticalScrollIndicator={false}>
                <TouchableOpacity onPress={() => navigation.navigate("Home")} className="bg-white border border-slate-200 px-3 py-2 rounded-xl self-start mb-6 flex-row items-center">
                    <View className="w-4 h-4 mr-2">{Icons.Back}</View>
                    <Text className="text-slate-500 font-bold text-xs">PERSONAL REALM</Text>
                </TouchableOpacity>

                <View className="flex-row items-center mb-8">
                    <View className="w-1.5 h-12 bg-indigo-600 rounded-full mr-4" />
                    <View>
                        <Text className="text-3xl font-black text-slate-800">{company.name}</Text>
                        <Text className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">Business Realm</Text>
                    </View>
                </View>

                <View className="flex-row justify-end mb-8">
                    <Btn onClick={() => toggle('manageEmp', true)} type="sec" icon={Icons.Users}>Manage Employees</Btn>
                </View>

                <DashboardCard 
                    title="Employees" 
                    value={members.length} 
                    subtext={`${goals.length} Goals Set`} 
                    linkText="View Team" 
                    onClick={() => toggle('viewEmp', true)} 
                    icon={Icons.Users} 
                    colorClass="text-indigo-600" 
                />
                <DashboardCard 
                    title="Balance" 
                    value={`₱${report ? report.balance.toLocaleString() : '0'}`} 
                    subtext={`${transactions.length} Transactions`} 
                    linkText="View Ledger" 
                    onClick={() => toggle('viewTx', true)} 
                    icon={Icons.Wallet} 
                    colorClass="text-emerald-600" 
                />
                <DashboardCard 
                    title="Goals" 
                    value={goals.length} 
                    subtext={`${completedGoals.length} Completed`} 
                    linkText="View Goals" 
                    onClick={() => toggle('viewGoals', true)} 
                    icon={Icons.Target} 
                    colorClass="text-amber-600" 
                />
                <DashboardCard 
                    title="Payroll" 
                    value="Run Now" 
                    subtext="Manage Salaries & Advances" 
                    linkText="View History" 
                    onClick={() => toggle('payrollHistory', true)} 
                    icon={Icons.Printer} 
                    colorClass="text-rose-600" 
                />

                <View className="bg-white rounded-[40px] p-6 mb-12 shadow-sm border border-slate-100">
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
                    
                    {report ? (
                        <Suspense fallback={<ActivityIndicator color="#4f46e5" />}>
                            <CompanyReportChartWidget report={report} />
                        </Suspense>
                    ) : (
                        <View className="h-40 items-center justify-center">
                            <ActivityIndicator color="#4f46e5" />
                        </View>
                    )}
                </View>
                
                <View className="h-20" />
            </ScrollView>

            {/* --- NATIVE MODAL WRAPPERS --- */}
            {Object.entries(modals).map(([key, isOpen]) => (
                <RNModal 
                    key={key} 
                    visible={isOpen} 
                    animationType="slide" 
                    presentationStyle="pageSheet"
                    onRequestClose={() => toggle(key, false)}
                >
                    <SafeAreaView className="flex-1 bg-white">
                        <View className="flex-row justify-between items-center p-5 border-b border-slate-100">
                            <Text className="text-xl font-bold text-slate-800 capitalize">
                                {key.replace('add', 'New ').replace('view', 'View ').replace('manage', 'Manage ').replace('run', 'Run ')}
                            </Text>
                            <TouchableOpacity onPress={() => toggle(key, false)} className="bg-slate-100 px-4 py-2 rounded-full">
                                <Text className="text-slate-600 font-bold text-xs">Close</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
                            <Suspense fallback={<ActivityIndicator size="large" className="mt-10" />}>
                                {key === 'addTx' && <CreateCompanyTransactionWidget company={company} onSuccess={() => { toggle('addTx', false); handleRefresh(); }} />}
                                {key === 'addGoal' && <CreateCompanyGoalWidget company={company} onSuccess={() => { toggle('addGoal', false); handleRefresh(); }} />}
                                {key === 'manageEmp' && <ManageEmployeesWidget company={company} members={members} onUpdate={handleRefresh} />}
                                {key === 'viewTx' && <CompanyLedgerListWidget transactions={transactions} onDataChange={handleRefresh} />}
                                {key === 'viewGoals' && <CompanyGoalListWidget goals={goals} onDataChange={handleRefresh} />}
                                {key === 'runPayroll' && <CompanyPayrollWidget company={company} members={members} onSuccess={() => { toggle('runPayroll', false); handleRefresh(); }} />}
                                {key === 'payrollHistory' && <PayrollHistoryWidget transactions={transactions} companyName={company.name} />}
                                {key === 'viewEmp' && (
                                    <View className="space-y-6">
                                        <TouchableOpacity 
                                            onPress={() => { toggle('viewEmp', false); toggle('manageEmp', true); }} 
                                            className="flex-row items-center justify-end"
                                        >
                                            <View className="w-4 h-4 mr-1">{Icons.Plus}</View>
                                            <Text className="text-indigo-600 font-bold text-xs">Onboard New Employee</Text>
                                        </TouchableOpacity>
                                        <CompanyEmployeeListWidget members={members} />
                                    </View>
                                )}
                            </Suspense>
                        </ScrollView>
                    </SafeAreaView>
                </RNModal>
            ))}
        </SafeAreaView>
    );
}