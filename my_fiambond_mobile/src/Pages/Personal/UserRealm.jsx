import React, { useContext, useEffect, useState, useCallback, lazy, Suspense, useMemo } from "react";
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    SafeAreaView, 
    ActivityIndicator, 
    Alert, 
    Modal as RNModal,
    Dimensions
} from "react-native";
import { AppContext } from "../../Context/AppContext";
import { useNavigation } from "@react-navigation/native"; 
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"; 
import { db } from "../../config/firebase-config"; 
import Svg, { Path } from "react-native-svg";

// ----------------------------------------------------------------
// FIX: LOCAL IP ADDRESS FOR API CALLS - Using localhost for Web Testing
const API_BASE_URL = 'http://localhost:3000';
// ----------------------------------------------------------------

// --- WIDGET IMPORTS (LAZY) ---
const PersonalTransactionsWidget = lazy(() => import("../../Components/Personal/Finance/PersonalTransactionsWidget"));
const GoalListsWidget = lazy(() => import("../../Components/Personal/Goal/GoalListsWidget"));
const ManageFamiliesWidget = lazy(() => import("../../Components/Personal/Families/ManageFamiliesWidget")); 
const LoanTrackingWidget = lazy(() => import("../../Components/Personal/Loan/LoanTrackingWidget"));
const PersonalReportChartWidget = lazy(() => import("../../Components/Personal/Analytics/PersonalReportChartWidget"));
const CreateTransactionWidget = lazy(() => import("../../Components/Personal/Finance/CreateTransactionWidget"));
const CreateGoalWidget = lazy(() => import("../../Components/Personal/Goal/CreateGoalWidget"));
const RecordLoanChoiceWidget = lazy(() => import("../../Components/Personal/Loan/Setup/RecordLoanChoiceWidget"));
const RecordLoanFlowWidget = lazy(() => import("../../Components/Personal/Loan/Setup/RecordLoanFlowWidget"));
const CreatePersonalLoanWidget = lazy(() => import("../../Components/Personal/Loan/Setup/CreatePersonalLoanWidget"));
const ApplyPremiumWidget = lazy(() => import("../../Components/Company/Onboarding/ApplyPremiumWidget"));
const FamilyRealm = lazy(() => import("../Family/FamilyRealm"));
const CompanyRealm = lazy(() => import("../Company/CompanyRealm"));

// --- ICONS ---
const Icons = {
    Plus: <Svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><Path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></Svg>,
    Users: <Svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><Path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" /></Svg>,
    Build: <Svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><Path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></Svg>,
    Lock: <Svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><Path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></Svg>,
    Wallet: <Svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><Path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></Svg>,
    Flag: <Svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><Path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2z" /></Svg>,
    Gift: <Svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><Path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></Svg>,
    Back: <Svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><Path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></Svg>
};

// --- PLACEHOLDER BUTTON COMPONENT (Fixes Btn is not defined) ---
const Btn = ({ onClick, type, icon, children }) => {
    let baseClass = "px-4 py-2 rounded-xl flex-row items-center justify-center";
    let textClass = "font-bold text-xs";
    let iconView = <View className="w-4 h-4 mr-2">{icon}</View>;

    if (type === 'pri') {
        baseClass += " bg-indigo-600 shadow-md";
        textClass += " text-white";
    } else if (type === 'sec') {
        baseClass += " bg-slate-100 border border-slate-200";
        textClass += " text-slate-600";
    }

    return (
        <TouchableOpacity onPress={onClick} className={baseClass}>
            {icon && iconView}
            <Text className={textClass}>{children}</Text>
        </TouchableOpacity>
    );
};

// --- DASHBOARD CARD SUB-COMPONENT (Fixes DashboardCard is not defined) ---
const DashboardCard = ({ title, value, subtext, linkText, onClick, icon, colorClass }) => {
    let iconBgClass = 'bg-slate-100';
    if (colorClass && colorClass.includes('emerald')) {
        iconBgClass = 'bg-emerald-100';
    } else if (colorClass && colorClass.includes('amber')) {
        iconBgClass = 'bg-amber-100';
    } else if (colorClass && colorClass.includes('indigo')) {
        iconBgClass = 'bg-indigo-100';
    }

    return (
        <View className="bg-white rounded-3xl p-5 mb-4 shadow-sm border border-slate-100 flex-row items-center justify-between">
            <View className="flex-row items-center">
                <View className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${iconBgClass}`}>
                    <View style={{ color: colorClass }}>{icon}</View>
                </View>
                <View>
                    <Text className="text-xs text-slate-500">{title}</Text>
                    <Text className={`text-xl font-black ${colorClass} leading-tight`}>{value}</Text>
                </View>
            </View>
            <TouchableOpacity onPress={onClick} className="self-end px-3 py-1 rounded-lg">
                <Text className="text-[10px] font-bold text-indigo-500 uppercase">{linkText}</Text>
            </TouchableOpacity>
        </View>
    );
};

// --- SUBSCRIPTION REMINDER SUB-COMPONENT ---
const SubscriptionReminder = ({ details, type, toggleModal, Icons }) => {
    if (!details || !details.expires_at) return null;
    
    // Defensive date parsing
    const expiryDate = typeof details.expires_at.toDate === 'function' 
        ? details.expires_at.toDate() 
        : new Date(details.expires_at);

    const diffTime = expiryDate - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 30) return null; 

    return (
        <View className={`p-4 rounded-2xl mb-6 ${diffDays <= 7 ? 'bg-rose-50 border-rose-300' : 'bg-amber-50 border-amber-300'} border shadow-sm`}>
            <Text className="font-bold text-sm mb-2">{type === 'family' ? 'Family' : 'Company'} Premium Expires In {diffDays} Days</Text>
            <Text className="text-xs text-slate-500 mb-3">Renew to keep full access to advanced features.</Text>
            <Btn onClick={() => toggleModal(type === 'family' ? 'applyFamily' : 'applyCompany', true)} type="pri" icon={Icons.Gift}>Renew Now</Btn>
        </View>
    );
};

// --- MAIN COMPONENT ---
export default function UserRealm() {
    const navigation = useNavigation();
    const { user, setUser, setActiveRealm } = useContext(AppContext);

    // Initializing state to an empty array [] is crucial to prevent .filter() errors
    const [families, setFamilies] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [goals, setGoals] = useState([]);
    const [loans, setLoans] = useState([]);
    
    const [report, setReport] = useState(null);
    const [period, setPeriod] = useState('monthly');
    const [loading, setLoading] = useState(true);
    const [reportLoading, setReportLoading] = useState(false);
    const [activeFamilyRealm, setActiveFamilyRealm] = useState(null);
    const [activeCompanyRealm, setActiveCompanyRealm] = useState(null);

    const [modals, setModals] = useState({
        transactions: false,
        goals: false,
        families: false,
        lending: false,
        createTx: false,
        createGoal: false,
        recordLoan: false,
        applyCompany: false,
        applyFamily: false
    });

    const toggleModal = (key, value) => setModals(prev => ({ ...prev, [key]: value }));

    const [loanFlowStep, setLoanFlowStep] = useState('choice');

    const fetchReport = useCallback(async () => {
        setReportLoading(true);
        try {
            // UPDATED URL
            const res = await fetch(`${API_BASE_URL}/api/reports/personal/${user.uid}?period=${period}`);
            if (!res.ok) throw new Error("Failed to fetch report: " + res.status);
            setReport(await res.json());
        } catch(e) {
            console.error("Report fetch error:", e);
            setReport(null);
        } finally {
            setReportLoading(false);
        }
    }, [user, period]);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            // Use local error checking before parsing JSON to catch 500s/404s cleanly
            const fetchAndCheck = async (endpoint) => {
                const res = await fetch(`${API_BASE_URL}/api/${endpoint}?user_id=${user.uid}`);
                // Throw an error on 4xx/5xx status
                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`API Error ${res.status}: ${res.url}. Response: ${errorText.slice(0, 50)}...`);
                }
                return res.json();
            };

            const [
                familiesData,
                companiesData,
                transactionsData,
                goalsData,
                loansData,
            ] = await Promise.all([
                fetchAndCheck('families'),
                fetchAndCheck('companies'),
                fetchAndCheck('transactions'),
                fetchAndCheck('goals'),
                fetchAndCheck('loans'),
            ]);

            // Ensure data is set to an array, even if the API returns null/undefined/an object
            setFamilies(Array.isArray(familiesData) ? familiesData : []);
            setCompanies(Array.isArray(companiesData) ? companiesData : []);
            setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
            setGoals(Array.isArray(goalsData) ? goalsData : []);
            setLoans(Array.isArray(loansData) ? loansData : []);
            
            await fetchReport();

        } catch (err) {
            console.error("Data load error:", err);
            Alert.alert("Connection Error", `Failed to load data. Details: ${err.message}. Check API server and IP.`);
            
            // Set to empty arrays on failure to prevent the .filter() crash
            setFamilies([]);
            setCompanies([]);
            setTransactions([]);
            setGoals([]);
            setLoans([]);
            
        } finally {
            setLoading(false);
        }
    }, [user, fetchReport]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    useEffect(() => {
        if (period && !loading) fetchReport();
    }, [period, loading, fetchReport]);

    const handleUpgradeSubmit = async (data) => {
        try {
            // UPDATED URL
            const res = await fetch(`${API_BASE_URL}/api/premiums`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: data.userId,
                    amount: data.amountPaid,
                    plan: data.plan,
                    status: 'pending',
                    ref_number: data.paymentRef,
                    payment_method: data.method,
                    target_access: data.targetAccess,
                    created_at: serverTimestamp()
                })
            });
            if (!res.ok) throw new Error("Failed to submit");
            Alert.alert("Success", "Your upgrade request is pending approval.");
            toggleModal(data.targetAccess === 'family' ? 'applyFamily' : 'applyCompany', false);
            await updateDoc(doc(db, "users", data.userId), { 
                [data.targetAccess === 'family' ? 'premium_pending' : 'company_pending']: true 
            });
            setUser(prev => ({ ...prev, [data.targetAccess === 'family' ? 'premium_pending' : 'company_pending']: true }));
        } catch (err) {
            Alert.alert("Error", "Failed to submit upgrade.");
        }
    };

    if (activeFamilyRealm) return <FamilyRealm familyId={activeFamilyRealm.id} onBack={() => setActiveFamilyRealm(null)} />;
    if (activeCompanyRealm) return <CompanyRealm companyId={activeCompanyRealm.id} onBack={() => setActiveCompanyRealm(null)} />;

    if (loading) return (
        <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text className="mt-4 text-slate-400 font-bold">Loading Realm...</Text>
        </SafeAreaView>
    );

    const hasPremiumFamily = user.premium_access;
    const hasPremiumCompany = user.company_access;
    const familyPending = user.premium_pending;
    const companyPending = user.company_pending;
    
    // --- SAFE ARRAYS (Prevents the goals.filter crash) ---
    const safeGoals = goals || []; 
    const safeLoans = loans || [];
    const safeTransactions = transactions || [];

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <ScrollView className="px-5 pt-6" showsVerticalScrollIndicator={false}>
                <TouchableOpacity onPress={() => navigation.navigate("AdminRealm")} className="bg-white border border-slate-200 px-3 py-2 rounded-xl self-start mb-6 flex-row items-center">
                    <View className="w-4 h-4 mr-2">{Icons.Back}</View>
                    <Text className="text-slate-500 font-bold text-xs">ADMIN REALM</Text>
                </TouchableOpacity>

                <View className="flex-row items-center mb-8">
                    <View className="w-1.5 h-12 bg-indigo-600 rounded-full mr-4" />
                    <View>
                        <Text className="text-3xl font-black text-slate-800">{user.last_name || 'User'}</Text>
                        <Text className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">Personal Realm</Text>
                    </View>
                </View>

                <View className="flex-row justify-end mb-8">
                    <Btn onClick={() => toggleModal('families', true)} type="sec" icon={Icons.Users}>Manage Families</Btn>
                </View>

                <SubscriptionReminder details={user.premium_details} type="family" toggleModal={toggleModal} Icons={Icons} />
                <SubscriptionReminder details={user.company_details} type="company" toggleModal={toggleModal} Icons={Icons} />

                <DashboardCard 
                    title="Balance" 
                    value={`₱${report ? report.balance.toLocaleString() : '0'}`} 
                    subtext={`${safeTransactions.length} Transactions`} // Used safeTransactions
                    linkText="View Ledger" 
                    onClick={() => toggleModal('transactions', true)} 
                    icon={Icons.Wallet} 
                    colorClass="text-emerald-600" 
                />
                <DashboardCard 
                    title="Goals" 
                    value={safeGoals.length} // Used safeGoals
                    subtext={`${safeGoals.filter(g => g.status === 'completed').length} Completed`} // Used safeGoals and fixed the crash
                    linkText="View Goals" 
                    onClick={() => toggleModal('goals', true)} 
                    icon={Icons.Flag} 
                    colorClass="text-amber-600" 
                />
                <DashboardCard 
                    title="Lending" 
                    value={safeLoans.length} // Used safeLoans
                    subtext={`${safeLoans.filter(l => l.status === 'active').length} Active Loans`} // Used safeLoans
                    linkText="Track Loans" 
                    onClick={() => toggleModal('lending', true)} 
                    icon={Icons.Gift} 
                    colorClass="text-indigo-600" 
                />

                <View className="bg-white rounded-[40px] p-6 mb-12 shadow-sm border border-slate-100">
                    <View className="flex-row bg-slate-100 p-1 rounded-xl mb-6 justify-center">
                        {['weekly', 'monthly', 'yearly'].map(p => (
                            <TouchableOpacity 
                                key={p} 
                                onPress={() => setPeriod(p)} 
                                className={`px-3 py-1.5 rounded-lg flex-1 items-center ${period === p ? 'bg-white shadow-sm' : ''}`}
                            >
                                <Text className={`capitalize text-[10px] font-bold ${period === p ? 'text-indigo-600' : 'text-slate-400'}`}>{p}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    
                    {reportLoading || !report ? (
                        <View className="h-40 items-center justify-center">
                            <ActivityIndicator color="#4f46e5" />
                        </View>
                    ) : (
                        <Suspense fallback={<ActivityIndicator color="#4f46e5" />}>
                            <PersonalReportChartWidget report={report} />
                        </Suspense>
                    )}
                </View>
            </ScrollView>

            {/* --- MODALS --- */}
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
                            <Text className="text-xl font-bold text-slate-800 capitalize">{key.replace('create', 'New ')}</Text>
                            <TouchableOpacity onPress={() => toggleModal(key, false)} className="bg-slate-100 px-4 py-2 rounded-full">
                                <Text className="text-slate-600 font-bold text-xs">Close</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView className="flex-1">
                            <Suspense fallback={<ActivityIndicator size="large" className="mt-20" />}>
                                {key === 'transactions' && <PersonalTransactionsWidget />}
                                {key === 'goals' && <GoalListsWidget onDataChange={refresh} />}
                                {key === 'families' && <ManageFamiliesWidget onEnterRealm={setActiveFamilyRealm} />}
                                {key === 'lending' && <LoanTrackingWidget onDataChange={refresh} />}
                                {key === 'createTx' && <CreateTransactionWidget onSuccess={() => { toggleModal('createTx', false); refresh(); }} />}
                                {key === 'createGoal' && <CreateGoalWidget onSuccess={() => { toggleModal('createGoal', false); refresh(); }} />} 
                                {key === 'recordLoan' && (
                                    <View className="p-5">
                                        {loanFlowStep === 'choice' && <RecordLoanChoiceWidget onSelectFamilyLoan={() => setLoanFlowStep('family')} onSelectPersonalLoan={() => setLoanFlowStep('personal')} />}
                                        {loanFlowStep === 'family' && <RecordLoanFlowWidget onSuccess={() => { toggleModal('recordLoan', false); refresh(); }} />}
                                        {loanFlowStep === 'personal' && <CreatePersonalLoanWidget onSuccess={() => { toggleModal('recordLoan', false); refresh(); }} />}
                                    </View>
                                )}
                                {key === 'applyCompany' && <ApplyPremiumWidget targetAccess="company" onClose={() => toggleModal('applyCompany', false)} onUpgradeSuccess={handleUpgradeSubmit} />}
                                {key === 'applyFamily' && <ApplyPremiumWidget targetAccess="family" onClose={() => toggleModal('applyFamily', false)} onUpgradeSuccess={handleUpgradeSubmit} />}
                            </Suspense>
                        </ScrollView>
                    </SafeAreaView>
                </RNModal>
            ))}
        </SafeAreaView>
    );
}