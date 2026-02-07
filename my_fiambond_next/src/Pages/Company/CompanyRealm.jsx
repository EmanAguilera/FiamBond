// CompanyRealm.jsx

'use client'; 

import React, { useState, Suspense, useContext, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AppContext } from '../../Context/AppContext.jsx';
import { db } from '../../config/firebase-config.js';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { API_BASE_URL } from "../../config/apiConfig";

// --- WIDGETS ---
const Modal = dynamic(() => import('../../Components/Modal.jsx'), { ssr: false });
const CompanyReportChartWidget = dynamic(() => import('../../Components/Company/Analytics/CompanyReportChartWidget.jsx'), { ssr: false });
const CreateCompanyTransactionWidget = dynamic(() => import('../../Components/Company/Finance/CreateCompanyTransactionWidget.tsx'), { ssr: false });
const ManageEmployeesWidget = dynamic(() => import('../../Components/Company/Employees/ManageEmployeesWidget.jsx'), { ssr: false });
const CompanyLedgerListWidget = dynamic(() => import('../../Components/Company/Finance/CompanyLedgerListWidget.jsx'), { ssr: false });
const CompanyEmployeeListWidget = dynamic(() => import('../../Components/Company/Employees/CompanyEmployeeListWidget.jsx'), { ssr: false });
const CompanyGoalListWidget = dynamic(() => import('../../Components/Company/Goal/CompanyGoalListWidget.jsx'), { ssr: false });
const CreateCompanyGoalWidget = dynamic(() => import('../../Components/Company/Goal/CreateCompanyGoalWidget.tsx'), { ssr: false });
const CompanyPayrollWidget = dynamic(() => import('../../Components/Company/Payroll/CompanyPayrollWidget.tsx'), { ssr: false });
const PayrollHistoryWidget = dynamic(() => import('../../Components/Company/Payroll/PayrollHistoryWidget.jsx'), { ssr: false });

// --- ICONS ---
const Icons = {
    Plus: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>,
    Back: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>,
    Users: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>,
    Wallet: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>,
    Target: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
    Printer: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
};

// --- REUSABLE BUTTON (omitted for brevity) ---
const Btn = ({ onClick, type = 'sec', icon, children }) => {
    const styles = {
        pri: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm border border-transparent",
        sec: "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 hover:text-slate-800",
        ghost: "bg-transparent text-slate-500 hover:text-slate-800"
    };
    return (
        <button onClick={onClick} className={`${styles[type]} px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 flex items-center gap-2`}>
            {icon} {children}
        </button>
    );
};

// --- DASHBOARD CARD (omitted for brevity) ---
const DashboardCard = ({ title, value, subtext, linkText, onClick, icon, colorClass }) => (
    <div onClick={onClick} className="bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-lg p-6 cursor-pointer group transition-shadow hover:shadow-xl flex flex-col">
        <div className="flex justify-between items-start">
            <h4 className="font-bold text-gray-600 pr-4">{title}</h4>
            <div className={`flex-shrink-0 ${colorClass}`}>{icon}</div>
        </div>
        <div className="flex-grow"><p className={`text-4xl font-bold mt-2 ${colorClass}`}>{value}</p></div>
        {subtext && <p className="text-slate-400 text-sm font-medium mt-1">{subtext}</p>}
        <span className="text-indigo-600 text-sm mt-3 inline-block transition-all duration-200 group-hover:text-indigo-700">
            {linkText} &rarr;
        </span>
    </div>
);

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

export default function CompanyRealm({ company, onBack, onDataChange }) {
    // ⭐️ Destructure user from AppContext
    const { user } = useContext(AppContext);

    const [modals, setModals] = useState({
        addTx: false, addGoal: false, manageEmp: false,
        viewTx: false, viewGoals: false, viewEmp: false,
        runPayroll: false, payrollHistory: false
    });

    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [goals, setGoals] = useState([]);
    const [members, setMembers] = useState([]);
    const [summaryData, setSummaryData] = useState({ netPosition: 0, payrollCount: 0 });
    const [report, setReport] = useState(null);
    const [period, setPeriod] = useState('monthly');

    const toggle = (key, val) => setModals(prev => ({ ...prev, [key]: val }));

    const fetchData = useCallback(async () => {
        if (!company || !user) return;
        setLoading(true);
        try {
            // Ensure company exists or create if missing (omitted for brevity)
            let compRes = await fetch(`${API_BASE_URL}/companies/${company.id}`);
            if (!compRes.ok && compRes.status === 404) {
                const createRes = await fetch(`${API_BASE_URL}/companies`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ owner_id: company.id, name: company.name })
                });
                if (createRes.ok) compRes = await fetch(`${API_BASE_URL}/companies/${company.id}`);
            }

            const [txRes, goalRes] = await Promise.all([
                fetch(`${API_BASE_URL}/transactions?company_id=${company.id}`),
                fetch(`${API_BASE_URL}/goals?company_id=${company.id}`)
            ]);

            let txData = txRes.ok ? await txRes.json() : [];
            const formattedTx = (Array.isArray(txData) ? txData : []).map(tx => ({ 
                ...tx, 
                id: tx._id, 
                created_at: { toDate: () => new Date(tx.created_at) }
            }));
            setTransactions(formattedTx);

            let net = 0, pCount = 0;
            formattedTx.forEach(tx => {
                tx.type === 'income' ? net += tx.amount : net -= tx.amount;
                if(tx.category === 'Payroll' || tx.description?.toLowerCase().includes('salary')) pCount++;
            });
            setSummaryData({ netPosition: net, payrollCount: pCount });

            let goalData = goalRes.ok ? await goalRes.json() : [];
            setGoals(Array.isArray(goalData) ? goalData : []);

            if (compRes.ok) {
                const companyData = await compRes.json();
                const memberIds = companyData.member_ids || [];
                if (memberIds.length) {
                    const snap = await getDocs(query(collection(db, "users"), where(documentId(), "in", memberIds.slice(0, 10))));
                    setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                }
            }
        } catch (e) {
            console.error("Fetch Error:", e);
        } finally {
            setLoading(false);
        }
    }, [company, user]);

    const generateReport = useCallback(() => {
        if (!transactions.length) return;
        const endDate = new Date();
        const startDate = new Date();

        if (period === 'weekly') startDate.setDate(endDate.getDate() - 7);
        else if (period === 'yearly') startDate.setFullYear(endDate.getFullYear() - 1);
        else startDate.setMonth(endDate.getMonth() - 1);

        const filtered = transactions.filter(tx => {
            const txDate = tx.created_at.toDate();
            return txDate >= startDate && txDate <= endDate;
        });

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
    useEffect(() => { generateReport(); }, [generateReport, period]);

    const handleRefresh = () => { fetchData(); if (onDataChange) onDataChange(); };

    // ⭐️ FIX: Access Check Logic ⭐️
    useEffect(() => {
        if (!user || !onBack) return;

        // 1. Admins always have access
        if (user.role === 'admin') return; 

        // 2. Non-admin access is determined by the `is_premium` and `subscription_status === 'active'` flags
        //    (The AdminRealm fixes ensure this status is 'active' upon approval)
        const hasActiveCompanyAccess = user.is_premium === true && user.subscription_status === 'active';

        // 3. If access is NOT active, go back to UserRealm
        if (!hasActiveCompanyAccess) {
            // Use a short timeout to prevent instant flicker/re-render issues sometimes caused by state change
            const timer = setTimeout(() => {
                onBack(); 
            }, 100); 

            return () => clearTimeout(timer); 
        }
        // Dependency array relies only on user and onBack since user update triggers full component refresh
    }, [user, onBack]); 

    if (loading && !transactions.length) return <div className="p-10 text-center animate-pulse text-slate-500">Entering Corporate Realm...</div>;

    return (
        <div className="w-full">
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex flex-col gap-1">
                    <button onClick={onBack} className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 text-sm font-medium hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm transition-all mb-4 w-fit">
                        <span className="group-hover:-translate-x-0.5 transition-transform">{Icons.Back}</span>
                        <span>Back to Personal</span>
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-1 h-12 bg-indigo-600 rounded-full opacity-80"></div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-none">{company.name}</h1>
                            <p className="text-slate-500 font-medium text-sm mt-1 tracking-wide">Corporate Realm</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Btn onClick={() => toggle('addTx', true)} type="pri" icon={Icons.Plus}>Transaction</Btn>
                    <Btn onClick={() => toggle('addGoal', true)} icon={Icons.Plus}>Goal</Btn>
                    <Btn onClick={() => toggle('runPayroll', true)} icon={Icons.Plus}>Payroll</Btn>
                    <div className="hidden md:block w-px h-10 bg-slate-200 mx-1"></div>
                    <Btn onClick={() => toggle('viewEmp', true)} icon={Icons.Users}>Employees</Btn>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <DashboardCard title="Company Funds" value={`₱${summaryData.netPosition.toLocaleString()}`} subtext="Available Balance" linkText="View Transactions" onClick={() => toggle('viewTx', true)} icon={Icons.Wallet} colorClass="text-emerald-600" />
                <DashboardCard title="Active Goals" value={goals.filter(g => g.status === 'active').length} subtext="Targets in Progress" linkText="View Goals" onClick={() => toggle('viewGoals', true)} icon={Icons.Target} colorClass="text-rose-600" />
                <DashboardCard title="Payroll Reports" value={`${summaryData.payrollCount} Records`} subtext="Processed Histories" linkText="Manage Reports" onClick={() => toggle('payrollHistory', true)} icon={Icons.Printer} colorClass="text-amber-600" />
            </div>

            <div className="dashboard-section">
                <div className="flex justify-center gap-2 mb-6 bg-slate-100 p-1 rounded-xl w-fit mx-auto">
                    {['weekly', 'monthly', 'yearly'].map(p => (
                        <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1 text-sm rounded-lg capitalize transition ${period === p ? 'bg-white shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-800'}`}>{p}</button>
                    ))}
                </div>
                {/* FIX: Simplified conditional rendering to only use Suspense */}
                <Suspense fallback={<div className="h-96 bg-slate-100 rounded-lg animate-pulse"/>}>
                    <CompanyReportChartWidget report={report} /> 
                </Suspense>
            </div>

            <Suspense fallback={null}>
                {modals.addTx && <Modal isOpen={modals.addTx} onClose={() => toggle('addTx', false)} title="Record New Transaction"><CreateCompanyTransactionWidget company={company} onSuccess={() => { toggle('addTx', false); handleRefresh(); }} /></Modal>}
                {modals.addGoal && <Modal isOpen={modals.addGoal} onClose={() => toggle('addGoal', false)} title="Record New Goal"><CreateCompanyGoalWidget company={company} onSuccess={() => { toggle('addGoal', false); handleRefresh(); }} /></Modal>}
                {modals.manageEmp && <Modal isOpen={modals.manageEmp} onClose={() => toggle('manageEmp', false)} title="Manage Employee Access"><ManageEmployeesWidget company={company} members={members} onUpdate={handleRefresh} /></Modal>}
                {modals.viewTx && <Modal isOpen={modals.viewTx} onClose={() => toggle('viewTx', false)} title="Shared Company Transactions"><CompanyLedgerListWidget transactions={transactions} onDataChange={handleRefresh} /></Modal>}
                {modals.viewGoals && <Modal isOpen={modals.viewGoals} onClose={() => toggle('viewGoals', false)} title="Shared Company Goals"><CompanyGoalListWidget goals={goals} onDataChange={handleRefresh} /></Modal>}
                {modals.viewEmp && (
                    <Modal isOpen={modals.viewEmp} onClose={() => toggle('viewEmp', false)} title="Manage Employee Access">
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <button onClick={() => { toggle('viewEmp', false); toggle('manageEmp', true); }} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                    {Icons.Plus} Onboard New Employee
                                </button>
                            </div>
                            <CompanyEmployeeListWidget members={members} />
                        </div>
                    </Modal>
                )}
                {modals.runPayroll && <Modal isOpen={modals.runPayroll} onClose={() => toggle('runPayroll', false)} title="Record New Payroll"><CompanyPayrollWidget company={company} members={members} onSuccess={() => { toggle('runPayroll', false); handleRefresh(); }} /></Modal>}
                {modals.payrollHistory && <Modal isOpen={modals.payrollHistory} onClose={() => toggle('payrollHistory', false)} title="Shared Company Payroll Reports"><PayrollHistoryWidget transactions={transactions} companyName={company.name} /></Modal>}
            </Suspense>
        </div>
    );
}