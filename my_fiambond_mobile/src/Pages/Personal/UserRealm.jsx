import React, { useContext, useEffect, useState, useCallback, useMemo } from "react";
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
// FIX: Replace this with your specific Port 3000 Codespace URL
// Example: https://super-duper-engine-57wjxxp4jxq2p64w-3000.app.github.dev
const API_BASE_URL = 'https://super-duper-engine-57wjxxp4jxq2p64w-3000.app.github.dev';
// ----------------------------------------------------------------

// --- WIDGET IMPORTS (FIXED: Changed from lazy() to regular imports to resolve "unknown module" error) ---
import PersonalTransactionsWidget from "../../Components/Personal/Finance/PersonalTransactionsWidget";
import GoalListsWidget from "../../Components/Personal/Goal/GoalListsWidget";
import ManageFamiliesWidget from "../../Components/Personal/Families/ManageFamiliesWidget"; 
import LoanTrackingWidget from "../../Components/Personal/Loan/LoanTrackingWidget";
import PersonalReportChartWidget from "../../Components/Personal/Analytics/PersonalReportChartWidget";
import CreateTransactionWidget from "../../Components/Personal/Finance/CreateTransactionWidget";
import CreateGoalWidget from "../../Components/Personal/Goal/CreateGoalWidget";
import CreatePersonalLoanWidget from "../../Components/Personal/Loan/Setup/CreatePersonalLoanWidget";
import RecordLoanChoiceWidget from "../../Components/Personal/Loan/Setup/RecordLoanChoiceWidget";
import RecordLoanFlowWidget from "../../Components/Personal/Loan/Setup/RecordLoanFlowWidget";
import ApplyPremiumWidget from "../../Components/Company/Onboarding/ApplyPremiumWidget";


const IconWrapper = ({ children, colorClass = "bg-indigo-100" }) => (
    <View className={`p-2 rounded-xl ${colorClass} items-center justify-center`}>
        {children}
    </View>
);

export default function UserRealm() {
    // FIX: Added default empty object to premiumDetails to prevent 'undefined' crash
    const { user, userDetails, premiumDetails = {}, refreshUserDetails } = useContext(AppContext);
    const navigation = useNavigation();

    const [transactions, setTransactions] = useState([]);
    const [goals, setGoals] = useState([]);
    const [families, setFamilies] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loans, setLoans] = useState([]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [modals, setModals] = useState({
        transactions: false,
        goals: false,
        families: false,
        loans: false,
        analytics: false,
        createTransaction: false,
        createGoal: false,
        recordLoan: false,
        applyCompany: false,
        applyFamily: false
    });

    const [loanFlowStep, setLoanFlowStep] = useState('choice');

    const toggleModal = (key, value) => {
        setModals(prev => ({ ...prev, [key]: value }));
        if (key === 'recordLoan' && value === false) setLoanFlowStep('choice');
    };

    const refresh = useCallback(async () => {
        if (!user) return;
        setRefreshing(true);
        try {
            const fetchAndCheck = async (endpoint) => {
                const response = await fetch(`${API_BASE_URL}/api/${endpoint}?user_id=${user.uid}`);
                if (!response.ok) return [];
                return await response.json();
            };

            const [txData, goalData, famData, compData, loanData] = await Promise.all([
                fetchAndCheck('transactions'),
                fetchAndCheck('goals'),
                fetchAndCheck('families'),
                fetchAndCheck('companies'),
                fetchAndCheck('loans')
            ]);

            setTransactions(txData);
            setGoals(goalData);
            setFamilies(famData);
            setCompanies(compData);
            setLoans(loanData);

            const reportRes = await fetch(`${API_BASE_URL}/api/reports/personal/${user.uid}?period=monthly`);
            if (reportRes.ok) setReportData(await reportRes.json());

        } catch (error) {
            console.error("Data load error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useEffect(() => { refresh(); }, [refresh]);

    const handleUpgradeSubmit = async (targetAccess) => {
        try {
            const userRef = doc(db, "users", user.uid);
            const updateField = targetAccess === 'company' ? 'is_company_premium' : 'is_family_premium';
            await updateDoc(userRef, {
                [updateField]: true,
                updated_at: serverTimestamp()
            });
            await refreshUserDetails();
            toggleModal(targetAccess === 'company' ? 'applyCompany' : 'applyFamily', false);
            Alert.alert("Success", `${targetAccess.charAt(0).toUpperCase() + targetAccess.slice(1)} Premium Activated!`);
            refresh();
        } catch (error) {
            Alert.alert("Error", "Failed to process upgrade.");
        }
    };

    const stats = useMemo(() => {
        const totalBalance = transactions.reduce((sum, tx) => tx.type === 'income' ? sum + tx.amount : sum - tx.amount, 0);
        const totalGoals = goals.length;
        const pendingLoans = loans.filter(l => l.status === 'pending' || l.status === 'active').length;
        return { totalBalance, totalGoals, pendingLoans };
    }, [transactions, goals, loans]);

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text className="mt-4 text-gray-500 font-medium">Synchronizing your Realm...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
                <View className="py-6 flex-row justify-between items-center">
                    <View>
                        <Text className="text-gray-500 text-sm font-medium italic">Personal Realm</Text>
                        <Text className="text-3xl font-black text-gray-900 tracking-tight">
                            {user?.displayName?.split(' ')[0] || 'User'}'s Space
                        </Text>
                    </View>
                    <View className="flex-row gap-2">
                        {/* FIX: Use Optional Chaining ?. to prevent crashes */}
                        {premiumDetails?.company && (
                            <View className="bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                                <Text className="text-emerald-700 text-[10px] font-bold uppercase">Company</Text>
                            </View>
                        )}
                        {premiumDetails?.family && (
                            <View className="bg-blue-100 px-3 py-1 rounded-full border border-blue-200">
                                <Text className="text-blue-700 text-[10px] font-bold uppercase">Family</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Quick Balance Card */}
                <View className="bg-indigo-600 rounded-3xl p-6 shadow-xl mb-8">
                    <Text className="text-indigo-100 text-sm font-bold uppercase tracking-wider mb-1">Total Balance</Text>
                    <Text className="text-white text-4xl font-black mb-6">
                        ₱{stats.totalBalance.toLocaleString()}
                    </Text>
                    <View className="flex-row justify-between border-t border-indigo-500/50 pt-4">
                        <View>
                            <Text className="text-indigo-200 text-xs font-bold uppercase">Active Goals</Text>
                            <Text className="text-white text-lg font-black">{stats.totalGoals}</Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-indigo-200 text-xs font-bold uppercase">Open Loans</Text>
                            <Text className="text-white text-lg font-black">{stats.pendingLoans}</Text>
                        </View>
                    </View>
                </View>

                {/* Access Hub */}
                <Text className="text-gray-900 text-lg font-black mb-4 px-1">Realm Access</Text>
                <View className="flex-row flex-wrap justify-between gap-y-4 mb-8">
                    {/* Companies Access */}
                    <TouchableOpacity 
                        onPress={() => premiumDetails?.company ? navigation.navigate("CompanyRealm") : toggleModal('applyCompany', true)}
                        className="bg-white w-[48%] p-5 rounded-3xl shadow-sm border border-gray-100 items-center"
                    >
                        <IconWrapper colorClass="bg-emerald-50">
                            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <Path d="M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3" />
                                <Path d="M19 21V11M5 21V11" />
                            </Svg>
                        </IconWrapper>
                        <Text className="text-gray-900 font-bold mt-3">Company</Text>
                        {!premiumDetails?.company && <Text className="text-gray-400 text-[10px] font-bold uppercase mt-1">Upgrade</Text>}
                    </TouchableOpacity>

                    {/* Family Access */}
                    <TouchableOpacity 
                        onPress={() => premiumDetails?.family ? navigation.navigate("FamilyRealm") : toggleModal('applyFamily', true)}
                        className="bg-white w-[48%] p-5 rounded-3xl shadow-sm border border-gray-100 items-center"
                    >
                        <IconWrapper colorClass="bg-blue-50">
                            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <Path d="M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                                <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </Svg>
                        </IconWrapper>
                        <Text className="text-gray-900 font-bold mt-3">Family</Text>
                        {!premiumDetails?.family && <Text className="text-gray-400 text-[10px] font-bold uppercase mt-1">Upgrade</Text>}
                    </TouchableOpacity>
                </View>

                {/* Operations */}
                <Text className="text-gray-900 text-lg font-black mb-4 px-1">Management</Text>
                <View className="space-y-4 mb-10">
                    {[
                        { label: 'Finances', key: 'transactions', icon: <Path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />, color: "#4f46e5", bg: "bg-indigo-50" },
                        { label: 'Goals', key: 'goals', icon: <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />, color: "#eab308", bg: "bg-yellow-50" },
                        { label: 'Loans', key: 'loans', icon: <Path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />, color: "#ec4899", bg: "bg-pink-50" },
                        { label: 'Analytics', key: 'analytics', icon: <Path d="M18 20V10M12 20V4M6 20v-6" />, color: "#8b5cf6", bg: "bg-violet-50" }
                    ].map((item) => (
                        <TouchableOpacity 
                            key={item.key}
                            onPress={() => toggleModal(item.key, true)}
                            className="bg-white p-5 rounded-3xl flex-row items-center justify-between shadow-sm border border-gray-100"
                        >
                            <View className="flex-row items-center">
                                <IconWrapper colorClass={item.bg}>
                                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        {item.icon}
                                    </Svg>
                                </IconWrapper>
                                <Text className="ml-4 text-gray-900 font-bold text-base">{item.label}</Text>
                            </View>
                            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <Path d="M9 18l6-6-6-6" />
                            </Svg>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* Modals */}
            {Object.entries(modals).map(([key, isOpen]) => (
                <RNModal key={key} visible={isOpen} animationType="slide" transparent={false}>
                    <SafeAreaView className="flex-1 bg-white">
                        <View className="px-5 py-4 border-b border-gray-100 flex-row items-center justify-between">
                            <Text className="text-xl font-black text-gray-900 capitalize">
                                {key.replace(/([A-Z])/g, ' $1')}
                            </Text>
                            <TouchableOpacity onPress={() => toggleModal(key, false)} className="p-2">
                                <Text className="text-indigo-600 font-bold">Done</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView className="flex-1">
                            {/* FIX: Removed Suspense component, as it caused "unknown module" errors with React Native Web/Metro code splitting */}
                            {key === 'transactions' && <PersonalTransactionsWidget transactions={transactions} onAddPress={() => toggleModal('createTransaction', true)} />}
                            {key === 'goals' && <GoalListsWidget goals={goals} onAddPress={() => toggleModal('createGoal', true)} />}
                            {key === 'loans' && <LoanTrackingWidget loans={loans} onAddPress={() => toggleModal('recordLoan', true)} />}
                            {key === 'analytics' && <PersonalReportChartWidget reportData={reportData} />}
                            {key === 'createTransaction' && <CreateTransactionWidget onSuccess={() => { toggleModal('createTransaction', false); refresh(); }} />}
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
                        </ScrollView>
                    </SafeAreaView>
                </RNModal>
            ))}
        </SafeAreaView>
    );
}