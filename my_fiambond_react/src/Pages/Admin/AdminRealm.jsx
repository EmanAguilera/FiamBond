import { useEffect, useState, useCallback, lazy, Suspense, useContext } from "react"; 
import { useNavigate } from "react-router-dom";
import { AppContext } from '../../Context/AppContext'; 
import { collection, getDocs, updateDoc, doc, serverTimestamp, query, where } from "firebase/firestore";
import { db } from "../../config/firebase-config";

// --- LAZY IMPORTS ---
const Modal = lazy(() => import("../../Components/Modal"));
const AdminReportChartWidget = lazy(() => import("../../Components/Admin/Analytics/AdminReportChartWidget"));
const AdminUserTableWidget = lazy(() => import("../../Components/Admin/Users/AdminUserTableWidget")); 
const SubscriptionReportWidget = lazy(() => import("../../Components/Admin/Finance/SubscriptionReportWidget"));

// --- ICONS ---
const Icons = {
    Plus: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>,
    Back: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>,
    Money: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Entities: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    Shield: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    Refresh: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>,
    Report: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
};

// --- CONFIG ---
const getPlanValue = (plan) => {
    if (plan === 'yearly') return 15000.00;
    if (plan === 'monthly') return 1500.00;
    return 1500.00; 
};

// --- REUSABLE COMPONENTS ---
const Btn = ({ onClick, type = 'sec', icon, children }) => {
    const styles = {
        admin: "bg-purple-600 text-white hover:bg-purple-700 shadow-sm border border-transparent",
        sec: "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 hover:text-slate-800",
    };
    return (
        <button onClick={onClick} className={`${styles[type]} px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 flex items-center gap-2`}>
            {icon} {children}
        </button>
    );
};

const DashboardCard = ({ title, value, subtext, linkText, onClick, icon, colorClass, isAlert }) => (
    <div onClick={onClick} className={`bg-white/60 backdrop-blur-xl border rounded-2xl shadow-lg p-6 cursor-pointer group transition-all hover:shadow-xl flex flex-col 
        ${isAlert ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200/50'}`}>
        <div className="flex justify-between items-start">
            <h4 className={`font-bold pr-4 ${isAlert ? 'text-amber-800' : 'text-gray-600'}`}>{title}</h4>
            <div className={`flex-shrink-0 ${colorClass}`}>{icon}</div>
        </div>
        <div className="flex-grow">
            <p className={`text-4xl font-bold mt-2 ${colorClass}`}>{value}</p>
            {subtext && <p className={`text-xs mt-1 font-bold ${isAlert ? 'text-amber-600 animate-pulse' : 'text-slate-400 font-medium'}`}>{subtext}</p>}
        </div>
        <span className="text-link text-sm mt-3 inline-block">{linkText} &rarr;</span>
    </div>
);

const AddAdminForm = ({ onAdd, onCancel }) => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        await onAdd(email);
        setLoading(false);
    };
 
    return (
        <form onSubmit={handleSubmit} className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm mt-2">
            <p className="text-xs text-slate-500 mb-4">Enter user email to promote.</p>
            <div className="mb-4">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" placeholder="user@example.com" />
            </div>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs font-bold text-slate-500">Cancel</button>
                <button type="submit" disabled={loading} className="px-3 py-1.5 text-xs font-bold bg-purple-600 text-white rounded-lg">{loading ? '...' : 'Promote'}</button>
            </div>
        </form>
    );
};

// --- NEW: MANAGE TEAM WIDGET (Combines List + Add) ---
const ManageTeamWidget = ({ adminUsers, onAddAdmin }) => {
    const [showAddForm, setShowAddForm] = useState(false);

    return (
        <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                {!showAddForm ? (
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-slate-700">System Administrators</h4>
                            <p className="text-xs text-slate-500">Manage dashboard access.</p>
                        </div>
                        <button onClick={() => setShowAddForm(true)} className="bg-purple-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow hover:bg-purple-700 transition-all flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                            Promote New Admin
                        </button>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex justify-between items-center">
                            <h4 className="font-bold text-purple-700 text-sm">Promote User</h4>
                            <button onClick={() => setShowAddForm(false)} className="text-xs text-slate-400">Close</button>
                        </div>
                        <AddAdminForm onAdd={async (email) => { await onAddAdmin(email); setShowAddForm(false); }} onCancel={() => setShowAddForm(false)} />
                    </div>
                )}
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Current Team ({adminUsers.length})</p>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <AdminUserTableWidget users={adminUsers} type="admin" headerText={null} />
                </div>
            </div>
        </div>
    );
};

// --- MAIN DASHBOARD ---
export default function AdminDashboard() {
    const { user } = useContext(AppContext);
    const navigate = useNavigate();
    const adminLastName = user?.last_name || (user?.full_name ? user.full_name.trim().split(' ').pop() : 'Admin');

    // State
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modals, setModals] = useState({ revenue: false, entities: false, reports: false, manageTeam: false });
    
    // Derived Data
    const [premiumUsers, setPremiumUsers] = useState([]);
    const [adminUsers, setAdminUsers] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);

    // Report State
    const [currentTotalFunds, setCurrentTotalFunds] = useState(0);
    const [report, setReport] = useState(null);
    const [period, setPeriod] = useState('monthly');

    const generateReport = useCallback((userList, currentPeriod) => {
        if (!userList || userList.length === 0) return;
        const now = new Date();
        const startDate = new Date(); 
        
        if (currentPeriod === 'weekly') startDate.setDate(now.getDate() - 7);
        else if (currentPeriod === 'yearly') startDate.setFullYear(now.getFullYear() - 1);
        else startDate.setMonth(now.getMonth() - 1);

        const revenueData = {};
        let periodRevenue = 0;
        let activeCount = 0;

        userList.forEach(u => {
            if (u.is_premium) {
                const timestamp = u.premium_granted_at || u.created_at;
                if (timestamp?.seconds) {
                    const txDate = new Date(timestamp.seconds * 1000);
                    if (txDate >= startDate && txDate <= now) {
                        const dateKey = txDate.toLocaleDateString();
                        if (!revenueData[dateKey]) revenueData[dateKey] = 0;
                        const transactionValue = getPlanValue(u.premium_plan);
                        revenueData[dateKey] += transactionValue;
                        periodRevenue += transactionValue;
                        activeCount++;
                    }
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
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const usersSnapshot = await getDocs(collection(db, "users"));
            const usersList = usersSnapshot.docs.map(u => ({ id: u.id, ...u.data() }));
            
            // SORT: Pending requests to top
            usersList.sort((a, b) => {
                if (a.subscription_status === 'pending_approval' && b.subscription_status !== 'pending_approval') return -1;
                if (a.subscription_status !== 'pending_approval' && b.subscription_status === 'pending_approval') return 1;
                return (b.premium_granted_at?.seconds || 0) - (a.premium_granted_at?.seconds || 0);
            });
            
            setUsers(usersList);
            const premiums = usersList.filter(u => u.is_premium);
            const admins = usersList.filter(u => u.role === 'admin');
            const pendings = usersList.filter(u => u.subscription_status === 'pending_approval');
            
            setPremiumUsers(premiums);
            setAdminUsers(admins);
            setPendingUsers(pendings);

            const totalValue = premiums.reduce((sum, u) => sum + getPlanValue(u.premium_plan), 0);
            setCurrentTotalFunds(totalValue);
            
            generateReport(usersList, period);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    }, [generateReport, period]);

    useEffect(() => { if (users.length > 0) generateReport(users, period); }, [period, users, generateReport]);
    // FIXED: Added fetchData to dependency array
    useEffect(() => { fetchData(); }, [fetchData]);

    // --- APPROVAL LOGIC ---
    const togglePremium = async (userId, currentStatus, isApproval = false) => {
        const msg = isApproval ? "APPROVE Payment & Grant Access?" : `Confirm ${currentStatus ? 'revoke' : 'grant'} company access?`;
        if(!confirm(msg)) return;

        try {
            const userRef = doc(db, "users", userId);
            let updates = {};

            if (isApproval) {
                // APPROVAL: Grant Premium & Clear Pending
                updates = { is_premium: true, subscription_status: 'active', premium_granted_at: serverTimestamp() };
            } else if (!currentStatus) {
                // MANUAL GRANT
                updates = { is_premium: true, premium_granted_at: serverTimestamp(), subscription_status: 'active', premium_plan: 'monthly' };
            } else {
                // REVOKE
                updates = { is_premium: false, premium_granted_at: null, subscription_status: null, premium_plan: null };
            }

            await updateDoc(userRef, updates);
            fetchData(); 
        } catch (error) { alert("Error: " + error.message); }
    };

    const handleAddAdmin = async (email) => {
        try {
            const q = query(collection(db, "users"), where("email", "==", email));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) { alert("User not found."); return; }
            await updateDoc(querySnapshot.docs[0].ref, { role: 'admin' });
            alert(`${email} is now an Admin.`);
            fetchData();
        } catch (error) { 
            // FIXED: Used the 'error' variable
            console.error(error);
            alert("Failed."); 
        }
    };

    // Transform data for Reports Widget
    const subscriptionTransactions = premiumUsers.map(u => ({
        id: u.id,
        created_at: u.premium_granted_at || u.created_at,
        subscriber: u.full_name || u.email,
        plan: u.premium_plan || 'monthly',
        method: u.payment_method || 'Manual',
        ref: u.payment_ref || 'N/A',
        amount: getPlanValue(u.premium_plan)
    }));

    if (loading) return <div className="p-10 text-center animate-pulse text-slate-400">Loading System...</div>;

    return (
        <div className="w-full">
            {/* HEADER */}
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex flex-col gap-1">
                    <button onClick={() => navigate('/')} className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 text-sm font-medium hover:border-purple-300 hover:text-purple-600 hover:shadow-sm transition-all mb-4 w-fit">
                        <span className="group-hover:-translate-x-0.5 transition-transform">{Icons.Back}</span>
                        <span>Back to Personal</span>
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-1 h-12 bg-indigo-600 rounded-full opacity-80"></div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-none">{adminLastName}</h1>
                            <p className="text-slate-500 font-medium text-sm mt-1 tracking-wide">Admin Realm</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-3">
                    <Btn onClick={() => setModals({ ...modals, manageTeam: true })} type="admin" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>}>Manage Team</Btn>
                    <Btn onClick={fetchData} icon={Icons.Refresh}>Refresh</Btn>
                </div>
            </header>

            {/* DASHBOARD CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <DashboardCard 
                    title="Admin Funds" 
                    value={`₱${currentTotalFunds.toLocaleString()}`} 
                    subtext="Total Accumulated Value" 
                    linkText="View Transactions" 
                    onClick={() => setModals({ ...modals, revenue: true })} 
                    icon={Icons.Money} 
                    colorClass="text-emerald-600" 
                />
                <DashboardCard 
                    title="User Management" 
                    value={users.length} 
                    subtext={pendingUsers.length > 0 ? `⚠️ ${pendingUsers.length} PENDING REQUEST(S)` : `${premiumUsers.length} Companies Active`}
                    linkText={pendingUsers.length > 0 ? "Review Requests Now" : "Manage Access"}
                    onClick={() => setModals({ ...modals, entities: true })} 
                    icon={Icons.Entities} 
                    colorClass={pendingUsers.length > 0 ? "text-amber-600" : "text-indigo-600"}
                    isAlert={pendingUsers.length > 0} 
                />
                <DashboardCard 
                    title="Revenue Reports" 
                    value="Export" 
                    subtext="Processed Histories"
                    linkText="Manage Reports" 
                    onClick={() => setModals({ ...modals, reports: true })} 
                    icon={Icons.Report} 
                    colorClass="text-amber-600" 
                />
            </div>

            {/* CHART */}
            <Suspense fallback={<div className="h-64 bg-slate-100 rounded-lg"></div>}>
                <AdminReportChartWidget report={report} period={period} setPeriod={setPeriod} />
            </Suspense>

            {/* MODALS */}
            <Suspense fallback={null}>
                {modals.revenue && ( 
                    <Modal isOpen={modals.revenue} onClose={() => setModals({ ...modals, revenue: false })} title="Revenue Ledger"> 
                        <AdminUserTableWidget 
                            users={premiumUsers} 
                            type="revenue" 
                            headerText={<span className="flex justify-between w-full font-bold text-emerald-600"><span>Total Funds:</span><span>₱{currentTotalFunds.toLocaleString()}</span></span>} 
                        /> 
                    </Modal> 
                )}
                {modals.entities && ( 
                    <Modal isOpen={modals.entities} onClose={() => setModals({ ...modals, entities: false })} title="Entity Management"> 
                        <AdminUserTableWidget 
                            users={users} 
                            type="entity" 
                            onTogglePremium={togglePremium} 
                            headerText={pendingUsers.length > 0 ? "⚠️ Approval Needed" : "Manage Company Status"}
                        /> 
                    </Modal> 
                )}
                {modals.reports && ( 
                    <Modal isOpen={modals.reports} onClose={() => setModals({ ...modals, reports: false })} title="Subscription Revenue Reports"> 
                        <SubscriptionReportWidget transactions={subscriptionTransactions} /> 
                    </Modal> 
                )}
                {modals.manageTeam && ( 
                    <Modal isOpen={modals.manageTeam} onClose={() => setModals({ ...modals, manageTeam: false })} title="Admin Team Management"> 
                        <ManageTeamWidget adminUsers={adminUsers} onAddAdmin={handleAddAdmin} /> 
                    </Modal> 
                )}
            </Suspense>
        </div>
    );
}