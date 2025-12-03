import { useState, lazy, Suspense, useContext, useCallback, useEffect } from 'react';
import { AppContext } from '../../Context/AppContext.jsx';
import { db } from '../../config/firebase-config.js';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';

// --- WIDGETS ---
const Modal = lazy(() => import('../../Components/Modal.jsx'));
const CompanyReportChartWidget = lazy(() => import('../../Components/Company/Dashboard/CompanyReportChartWidget.jsx'));

// Management Widgets (The Forms)
const CreateCompanyTransactionWidget = lazy(() => import('../../Components/Company/Transaction/CreateCompanyTransactionWidget.jsx'));
const ManageEmployeesWidget = lazy(() => import('../../Components/Company/Management/ManageEmployeesWidget.jsx'));

// Display Widgets (The Lists - NEW)
const CompanyLedgerListWidget = lazy(() => import('../../Components/Company/Dashboard/CompanyLedgerListWidget.jsx'));
const CompanyEmployeeListWidget = lazy(() => import('../../Components/Company/Dashboard/CompanyEmployeeListWidget.jsx'));
const CompanyGoalListWidget = lazy(() => import('../../Components/Company/Dashboard/CompanyGoalListWidget.jsx'));
const CreateCompanyGoalWidget = lazy(() => import('../../Components/Company/Goal/CreateCompanyGoalWidget.jsx'));


// --- ICONS ---
const WalletIcon = () => (<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>);
const TargetIcon = () => (<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>);
const BriefcaseIcon = () => (<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>);

// --- CARD ---
const DashboardCard = ({ title, value, linkText, onClick, icon, colorClass }) => (
    <div onClick={onClick} className="bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-lg p-6 cursor-pointer group transition-shadow hover:shadow-xl flex flex-col">
        <div className="flex justify-between items-start">
            <h4 className="font-bold text-gray-600 pr-4">{title}</h4>
            <div className={`flex-shrink-0 ${colorClass}`}>{icon}</div>
        </div>
        <div className="flex-grow"><p className={`text-4xl font-bold mt-2 ${colorClass}`}>{value}</p></div>
        <span className="text-link text-sm mt-3 inline-block">{linkText} &rarr;</span>
    </div>
);

// --- HELPER: CHART DATA ---
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
            { label: 'Revenue (₱)', data: labels.map(label => data[label].income), backgroundColor: 'rgba(75, 192, 192, 0.5)' },
            { label: 'Expenses (₱)', data: labels.map(label => data[label].expense), backgroundColor: 'rgba(255, 99, 132, 0.5)' }
        ]
    };
};

export default function CompanyRealm({ company, onBack, onDataChange }) {
    const { user } = useContext(AppContext);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    // --- STATE ---
    const [modals, setModals] = useState({ 
        addTx: false, addGoal: false, manageEmp: false, 
        viewTx: false, viewGoals: false, viewEmp: false 
    });
    const [loading, setLoading] = useState(true);
    const [companyNotFound, setCompanyNotFound] = useState(false);
    
    // Data State
    const [transactions, setTransactions] = useState([]);
    const [goals, setGoals] = useState([]);
    const [members, setMembers] = useState([]);
    
    // Metrics
    const [summaryData, setSummaryData] = useState({ netPosition: 0 });
    
    // Chart / Report
    const [report, setReport] = useState(null);
    const [period, setPeriod] = useState('monthly');

    // --- FETCH DATA ---
    const fetchData = useCallback(async () => {
        if (!company || !user) return;
        setLoading(true);
        try {
            // 1. Transactions (Used for Ledger + Chart + Balance)
            const txRes = await fetch(`${API_URL}/transactions?company_id=${company.id}`);
            const txData = await txRes.json();
            // Format Dates for UI
            const formattedTx = txData.map(tx => ({ ...tx, id: tx._id, created_at: { toDate: () => new Date(tx.created_at) }}));
            setTransactions(formattedTx);

            // Calculate Balance
            let net = 0;
            formattedTx.forEach(tx => {
                if (tx.type === 'income') net += tx.amount; else net -= tx.amount;
            });
            setSummaryData({ netPosition: net });

            // 2. Goals
            const goalRes = await fetch(`${API_URL}/goals?company_id=${company.id}`);
            const goalData = await goalRes.json();
            setGoals(goalData);

            // 3. Members (Mongo ID list -> Firebase Users)
            const compRes = await fetch(`${API_URL}/companies/${company.id}`);
            if (compRes.status === 404) { setCompanyNotFound(true); return; }
            
            const compData = await compRes.json();
            const memberIds = compData.member_ids || [];

            if (memberIds.length > 0) {
                // Firebase Query (limited to 10 for basic implementation)
                const safeIds = memberIds.slice(0, 10);
                const q = query(collection(db, "users"), where(documentId(), "in", safeIds));
                const snap = await getDocs(q);
                setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } else {
                setMembers([]);
            }

        } catch (error) { console.error("Fetch Error:", error); } 
        finally { setLoading(false); }
    }, [company, user, API_URL]);

    // --- REPORT GENERATION ---
    const generateReport = useCallback(() => {
        if (!transactions) return;
        
        const now = new Date();
        let startDate = new Date();
        
        if (period === 'weekly') startDate.setDate(now.getDate() - 7);
        else if (period === 'yearly') startDate.setFullYear(now.getFullYear() - 1);
        else startDate.setMonth(now.getMonth() - 1); // Monthly

        // Filter Transactions by Date
        const filteredTx = transactions.filter(tx => {
            const txDate = tx.created_at.toDate();
            return txDate >= startDate && txDate <= now;
        });

        let totalInflow = 0;
        let totalOutflow = 0;
        filteredTx.forEach(tx => {
            if (tx.type === 'income') totalInflow += tx.amount;
            else totalOutflow += tx.amount;
        });

        setReport({
            chartData: formatDataForChart(filteredTx),
            totalInflow, totalOutflow,
            netPosition: totalInflow - totalOutflow,
            reportTitle: `Report: ${startDate.toLocaleDateString()} - ${now.toLocaleDateString()}`,
            transactionCount: filteredTx.length
        });

    }, [transactions, period]);

    // Effects
    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { generateReport(); }, [generateReport]);

    // --- AUTO-REGISTER COMPANY IF MISSING ---
    useEffect(() => {
        const ensureCompanyExists = async () => {
            if (!user) return;
            try {
                // Check if exists
                const check = await fetch(`${API_URL}/companies/${user.uid}`);
                if (check.status === 404) {
                    console.log("Company missing in Mongo. Creating...");
                    // Create it using the user's name
                    const createRes = await fetch(`${API_URL}/companies`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: `${user.first_name}'s Company`,
                            owner_id: user.uid
                        })
                    });
                    if (createRes.ok) {
                        console.log("Company Auto-Created!");
                        fetchData(); // Reload data
                    }
                }
            } catch (e) {
                console.error("Auto-create failed", e);
            }
        };
        ensureCompanyExists();
    }, [user, API_URL]);

    const handleRefresh = () => {
        fetchData();
        if (onDataChange) onDataChange();
    };

    if (loading && !transactions.length) return <div className="p-10 text-center animate-pulse">Loading Company Realm...</div>;
    if (companyNotFound) return <div className="p-10 text-center">Company Not Found. <button onClick={onBack} className="text-blue-500">Back</button></div>;

    return (
        <div className="p-4 md:p-10">
            {/* HEADER */}
            <header className="dashboard-header mb-8 flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="secondary-btn-sm">&larr; Back</button>
                    <div><h1 className="text-2xl font-bold text-slate-800">{company.name}</h1><p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Company Realm</p></div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setModals({...modals, addTx: true})} className="primary-btn bg-indigo-600 hover:bg-indigo-700">+ Finance</button>
                    <button onClick={() => setModals({...modals, addGoal: true})} className="secondary-btn">+ Target</button>
                    <button onClick={() => setModals({...modals, manageEmp: true})} className="secondary-btn">Employees</button>
                </div>
            </header>

            {/* CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <DashboardCard title="Company Funds (Net)" value={`₱${summaryData.netPosition.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} linkText="View Ledger" onClick={() => setModals({...modals, viewTx: true})} icon={<WalletIcon />} colorClass="text-indigo-600" />
                <DashboardCard title="Active Targets" value={goals.filter(g=>g.status === 'active').length} linkText="View Strategy" onClick={() => setModals({...modals, viewGoals: true})} icon={<TargetIcon />} colorClass="text-rose-600" />
                <DashboardCard title="Total Employees" value={members.length} linkText="View Workforce" onClick={() => setModals({...modals, viewEmp: true})} icon={<BriefcaseIcon />} colorClass="text-amber-600" />
            </div>

            {/* CHART */}
            <div className="dashboard-section">
                <div className="w-full mx-auto flex justify-center gap-4 mb-6">
                    <button onClick={() => setPeriod('weekly')} className={period === 'weekly' ? 'active-period-btn' : 'period-btn'}>Weekly</button>
                    <button onClick={() => setPeriod('monthly')} className={period === 'monthly' ? 'active-period-btn' : 'period-btn'}>Monthly</button>
                    <button onClick={() => setPeriod('yearly')} className={period === 'yearly' ? 'active-period-btn' : 'period-btn'}>Yearly</button>
                </div>
                <Suspense fallback={<div className="h-96 bg-slate-100 rounded-lg"></div>}>
                    <CompanyReportChartWidget report={report} />
                </Suspense>
            </div>

            {/* MODALS */}
            <Suspense fallback={<div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center text-white">Loading...</div>}>
                
                {/* FORMS */}
                {modals.addTx && <Modal isOpen={modals.addTx} onClose={() => setModals({...modals, addTx: false})} title="Record Business Finance"><CreateCompanyTransactionWidget company={company} onSuccess={() => { setModals({...modals, addTx: false}); handleRefresh(); }} /></Modal>}
                {modals.addGoal && ( <Modal isOpen={modals.addGoal} onClose={() => setModals({...modals, addGoal: false})} title="Set Strategic Target"> <CreateCompanyGoalWidget  company={company}  onSuccess={() => { setModals({...modals, addGoal: false}); handleRefresh(); }} /> </Modal> )}
                {modals.manageEmp && <Modal isOpen={modals.manageEmp} onClose={() => setModals({...modals, manageEmp: false})} title="Onboard Employee"><ManageEmployeesWidget company={company} members={members} onUpdate={handleRefresh} /></Modal>}

                {/* LISTS (The New Lightweight Widgets) */}
                {modals.viewTx && <Modal isOpen={modals.viewTx} onClose={() => setModals({...modals, viewTx: false})} title="Company Ledger"><CompanyLedgerListWidget transactions={transactions} /></Modal>}
                {modals.viewGoals && <Modal isOpen={modals.viewGoals} onClose={() => setModals({...modals, viewGoals: false})} title="Strategic Goals"><CompanyGoalListWidget goals={goals} /></Modal>}
                {modals.viewEmp && <Modal isOpen={modals.viewEmp} onClose={() => setModals({...modals, viewEmp: false})} title="Workforce Directory"><CompanyEmployeeListWidget members={members} /></Modal>}

            </Suspense>
        </div>
    );
}