import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../config/firebase-config";

// --- WIDGET IMPORTS ---
const Modal = lazy(() => import("../../Components/Modal"));
const AdminReportChartWidget = lazy(() => import("../../Components/Admin/Dashboard/AdminReportChartWidget"));

// --- NEW SPLIT WIDGETS ---
const RevenueLedgerWidget = lazy(() => import("../../Components/Admin/Dashboard/RevenueLedgerWidget"));
const EntityManagementWidget = lazy(() => import("../../Components/Admin/Dashboard/EntityManagementWidget"));
const AdminTeamWidget = lazy(() => import("../../Components/Admin/Dashboard/AdminTeamWidget"));

// --- ICONS ---
const MoneyIcon = () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const EntitiesIcon = () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const ShieldIcon = () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;

const SUBSCRIPTION_PRICE = 499.00;

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

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    
    // Data State
    const [users, setUsers] = useState([]);
    const [premiumUsers, setPremiumUsers] = useState([]);
    const [adminUsers, setAdminUsers] = useState([]);
    const [currentMrr, setCurrentMrr] = useState(0);
    const [report, setReport] = useState(null);
    const [period, setPeriod] = useState('monthly');

    // UI State
    const [modals, setModals] = useState({ revenue: false, entities: false, admin: false });

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
            if (u.is_premium && u.created_at?.seconds) {
                const txDate = new Date(u.created_at.seconds * 1000);
                if (txDate >= startDate && txDate <= now) {
                    const dateKey = txDate.toLocaleDateString();
                    if (!revenueData[dateKey]) revenueData[dateKey] = 0;
                    revenueData[dateKey] += SUBSCRIPTION_PRICE;
                    periodRevenue += SUBSCRIPTION_PRICE;
                    activeCount++;
                }
            }
        });

        const labels = Object.keys(revenueData).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        setReport({
            chartData: {
                labels,
                datasets: [{ 
                    label: 'Subscription Income (₱)', 
                    data: labels.map(l => revenueData[l]), 
                    backgroundColor: 'rgba(16, 185, 129, 0.5)', 
                    borderColor: 'rgba(16, 185, 129, 1)', 
                    borderWidth: 1 
                }]
            },
            totalInflow: periodRevenue,
            totalOutflow: 0,
            netPosition: periodRevenue, 
            reportTitle: `Revenue Report: ${startDate.toLocaleDateString()} - ${now.toLocaleDateString()}`,
            transactionCount: activeCount
        });
    }, []);

    // --- FETCH DATA ---
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const usersSnapshot = await getDocs(collection(db, "users"));
            const usersList = usersSnapshot.docs.map(u => ({ id: u.id, ...u.data() }));
            usersList.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
            
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

    // --- ACTIONS ---
    const togglePremium = async (userId, currentStatus) => {
        // 1. Check if ID exists
        if (!userId) {
            alert("Error: User ID is missing.");
            return;
        }

        // 2. Confirmation
        const action = currentStatus ? 'revoke' : 'grant';
        if(!confirm(`Are you sure you want to ${action} Company Dashboard access?`)) return;
        
        try {
            console.log(`Attempting to update User: ${userId} to is_premium: ${!currentStatus}`);
            
            // 3. Perform Update
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, { is_premium: !currentStatus });
            
            console.log("Update Success!");
            
            // 4. Refresh Data
            await fetchData(); 
            
        } catch (error) {
            console.error("Update Failed:", error);
            // 5. Show the ACTUAL error code
            alert(`Update Failed: ${error.code || error.message}`);
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse">Loading System...</div>;

    return (
        <div className="p-4 md:p-10">
            <header className="dashboard-header mb-8 flex justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="secondary-btn-sm">&larr; Back</button>
                    <div><h1 className="text-2xl font-bold text-slate-800">System Administration</h1></div>
                </div>
                <button onClick={fetchData} className="secondary-btn">Refresh</button>
            </header>

            {/* CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <DashboardCard title="Monthly Revenue" value={`₱${currentMrr.toLocaleString()}`} subtext="Projected MRR" linkText="View Ledger" onClick={() => setModals({ ...modals, revenue: true })} icon={<MoneyIcon />} colorClass="text-emerald-600" />
                <DashboardCard title="Total Entities" value={users.length} subtext={`${premiumUsers.length} Companies`} linkText="Manage Access" onClick={() => setModals({ ...modals, entities: true })} icon={<EntitiesIcon />} colorClass="text-indigo-600" />
                <DashboardCard title="Admin Team" value={adminUsers.length} subtext="System Overseers" linkText="View Admins" onClick={() => setModals({ ...modals, admin: true })} icon={<ShieldIcon />} colorClass="text-purple-600" />
            </div>

            {/* CHART */}
            <Suspense fallback={<div className="h-64 bg-slate-100 rounded-lg"></div>}>
                <AdminReportChartWidget report={report} period={period} setPeriod={setPeriod} />
            </Suspense>

            {/* CLEAN MODAL IMPLEMENTATION */}
            <Suspense fallback={null}>
                {modals.revenue && (
                    <Modal isOpen={modals.revenue} onClose={() => setModals({ ...modals, revenue: false })} title="Revenue Ledger">
                        <RevenueLedgerWidget users={premiumUsers} totalRevenue={currentMrr} />
                    </Modal>
                )}
                {modals.entities && (
                    <Modal isOpen={modals.entities} onClose={() => setModals({ ...modals, entities: false })} title="Entity Management">
                        <EntityManagementWidget users={users} onTogglePremium={togglePremium} />
                    </Modal>
                )}
                {modals.admin && (
                    <Modal isOpen={modals.admin} onClose={() => setModals({ ...modals, admin: false })} title="Admin Team">
                        <AdminTeamWidget users={adminUsers} />
                    </Modal>
                )}
            </Suspense>
        </div>
    );
}