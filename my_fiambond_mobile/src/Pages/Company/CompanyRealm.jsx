import React, { useState, useContext, useCallback, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator, 
    Dimensions 
} from 'react-native';
import { AppContext } from '../../Context/AppContext.jsx';
import { db } from '../../config/firebase-config.ts';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';

// --- DIRECTLY IMPORTED WIDGETS (Assumed Native versions) ---
import Modal from '../../Components/Modal.jsx';
import CompanyReportChartWidget from '../../Components/Company/Analytics/CompanyReportChartWidget.jsx';
import CreateCompanyTransactionWidget from '../../Components/Company/Finance/CreateCompanyTransactionWidget.tsx';
import ManageEmployeesWidget from '../../Components/Company/Employees/ManageEmployeesWidget.jsx';
import CompanyLedgerListWidget from '../../Components/Company/Finance/CompanyLedgerListWidget.jsx';
import CompanyEmployeeListWidget from '../../Components/Company/Employees/CompanyEmployeeListWidget.jsx';
import CompanyGoalListWidget from '../../Components/Company/Goal/CompanyGoalListWidget.jsx';
import CreateCompanyGoalWidget from '../../Components/Company/Goal/CreateCompanyGoalWidget.tsx';
import CompanyPayrollWidget from '../../Components/Company/Payroll/CompanyPayrollWidget.jsx';
import PayrollHistoryWidget from '../../Components/Company/Payroll/PayrollHistoryWidget.jsx';

// --- INTERFACES (Removed - use JSDoc for minimal typing in .jsx) ---

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
        case 'Target': iconText = '🎯'; break;
        case 'Cash': iconText = '💰'; break;
        case 'Printer': iconText = '🖨️'; break;
        default: iconText = '?';
    }
    return <Text style={[{ fontSize: size, lineHeight: size }, style]}>{iconText}</Text>;
};
const Icons = {
    Plus: <Icon name="Plus" />,
    Back: <Icon name="Back" />,
    Users: <Icon name="Users" />,
    Wallet: <Icon name="Wallet" size={32} />,
    Target: <Icon name="Target" size={32} />,
    Printer: <Icon name="Printer" size={32} />,
    Cash: <Icon name="Cash" />
};

// --- REUSABLE BUTTON ---
/**
 * @param {{onClick: function, type: 'pri'|'sec'|'ghost', icon: React.ReactNode, children: React.ReactNode, style: object}} props
 */
const Btn = ({ onClick, type = 'sec', icon, children, style = {} }) => {
    const stylesMap = {
        pri: [styles.btnBase, styles.bgIndigo600, styles.shadowSm, styles.btnWFull],
        sec: [styles.btnBase, styles.bgWhite, styles.borderSlate300, styles.textSlate600, styles.btnWFull],
        ghost: [styles.btnBase, styles.bgTransparent, styles.textSlate500, styles.btnWFull],
    };
    const finalStyle = stylesMap[type] || stylesMap.sec;

    return (
        <TouchableOpacity onPress={onClick} style={[...finalStyle, style]} activeOpacity={0.7}>
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

// --- HELPER ---
const formatDataForChart = (transactions) => {
    if (!transactions || !transactions.length) return { labels: [], datasets: [] };
    const data = {};
    transactions.forEach(tx => {
        if (tx.created_at && typeof tx.created_at.toDate === 'function') {
            const date = tx.created_at.toDate().toLocaleDateString();
            if (!data[date]) data[date] = { income: 0, expense: 0 };
            tx.type === 'income' ? data[date].income += tx.amount : data[date].expense += tx.amount;
        }
    });
    const labels = Object.keys(data).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    return {
        labels,
        datasets: [
            { label: 'Revenue (₱)', data: labels.map(l => data[l].income), backgroundColor: 'rgba(99, 102, 241, 0.5)' },
            { label: 'Expenses (₱)', data: labels.map(l => data[l].expense), backgroundColor: 'rgba(244, 63, 94, 0.5)' }
        ]
    };
};

/**
 * @param {{company: {id: string, name: string}, onBack: function, onDataChange: function}} props
 */
export default function CompanyRealm({ company, onBack, onDataChange }) {
    const { user } = useContext(AppContext);
    const API_URL = 'http://localhost:3000/api'; // Simplified URL

    const [modals, setModals] = useState({ 
        addTx: false, 
        addGoal: false, 
        manageEmp: false, 
        viewTx: false, 
        viewGoals: false, 
        viewEmp: false,
        runPayroll: false, 
        payrollHistory: false
    });
    
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [goals, setGoals] = useState([]);
    const [members, setMembers] = useState([]);
    const [summaryData, setSummaryData] = useState({ netPosition: 0, payrollCount: 0 });
    
    // Report States
    const [report, setReport] = useState(null);
    const [period, setPeriod] = useState('monthly');

    const toggle = (key, val) => setModals(prev => ({ ...prev, [key]: val }));

    const fetchData = useCallback(async () => {
        if (!company || !user) return;
        setLoading(true);
        try {
            const [txRes, goalRes, compRes] = await Promise.all([
                fetch(`${API_URL}/transactions?company_id=${company.id}`),
                fetch(`${API_URL}/goals?company_id=${company.id}`),
                fetch(`${API_URL}/companies/${company.id}`)
            ]);

            const txData = await txRes.json();
            const formattedTx = txData.map(tx => ({ ...tx, id: tx._id, created_at: { toDate: () => new Date(tx.created_at) }}));
            setTransactions(formattedTx);

            let net = 0;
            let pCount = 0;
            
            formattedTx.forEach(tx => {
                tx.type === 'income' ? net += tx.amount : net -= tx.amount;
                if(tx.category === 'Payroll' || tx.description?.toLowerCase().includes('salary')) {
                    pCount++;
                }
            });

            setSummaryData({ netPosition: net, payrollCount: pCount });
            setGoals(await goalRes.json());

            if (compRes.ok) {
                const memberIds = (await compRes.json()).member_ids || [];
                if (memberIds.length) {
                    const snap = await getDocs(query(collection(db, "users"), where(documentId(), "in", memberIds.slice(0, 10))));
                    setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                }
            }
        } catch (e) { console.error(e); Alert.alert("Error", "Failed to load company data."); } finally { setLoading(false); }
    }, [company, user]);

    // Enhanced Report Logic matching UserRealm
    const generateReport = useCallback(() => {
        if (!transactions) return;
        
        const endDate = new Date();
        const startDate = new Date();

        // Calculate Date Range
        if (period === 'weekly') {
            startDate.setDate(endDate.getDate() - 7);
        } else if (period === 'yearly') {
            startDate.setFullYear(endDate.getFullYear() - 1);
        } else {
            startDate.setMonth(endDate.getMonth() - 1);
        }

        // Filter Transactions
        const filtered = transactions.filter(tx => {
            const txDate = tx.created_at.toDate();
            return txDate >= startDate && txDate <= endDate;
        });

        // Calculate Totals
        let inflow = 0, outflow = 0;
        filtered.forEach(tx => tx.type === 'income' ? inflow += tx.amount : outflow += tx.amount);

        setReport({ 
            chartData: formatDataForChart(filtered), 
            totalInflow: inflow, 
            totalOutflow: outflow, 
            netPosition: inflow - outflow, 
            reportTitle: `Funds Report: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 
            transactionCount: filtered.length 
        });
    }, [transactions, period]);

    useEffect(() => { fetchData(); }, [fetchData]);
    
    // Regenerate report when period changes or transactions update
    useEffect(() => { generateReport(); }, [generateReport, period]);

    const handleRefresh = () => { fetchData(); if (onDataChange) onDataChange(); };

    if (loading && !transactions.length) return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.loadingText}>Entering Corporate Realm...</Text>
        </View>
    );

    return (
        <ScrollView style={styles.mainWrapper}>
            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    
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
                            <Text style={styles.titleHeader}>{company.name}</Text>
                            <Text style={styles.titleSubtext}>Corporate Realm</Text>
                        </View>
                    </View>
                </View>

                {/* RESPONSIVE BUTTON GRID */}
                <View style={styles.buttonGridWrapper}>
                    <View style={styles.buttonGrid}>
                        
                        <Btn onClick={() => toggle('addTx', true)} type="pri" icon={Icons.Plus} style={styles.btnPri}>
                            Transaction
                        </Btn>

                        <Btn onClick={() => toggle('addGoal', true)} icon={Icons.Plus} style={styles.btnSec}>Goal</Btn>
                        <Btn onClick={() => toggle('runPayroll', true)} icon={Icons.Cash} style={styles.btnSec}>Payroll</Btn>
                        
                        <View style={styles.btnDivider}></View>
                        
                        <Btn onClick={() => toggle('viewEmp', true)} icon={Icons.Users} style={styles.btnSec}>
                            Employees
                        </Btn>
                    </View>
                </View>
            </View>

            {/* DASHBOARD CARDS */}
            <View style={styles.cardsGrid}>
                <DashboardCard title="Company Funds" value={`₱${summaryData.netPosition.toLocaleString()}`} subtext="Available Balance" linkText="View Transactions" onClick={() => toggle('viewTx', true)} icon={Icons.Wallet} colorClass={CardColors.emerald} />
                <DashboardCard title="Active Goals" value={goals.filter(g => g.status === 'active').length} subtext="Targets in Progress" linkText="View Goals" onClick={() => toggle('viewGoals', true)} icon={Icons.Target} colorClass={CardColors.rose} />
                <DashboardCard title="Payroll Reports" value={`${summaryData.payrollCount} Records`} subtext="Processed Histories"  linkText="Manage Reports" onClick={() => toggle('payrollHistory', true)} icon={Icons.Printer} colorClass={CardColors.amber} />
            </View>

            {/* CHART SECTION */}
            <View style={styles.dashboardSection}>
                <View style={styles.periodSelectorWrapper}>
                    {['weekly', 'monthly', 'yearly'].map(p => (
                        <TouchableOpacity key={p} onPress={() => setPeriod(p)} style={[styles.periodButton, period === p && styles.periodButtonActive]}>
                            <Text style={[styles.periodButtonText, period === p && styles.periodButtonTextActive]}>{p}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                
                {report ? (
                    <CompanyReportChartWidget report={report} />
                ) : (
                    <View style={styles.reportLoadingBox}>
                        <Text style={styles.reportLoadingText}>Loading Report...</Text>
                    </View>
                )}
            </View>

            {/* MODALS */}
            {modals.addTx && <Modal isOpen={modals.addTx} onClose={() => toggle('addTx', false)} title="Record New Transaction"><CreateCompanyTransactionWidget company={company} onSuccess={() => { toggle('addTx', false); handleRefresh(); }} /></Modal>}
            {modals.addGoal && <Modal isOpen={modals.addGoal} onClose={() => toggle('addGoal', false)} title="Record New Goal"><CreateCompanyGoalWidget company={company} onSuccess={() => { toggle('addGoal', false); handleRefresh(); }} /></Modal>}
            
            {/* Manage/Onboard Employees */}
            {modals.manageEmp && <Modal isOpen={modals.manageEmp} onClose={() => toggle('manageEmp', false)} title="Manage Employee Access"><ManageEmployeesWidget company={company} members={members} onUpdate={handleRefresh} /></Modal>}
            
            {modals.viewTx && <Modal isOpen={modals.viewTx} onClose={() => toggle('viewTx', false)} title="Shared Company Transactions"><CompanyLedgerListWidget transactions={transactions} loading={loading} /></Modal>}
            {modals.viewGoals && <Modal isOpen={modals.viewGoals} onClose={() => toggle('viewGoals', false)} title="Shared Company Goals"><CompanyGoalListWidget goals={goals} onDataChange={handleRefresh} /></Modal>}
            
            {/* Employee Directory + Add Shortcut */}
            {modals.viewEmp && (
                <Modal isOpen={modals.viewEmp} onClose={() => toggle('viewEmp', false)} title="Employee Directory">
                    <View style={styles.modalContent}>
                        <View style={styles.modalShortcut}>
                            <TouchableOpacity onPress={() => { toggle('viewEmp', false); toggle('manageEmp', true); }} style={styles.shortcutButton}>
                                {Icons.Plus}
                                <Text style={styles.shortcutText}>Onboard New Employee</Text>
                            </TouchableOpacity>
                        </View>
                        <CompanyEmployeeListWidget members={members} loading={loading} />
                    </View>
                </Modal>
            )}

            {/* Payroll Actions */}
            {modals.runPayroll && <Modal isOpen={modals.runPayroll} onClose={() => toggle('runPayroll', false)} title="Record New Payroll"><CompanyPayrollWidget company={company} members={members} onSuccess={() => { toggle('runPayroll', false); handleRefresh(); }} /></Modal>}
            {modals.payrollHistory && <Modal isOpen={modals.payrollHistory} onClose={() => toggle('payrollHistory', false)} title="Shared Company Payroll Reports"><PayrollHistoryWidget transactions={transactions} companyName={company.name} /></Modal>}
        </ScrollView>
    );
}

// --- REACT NATIVE STYLESHEET ---
const styles = StyleSheet.create({
    // --- Colors & Utilities ---
    textWhite: { color: 'white' },
    textSlate600: { color: '#475569' },
    textSlate500: { color: '#64748B' },
    bgWhite: { backgroundColor: 'white' },
    bgIndigo600: { backgroundColor: '#4F46E5' },
    bgTransparent: { backgroundColor: 'transparent' },
    borderSlate300: { borderColor: '#CBD5E1', borderWidth: 1 },
    shadowSm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    
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

    // --- Header ---
    header: {
        marginBottom: 32, // mb-8
        flexDirection: 'column',
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
        borderColor: '#E5E7EB',
        alignSelf: 'flex-start',
        marginBottom: 16, // mb-4
        // Use a function to resolve 'this.shadowSm' reference error in pure JS
        ...({
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        }),
    },
    backButtonPillText: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '500',
    },
    titleArea: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    titleLine: {
        width: 4,
        height: 48,
        backgroundColor: '#4F46E5',
        borderRadius: 9999,
        opacity: 0.8,
    },
    titleHeader: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1E293B',
        letterSpacing: -0.5,
        lineHeight: 32,
    },
    titleSubtext: {
        color: '#64748B',
        fontWeight: '500',
        fontSize: 14,
        marginTop: 4,
        letterSpacing: 1,
    },

    // --- Button Grid ---
    buttonGridWrapper: {
        width: '100%',
    },
    buttonGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
    },
    btnWFull: { flex: 1, minWidth: 100 },
    btnBase: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        fontWeight: '500',
        fontSize: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    btnText: {
        fontSize: 14,
        fontWeight: '500',
    },
    btnPri: { backgroundColor: '#4F46E5', color: 'white', },
    btnSec: { backgroundColor: 'white', borderWidth: 1, borderColor: '#CBD5E1', color: '#475569' },
    btnDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 4,
    },

    // --- Cards Grid ---
    cardsGrid: {
        flexDirection: 'column',
        gap: 24,
        marginBottom: 32,
    },
    cardContainer: {
        backgroundColor: 'white', // bg-white/60
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.5)',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardTitle: {
        fontWeight: 'bold',
        color: '#4B5563',
        paddingRight: 16,
    },
    cardValueWrapper: { flexGrow: 1 },
    cardValue: {
        fontSize: 36,
        fontWeight: 'bold',
        marginTop: 8,
    },
    cardSubtext: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '500',
        marginTop: 4,
    },
    cardLink: {
        color: '#4F46E5',
        fontSize: 14,
        marginTop: 12,
        fontWeight: 'bold',
    },

    // --- Dashboard Section (Chart) ---
    dashboardSection: {},
    periodSelectorWrapper: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 24,
        backgroundColor: '#F1F5F9',
        padding: 4,
        borderRadius: 12,
        alignSelf: 'center',
    },
    periodButton: {
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderRadius: 8,
    },
    periodButtonActive: {
        backgroundColor: 'white',
        ...({
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        }),
    },
    periodButtonText: {
        fontSize: 14,
        textTransform: 'capitalize',
        color: '#64748B',
    },
    periodButtonTextActive: {
        color: '#1E293B',
        fontWeight: '600',
    },
    reportLoadingBox: {
        width: '100%',
        height: 384,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
    },
    reportLoadingText: {
        marginTop: 10,
        color: '#94A3AF',
    },
    reportErrorBox: {
        width: '100%',
        height: 384,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
    },
    reportErrorText: {
        color: '#F87171',
    },

    // --- Modal Specific ---
    modalContent: { padding: 16, gap: 16 },
    modalShortcut: { flexDirection: 'row', justifyContent: 'flex-end' },
    shortcutButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    shortcutText: { fontSize: 14, fontWeight: '500', color: '#4F46E5' },
});