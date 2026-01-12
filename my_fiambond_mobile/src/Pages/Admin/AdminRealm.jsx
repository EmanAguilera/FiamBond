// AdminRealm.jsx
import React, { useEffect, useState, useCallback, lazy, Suspense, useContext } from "react"; 
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ScrollView, 
    SafeAreaView, 
    ActivityIndicator, 
    Alert, 
    TextInput,
    Modal as RNModal 
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AppContext } from '../../Context/AppContext'; 
import { collection, getDocs, updateDoc, doc, serverTimestamp, query, where, writeBatch } from "firebase/firestore";
import { db } from "../../config/firebase-config";
import Svg, { Path } from "react-native-svg";

// --- LAZY IMPORTS ---
const AdminReportChartWidget = lazy(() => import("../../Components/Admin/Analytics/AdminReportChartWidget"));
const AdminUserTableWidget = lazy(() => import("../../Components/Admin/Users/AdminUserTableWidget")); 
const SubscriptionReportWidget = lazy(() => import("../../Components/Admin/Finance/SubscriptionReportWidget"));
const RevenueLedgerWidget = lazy(() => import("../../Components/Admin/Finance/RevenueLedgerWidget")); 

// --- ICONS ---
const Icons = {
    Plus: <Svg fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}><Path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></Svg>,
    Back: <Svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><Path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></Svg>,
    Money: <Svg fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2}><Path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></Svg>,
    Entities: <Svg fill="none" viewBox="0 0 24 24" stroke="#4f46e5" strokeWidth={2}><Path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></Svg>,
    Report: <Svg fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={2}><Path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></Svg>,
    Team: <Svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><Path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></Svg>
};

// --- CONFIG ---
const getPlanValue = (plan, type = 'company') => {
    if (type === 'company') return plan === 'yearly' ? 15000.0 : 1500.0;
    return plan === 'yearly' ? 5000.0 : 500.0;
};

// --- REUSABLE COMPONENTS ---
const Btn = ({ onClick, type = 'sec', icon, children }) => {
    const styles = {
        admin: "bg-purple-600 border-transparent",
        sec: "bg-white border-slate-300",
    };
    const textStyles = { admin: "text-white", sec: "text-slate-600" };
    return (
        <TouchableOpacity onPress={onClick} activeOpacity={0.7} className={`${styles[type]} px-4 py-3 rounded-xl border flex-row items-center justify-center gap-2`}>
            <View className="w-4 h-4">{icon}</View>
            <Text className={`${textStyles[type]} font-bold text-xs`}>{children}</Text>
        </TouchableOpacity>
    );
};

const DashboardCard = ({ title, value, subtext, linkText, onClick, icon, colorClass, isAlert }) => (
    <TouchableOpacity onPress={onClick} activeOpacity={0.9} className={`border rounded-3xl p-6 mb-4 shadow-sm ${isAlert ? 'border-amber-300 bg-amber-50' : 'border-slate-100 bg-white'}`}>
        <View className="flex-row justify-between items-start">
            <Text className={`font-bold text-xs uppercase tracking-widest ${isAlert ? 'text-amber-800' : 'text-slate-400'}`}>{title}</Text>
            <View className="w-8 h-8">{icon}</View>
        </View>
        <View className="mt-2">
            <Text className={`text-3xl font-black ${colorClass}`}>{value}</Text>
            {subtext && <Text className={`text-[10px] mt-1 font-black uppercase ${isAlert ? 'text-amber-600' : 'text-slate-400'}`}>{subtext}</Text>}
        </View>
        <Text className="text-indigo-600 text-xs mt-5 font-bold">{linkText} →</Text>
    </TouchableOpacity>
);

const AddAdminForm = ({ onAdd, onCancel }) => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    return (
        <View className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm mt-2">
            <Text className="text-xs text-slate-500 mb-4 font-medium">Enter user email to promote to Administrator.</Text>
            <TextInput 
                keyboardType="email-address" 
                value={email} 
                onChangeText={setEmail} 
                placeholder="user@example.com"
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm mb-4" 
            />
            <View className="flex-row justify-end gap-2">
                <TouchableOpacity onPress={onCancel} className="px-4 py-2">
                    <Text className="text-xs font-bold text-slate-400">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={async () => {
                        setLoading(true);
                        await onAdd(email);
                        setLoading(false);
                    }} 
                    disabled={loading} 
                    className={`px-5 py-2 rounded-xl bg-indigo-600 flex-row items-center ${loading ? 'opacity-50' : ''}`}
                >
                    {loading && <ActivityIndicator size="small" color="white" className="mr-2" />}
                    <Text className="text-xs font-bold text-white">
                        {loading ? 'Adding...' : 'Add Admin'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// --- MAIN COMPONENT ---
export default function AdminRealm() {
    const navigation = useNavigation();
    const { user } = useContext(AppContext);

    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [adminUsers, setAdminUsers] = useState([]);
    const [adminLastName, setAdminLastName] = useState("");
    const [premiumUsers, setPremiumUsers] = useState([]);
    const [premiums, setPremiums] = useState([]);
    const [report, setReport] = useState({ total: 0, company: 0, family: 0, chart: [] });
    const [period, setPeriod] = useState('monthly');
    const [currentTotalFunds, setCurrentTotalFunds] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);

    const [modals, setModals] = useState({
        revenue: false,
        entities: false,
        reports: false,
        manageTeam: false
    });

    const toggle = (key, value) => setModals(prev => ({ ...prev, [key]: value }));

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch all users
            const usersSnap = await getDocs(collection(db, "users"));
            const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setUsers(allUsers);
            
            // Admin users
            setAdminUsers(allUsers.filter(u => u.role === 'admin'));

            // Premium users
            setPremiumUsers(allUsers.filter(u => u.premium_access === true || u.company_access === true));

            // Premium transactions
            const premiumsSnap = await getDocs(collection(db, "premiums"));
            const allPremiums = premiumsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setPremiums(allPremiums);

            // Calculate report
            let total = 0, company = 0, family = 0;
            const chartData = [];
            allPremiums.forEach(p => {
                const amt = getPlanValue(p.plan, p.target_access);
                total += amt;
                if (p.target_access === 'company') company += amt;
                else family += amt;
                
                // Chart data (simplified)
                chartData.push({ date: p.created_at.toDate().toLocaleDateString(), amount: amt });
            });
            setReport({ total, company, family, chart: chartData });

            // Current funds (assuming some logic)
            setCurrentTotalFunds(total); // Placeholder

            // Pending requests
            setPendingCount(allPremiums.filter(p => p.status === 'pending').length);

            // Admin last name
            setAdminLastName(user.last_name || 'Admin');

        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to load admin data.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleTogglePremium = async (userId, accessType) => {
        try {
            const batch = writeBatch(db);
            const userRef = doc(db, "users", userId);
            batch.update(userRef, { [accessType === 'company' ? 'company_access' : 'premium_access']: true });

            // Update premiums if needed
            const premiumsQuery = query(collection(db, "premiums"), where("user_id", "==", userId), where("status", "==", "pending"));
            const premiumsSnap = await getDocs(premiumsQuery);
            premiumsSnap.forEach(d => {
                batch.update(d.ref, { status: 'approved', approved_at: serverTimestamp(), approved_by: user.id });
            });

            await batch.commit();
            Alert.alert("Success", "Access granted.");
            fetchData();
        } catch {
            Alert.alert("Error", "Failed to grant access.");
        }
    };

    if (loading) return (
        <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
            <ActivityIndicator size="large" color="#9333ea" />
            <Text className="mt-4 text-slate-400 font-bold">Initializing Admin Realm...</Text>
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
                    <View className="w-1.5 h-12 bg-purple-600 rounded-full mr-4" />
                    <View>
                        <Text className="text-3xl font-black text-slate-800">{adminLastName}</Text>
                        <Text className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">System Controller</Text>
                    </View>
                </View>

                <View className="flex-row justify-end mb-8">
                    <Btn onClick={() => toggle('manageTeam', true)} type="admin" icon={Icons.Team}>Manage Team</Btn>
                </View>

                <DashboardCard title="Admin Funds" value={`₱${currentTotalFunds.toLocaleString()}`} linkText="Ledger" onClick={() => toggle('revenue', true)} icon={Icons.Money} colorClass="text-emerald-600" />
                <DashboardCard title="Users" value={users.length} subtext={pendingCount > 0 ? `⚠️ ${pendingCount} PENDING REQUESTS` : `${premiumUsers.length} PREMIUM`} linkText="Manage Access" onClick={() => toggle('entities', true)} icon={Icons.Entities} colorClass={pendingCount > 0 ? "text-amber-600" : "text-indigo-600"} isAlert={pendingCount > 0} />
                <DashboardCard title="Revenue" value="Export" subtext="Financial Reports" linkText="Manage Reports" onClick={() => toggle('reports', true)} icon={Icons.Report} colorClass="text-amber-600" />

                <View className="bg-white rounded-[40px] p-6 mb-12 shadow-sm border border-slate-100">
                    <Suspense fallback={<ActivityIndicator />}>
                        <AdminReportChartWidget report={report} period={period} setPeriod={setPeriod} />
                    </Suspense>
                </View>
                <View className="h-20" />
            </ScrollView>

            {/* --- MODALS --- */}
            {Object.entries(modals).map(([key, isOpen]) => (
                <RNModal key={key} visible={isOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => toggle(key, false)}>
                    <SafeAreaView className="flex-1 bg-white">
                        <View className="flex-row justify-between p-5 border-b border-slate-100">
                            <Text className="text-xl font-bold text-slate-800 capitalize">{key.replace('manage', 'Manage ')}</Text>
                            <TouchableOpacity onPress={() => toggle(key, false)} className="bg-slate-100 px-4 py-2 rounded-full">
                                <Text className="text-slate-600 font-bold text-xs">Close</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView className="p-5">
                            <Suspense fallback={<ActivityIndicator className="mt-10" />}>
                                {key === 'revenue' && <RevenueLedgerWidget premiums={premiums} users={users} currentAdminId={user.id} />}
                                {key === 'entities' && <AdminUserTableWidget users={users} onTogglePremium={handleTogglePremium} />}
                                {key === 'reports' && <SubscriptionReportWidget transactions={premiums.map(p => ({ ...p, subscriber: users.find(u => u.id === p.user_id)?.full_name || "Unknown" }))} />}
                                {key === 'manageTeam' && (
                                    <View>
                                        <AddAdminForm onAdd={async (email) => { 
                                            const q = query(collection(db, "users"), where("email", "==", email));
                                            const snap = await getDocs(q);
                                            if (snap.empty) return Alert.alert("Not Found", "User not found.");
                                            await updateDoc(snap.docs[0].ref, { role: 'admin' });
                                            Alert.alert("Success", `${email} promoted.`); 
                                            fetchData(); 
                                            toggle('manageTeam', false);
                                        }} onCancel={() => toggle('manageTeam', false)} />
                                        <View className="mt-8">
                                            <AdminUserTableWidget users={adminUsers} type="admin" />
                                        </View>
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