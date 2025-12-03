import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
// ADDED: serverTimestamp, query, where
import { collection, getDocs, updateDoc, doc, serverTimestamp, query, where } from "firebase/firestore";
import { db } from "../../config/firebase-config";

// --- WIDGET IMPORTS ---
const Modal = lazy(() => import("../../Components/Modal"));
const AdminReportChartWidget = lazy(() => import("../../Components/Admin/Dashboard/AdminReportChartWidget"));
const AdminUserTableWidget = lazy(() => import("../../Components/Admin/Dashboard/AdminUserTableWidget")); // Using the generic one

// --- ICONS ---
const MoneyIcon = () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const EntitiesIcon = () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const ShieldIcon = () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;

const SUBSCRIPTION_PRICE = 499.00;

// --- CARD COMPONENT ---
const DashboardCard = ({ title, value, subtext, linkText, onClick, icon, colorClass }) => (
    <div onClick={onClick} className="bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-lg p-6 cursor-pointer group transition-shadow hover:shadow-xl flex flex-col">
        <div className="flex justify-between items-start">
            <h4 className="font-bold text-gray-600 pr-4">{title}</h4>
            <div className={`flex-shrink-0 ${colorClass}`}>{icon}</div>
        </div>
        <div className="flex-grow">
            <p className={`text-4xl font-bold mt-2 ${colorClass}`}>{value}</p>
            {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        <span className="text-link text-sm mt-3 inline-block">{linkText} &rarr;</span>
    </div>
);

// --- ADD ADMIN FORM COMPONENT ---
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
        <form onSubmit={handleSubmit} className="p-4">
            <p className="text-sm text-gray-600 mb-4">
                Enter the email address of an existing user to promote them to an Administrator.
            </p>
            <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">User Email</label>
                <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="user@example.com"
                />
            </div>
            <div className="flex justify-end gap-3">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-600 hover:text-slate-800">Cancel</button>
                <button 
                    type="submit" 
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                    {loading ? 'Promoting...' : 'Promote to Admin'}
                </button>
            </div>
        </form>
    );
};

export default function AdminDashboard() {
    const navigate = useNavigate();

    // --- STATE ---
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    // Added 'addAdmin' modal state
    const [modals, setModals] = useState({ revenue: false, entities: false, admin: false, addAdmin: false });
    
    // Metrics
    const [premiumUsers, setPremiumUsers] = useState([]);
    const [adminUsers, setAdminUsers] = useState([]);
    const [currentMrr, setCurrentMrr] = useState(0);

    // Chart
    const [report, setReport] = useState(null);
    const [period, setPeriod] = useState('monthly');

    // --- REPORT GENERATOR ---
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
                // DATE LOGIC: Prefer 'premium_granted_at', fallback to 'created_at'
                const timestamp = u.premium_granted_at || u.created_at;
                
                if (timestamp?.seconds) {
                    const txDate = new Date(timestamp.seconds * 1000);
                    if (txDate >= startDate && txDate <= now) {
                        const dateKey = txDate.toLocaleDateString();
                        if (!revenueData[dateKey]) revenueData[dateKey] = 0;
                        revenueData[dateKey] += SUBSCRIPTION_PRICE;
                        periodRevenue += SUBSCRIPTION_PRICE;
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
                    backgroundColor: 'rgba(16, 185, 129, 0.5)', 
                    borderColor: 'rgba(16, 185, 129, 1)', 
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

    // --- FETCH DATA ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const usersSnapshot = await getDocs(collection(db, "users"));
            const usersList = usersSnapshot.docs.map(u => ({ id: u.id, ...u.data() }));
            // Sort by Premium Granted descending, then Created At descending
            usersList.sort((a, b) => {
                const timeA = a.premium_granted_at?.seconds || a.created_at?.seconds || 0;
                const timeB = b.premium_granted_at?.seconds || b.created_at?.seconds || 0;
                return timeB - timeA;
            });
            
            setUsers(usersList);
            const premiums = usersList.filter(u => u.is_premium);
            setPremiumUsers(premiums);
            setAdminUsers(usersList.filter(u => u.role === 'admin'));
            setCurrentMrr(premiums.length * SUBSCRIPTION_PRICE);
            
            generateReport(usersList, period);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    }, [generateReport, period]);

    useEffect(() => { 
        if (users.length > 0) generateReport(users, period); 
    }, [period, users, generateReport]);

    useEffect(() => { fetchData(); }, []);

    // --- HANDLER: TOGGLE PREMIUM (With Timestamp Fix) ---
    const togglePremium = async (userId, currentStatus) => {
        if(!confirm(`Confirm ${currentStatus ? 'revoke' : 'grant'} company access?`)) return;
        try {
            await updateDoc(doc(db, "users", userId), { 
                is_premium: !currentStatus,
                // If granting access, save the current time. If revoking, clear it (or keep history if desired)
                premium_granted_at: !currentStatus ? serverTimestamp() : null 
            });
            fetchData(); 
        } catch (error) { alert("Error updating status: " + error.message); }
    };

    // --- HANDLER: ADD ADMIN ---
    const handleAddAdmin = async (email) => {
        try {
            // 1. Find user by email
            const q = query(collection(db, "users"), where("email", "==", email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                alert("User not found with this email.");
                return;
            }

            // 2. Update role
            const userDoc = querySnapshot.docs[0];
            await updateDoc(userDoc.ref, { role: 'admin' });
            
            alert(`${email} is now an Admin.`);
            setModals({ ...modals, addAdmin: false });
            fetchData();

        } catch (error) {
            console.error(error);
            alert("Failed to promote user.");
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse">Loading System...</div>;

    return (
        <div className="p-4 md:p-10">
            <header className="dashboard-header mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button onClick={() => navigate('/')} className="secondary-btn-sm">&larr; Back</button>
                    <div><h1 className="text-2xl font-bold text-slate-800">System Administration</h1></div>
                </div>
                
                <div className="flex gap-3">
                    {/* ADD ADMIN BUTTON */}
                    <button 
                        onClick={() => setModals({ ...modals, addAdmin: true })}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition flex items-center gap-2 shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        Add Admin
                    </button>
                    <button onClick={fetchData} className="secondary-btn">Refresh</button>
                </div>
            </header>

            {/* CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* RENAMED CARD */}
                <DashboardCard title="Admin Funds (Net)" value={`₱${currentMrr.toLocaleString()}`} subtext="Total Accumulated Value" linkText="View Ledger" onClick={() => setModals({ ...modals, revenue: true })} icon={<MoneyIcon />} colorClass="text-emerald-600" />
                <DashboardCard title="Total Entities" value={users.length} subtext={`${premiumUsers.length} Companies`} linkText="Manage Access" onClick={() => setModals({ ...modals, entities: true })} icon={<EntitiesIcon />} colorClass="text-indigo-600" />
                <DashboardCard title="Admin Team" value={adminUsers.length} subtext="System Overseers" linkText="View Admins" onClick={() => setModals({ ...modals, admin: true })} icon={<ShieldIcon />} colorClass="text-purple-600" />
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
                            headerText={<span className="flex justify-between w-full"><span>Total Funds:</span><span>₱{currentMrr.toLocaleString()}</span></span>} 
                        />
                    </Modal>
                )}
                {modals.entities && (
                    <Modal isOpen={modals.entities} onClose={() => setModals({ ...modals, entities: false })} title="Entity Management">
                        <AdminUserTableWidget 
                            users={users} 
                            type="entity" 
                            onTogglePremium={togglePremium} 
                            headerText="Toggle Company Status for Users"
                        />
                    </Modal>
                )}
                {modals.admin && (
                    <Modal isOpen={modals.admin} onClose={() => setModals({ ...modals, admin: false })} title="Admin Team">
                        <AdminUserTableWidget 
                            users={adminUsers} 
                            type="admin" 
                            headerText="Current System Administrators"
                        />
                    </Modal>
                )}
                {modals.addAdmin && (
                    <Modal isOpen={modals.addAdmin} onClose={() => setModals({ ...modals, addAdmin: false })} title="Promote to Admin">
                        <AddAdminForm onAdd={handleAddAdmin} onCancel={() => setModals({ ...modals, addAdmin: false })} />
                    </Modal>
                )}
            </Suspense>
        </div>
    );
}