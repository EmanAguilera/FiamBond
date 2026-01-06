import React, { useState, useContext, useCallback, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator, 
    Dimensions,
    Alert 
} from 'react-native';
import { AppContext } from '../../Context/AppContext.jsx';
import { db } from '../../config/firebase-config.ts';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';

// --- DIRECTLY IMPORTED WIDGETS (Assumed Native versions) ---
import Modal from '../../Components/Modal.jsx';
import FamilyReportChartWidget from '../../Components/Family/Analytics/FamilyReportChartWidget.jsx';
import LoanTrackingWidget from '../../Components/Personal/Loan/LoanTrackingWidget.tsx';
import GoalListsWidget from "../../Components/Personal/Goal/GoalListsWidget.jsx";
import CreateLoanWidget from '../../Components/Personal/Loan/Setup/CreateLoanWidget.tsx';
import CreateFamilyTransactionWidget from '../../Components/Family/Finance/CreateFamilyTransactionWidget.tsx';
import CreateFamilyGoalWidget from '../../Components/Family/Goal/CreateFamilyGoalWidget.tsx';
import FamilyTransactionsWidget from '../../Components/Family/Finance/FamilyTransactionsWidget.tsx';
import ManageMembersWidget from '../../Components/Family/Members/ManageMembersWidget.jsx'; 
import FamilyMembersView from '../../Components/Family/Members/ManageMembersWidget.jsx'; // Assuming ManageMembersWidget is used for the view

// --- ICON PLACEHOLDER ---
/**
 * @param {{name: string, style: object, size: number}} props
 */
const Icon = ({ name, style, size = 16 }) => {
    let iconText = '';
    switch (name) {
        case 'Plus': iconText = '+'; break;
        case 'Back': iconText = '←'; break;
        case 'Users': iconText = '👥'; break;
        case 'Wallet': iconText = '💳'; break;
        case 'Flag': iconText = '🚩'; break;
        case 'Gift': iconText = '🎁'; break;
        default: iconText = '?';
    }
    return <Text style={[{ fontSize: size, lineHeight: size }, style]}>{iconText}</Text>;
};
const Icons = {
    Plus: <Icon name="Plus" />,
    Back: <Icon name="Back" />,
    Users: <Icon name="Users" />,
    Wallet: <Icon name="Wallet" size={32} />,
    Flag: <Icon name="Flag" size={32} />,
    Gift: <Icon name="Gift" size={32} />
};

// --- REUSABLE BUTTON ---
/**
 * @param {{onClick: function, type: 'pri'|'sec'|'ghost', icon: React.ReactNode, children: React.ReactNode, style: object}} props
 */
const Btn = ({ onClick, type = 'sec', icon, children, style = {} }) => {
    const stylesMap = {
        pri: [styles.btnBase, styles.bgIndigo600],
        sec: [styles.btnBase, styles.bgWhite, styles.borderSlate300, styles.textSlate600],
        ghost: [styles.btnBase, styles.bgTransparent, styles.textSlate500],
    };
    const finalStyle = stylesMap[type] || stylesMap.sec;

    return (
        <TouchableOpacity onPress={onClick} style={[...finalStyle, style]}>
            {icon}
            <Text style={[styles.btnText, type === 'sec' ? styles.textSlate600 : styles.textWhite]}>{children}</Text>
        </TouchableOpacity>
    );
};

// --- DASHBOARD CARD ---
/**
 * @param {{title: string, value: any, subtext: string, linkText: string, onClick: function, icon: React.ReactNode, colorClass: {rnColor: string}}} props
 */
const DashboardCard = ({ title, value, subtext, linkText, onClick, icon, colorClass }) => (
    <TouchableOpacity onPress={onClick} style={styles.cardContainer} activeOpacity={0.8}>
        <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{title}</Text>
            <View style={[{ color: colorClass.rnColor }]}>{icon}</View>
        </View>
        <View style={styles.cardValueWrapper}>
            <Text style={[styles.cardValue, { color: colorClass.rnColor }]}>{value}</Text>
        </View>
        {subtext && <Text style={styles.cardSubtext}>{subtext}</Text>}
        <Text style={styles.cardLink}>{linkText} →</Text>
    </TouchableOpacity>
);

const CardColors = {
    emerald: { rnColor: '#059669' }, // text-emerald-600
    rose: { rnColor: '#E11D48' },    // text-rose-600
    amber: { rnColor: '#D97706' },   // text-amber-600
};

// --- HELPER FUNCTION --- (Simplified for RN use)
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

/**
 * @param {{family: {id: string, family_name: string}, onBack: function, onDataChange: function, onFamilyUpdate: function}} props
 */
export default function FamilyRealm({ family, onBack, onDataChange, onFamilyUpdate }) {
    const { user } = useContext(AppContext);
    const API_URL = 'http://localhost:3000/api'; // Simplified URL

    const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [isGoalsListModalOpen, setIsGoalsListModalOpen] = useState(false);
    const [isFamilyTransactionsModalOpen, setIsFamilyTransactionsModalOpen] = useState(false);
    const [isLoanListModalOpen, setIsLoanListModalOpen] = useState(false);
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
    
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
                    if (tx.type === 'income') netPosition += tx.amount;
                    else netPosition -= tx.amount;
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
                setActiveGoalsCount((await response.json()).filter(g => g.status === 'active').length);
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
            
            if (period === 'weekly') {
                startDate.setDate(endDate.getDate() - 7);
            } else if (period === 'yearly') {
                startDate.setFullYear(endDate.getFullYear() - 1);
            } else {
                startDate.setMonth(endDate.getMonth() - 1);
            }
            
            const response = await fetch(`${API_URL}/transactions?family_id=${family.id}&startDate=${startDate.toISOString()}`);
            if (!response.ok) throw new Error('API Error');
            
            const transactions = (await response.json()).map(tx => ({ ...tx, id: tx._id, created_at: { toDate: () => new Date(tx.created_at) } }));

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
        } catch (error) { 
            console.error("Report Fetch Error:", error);
            setReportError("No data"); 
        } finally { setReportLoading(false); }
    }, [user, family, period, familyNotFound]);

    const handleRealmRefresh = useCallback(async () => {
        if (familyNotFound) return;
        setIsTransactionModalOpen(false); setIsGoalModalOpen(false); setIsLoanModalOpen(false);
        await Promise.all([ getFamilyBalance(), getFamilyActiveGoalsCount(), getFamilyActiveLoansCount(), getFamilyReport(), getFamilyMembers() ]);
        if (onDataChange) onDataChange();
    }, [getFamilyBalance, getFamilyActiveGoalsCount, getFamilyActiveLoansCount, getFamilyReport, getFamilyMembers, onDataChange, familyNotFound]);

    useEffect(() => {
        const fetchAllData = async () => {
            if (!family || !user) return;
            setLoading(true);
            try {
                const checkResponse = await fetch(`${API_URL}/families/${family.id}`);
                if (checkResponse.status === 404) { setFamilyNotFound(true); setLoading(false); return; }
                await Promise.all([ getFamilyBalance(), getFamilyActiveGoalsCount(), getFamilyActiveLoansCount(), getFamilyReport(), getFamilyMembers() ]);
            } catch (error) { console.error(error); } finally { setLoading(false); }
        };
        fetchAllData();
    }, [family, user, getFamilyBalance, getFamilyActiveGoalsCount, getFamilyActiveLoansCount, getFamilyReport, getFamilyMembers]); 

    useEffect(() => { if (!loading && !familyNotFound) getFamilyReport(); }, [period, loading, familyNotFound, getFamilyReport]);

    const handleMembersUpdate = (updatedFamily) => { getFamilyMembers(); if (onFamilyUpdate) onFamilyUpdate(updatedFamily); };
    
    if (loading) return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Loading Family Realm...</Text>
        </View>
    );
    if (familyNotFound) return (
        <View style={styles.notFoundContainer}>
            <Text style={styles.notFoundText}>Family Not Found</Text>
            <TouchableOpacity onPress={onBack} style={styles.backButtonLarge}>
                <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <ScrollView style={styles.mainWrapper}>
            {/* --- HEADER --- */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    
                    {/* Utility Pill Back Button */}
                    <TouchableOpacity 
                        onPress={onBack} 
                        style={styles.backButtonPill}
                    >
                        {Icons.Back}
                        <Text style={styles.backButtonPillText}>Back to Personal</Text>
                    </TouchableOpacity>

                    <View style={styles.titleArea}>
                        <View style={styles.titleLine}></View>
                        <View>
                            <Text style={styles.titleHeader}>{family.family_name}</Text>
                            <Text style={styles.titleSubtext}>Family Realm</Text>
                        </View>
                    </View>
                </View>

                {/* --- RESPONSIVE BUTTON GRID --- */}
                <View style={styles.buttonGridWrapper}>
                    <View style={styles.buttonGrid}>
                        
                        {/* Transaction Button: Full Width on Mobile */}
                        <View style={styles.btnFullMobile}>
                            <Btn onClick={() => setIsTransactionModalOpen(true)} type="pri" icon={Icons.Plus} style={styles.btnBase}>
                                Transaction
                            </Btn>
                        </View>

                        {/* Middle Buttons */}
                        <Btn onClick={() => setIsGoalModalOpen(true)} icon={Icons.Plus} style={styles.btnBase}>Goal</Btn>
                        <Btn onClick={() => setIsLoanModalOpen(true)} icon={Icons.Plus} style={styles.btnBase}>Loan</Btn>
                        
                        <View style={styles.btnDivider}></View>
                        
                        {/* Members Button: Full Width on Mobile */}
                        <View style={styles.btnFullMobile}>
                            <Btn onClick={() => setIsMembersModalOpen(true)} icon={Icons.Users} style={styles.btnBase}>
                                Members
                            </Btn>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.cardsGrid}>
                <DashboardCard 
                    title="Family Funds" 
                    value={summaryData ? `₱${summaryData.netPosition.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '₱0.00'} 
                    subtext="Available Balance" 
                    linkText="View Transactions" 
                    onClick={() => setIsFamilyTransactionsModalOpen(true)} 
                    icon={Icons.Wallet} 
                    colorClass={CardColors.emerald}
                />
                <DashboardCard 
                    title="Active Goals" 
                    value={activeGoalsCount} 
                    subtext="Targets in Progress" 
                    linkText="View Goals" 
                    onClick={() => setIsGoalsListModalOpen(true)} 
                    icon={Icons.Flag} 
                    colorClass={CardColors.rose}
                />
                <DashboardCard 
                    title="Outstanding Loans" 
                    value={activeLoansCount} 
                    subtext="Total Receivables" 
                    linkText="Manage Lending" 
                    onClick={() => setIsLoanListModalOpen(true)} 
                    icon={Icons.Gift} 
                    colorClass={CardColors.amber}
                />
            </View>

            <View style={styles.dashboardSection}>
                {/* --- PERIOD SELECTOR --- */}
                <View style={styles.periodSelectorWrapper}>
                    {['weekly', 'monthly', 'yearly'].map(p => (
                        <TouchableOpacity key={p} onPress={() => setPeriod(p)} style={[styles.periodButton, period === p && styles.periodButtonActive]}>
                            <Text style={[styles.periodButtonText, period === p && styles.periodButtonTextActive]}>{p}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {reportLoading ? (
                    <View style={styles.reportLoadingBox}>
                        <ActivityIndicator size="large" color="#4F46E5" />
                        <Text style={styles.reportLoadingText}>Loading Report...</Text>
                    </View>
                ) : reportError ? (
                    <View style={styles.reportErrorBox}>
                        <Text style={styles.reportErrorText}>No data available</Text>
                    </View>
                ) : (
                    <FamilyReportChartWidget family={family} report={report} />
                )}
            </View>

            {/* Modals */}
            {isLoanModalOpen && <Modal isOpen={isLoanModalOpen} onClose={() => setIsLoanModalOpen(false)} title="Record New Loan"><CreateLoanWidget family={family} members={familyMembers} onSuccess={handleRealmRefresh} /></Modal>}
            {isTransactionModalOpen && <Modal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} title={`Record New Transaction`}><CreateFamilyTransactionWidget family={family} onSuccess={handleRealmRefresh} /></Modal>}
            {isGoalModalOpen && <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title={`Record New Goal`}><CreateFamilyGoalWidget family={family} onSuccess={handleRealmRefresh} /></Modal>}
            {isFamilyTransactionsModalOpen && <Modal isOpen={isFamilyTransactionsModalOpen} onClose={() => setIsFamilyTransactionsModalOpen(false)} title={`Shared Family Transactions`}><FamilyTransactionsWidget family={family} /></Modal>}
            {isGoalsListModalOpen && <Modal isOpen={isGoalsListModalOpen} onClose={() => setIsGoalsListModalOpen(false)} title={`Shared Family Goals`}><GoalListsWidget family={family} onDataChange={handleRealmRefresh} /></Modal>}
            {isLoanListModalOpen && <Modal isOpen={isLoanListModalOpen} onClose={() => setIsLoanListModalOpen(false)} title={`Shared Family Loan Tracker`}><LoanTrackingWidget family={family} onDataChange={handleRealmRefresh} /></Modal>}
            {isMembersModalOpen && <Modal isOpen={isMembersModalOpen} onClose={() => setIsMembersModalOpen(false)} title={`Manage Member Access`}><FamilyMembersView family={family} members={familyMembers} onUpdate={handleMembersUpdate}/></Modal>}
        </ScrollView>
    );
}

// --- REACT NATIVE STYLESHEET ---
const styles = StyleSheet.create({
    // --- Colors ---
    textWhite: { color: 'white' },
    textSlate600: { color: '#475569' },
    textSlate500: { color: '#64748B' },
    bgWhite: { backgroundColor: 'white' },
    bgIndigo600: { backgroundColor: '#4F46E5' },
    bgTransparent: { backgroundColor: 'transparent' },
    borderSlate300: { borderColor: '#CBD5E1', borderWidth: 1 },
    
    // --- Layout ---
    mainWrapper: { 
        flex: 1, 
        paddingHorizontal: 16, // px-4 sm:px-6 lg:px-8
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 10,
        color: '#64748B',
        fontSize: 16,
    },
    notFoundContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    notFoundText: {
        fontSize: 18,
        color: '#DC2626',
        marginBottom: 20,
    },
    backButtonLarge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
    },
    backButtonText: {
        color: '#475569',
        fontWeight: 'bold',
    },

    // --- Header ---
    header: {
        marginBottom: 32, // mb-8
        flexDirection: 'column',
        // md:flex-row md:items-end justify-between gap-6 is handled by the View structure
        gap: 24, // gap-6
    },
    headerLeft: {
        flexDirection: 'column',
        gap: 4, // gap-1
    },
    backButtonPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // gap-2
        paddingHorizontal: 12, // px-3
        paddingVertical: 6, // py-1.5
        borderRadius: 8,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E2E8F0', // border-slate-200
        alignSelf: 'flex-start', // w-fit
        marginBottom: 16, // mb-4
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1, // hover:shadow-sm
    },
    backButtonPillText: {
        color: '#64748B', // text-slate-500
        fontSize: 14,
        fontWeight: '500', // font-medium
    },
    titleArea: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16, // gap-4
    },
    titleLine: {
        width: 4, // w-1
        height: 48, // h-12
        backgroundColor: '#4F46E5', // bg-indigo-600
        borderRadius: 9999,
        opacity: 0.8,
    },
    titleHeader: {
        fontSize: 28, // text-3xl
        fontWeight: 'bold',
        color: '#1E293B', // text-slate-800
        letterSpacing: -0.5, // tracking-tight
        lineHeight: 32, // leading-none
    },
    titleSubtext: {
        color: '#64748B', // text-slate-500
        fontWeight: '500', // font-medium
        fontSize: 14,
        marginTop: 4, // mt-1
        letterSpacing: 1, // tracking-wide
    },

    // --- Button Grid ---
    buttonGridWrapper: {
        width: '100%',
        // md:w-auto
    },
    buttonGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12, // gap-3
        // md:flex md:items-center
        alignItems: 'center',
    },
    btnFullMobile: {
        width: Dimensions.get('window').width / 2 - 22, // Approx w-full on mobile column
        minWidth: 150,
        // col-span-2 md:col-span-1 md:w-auto is complex in RN
    },
    btnBase: {
        paddingHorizontal: 16, // px-4
        paddingVertical: 10, // py-2.5
        borderRadius: 12, // rounded-xl
        fontWeight: '500',
        fontSize: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8, // gap-2
    },
    btnText: {
        fontSize: 14,
        fontWeight: '500',
    },
    btnDivider: {
        width: 1, // w-px
        height: 40, // h-10
        backgroundColor: '#E5E7EB', // bg-slate-200
        marginHorizontal: 4, // mx-1
        // hidden md:block
    },

    // --- Cards Grid ---
    cardsGrid: {
        flexDirection: 'column', // grid grid-cols-1
        gap: 24, // gap-6
        marginBottom: 32, // mb-8
    },
    cardContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.6)', // bg-white/60
        // backdrop-blur-xl simulation is complex
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.5)', // border-slate-200/50
        borderRadius: 16, // rounded-2xl
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5, // shadow-lg
        padding: 24, // p-6
        gap: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardTitle: {
        fontWeight: 'bold',
        color: '#4B5563', // text-gray-600
        paddingRight: 16, // pr-4
    },
    cardValueWrapper: {
        flexGrow: 1,
    },
    cardValue: {
        fontSize: 36, // text-4xl
        fontWeight: 'bold',
        marginTop: 8, // mt-2
    },
    cardSubtext: {
        color: '#94A3B8', // text-slate-400
        fontSize: 14,
        fontWeight: '500', // font-medium
        marginTop: 4, // mt-1
    },
    cardLink: {
        color: '#4F46E5', // text-link
        fontSize: 14,
        marginTop: 12, // mt-3
        fontWeight: 'bold',
    },

    // --- Dashboard Section (Chart) ---
    dashboardSection: {
        // dashboard-section
    },
    periodSelectorWrapper: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8, // gap-2
        marginBottom: 24, // mb-6
        backgroundColor: '#F1F5F9', // bg-slate-100
        padding: 4, // p-1
        borderRadius: 12, // rounded-xl
        alignSelf: 'center', // w-fit mx-auto
    },
    periodButton: {
        paddingHorizontal: 16, // px-4
        paddingVertical: 4, // py-1
        borderRadius: 8,
    },
    periodButtonActive: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1, // shadow-sm
    },
    periodButtonText: {
        fontSize: 14,
        textTransform: 'capitalize',
        color: '#64748B', // text-slate-500
    },
    periodButtonTextActive: {
        color: '#1E293B', // text-slate-800
        fontWeight: '600',
    },
    reportLoadingBox: {
        width: '100%',
        height: 384, // h-96
        alignItems: 'center',
        justifyContent: 'center',
    },
    reportLoadingText: {
        marginTop: 10,
        color: '#94A3AF', // text-slate-400
    },
    reportErrorBox: {
        width: '100%',
        height: 384, // h-96
        alignItems: 'center',
        justifyContent: 'center',
    },
    reportErrorText: {
        color: '#F87171', // text-red-400
    },
});