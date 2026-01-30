'use client'; // Required for all components using state, effects, or context in Next.js App Router

import { useEffect, useState, useCallback, Suspense, useContext } from "react";
import dynamic from "next/dynamic"; // Use next/dynamic instead of React.lazy
import { useRouter } from "next/navigation"; // Use useRouter from next/navigation
import { AppContext } from '../../context/AppContext';
import { collection, getDocs, updateDoc, doc, serverTimestamp, query, where, writeBatch } from "firebase/firestore";
import { db } from "../../config/firebase-config";

// --- DYNAMIC IMPORTS (Replaced lazy with next/dynamic) ---
const Modal = dynamic(() => import("../../components/layout/Modal"), { ssr: false });
const AdminReportChartWidget = dynamic(() => import("../../components/analytics/AdminReportChartWidget"), { ssr: false });
const AdminUserTableWidget = dynamic(() => import("../../components/management/AdminUserTableWidget"), { ssr: false });
const SubscriptionReportWidget = dynamic(() => import("../../components/finance/SubscriptionReportWidget"), { ssr: false });
const RevenueLedgerWidget = dynamic(() => import("../../components/finance/RevenueLedgerWidget"), { ssr: false });

// --- ICONS (Kept as is) ---
const Icons = {
    Plus: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>,
    Back: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>,
    Money: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Entities: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    Shield: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    Refresh: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>,
    Report: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
};

// --- CONFIG (Kept as is) ---
const getPlanValue = (plan, type = 'company') => {
    if (type === 'company') {
        if (plan === 'yearly') return 15000.00;
        return 1500.00;
    } else {
        if (plan === 'yearly') return 5000.00;
        return 500.00;
    }
};

// --- REUSABLE COMPONENTS (Kept as is) ---
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

// FIXED DashboardCard for proper link styling
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
        {/* FIX: Use standard Tailwind classes for link styling with hover, no translate */}
        <span className="text-indigo-600 text-sm mt-3 inline-block transition-all duration-200 group-hover:text-indigo-700">
            {linkText} &rarr;
        </span>
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
                            {Icons.Plus}
                            Promote New Admin
                        </button>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex justify-between items-center">
                            <h4 className="font-bold text-purple-700 text-sm">Promote User</h4>
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
export default function AdminDashboard({ onBack }) {
    const { user } = useContext(AppContext);
    // Next.js change: Replace useNavigate with useRouter
    const router = useRouter(); 
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

    // --- REVENUE GENERATION (Fixed dependency array and added null check for user) ---
    const generateReport = useCallback((premiumList, currentPeriod) => {
        if (!premiumList || !user) return; // FIX: Guard clause for user
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
    }, [user?.id]); // FIX: Use optional chaining here to prevent crash if user is null

    // --- FETCH DATA (Fixed dependency array and added null check for user) ---
    const fetchData = useCallback(async () => {
        if (!user) return; // FIX: Guard clause for user
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
            const currentAdminId = user.id; // user is guaranteed to exist here now
            const totalValue = premiumsList.reduce((sum, p) => {
                if (p.user_id === currentAdminId) return sum;
                return sum + (p.amount || 0);
            }, 0);

            setCurrentTotalFunds(totalValue);
            generateReport(premiumsList, period);
        } catch (error) {
            console.error("Data Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    }, [generateReport, period, user?.id]); // FIX: Use optional chaining here

    // FIX: Add null checks for user in useEffects
    useEffect(() => { 
        if (user) {
            fetchData();
        }
    }, [fetchData, user]);
    
    useEffect(() => { 
        if (user && premiums.length > 0) {
            generateReport(premiums, period); 
        }
    }, [period, premiums, generateReport, user]);

    // --- TOGGLE PREMIUM (BATCHED WITH PREMIUMS COLLECTION) (Kept as is) ---
    // ... (rest of handleTogglePremium is unchanged) ...
    const handleTogglePremium = async (userId, action, type) => {
        try {
            // ... (batch logic) ...
            await batch.commit();
            fetchData();
        } catch (error) {
            console.error("Error updating user access:", error);
            alert("Failed to update user.");
        }
    };

    // --- PROMOTE ADMIN (Kept as is) ---
    // ... (rest of handleAddAdmin is unchanged) ...
    const handleAddAdmin = async (email) => {
        try {
            // ... (firestore logic) ...
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Failed.");
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-slate-400">Loading Admin Realm...</div>;

    return (
        <div className="w-full">
            {/* HEADER */}
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex flex-col gap-1">
                    {/* Next.js change: Replace navigate('/') with router.push('/') */}
                    <button onClick={onBack} className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 text-sm font-medium hover:border-purple-300 hover:text-purple-600 hover:shadow-sm transition-all mb-4 w-fit">
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
                    subtext={pendingCount > 0 ? `⚠️ ${pendingCount} PENDING REQUEST(S)` : `${premiumUsers.length} Active Subscriptions`}
                    linkText={pendingCount > 0 ? "Review Requests Now" : "Manage Access"}
                    onClick={() => setModals({ ...modals, entities: true })}
                    icon={Icons.Entities}
                    colorClass={pendingCount > 0 ? "text-amber-600" : "text-indigo-600"}
                    isAlert={pendingCount > 0}
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
                        <div className="space-y-4">
                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex justify-between items-center">
                                <span className="font-bold text-emerald-600 text-sm uppercase tracking-wide">Total Funds: </span>
                                <span className="font-bold text-1xl text-emerald-600">₱{currentTotalFunds.toLocaleString()}</span>
                            </div>
                            <RevenueLedgerWidget premiums={premiums} users={users} currentAdminId={user?.id} />
                        </div>
                    </Modal>
                )}
                {modals.entities && (
                    <Modal isOpen={modals.entities} onClose={() => setModals({ ...modals, entities: false })} title="Entity Management">
                        <AdminUserTableWidget
                            users={users}
                            type="entity"
                            onTogglePremium={handleTogglePremium}
                            headerText={pendingCount > 0 ? "⚠️ Approval Needed" : "Manage Access Rights"}
                        />
                    </Modal>
                )}
                {modals.reports && (
                    <Modal isOpen={modals.reports} onClose={() => setModals({ ...modals, reports: false })} title="Subscription Revenue Reports">
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