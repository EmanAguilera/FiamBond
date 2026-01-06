import React, { useContext, useEffect, useState, useCallback, useMemo } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator, 
    Alert, // For the 'alert' calls
    Platform // Note: Platform is implicitly needed for styles in nested components, but added here just in case.
} from "react-native";
import { useNavigation } from "@react-navigation/native"; // Replaces useNavigate from react-router-dom
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"; 
import { db } from "../../config/firebase-config.ts"; 
import { AppContext } from "../../Context/AppContext.jsx"; // Note: Context is the same

// --- WIDGET IMPORTS (Directly Imported - No lazy/Suspense in RN) ---
// NOTE: These components must also be converted to their React Native versions.
// We assume they exist for this file.
import Modal from "../../Components/Modal.jsx"; // Assumed RN Modal component
import GoalListsWidget from "../../Components/Personal/Goal/GoalListsWidget.jsx";
import CreateGoalWidget from "../../Components/Personal/Goal/CreateGoalWidget.tsx";
import PersonalTransactionsWidget from "../../Components/Personal/Finance/PersonalTransactionsWidget.jsx";
import CreateTransactionWidget from "../../Components/Personal/Finance/CreateTransactionWidget.tsx";
import ManageFamiliesWidget from "../../Components/Personal/Families/ManageFamiliesWidget.jsx"; 
import PersonalReportChartWidget from "../../Components/Personal/Analytics/PersonalReportChartWidget.jsx";
import LoanTrackingWidget from "../../Components/Personal/Loan/LoanTrackingWidget.tsx";
import RecordLoanFlowWidget from "../../Components/Personal/Loan/Setup/RecordLoanFlowWidget.tsx";
import RecordLoanChoiceWidget from "../../Components/Personal/Loan/Setup/RecordLoanChoiceWidget.tsx";
import CreatePersonalLoanWidget from "../../Components/Personal/Loan/Setup/CreatePersonalLoanWidget.tsx";
import FamilyRealm from "../Family/FamilyRealm.jsx";
import CompanyRealm from "../Company/CompanyRealm.jsx";
import ApplyPremiumWidget from "../../Components/Company/Onboarding/ApplyPremiumWidget.jsx";

// --- ICON PLACEHOLDER (Using Text/Emoji, replace with react-native-vector-icons in a real app) ---
const Icon = ({ name, style }) => {
    let iconText = '';
    switch (name) {
        case 'Plus': iconText = '+'; break;
        case 'Users': iconText = '👥'; break;
        case 'Build': iconText = '🏢'; break;
        case 'Lock': iconText = '🔒'; break;
        case 'Wallet': iconText = '💳'; break;
        case 'Flag': iconText = '🚩'; break;
        case 'Gift': iconText = '🎁'; break;
        default: iconText = '?';
    }
    return <Text style={[{ fontSize: 24, lineHeight: 24 }, style]}>{iconText}</Text>;
};

// Map original icon names to the placeholder component
const Icons = {
    Plus: <Icon name="Plus" style={{ fontSize: 16 }} />,
    Users: <Icon name="Users" style={{ fontSize: 16 }} />,
    Build: <Icon name="Build" style={{ fontSize: 16 }} />,
    Lock: <Icon name="Lock" style={{ fontSize: 16 }} />,
    Wallet: <Icon name="Wallet" />,
    Flag: <Icon name="Flag" />,
    Gift: <Icon name="Gift" />,
};


// --- SUBSCRIPTION REMINDER SUB-COMPONENT ---
const SubscriptionReminder = ({ details, type }) => {
    if (!details) return null;
    const expiryDate = details.expires_at?.toDate();
    if (!expiryDate) return null;
    
    const diffTime = expiryDate - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 7) return null;

    const expired = diffDays <= 0;
    const containerStyle = expired ? styles.reminderExpired : styles.reminderWarning;
    const textStyle = expired ? styles.reminderTextExpired : styles.reminderTextWarning;

    return (
        <View style={[styles.reminderContainer, containerStyle, styles.shadowSm, styles.mb6]}>
            <View style={styles.flexRowCenter}>
                <Text style={styles.reminderEmoji}>{expired ? '🚫' : '⏳'}</Text>
                <View>
                    <Text style={[styles.fontBold, styles.textSm, textStyle]}>
                        {expired ? `${type.toUpperCase()} Access Expired` : `${type.toUpperCase()} expiring in ${diffDays} days`}
                    </Text>
                    <Text style={[styles.textXs, styles.opacity75, textStyle]}>Ends on {expiryDate.toLocaleDateString()}</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.reminderButton}>
                <Text style={styles.reminderButtonText}>{expired ? 'Renew Now' : 'Extend'}</Text>
            </TouchableOpacity>
        </View>
    );
};

// --- REUSABLE BUTTON ---
const Btn = ({ onClick, type = 'sec', icon, children, style = {}, disabled = false }) => {
    const baseStyle = [styles.btnBase, styles.flexRowCenter, styles.shadowSm];
    
    const stylesMap = {
        pri: [styles.btnPri, styles.bgIndigo600, styles.textWhite],
        sec: [styles.btnSec, styles.bgWhite, styles.textSlate600],
        comp: [styles.btnComp, styles.bgIndigo600, styles.textWhite],
        pending: [styles.btnPending, styles.bgAmber100, styles.textAmber700, styles.cursorNotAllowed],
    };

    const finalStyle = [...baseStyle, stylesMap[type]];
    if (disabled) finalStyle.push(styles.btnDisabled);

    // FIX: className is now merged as 'style'
    if (Array.isArray(style)) finalStyle.push(...style); 
    else finalStyle.push(style);

    return (
        <TouchableOpacity 
            onPress={disabled ? undefined : onClick} 
            disabled={disabled}
            style={finalStyle}
            activeOpacity={0.7} // Replaces active:scale-95
        >
            {icon}
            <Text style={[styles.fontMedium, styles.textSm, type === 'pending' ? styles.textAmber700 : (type === 'sec' ? styles.textSlate600 : styles.textWhite)]}>
                {children}
            </Text>
        </TouchableOpacity>
    );
};

// --- DASHBOARD CARD ---
const DashboardCard = ({ title, value, subtext, linkText, onClick, icon, colorClass }) => (
    <TouchableOpacity 
        onPress={onClick} 
        style={[styles.cardContainer, styles.bgWhite, styles.borderSlate200, styles.shadowLg, styles.p6]}
        activeOpacity={0.8}
    >
        <View style={styles.cardHeader}>
            <Text style={[styles.fontBold, styles.textGray600, styles.pr4]}>{title}</Text>
            <View style={[styles.flexShrink0, { color: colorClass.rnColor }]}>{icon}</View>
        </View>
        <View style={styles.flexGrow}>
            <Text style={[styles.text4xl, styles.fontBold, styles.mt2, { color: colorClass.rnColor }]}>
                {value}
            </Text>
            {subtext && <Text style={[styles.textSlate400, styles.textSm, styles.fontMedium, styles.mt1]}>{subtext}</Text>}
        </View>
        <Text style={[styles.textSm, styles.mt3, { color: '#4f46e5', fontWeight: 'bold' }]}>{linkText} →</Text>
    </TouchableOpacity>
);

// Helper for Dashboard Card Colors
const CardColors = {
    emerald: { rnColor: '#059669' }, // text-emerald-600
    rose: { rnColor: '#E11D48' },    // text-rose-600
    amber: { rnColor: '#D97706' },   // text-amber-600
};

// --- CHART DATA HELPER (Same as Web) ---
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
            { label: 'Inflow (₱)', data: labels.map(label => data[label].income), backgroundColor: 'rgba(75, 192, 192, 0.5)' },
            { label: 'Outflow (₱)', data: labels.map(label => data[label].expense), backgroundColor: 'rgba(255, 99, 132, 0.5)' }
        ]
    };
};

export default function UserDashboard() {
    // FIX: Default premiumDetails to an empty object to prevent the TypeError
    const { user, premiumDetails = {} } = useContext(AppContext); 
    const navigation = useNavigation(); // Replaces useNavigate
    const API_URL = 'http://localhost:3000/api'; // Simplify URL handling for RN
    const userLastName = user?.last_name || (user?.full_name ? user.full_name.trim().split(' ').pop() : 'User');

    // Subscription Status Logic (Unchanged but safer now)
    const isCompanyActive = useMemo(() => {
        if (user?.role === 'admin') return true;
        if (!premiumDetails.company) return false;
        return premiumDetails.company.expires_at?.toDate() > new Date();
    }, [user, premiumDetails.company]);

    const isFamilyActive = useMemo(() => {
        if (user?.role === 'admin') return true;
        if (!premiumDetails.family) return false;
        return premiumDetails.family.expires_at?.toDate() > new Date();
    }, [user, premiumDetails.family]);

    const isCompanyPending = user?.subscription_status === 'pending_approval';
    const isFamilyPending = user?.family_subscription_status === 'pending_approval';

    // State (Unchanged)
    const [modals, setModals] = useState({ 
        transactions: false, goals: false, families: false, lending: false, 
        createTx: false, createGoal: false, recordLoan: false, applyCompany: false, applyFamily: false
    });
    const [loanFlowStep, setLoanFlowStep] = useState('choice');
    const [activeFamilyRealm, setActiveFamilyRealm] = useState(null);
    const [showCompanyRealm, setShowCompanyRealm] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [summaryData, setSummaryData] = useState({ netPosition: 0 });
    const [summaryError, setSummaryError] = useState(null);
    const [activeGoalsCount, setActiveGoalsCount] = useState(0);
    const [lendingSummary, setLendingSummary] = useState({ outstanding: 0 });
    const [report, setReport] = useState(null);
    const [reportLoading, setReportLoading] = useState(true);
    const [reportError, setReportError] = useState(null);
    const [period, setPeriod] = useState('monthly');

    const toggleModal = (key, val) => setModals(prev => ({ ...prev, [key]: val }));

    // Fetching Logic (API calls and data processing remains the same)
    const fetchData = useCallback(async () => {
        if (!user) return;
        try {
            const txRes = await fetch(`${API_URL}/transactions?user_id=${user.uid}`);
            const txs = await txRes.json();
            let balance = 0;
            txs.forEach((tx) => { if (!tx.family_id) tx.type === 'income' ? balance += tx.amount : balance -= tx.amount; });
            setSummaryData({ netPosition: balance });

            const gRes = await fetch(`${API_URL}/goals?user_id=${user.uid}`);
            if (gRes.ok) setActiveGoalsCount((await gRes.json()).filter(g => g.status === 'active').length);

            const lRes = await fetch(`${API_URL}/loans?user_id=${user.uid}`);
            if (lRes.ok) {
                const loans = await lRes.json();
                let out = 0;
                loans.forEach(l => { if (l.creditor_id === user.uid && (l.status === 'outstanding' || l.status === 'pending_confirmation')) out += ((l.total_owed || l.amount) - (l.repaid_amount || 0)); });
                setLendingSummary({ outstanding: out });
            }
        } catch (e) { console.error(e); setSummaryError("Error"); }
    }, [user, API_URL]);

    const getReport = useCallback(async () => {
        if (!user) return;
        setReportLoading(true); setReportError(null);
        try {
            const endDate = new Date();
            const startDate = new Date();
            if (period === 'weekly') startDate.setDate(endDate.getDate() - 7);
            else if (period === 'yearly') startDate.setFullYear(endDate.getFullYear() - 1);
            else startDate.setMonth(endDate.getMonth() - 1);

            const res = await fetch(`${API_URL}/transactions?user_id=${user.uid}&startDate=${startDate.toISOString()}`);
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();
            
            const txs = data.filter(tx => !tx.family_id).map(tx => ({ ...tx, created_at: { toDate: () => new Date(tx.created_at) } }));
            let inflow = 0, outflow = 0;
            txs.forEach(tx => tx.type === 'income' ? inflow += tx.amount : outflow += tx.amount);
            
            setReport({ 
                chartData: formatDataForChart(txs), totalInflow: inflow, totalOutflow: outflow, netPosition: inflow - outflow, 
                reportTitle: `Funds Report: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, transactionCount: txs.length 
            });
        } catch { setReportError("No Data"); } finally { setReportLoading(false); }
    }, [user, period, API_URL]);

    const refresh = useCallback(() => { fetchData(); getReport(); }, [fetchData, getReport]);

    useEffect(() => { if (user) { setIsInitialLoading(true); refresh(); setIsInitialLoading(false); } }, [user, refresh]);
    useEffect(() => { if (!isInitialLoading) getReport(); }, [period, isInitialLoading, getReport]);

    const handleUpgradeSubmit = async (paymentData) => {
        try {
            const userRef = doc(db, "users", user.uid);
            const isFamily = paymentData.targetAccess === 'family';
            const updates = isFamily ? {
                family_subscription_status: 'pending_approval',
                family_payment_ref: paymentData.paymentRef,
                family_premium_plan: paymentData.plan,
                family_request_date: serverTimestamp()
            } : {
                subscription_status: 'pending_approval',
                payment_ref: paymentData.paymentRef,
                premium_plan: paymentData.plan,
                request_date: serverTimestamp()
            };
            await updateDoc(userRef, updates);
            toggleModal(isFamily ? 'applyFamily' : 'applyCompany', false);
            Alert.alert("Success!", "Request submitted for review."); // Replaced web alert
        } catch (error) { 
            console.error("Upgrade submission failed:", error); 
            Alert.alert("Error", "Failed to submit request."); // Replaced web alert
        }
    };
    
    // --- CONDITIONAL REALM RENDERING ---
    // In React Native, this pattern is often replaced by using the navigation stack, 
    // but preserving the original logic of rendering one of three full-screen views:
    if (activeFamilyRealm) return <FamilyRealm family={activeFamilyRealm} onBack={() => setActiveFamilyRealm(null)} onDataChange={refresh} />;
    if (showCompanyRealm) return <CompanyRealm company={{ id: user.uid, name: "Company" }} onBack={() => setShowCompanyRealm(false)} onDataChange={refresh} />;

    return (
        <ScrollView style={styles.wFull} contentContainerStyle={styles.contentContainer}>
            
            {/* --- SMART REMINDERS --- */}
            <SubscriptionReminder details={premiumDetails.company} type="company" />
            <SubscriptionReminder details={premiumDetails.family} type="family" />

            {/* --- HEADER --- */}
            <View style={styles.headerContainer}>
                <View style={styles.flexRowCenter}>
                    <View style={styles.headerLine} />
                    <View>
                        <Text style={styles.headerTitle}>{userLastName}</Text>
                        <Text style={styles.headerSubtitle}>Personal Realm</Text>
                    </View>
                </View>

                <View style={styles.headerButtonsWrapper}>
                    <View style={styles.headerButtonsGrid}>
                        <Btn onClick={() => toggleModal('createTx', true)} type="pri" icon={Icons.Plus} style={styles.btnFullWidth}>Transaction</Btn>
                        <Btn onClick={() => toggleModal('createGoal', true)} icon={Icons.Plus}>Goal</Btn>
                        <Btn onClick={() => { setLoanFlowStep('choice'); toggleModal('recordLoan', true); }} icon={Icons.Plus}>Loan</Btn>
                        
                        <View style={styles.headerDivider} />
                        
                        {/* FAMILY BTN */}
                        {isFamilyActive ? (
                            <Btn onClick={() => toggleModal('families', true)} icon={Icons.Users}>Families</Btn>
                        ) : isFamilyPending ? (
                            <Btn type="pending" icon={Icons.Lock} disabled>Pending</Btn>
                        ) : (
                            <Btn onClick={() => toggleModal('applyFamily', true)} type="sec" icon={Icons.Lock}>Families</Btn>
                        )}
                        
                        {/* COMPANY BTN */}
                        {isCompanyActive ? (
                            <Btn onClick={() => setShowCompanyRealm(true)} type="comp" icon={Icons.Build}>Company</Btn>
                        ) : isCompanyPending ? (
                            <Btn type="pending" icon={Icons.Lock} disabled>Pending</Btn>
                        ) : (
                            <Btn onClick={() => toggleModal('applyCompany', true)} type="sec" icon={Icons.Lock}>Company</Btn>
                        )}
                        
                        {user?.role === 'admin' && (
                            <Btn onClick={() => navigation.navigate('AdminRealm')} icon={Icons.Lock} style={styles.btnFullWidth}>Admin</Btn>
                        )}
                    </View>
                </View>
            </View>

            {/* --- CARDS --- */}
            <View style={styles.cardsGrid}>
                <DashboardCard title="Personal Funds" value={summaryError ? 'Error' : `₱${parseFloat(summaryData?.netPosition || 0).toLocaleString()}`} subtext="Available Balance" linkText="View Transactions" onClick={() => toggleModal('transactions', true)} icon={Icons.Wallet} colorClass={CardColors.emerald} />
                <DashboardCard title="Active Goals" value={activeGoalsCount} subtext="Targets in Progress" linkText="View Goals" onClick={() => toggleModal('goals', true)} icon={Icons.Flag} colorClass={CardColors.rose} />
                <DashboardCard title="Outstanding Loans" value={`₱${lendingSummary.outstanding.toLocaleString()}`} subtext="Total Receivables" linkText="Manage Lending" onClick={() => toggleModal('lending', true)} icon={Icons.Gift} colorClass={CardColors.amber} />
            </View>

            {/* --- CHART SECTION --- */}
            <View style={styles.dashboardSection}>
                <View style={styles.periodSelectorWrapper}>
                    {['weekly', 'monthly', 'yearly'].map(p => (
                        <TouchableOpacity key={p} onPress={() => setPeriod(p)} style={[styles.periodButton, period === p && styles.periodButtonActive]}>
                            <Text style={[styles.textSm, styles.capitalize, period === p ? styles.textSlate800 : styles.textSlate500]}>{p}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                {reportLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4F46E5" />
                        <Text style={styles.loadingText}>Loading Report...</Text>
                    </View>
                ) : reportError ? (
                    <Text style={styles.errorText}>{reportError}</Text>
                ) : (
                    <PersonalReportChartWidget report={report} />
                )}
            </View>

            {/* --- MODALS --- */}
            {/* Note: RN Modals need correct platform-specific implementation */}
            {modals.transactions && <Modal isOpen={modals.transactions} onClose={() => toggleModal('transactions', false)} title="Personal Transactions"><PersonalTransactionsWidget /></Modal>}
            {modals.goals && <Modal isOpen={modals.goals} onClose={() => toggleModal('goals', false)} title="Goals"><GoalListsWidget onDataChange={refresh} /></Modal>}
            {modals.families && <Modal isOpen={modals.families} onClose={() => toggleModal('families', false)} title="Families"><ManageFamiliesWidget onEnterRealm={setActiveFamilyRealm} /></Modal>}
            {modals.lending && <Modal isOpen={modals.lending} onClose={() => toggleModal('lending', false)} title="Loans"><LoanTrackingWidget onDataChange={refresh} /></Modal>}
            {modals.createTx && <Modal isOpen={modals.createTx} onClose={() => toggleModal('createTx', false)} title="New Transaction"><CreateTransactionWidget onSuccess={() => { toggleModal('createTx', false); refresh(); }} /></Modal>}
            {modals.createGoal && <Modal isOpen={modals.createGoal} onClose={() => toggleModal('createGoal', false)} title="New Goal"><CreateGoalWidget onSuccess={() => { toggleModal('createGoal', false); fetchData(); }} /></Modal>}
            {modals.recordLoan && <Modal isOpen={modals.recordLoan} onClose={() => toggleModal('recordLoan', false)} title="Record Loan">
                {loanFlowStep === 'choice' && <RecordLoanChoiceWidget onSelectFamilyLoan={() => setLoanFlowStep('family')} onSelectPersonalLoan={() => setLoanFlowStep('personal')} />}
                {loanFlowStep === 'family' && <RecordLoanFlowWidget onSuccess={() => { toggleModal('recordLoan', false); refresh(); }} />}
                {loanFlowStep === 'personal' && <CreatePersonalLoanWidget onSuccess={() => { toggleModal('recordLoan', false); refresh(); }} />}
            </Modal>}
            {modals.applyCompany && <Modal isOpen={modals.applyCompany} onClose={() => toggleModal('applyCompany', false)} title="Unlock Company"><ApplyPremiumWidget targetAccess="company" onClose={() => toggleModal('applyCompany', false)} onUpgradeSuccess={handleUpgradeSubmit} /></Modal>}
            {modals.applyFamily && <Modal isOpen={modals.applyFamily} onClose={() => toggleModal('applyFamily', false)} title="Unlock Family"><ApplyPremiumWidget targetAccess="family" onClose={() => toggleModal('applyFamily', false)} onUpgradeSuccess={handleUpgradeSubmit} /></Modal>}
        </ScrollView>
    );
}

// --- STYLESHEET (Tailwind to React Native Conversion) ---
const styles = StyleSheet.create({
    // Utility Styles
    wFull: { width: '100%' },
    contentContainer: { padding: 16 },
    mb6: { marginBottom: 24 },
    mb8: { marginBottom: 32 },
    mt1: { marginTop: 4 },
    mt2: { marginTop: 8 },
    mt3: { marginTop: 12 },
    p6: { padding: 24 },
    pr4: { paddingRight: 16 },
    flexRowCenter: { flexDirection: 'row', alignItems: 'center' },
    fontBold: { fontWeight: 'bold' },
    fontMedium: { fontWeight: '500' },
    flexGrow: { flexGrow: 1 },
    flexShrink0: { flexShrink: 0 },
    textSm: { fontSize: 14 },
    textXs: { fontSize: 12 },
    textSlate400: { color: '#94A3B8' },
    textSlate500: { color: '#64748B' },
    textSlate600: { color: '#475569' },
    textSlate800: { color: '#1E293B' },
    textGray600: { color: '#4B5563' },
    textAmber700: { color: '#B45309' },
    textWhite: { color: '#FFFFFF' },
    capitalize: { textTransform: 'capitalize' },
    opacity75: { opacity: 0.75 },
    
    // Shadow/Borders
    shadowSm: { 
        shadowColor: "#000", 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.22, 
        shadowRadius: 2.22, 
        elevation: 3 
    },
    shadowLg: { 
        shadowColor: "#000", 
        shadowOffset: { width: 0, height: 3 }, 
        shadowOpacity: 0.29, 
        shadowRadius: 4.65, 
        elevation: 7 
    },
    borderSlate200: { borderColor: '#E2E8F0', borderWidth: 1, opacity: 0.5 },
    roundedXl: { borderRadius: 12 },
    rounded2xl: { borderRadius: 16 },
    roundedFull: { borderRadius: 9999 },

    // SubscriptionReminder Styles
    reminderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    reminderExpired: { backgroundColor: '#FFF1F2', borderColor: '#FECACA' }, // bg-rose-50, border-rose-200
    reminderWarning: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }, // bg-amber-50, border-amber-200
    reminderTextExpired: { color: '#B91C1C' }, // text-rose-800
    reminderTextWarning: { color: '#92400E' }, // text-amber-800
    reminderEmoji: { fontSize: 20, marginRight: 12 },
    reminderButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'currentColor', // Placeholder for dynamic current color
        ...{ shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1.41, elevation: 2 } // shadow-sm
    },
    reminderButtonText: { fontSize: 12, fontWeight: 'bold' },

    // Header Styles
    headerContainer: {
        marginBottom: 32,
        // md:flex-row md:items-end md:justify-between gap-6 is handled by the View structure below
    },
    headerLine: {
        width: 4,
        height: 48, // h-12
        backgroundColor: '#4F46E5', // bg-indigo-600
        borderRadius: 9999,
        opacity: 0.8,
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 28, // text-3xl
        fontWeight: 'bold',
        color: '#1E293B', // text-slate-800
        lineHeight: 32,
    },
    headerSubtitle: {
        color: '#64748B', // text-slate-500
        fontWeight: '500',
        fontSize: 14,
        marginTop: 4,
        letterSpacing: 1,
    },
    headerButtonsWrapper: {
        width: '100%',
        marginTop: 24, // gap-6
    },
    headerButtonsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12, // grid-cols-2 gap-3 (approx)
        justifyContent: 'flex-start',
    },
    headerDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 4,
    },
    btnFullWidth: { width: '100%' }, // Col-span-2

    // Button Styles (Btn Component)
    btnBase: {
        paddingHorizontal: 16,
        paddingVertical: 10, // py-2.5
        borderRadius: 12, // rounded-xl
        transition: 'all',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8, // gap-2
    },
    btnPri: { borderColor: 'transparent', borderWidth: 1 }, // pri
    btnSec: { borderColor: '#CBD5E1', borderWidth: 1 }, // sec
    btnComp: { borderColor: 'transparent', borderWidth: 1 }, // comp
    btnPending: { borderColor: '#FCD34D', borderWidth: 1 }, // pending
    bgIndigo600: { backgroundColor: '#4F46E5' },
    bgWhite: { backgroundColor: 'white' },
    bgAmber100: { backgroundColor: '#FEF3C7' },
    cursorNotAllowed: { opacity: 0.6 },
    btnDisabled: { opacity: 0.6 },


    // DashboardCard Styles
    cardsGrid: {
        marginBottom: 32,
        gap: 24, // grid-cols-1 md:grid-cols-3 gap-6
    },
    cardContainer: {
        borderRadius: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    text4xl: { fontSize: 36 }, // text-4xl

    // Chart Section Styles
    dashboardSection: {
        marginBottom: 32,
    },
    periodSelectorWrapper: {
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9', // bg-slate-100
        padding: 4, // p-1
        borderRadius: 12, // rounded-xl
        alignSelf: 'center', // w-fit mx-auto
        marginBottom: 24,
    },
    periodButton: {
        paddingHorizontal: 16,
        paddingVertical: 8, // py-1
        borderRadius: 8, // rounded-lg
        transition: 'all',
    },
    periodButtonActive: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1.41,
        elevation: 2, // shadow-sm
        fontWeight: '600',
    },
    loadingContainer: {
        height: 384, // h-96
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        color: '#94A3B8', // text-slate-400
        marginTop: 8,
    },
    errorText: {
        color: '#EF4444', // text-red-500
        textAlign: 'center',
        paddingVertical: 40,
    }
});