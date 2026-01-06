import React, { useEffect, useState, useCallback, useContext } from "react"; 
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator, 
    Alert,
    TextInput // For form input
} from "react-native";
// Removed: useNavigate, lazy, Suspense
import { AppContext } from '../../Context/AppContext'; 
import { collection, getDocs, updateDoc, doc, serverTimestamp, query, where, writeBatch } from "firebase/firestore";
import { db } from "../../config/firebase-config";

// --- DIRECT IMPORTS (Replacing Lazy Imports) ---
import Modal from "../../Components/Modal";
import AdminReportChartWidget from "../../Components/Admin/Analytics/AdminReportChartWidget";
import AdminUserTableWidget from "../../Components/Admin/Users/AdminUserTableWidget"; 
import SubscriptionReportWidget from "../../Components/Admin/Finance/SubscriptionReportWidget";
import RevenueLedgerWidget from "../../Components/Admin/Finance/RevenueLedgerWidget"; 

// --- ICON PLACEHOLDER (Converted to RN Text) ---
/**
 * @param {{name: string, style: object, size: number, color: string}} props
 */
const Icon = ({ name, style, size = 16, color }) => {
    let iconText = '';
    let defaultSize = size;
    switch (name) {
        case 'Plus': iconText = '+'; break;
        case 'Back': iconText = '←'; break;
        case 'Money': iconText = '💰'; defaultSize = 32; break;
        case 'Entities': iconText = '🏢'; defaultSize = 32; break; // Building/Office icon
        case 'Users': iconText = '👥'; break;
        case 'Report': iconText = '📄'; defaultSize = 32; break;
        default: iconText = '?';
    }
    return <Text style={[{ fontSize: defaultSize, lineHeight: defaultSize, color }, style]}>{iconText}</Text>;
};

const Icons = {
    Plus: <Icon name="Plus" size={16} />,
    Back: <Icon name="Back" size={16} />,
    Money: <Icon name="Money" />,
    Entities: <Icon name="Entities" />,
    Users: <Icon name="Users" size={16} />,
    Report: <Icon name="Report" />,
};

// --- CONFIG ---
const getPlanValue = (plan, type = 'company') => {
    if (type === 'company') {
        if (plan === 'yearly') return 15000.00;
        return 1500.00; 
    } else {
        if (plan === 'yearly') return 5000.00;
        return 500.00;
    }
};

// --- REUSABLE COMPONENTS ---
/**
 * @param {{onClick: function, type: 'admin'|'sec', icon: React.ReactNode, children: React.ReactNode, style: object}} props
 */
const Btn = ({ onClick, type = 'sec', icon, children, style = {} }) => {
    const finalStyle = type === 'admin' ? styles.btnAdmin : styles.btnSec;
    const textStyle = type === 'admin' ? styles.btnTextAdmin : styles.btnTextSec;

    return (
        <TouchableOpacity onPress={onClick} style={[styles.btnBase, finalStyle, style]} activeOpacity={0.7}>
            {icon}
            <Text style={[styles.btnText, textStyle]}>{children}</Text>
        </TouchableOpacity>
    );
};

/**
 * @param {{title: string, value: any, subtext: string, linkText: string, onClick: function, icon: React.ReactNode, colorClass: string, isAlert: boolean}} props
 */
const DashboardCard = ({ title, value, subtext, linkText, onClick, icon, colorClass, isAlert }) => (
    <TouchableOpacity onPress={onClick} style={[styles.cardContainer, isAlert ? styles.cardAlert : styles.cardDefault]} activeOpacity={0.8}>
        <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, isAlert ? styles.cardTitleAlert : null]}>{title}</Text>
            {/* The icon's color will be handled by the colorClass style passed from the parent */}
            <View style={styles.cardIconWrapper}>{icon}</View> 
        </View>
        <View style={styles.cardValueWrapper}>
            <Text style={[styles.cardValue, styles[colorClass]]}>{value}</Text>
            {subtext && <Text style={[styles.cardSubtext, isAlert ? styles.cardSubtextAlert : styles.cardSubtextDefault]}>{subtext}</Text>}
        </View>
        <Text style={styles.cardLink}>{linkText} →</Text>
    </TouchableOpacity>
);

/**
 * @param {{onAdd: function, onCancel: function}} props
 */
const AddAdminForm = ({ onAdd, onCancel }) => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email) return;
        setLoading(true);
        await onAdd(email);
        setLoading(false);
    };
 
    return (
        <View style={styles.formContainer}>
            <Text style={styles.formSubtext}>Enter user email to promote.</Text>
            <View style={styles.inputWrapper}>
                <TextInput 
                    style={styles.inputBase}
                    placeholder="user@example.com"
                    value={email} 
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    required
                />
            </View>
            <View style={styles.formActions}>
                <TouchableOpacity onPress={onCancel} style={styles.formCancelBtn}>
                    <Text style={styles.formCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSubmit} disabled={loading} style={styles.formSubmitBtn}>
                    <Text style={styles.formSubmitText}>{loading ? '...' : 'Promote'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

/**
 * @param {{adminUsers: Array, onAddAdmin: function}} props
 */
const ManageTeamWidget = ({ adminUsers, onAddAdmin }) => {
    const [showAddForm, setShowAddForm] = useState(false);

    return (
        <View style={styles.manageTeamWrapper}>
            <View style={styles.manageTeamHeaderBox}>
                {!showAddForm ? (
                    <View style={styles.manageTeamHeaderContent}>
                        <View>
                            <Text style={styles.manageTeamTitle}>System Administrators</Text>
                            <Text style={styles.manageTeamSubtext}>Manage dashboard access.</Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowAddForm(true)} style={styles.promoteAdminBtn}>
                            {Icons.Plus}
                            <Text style={styles.promoteAdminText}>Promote New Admin</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.manageTeamForm}>
                        <View style={styles.manageTeamFormTitleArea}>
                            <Text style={styles.manageTeamFormTitle}>Promote User</Text>
                        </View>
                        <AddAdminForm onAdd={async (email) => { await onAddAdmin(email); setShowAddForm(false); }} onCancel={() => setShowAddForm(false)} />
                    </View>
                )}
            </View>
            <View>
                <Text style={styles.currentTeamTitle}>Current Team ({adminUsers.length})</Text>
                <View style={styles.adminTableWrapper}>
                    <AdminUserTableWidget users={adminUsers} type="admin" headerText={null} />
                </View>
            </View>
        </View>
    );
};

// --- MAIN DASHBOARD ---
/**
 * @param {{onBack: function}} props
 */
export default function AdminDashboard({ onBack }) { // Added onBack prop
    const { user } = useContext(AppContext);
    // Removed: const navigate = useNavigate();
    const adminLastName = user?.last_name || (user?.full_name ? user.full_name.trim().split(' ').pop() : 'Admin');

    // State
    const [users, setUsers] = useState([]);
    const [premiums, setPremiums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modals, setModals] = useState({ revenue: false, entities: false, reports: false, manageTeam: false });
    
    // Derived Data
    const [premiumUsers, setPremiumUsers] = useState([]); 
    const [adminUsers, setAdminUsers] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [currentTotalFunds, setCurrentTotalFunds] = useState(0);

    // Report State
    const [report, setReport] = useState(null);
    const [period, setPeriod] = useState('monthly');

    const toggleModal = (key, value) => setModals(prev => ({ ...prev, [key]: value }));

    // --- REVENUE GENERATION ---
    const generateReport = useCallback((premiumList, currentPeriod) => {
        if (!premiumList) return;
        const now = new Date();
        const startDate = new Date(); 
        
        if (currentPeriod === 'weekly') startDate.setDate(now.getDate() - 7);
        else if (currentPeriod === 'yearly') startDate.setFullYear(now.getFullYear() - 1);
        else startDate.setMonth(now.getMonth() - 1);

        const revenueData = {};
        let periodRevenue = 0;
        let activeCount = 0;
        
        const currentAdminId = user.id;

        premiumList.forEach(p => {
            // Skip Admin's own payment records
            if (p.user_id === currentAdminId) return; 

            const timestamp = p.granted_at;
            if (timestamp?.seconds) {
                const txDate = new Date(timestamp.seconds * 1000);
                if (txDate >= startDate && txDate <= now) {
                    const dateKey = txDate.toLocaleDateString();
                    if (!revenueData[dateKey]) revenueData[dateKey] = 0;
                    revenueData[dateKey] += (p.amount || 0);
                    periodRevenue += (p.amount || 0);
                    activeCount++;
                }
            }
        });

        const labels = Object.keys(revenueData).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        setReport({
            chartData: {
                labels,
                datasets: [{ 
                    label: 'Admin Funds (₱)', 
                    data: labels.map(l => revenueData[l]), 
                    backgroundColor: 'rgba(147, 51, 234, 0.5)', 
                    borderColor: 'rgba(147, 51, 234, 1)', 
                    borderWidth: 1 
                }]
            },
            totalInflow: periodRevenue,
            totalOutflow: 0,
            netPosition: periodRevenue, 
            reportTitle: `Funds Report: ${startDate.toLocaleDateString()} - ${now.toLocaleDateString()}`,
            transactionCount: activeCount
        });
    }, [user.id]);

    // --- FETCH DATA ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [usersSnap, premiumsSnap] = await Promise.all([
                getDocs(collection(db, "users")),
                getDocs(collection(db, "premiums"))
            ]);

            const premiumsList = premiumsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const usersList = usersSnap.docs.map(u => ({ id: u.id, ...u.data() }));
            
            // Sort Users: Pending at top
            usersList.sort((a, b) => {
                const aIsPending = a.subscription_status === 'pending_approval' || a.family_subscription_status === 'pending_approval';
                const bIsPending = b.subscription_status === 'pending_approval' || b.family_subscription_status === 'pending_approval';
                if (aIsPending && !bIsPending) return -1;
                if (!aIsPending && bIsPending) return 1;
                return (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0);
            });
            
            setUsers(usersList);
            setPremiums(premiumsList);

            const premiumsOnly = usersList.filter(u => u.is_premium || u.is_family_premium);
            const admins = usersList.filter(u => u.role === 'admin');
            const pendingTotal = usersList.filter(u => u.subscription_status === 'pending_approval' || u.family_subscription_status === 'pending_approval').length;
            
            setPremiumUsers(premiumsOnly);
            setAdminUsers(admins);
            setPendingCount(pendingTotal);

            // Calculate Lifetime Funds from the 'premiums' collection
            const currentAdminId = user.id;
            const totalValue = premiumsList.reduce((sum, p) => {
                if (p.user_id === currentAdminId) return sum; 
                return sum + (p.amount || 0);
            }, 0);

            setCurrentTotalFunds(totalValue);
            generateReport(premiumsList, period);
        } catch (error) { 
            console.error("Data Fetch Error:", error); 
            Alert.alert("Error", "Failed to fetch admin data.");
        } finally { 
            setLoading(false); 
        }
    }, [generateReport, period, user.id]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { if (premiums.length > 0) generateReport(premiums, period); }, [period, premiums, generateReport]);

    // --- TOGGLE PREMIUM (BATCHED WITH PREMIUMS COLLECTION) ---
    const handleTogglePremium = async (userId, action, type) => {
        try {
            const batch = writeBatch(db);
            const userRef = doc(db, "users", userId);
            
            if (action === 'approve' || action === 'grant') {
                const isCompany = type === 'company';
                const plan = 'monthly';
                const amount = getPlanValue(plan, type);
                
                // 1. Create entry in 'premiums' collection
                const newPremiumRef = doc(collection(db, "premiums"));
                const premiumData = {
                    user_id: userId,
                    access_type: type,
                    amount: amount,
                    plan_cycle: plan,
                    status: "active",
                    granted_at: serverTimestamp(),
                    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 Day expiry
                    payment_method: action === 'approve' ? "GCash" : "Admin Manual",
                    payment_ref: action === 'approve' ? (users.find(u => u.id === userId)?.payment_ref || "VERIFIED") : "ADMIN_GRANTED"
                };

                // 2. Update 'users' document
                const userUpdates = {};
                if (isCompany) {
                    userUpdates.is_premium = true;
                    userUpdates.subscription_status = 'active';
                    userUpdates.active_company_premium_id = newPremiumRef.id;
                    userUpdates.premium_granted_at = serverTimestamp();
                    userUpdates.premium_plan = plan;
                } else {
                    userUpdates.is_family_premium = true;
                    userUpdates.family_subscription_status = 'active';
                    userUpdates.active_family_premium_id = newPremiumRef.id;
                    userUpdates.family_premium_granted_at = serverTimestamp();
                    userUpdates.family_premium_plan = plan;
                }

                batch.set(newPremiumRef, premiumData);
                batch.update(userRef, userUpdates);
            } else {
                // REVOKE logic
                const userUpdates = {};
                if (type === 'company') {
                    userUpdates.is_premium = false;
                    userUpdates.subscription_status = 'inactive';
                    userUpdates.active_company_premium_id = "";
                } else {
                    userUpdates.is_family_premium = false;
                    userUpdates.family_subscription_status = 'inactive';
                    userUpdates.active_family_premium_id = "";
                }
                batch.update(userRef, userUpdates);
            }

            await batch.commit();
            fetchData(); 
        } catch (error) { 
            console.error("Error updating user access:", error);
            Alert.alert("Error", "Failed to update user."); 
        }
    };

    // --- PROMOTE ADMIN ---
    const handleAddAdmin = async (email) => {
        try {
            const q = query(collection(db, "users"), where("email", "==", email));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) { Alert.alert("Error", "User not found."); return; }
            await updateDoc(querySnapshot.docs[0].ref, { role: 'admin' });
            Alert.alert("Success", `${email} is now an Admin.`);
            fetchData();
        } catch (error) { 
            console.error(error);
            Alert.alert("Error", "Failed to promote admin."); 
        }
    };

    if (loading) return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={styles.textPurple600.color} />
            <Text style={styles.loadingText}>Loading Admin Realm...</Text>
        </View>
    );

    return (
        <ScrollView style={styles.mainWrapper}>
            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    
                    {/* Back button uses onBack prop */}
                    <TouchableOpacity onPress={onBack} style={styles.backButtonPill}>
                        <View style={styles.backButtonIconWrapper}>{Icons.Back}</View>
                        <Text style={styles.backButtonPillText}>Back to Personal</Text>
                    </TouchableOpacity>

                    <View style={styles.titleArea}>
                        <View style={styles.titleLine}></View>
                        <View>
                            <Text style={styles.titleHeader}>{adminLastName}</Text>
                            <Text style={styles.titleSubtext}>Admin Realm</Text>
                        </View>
                    </View>
                </View>
                
                <View style={styles.buttonGroup}>
                    {/* Simplified SVG path for the icon in React Native context */}
                    <Btn onClick={() => toggleModal('manageTeam', true)} type="admin" icon={<Icon name="Users" size={16} />}>
                        Manage Team
                    </Btn>
                </View>
            </View>

            {/* DASHBOARD CARDS */}
            <View style={styles.cardsGrid}>
                <DashboardCard 
                    title="Admin Funds" 
                    value={`₱${currentTotalFunds.toLocaleString()}`} 
                    subtext="Total Accumulated Value" 
                    linkText="View Transactions" 
                    onClick={() => toggleModal('revenue', true)} 
                    icon={Icons.Money} 
                    colorClass="textEmerald600" 
                />
                <DashboardCard 
                    title="User Management" 
                    value={users.length} 
                    subtext={pendingCount > 0 ? `⚠️ ${pendingCount} PENDING REQUEST(S)` : `${premiumUsers.length} Active Subscriptions`}
                    linkText={pendingCount > 0 ? "Review Requests Now" : "Manage Access"}
                    onClick={() => toggleModal('entities', true)} 
                    icon={Icons.Entities} 
                    colorClass={pendingCount > 0 ? "textAmber600" : "textIndigo600"}
                    isAlert={pendingCount > 0} 
                />
                <DashboardCard 
                    title="Revenue Reports" 
                    value="Export" 
                    subtext="Processed Histories"
                    linkText="Manage Reports" 
                    onClick={() => toggleModal('reports', true)} 
                    icon={Icons.Report} 
                    colorClass="textAmber600" 
                />
            </View>

            {/* CHART */}
            <View style={styles.chartWrapper}>
                <AdminReportChartWidget report={report} period={period} setPeriod={setPeriod} />
            </View>

            {/* MODALS */}
            {modals.revenue && ( 
                <Modal isOpen={modals.revenue} onClose={() => toggleModal('revenue', false)} title="Revenue Ledger"> 
                    <View style={styles.modalContent}>
                        <View style={styles.totalFundsBox}>
                            <Text style={styles.totalFundsTitle}>Total Funds:</Text>
                            <Text style={styles.totalFundsValue}>₱{currentTotalFunds.toLocaleString()}</Text>
                        </View>
                        <RevenueLedgerWidget premiums={premiums} users={users} currentAdminId={user.id} />
                    </View>
                </Modal> 
            )}
            {modals.entities && ( 
                <Modal isOpen={modals.entities} onClose={() => toggleModal('entities', false)} title="Entity Management"> 
                    <View style={styles.modalContent}>
                        <AdminUserTableWidget 
                            users={users} 
                            type="entity" 
                            onTogglePremium={handleTogglePremium} 
                            headerText={pendingCount > 0 ? "⚠️ Approval Needed" : "Manage Access Rights"}
                        /> 
                    </View>
                </Modal> 
            )}
            {modals.reports && ( 
                <Modal isOpen={modals.reports} onClose={() => toggleModal('reports', false)} title="Subscription Revenue Reports"> 
                    <View style={styles.modalContent}>
                        <SubscriptionReportWidget transactions={premiums.map(p => {
                            const u = users.find(usr => usr.id === p.user_id);
                            return {
                                id: p.id,
                                created_at: p.granted_at,
                                subscriber: u?.full_name || u?.email || "Unknown",
                                plan: p.plan_cycle,
                                method: p.payment_method,
                                ref: p.payment_ref,
                                amount: p.amount,
                                type: p.access_type
                            };
                        })} /> 
                    </View>
                </Modal> 
            )}
            {modals.manageTeam && ( 
                <Modal isOpen={modals.manageTeam} onClose={() => toggleModal('manageTeam', false)} title="Admin Team Management"> 
                    <View style={styles.modalContent}>
                        <ManageTeamWidget adminUsers={adminUsers} onAddAdmin={handleAddAdmin} /> 
                    </View>
                </Modal> 
            )}
        </ScrollView>
    );
}

// --- REACT NATIVE STYLESHEET ---
const styles = StyleSheet.create({
    // --- Colors ---
    textPurple600: { color: '#9333ea' },
    textPurple700: { color: '#7e22ce' },
    textSlate400: { color: '#94a3b8' },
    textSlate500: { color: '#64748b' },
    textSlate700: { color: '#334155' },
    textSlate800: { color: '#1e293b' },
    textEmerald600: { color: '#059669' },
    textIndigo600: { color: '#4f46e5' },
    textAmber600: { color: '#d97706' },
    textAmber800: { color: '#92400e' },
    textWhite: { color: 'white' },
    bgPurple600: { backgroundColor: '#9333ea' },
    bgWhite: { backgroundColor: 'white' },
    bgSlate50: { backgroundColor: '#f8fafc' },
    bgAmber50: { backgroundColor: 'rgba(255, 251, 235, 0.5)' }, // bg-amber-50/50
    bgEmerald50: { backgroundColor: '#ecfdf5' },
    borderSlate200: { borderColor: '#e2e8f0', borderWidth: 1 },
    borderSlate300: { borderColor: '#cbd5e1', borderWidth: 1 },
    borderAmber300: { borderColor: '#fcd34d', borderWidth: 1 },
    borderEmerald100: { borderColor: '#d1fae5', borderWidth: 1 },

    // --- Layout & Utils ---
    mainWrapper: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 24,
        backgroundColor: '#f8fafc', // Setting a default background for the ScrollView area
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 10,
        ...this.textSlate400,
        fontSize: 16,
    },
    shadowSm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    shadowLg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    
    // --- Header ---
    header: {
        marginBottom: 32,
        flexDirection: 'column', 
        gap: 24,
    },
    headerLeft: {
        flexDirection: 'column',
        gap: 4,
    },
    backButtonPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        ...this.bgWhite,
        ...this.borderSlate200,
        alignSelf: 'flex-start',
        marginBottom: 16,
        ...this.shadowSm,
    },
    backButtonIconWrapper: {
        // Ensures the icon is styled correctly if it's text
    },
    backButtonPillText: {
        ...this.textSlate500,
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
        ...this.bgIndigo600,
        borderRadius: 9999,
        opacity: 0.8,
    },
    titleHeader: {
        fontSize: 28,
        fontWeight: 'bold',
        ...this.textSlate800,
        letterSpacing: -0.5,
        lineHeight: 32,
    },
    titleSubtext: {
        ...this.textSlate500,
        fontWeight: '500',
        fontSize: 14,
        marginTop: 4,
        letterSpacing: 1,
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 12,
        alignSelf: 'flex-start',
    },
    
    // --- Buttons ---
    btnBase: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
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
    btnAdmin: {
        ...this.bgPurple600,
        ...this.shadowSm,
    },
    btnSec: {
        ...this.bgWhite,
        ...this.borderSlate300,
    },
    btnTextAdmin: {
        ...this.textWhite,
        fontWeight: 'bold',
    },
    btnTextSec: {
        ...this.textSlate700,
    },

    // --- Cards Grid ---
    cardsGrid: {
        flexDirection: 'column',
        gap: 24,
        marginBottom: 32,
    },
    cardContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.6)', 
        borderRadius: 16,
        ...this.shadowLg,
        padding: 24,
        gap: 4,
    },
    cardDefault: {
        ...this.borderSlate200,
    },
    cardAlert: {
        ...this.borderAmber300,
        ...this.bgAmber50,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardTitle: {
        fontWeight: 'bold',
        ...this.textSlate700,
        paddingRight: 16,
    },
    cardTitleAlert: {
        ...this.textAmber800,
    },
    cardIconWrapper: {
        // Style for the icon container
    },
    cardValueWrapper: {
        flexGrow: 1,
    },
    cardValue: {
        fontSize: 36,
        fontWeight: 'bold',
        marginTop: 8,
    },
    cardSubtext: {
        fontSize: 12,
        marginTop: 4,
    },
    cardSubtextDefault: {
        ...this.textSlate400,
        fontWeight: '500',
    },
    cardSubtextAlert: {
        ...this.textAmber600,
        fontWeight: 'bold',
        // Note: RN doesn't support animate-pulse directly
    },
    cardLink: {
        ...this.textIndigo600,
        fontSize: 14,
        marginTop: 12,
        fontWeight: 'bold',
    },

    // --- Chart ---
    chartWrapper: {
        marginBottom: 32,
    },

    // --- Modal Content ---
    modalContent: {
        padding: 16,
        gap: 16,
    },
    totalFundsBox: {
        ...this.bgEmerald50,
        ...this.borderEmerald100,
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalFundsTitle: {
        fontWeight: 'bold',
        ...this.textEmerald600,
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    totalFundsValue: {
        fontWeight: 'bold',
        fontSize: 18,
        ...this.textEmerald600,
    },

    // --- Manage Team Widget Styles ---
    manageTeamWrapper: {
        gap: 16,
    },
    manageTeamHeaderBox: {
        ...this.bgSlate50,
        ...this.borderSlate200,
        padding: 16,
        borderRadius: 12,
    },
    manageTeamHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    manageTeamTitle: {
        fontWeight: 'bold',
        ...this.textSlate700,
    },
    manageTeamSubtext: {
        fontSize: 12,
        ...this.textSlate500,
    },
    promoteAdminBtn: {
        ...this.bgPurple600,
        ...this.textWhite,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 'bold',
        ...this.shadowSm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    promoteAdminText: {
        ...this.textWhite,
        fontSize: 12,
        fontWeight: 'bold',
    },
    manageTeamForm: {
        // Style for the form wrapper when visible
    },
    manageTeamFormTitleArea: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    manageTeamFormTitle: {
        fontWeight: 'bold',
        ...this.textPurple700,
        fontSize: 14,
    },
    
    // --- AddAdminForm Styles ---
    formContainer: {
        padding: 16,
        ...this.bgWhite,
        ...this.borderSlate200,
        borderRadius: 8,
        ...this.shadowSm,
        marginTop: 8,
    },
    formSubtext: {
        fontSize: 12,
        ...this.textSlate500,
        marginBottom: 16,
    },
    inputWrapper: {
        marginBottom: 16,
    },
    inputBase: {
        width: '100%',
        paddingHorizontal: 16,
        paddingVertical: 8,
        ...this.borderSlate300,
        borderRadius: 8,
        fontSize: 14,
    },
    formActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    formCancelBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    formCancelText: {
        fontSize: 12,
        fontWeight: 'bold',
        ...this.textSlate500,
    },
    formSubmitBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        ...this.bgPurple600,
        borderRadius: 8,
    },
    formSubmitText: {
        fontSize: 12,
        fontWeight: 'bold',
        ...this.textWhite,
    },
    
    // --- Admin List Styles ---
    currentTeamTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        ...this.textSlate400,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    adminTableWrapper: {
        ...this.borderSlate200,
        borderRadius: 12,
        overflow: 'hidden',
    },
});