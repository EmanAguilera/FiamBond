// AdminRealm.jsx

'use client'; // Required for all components using state, effects, or context in Next.js App Router

import { useEffect, useState, useCallback, Suspense, useContext } from "react";
import dynamic from "next/dynamic"; 
import { useRouter } from "next/navigation"; 
import { AppContext } from '../../Context/AppContext';
import { collection, getDocs, doc, serverTimestamp, writeBatch, query, where, updateDoc } from "firebase/firestore"; // Added updateDoc
import { db } from "../../config/firebase-config";
import { toast } from "react-hot-toast";

// --- DYNAMIC IMPORTS ---
const Modal = dynamic(() => import("../../Components/Modal"), { ssr: false });
const AdminReportChartWidget = dynamic(() => import("../../Components/Admin/Analytics/AdminReportChartWidget"), { ssr: false });
const AdminUserTableWidget = dynamic(() => import("../../Components/Admin/Users/AdminUserTableWidget"), { ssr: false });
const SubscriptionReportWidget = dynamic(() => import("../../Components/Admin/Finance/SubscriptionReportWidget"), { ssr: false });
const RevenueLedgerWidget = dynamic(() => import("../../Components/Admin/Finance/RevenueLedgerWidget"), { ssr: false });

// --- ICONS & CONFIG ---
const Icons = {
    Plus: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>,
    Back: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>,
    Money: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Entities: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    Report: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
};

const getPlanValue = (plan, type = 'company') => {
    if (type === 'company') return plan === 'yearly' ? 15000.00 : 1500.00;
    return plan === 'yearly' ? 5000.00 : 500.00;
};

// --- REUSABLE COMPONENTS (omitted for brevity) ---
const Btn = ({ onClick, type = 'sec', icon, children }) => {
    const styles = {
        admin: "bg-purple-600 text-white hover:bg-purple-700 shadow-sm",
        sec: "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50",
    };
    return (
        <button onClick={onClick} className={`${styles[type]} px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2`}>
            {icon} {children}
        </button>
    );
};

const DashboardCard = ({ title, value, subtext, linkText, onClick, icon, colorClass, isAlert }) => (
    <div onClick={onClick} className={`bg-white/60 backdrop-blur-xl border rounded-2xl shadow-lg p-6 cursor-pointer group transition-all hover:shadow-xl flex flex-col ${isAlert ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200/50'}`}>
        <div className="flex justify-between items-start">
            <h4 className={`font-bold pr-4 ${isAlert ? 'text-amber-800' : 'text-gray-600'}`}>{title}</h4>
            <div className={`flex-shrink-0 ${colorClass}`}>{icon}</div>
        </div>
        <div className="flex-grow">
            <p className={`text-4xl font-bold mt-2 ${colorClass}`}>{value}</p>
            {subtext && <p className={`text-xs mt-1 font-bold ${isAlert ? 'text-amber-600 animate-pulse' : 'text-slate-400'}`}>{subtext}</p>}
        </div>
        <span className="text-indigo-600 text-sm mt-3 inline-block group-hover:text-indigo-700">{linkText} &rarr;</span>
    </div>
);

const ManageTeamWidget = ({ adminUsers, onAddAdmin }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [email, setEmail] = useState("");

    return (
        <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                {!showAddForm ? (
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-700">System Administrators</h4>
                        <button onClick={() => setShowAddForm(true)} className="bg-purple-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow hover:bg-purple-700 flex items-center gap-2">{Icons.Plus} Promote</button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email address" className="w-full p-2 border rounded-lg text-sm" />
                        <div className="flex justify-end gap-2">
                            <button onClick={()=>setShowAddForm(false)} className="text-xs text-slate-500">Cancel</button>
                            <button onClick={()=>{onAddAdmin(email); setShowAddForm(false)}} className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Promote Admin</button>
                        </div>
                    </div>
                )}
            </div>
            <AdminUserTableWidget users={adminUsers} type="admin" />
        </div>
    );
};

// --- MAIN DASHBOARD ---
export default function AdminDashboard({ onBack }) {
    // ⭐️ FIX: Destructure refreshUserData from AppContext
    const { user, refreshUserData } = useContext(AppContext);
    const adminLastName = user?.last_name || (user?.full_name ? user.full_name.trim().split(' ').pop() : 'Admin');

    const [users, setUsers] = useState([]);
    const [premiums, setPremiums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modals, setModals] = useState({ revenue: false, entities: false, reports: false, manageTeam: false });

    const [premiumUsers, setPremiumUsers] = useState([]);
    const [adminUsers, setAdminUsers] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [currentTotalFunds, setCurrentTotalFunds] = useState(0);

    const [report, setReport] = useState(null);
    const [period, setPeriod] = useState('monthly');

    const generateReport = useCallback((premiumList, currentPeriod) => {
        if (!premiumList || !user) return;
        const now = new Date();
        const startDate = new Date();
        if (currentPeriod === 'weekly') startDate.setDate(now.getDate() - 7);
        else if (currentPeriod === 'yearly') startDate.setFullYear(now.getFullYear() - 1);
        else startDate.setMonth(now.getMonth() - 1);

        const revenueData = {};
        let periodRevenue = 0;
        let activeCount = 0;

        premiumList.forEach(p => {
            if (p.user_id === user.id) return;
            const timestamp = p.granted_at;
            if (timestamp?.seconds) {
                const txDate = new Date(timestamp.seconds * 1000);
                if (txDate >= startDate && txDate <= now) {
                    const dateKey = txDate.toLocaleDateString();
                    revenueData[dateKey] = (revenueData[dateKey] || 0) + (p.amount || 0);
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
            transactionCount: activeCount
        });
    }, [user?.id]);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [usersSnap, premiumsSnap] = await Promise.all([
                getDocs(collection(db, "users")),
                getDocs(collection(db, "premiums"))
            ]);

            const premiumsList = premiumsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const usersList = usersSnap.docs.map(u => ({ id: u.id, ...u.data() }));

            setUsers(usersList);
            setPremiums(premiumsList);

            setPremiumUsers(usersList.filter(u => u.is_premium || u.is_family_premium));
            setAdminUsers(usersList.filter(u => u.role === 'admin'));
            setPendingCount(usersList.filter(u => u.subscription_status === 'pending_approval' || u.family_subscription_status === 'pending_approval').length);

            const totalValue = premiumsList.reduce((sum, p) => p.user_id === user.id ? sum : sum + (p.amount || 0), 0);
            setCurrentTotalFunds(totalValue);
            generateReport(premiumsList, period);
        } catch (error) {
            console.error("Data Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    }, [generateReport, period, user?.id]);

    useEffect(() => { if (user) fetchData(); }, [fetchData, user]);

    // --- ⭐️ THE FIXED BATCH LOGIC ⭐️ ---
    const handleTogglePremium = async (userId, action, type) => {
        try {
            const batch = writeBatch(db); // INITIALIZE THE BATCH
            const userRef = doc(db, "users", userId);
            const isGranting = action === 'grant' || action === 'approve';
            const userObj = users.find(u => u.id === userId);

            const updates = {};
            if (type === 'company') {
                updates.is_premium = isGranting;
                updates.subscription_status = isGranting ? 'active' : 'none';
                if (isGranting) updates.premium_granted_at = serverTimestamp();
            } else {
                updates.is_family_premium = isGranting;
                updates.family_subscription_status = isGranting ? 'active' : 'none';
                if (isGranting) updates.family_premium_granted_at = serverTimestamp();
            }

            batch.update(userRef, updates);

            // If approving, also create a record in the premiums collection for finance tracking
            if (isGranting) {
                const premiumRef = doc(collection(db, "premiums"));
                batch.set(premiumRef, {
                    user_id: userId,
                    email: userObj?.email || "unknown",
                    amount: getPlanValue('monthly', type),
                    access_type: type,
                    granted_at: serverTimestamp(),
                    payment_ref: userObj?.payment_ref || 'ADMIN_GRANT'
                });
            }

            await batch.commit();
            toast.success("Access updated successfully!");
            
            // 1. Refresh AdminRealm's local data
            fetchData();
            
            // 2. ⭐️ FIX: Refresh the global AppContext data (which updates MainShell.tsx)
            // This is crucial for MainShell.tsx to show the updated premium status.
            if (typeof refreshUserData === 'function' && userId === user.id) {
                 refreshUserData();
            }
        } catch (error) {
            console.error("Batch update failed:", error);
            toast.error("Failed to update user.");
        }
    };

    const handleAddAdmin = async (email) => {
        try {
            const q = query(collection(db, "users"), where("email", "==", email));
            const snap = await getDocs(q);
            if (snap.empty) return toast.error("User not found.");
            await updateDoc(doc(db, "users", snap.docs[0].id), { role: 'admin' });
            fetchData();
            toast.success("Admin added!");
        } catch (error) {
            toast.error("Error promoting user.");
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-slate-400">Loading Admin Realm...</div>;

    return (
        <div className="w-full">
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex flex-col gap-1">
                    <button onClick={onBack} className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 text-sm font-medium hover:text-purple-600 transition-all mb-4 w-fit">
                        {Icons.Back} <span>Back to Personal</span>
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-1 h-12 bg-indigo-600 rounded-full"></div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">{adminLastName}</h1>
                            <p className="text-slate-500 font-medium text-sm">Admin Realm Dashboard</p>
                        </div>
                    </div>
                </div>
                <Btn onClick={() => setModals({ ...modals, manageTeam: true })} type="admin" icon={Icons.Plus}>Manage Team</Btn>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <DashboardCard title="Admin Funds" value={`₱${currentTotalFunds.toLocaleString()}`} subtext="Total Value" linkText="View Transactions" onClick={() => setModals({ ...modals, revenue: true })} icon={Icons.Money} colorClass="text-emerald-600" />
                <DashboardCard title="User Access" value={users.length} subtext={pendingCount > 0 ? `⚠️ ${pendingCount} PENDING` : "System Stable"} linkText="Review Access" onClick={() => setModals({ ...modals, entities: true })} icon={Icons.Entities} colorClass={pendingCount > 0 ? "text-amber-600" : "text-indigo-600"} isAlert={pendingCount > 0} />
                <DashboardCard title="Reports" value="Export" subtext="Monthly Stats" linkText="Manage Reports" onClick={() => setModals({ ...modals, reports: true })} icon={Icons.Report} colorClass="text-amber-600" />
            </div>

            <Suspense fallback={<div className="h-64 bg-slate-100 rounded-lg"></div>}>
                <AdminReportChartWidget report={report} period={period} setPeriod={setPeriod} />
            </Suspense>

            <Suspense fallback={null}>
                {modals.revenue && (
                    <Modal isOpen={modals.revenue} onClose={() => setModals({ ...modals, revenue: false })} title="Revenue Ledger">
                        <RevenueLedgerWidget premiums={premiums} users={users} currentAdminId={user?.id} />
                    </Modal>
                )}
                {modals.entities && (
                    <Modal isOpen={modals.entities} onClose={() => setModals({ ...modals, entities: false })} title="Entity Management">
                        <AdminUserTableWidget users={users} type="entity" onTogglePremium={handleTogglePremium} headerText={pendingCount > 0 ? "⚠️ Approval Needed" : "Manage Access Rights"} />
                    </Modal>
                )}
                {modals.reports && (
                    <Modal isOpen={modals.reports} onClose={() => setModals({ ...modals, reports: false })} title="Subscription Reports">
                        <SubscriptionReportWidget transactions={premiums.map(p => {
                            const u = users.find(usr => usr.id === p.user_id);
                            return { id: p.id, created_at: p.granted_at, subscriber: u?.full_name || u?.email || "Unknown", plan: p.plan_cycle, method: p.payment_method, ref: p.payment_ref, amount: p.amount, type: p.access_type };
                        })} />
                    </Modal>
                )}
                {modals.manageTeam && (
                    <Modal isOpen={modals.manageTeam} onClose={() => setModals({ ...modals, manageTeam: false })} title="Admin Team">
                        <ManageTeamWidget adminUsers={adminUsers} onAddAdmin={handleAddAdmin} />
                    </Modal>
                )}
            </Suspense>
        </div>
    );
}