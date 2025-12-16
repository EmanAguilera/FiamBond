import { useContext, useEffect, useState, useCallback, lazy, Suspense } from "react";
import { AppContext } from "../../Context/AppContext.jsx";
import { useNavigate } from "react-router-dom"; 
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"; 
import { db } from "../../config/firebase-config.js"; 

// --- WIDGET IMPORTS ---
const Modal = lazy(() => import("../../Components/Modal.jsx"));
const GoalListsWidget = lazy(() => import("../../Components/Personal/Goal/GoalListsWidget.jsx"));
const CreateGoalWidget = lazy(() => import("../../Components/Personal/Goal/CreateGoalWidget.tsx"));
const PersonalTransactionsWidget = lazy(() => import("../../Components/Personal/Finance/PersonalTransactionsWidget.jsx"));
const CreateTransactionWidget = lazy(() => import("../../Components/Personal/Finance/CreateTransactionWidget.tsx"));
const MyFamiliesListWidget = lazy(() => import("../../Components/Personal/Families/MyFamiliesListWidget.jsx"));
const PersonalReportChartWidget = lazy(() => import("../../Components/Personal/Analytics/PersonalReportChartWidget.jsx"));
const LoanTrackingWidget = lazy(() => import("../../Components/Personal/Loan/LoanTrackingWidget.tsx"));
const RecordLoanFlowWidget = lazy(() => import("../../Components/Personal/Loan/Setup/RecordLoanFlowWidget.tsx"));
const RecordLoanChoiceWidget = lazy(() => import("../../Components/Personal/Loan/Setup/RecordLoanChoiceWidget.tsx"));
const CreatePersonalLoanWidget = lazy(() => import("../../Components/Personal/Loan/Setup/CreatePersonalLoanWidget.tsx"));
const FamilyRealm = lazy(() => import("../Family/FamilyRealm.jsx"));
const CompanyRealm = lazy(() => import("../Company/CompanyRealm.jsx"));
const ApplyCompanyWidget = lazy(() => import("../../Components/Company/Onboarding/ApplyCompanyWidget.jsx"));

// --- ICONS ---
const Icons = {
    Plus: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>,
    Users: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>,
    Build: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>,
    Lock: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>,
    Wallet: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>,
    Flag: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2z"></path></svg>,
    Gift: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path></svg>
};

// --- REUSABLE BUTTON ---
const Btn = ({ onClick, type = 'sec', icon, children, className = '', disabled = false }) => {
    const styles = {
        pri: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm border border-transparent",
        sec: "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 hover:text-slate-800",
        comp: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm border border-transparent",
        pending: "bg-amber-100 text-amber-700 border border-amber-200 cursor-not-allowed" 
    };
    return (
        <button 
            onClick={disabled ? null : onClick} 
            disabled={disabled}
            className={`${styles[type]} px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 flex items-center justify-center gap-2 w-full md:w-auto ${className}`}
        >
            {icon} {children}
        </button>
    );
};

// --- DASHBOARD CARD ---
const DashboardCard = ({ title, value, subtext, linkText, onClick, icon, colorClass }) => (
    <div onClick={onClick} className="bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-lg p-6 cursor-pointer group transition-shadow hover:shadow-xl flex flex-col">
        <div className="flex justify-between items-start">
            <h4 className="font-bold text-gray-600 pr-4">{title}</h4>
            <div className={`flex-shrink-0 ${colorClass}`}>{icon}</div>
        </div>
        <div className="flex-grow"><p className={`text-4xl font-bold mt-2 ${colorClass}`}>{value}</p>
        {subtext && <p className="text-slate-400 text-sm font-medium mt-1">{subtext}</p>}
        </div>
        <span className="text-link text-sm mt-3 inline-block">{linkText} &rarr;</span>
    </div>
);

// --- HELPER ---
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

export default function UserDashboard() {
    const { user } = useContext(AppContext);
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const userLastName = user?.last_name || (user?.full_name ? user.full_name.trim().split(' ').pop() : 'User');

    // UI & Data State
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCompanyUser, setIsCompanyUser] = useState(false);
    const [isPending, setIsPending] = useState(false); 
    
    const [modals, setModals] = useState({ transactions: false, goals: false, family: false, lending: false, createTx: false, createGoal: false, recordLoan: false, applyCompany: false });
    const [loanFlowStep, setLoanFlowStep] = useState('choice');
    const [activeFamilyRealm, setActiveFamilyRealm] = useState(null);
    const [showCompanyRealm, setShowCompanyRealm] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [summaryData, setSummaryData] = useState(null);
    const [summaryError, setSummaryError] = useState(null);
    const [activeGoalsCount, setActiveGoalsCount] = useState(0);
    const [lendingSummary, setLendingSummary] = useState({ outstanding: 0 });
    const [report, setReport] = useState(null);
    const [reportLoading, setReportLoading] = useState(true);
    const [reportError, setReportError] = useState(null);
    const [period, setPeriod] = useState('monthly');

    const toggleModal = (key, val) => setModals(prev => ({ ...prev, [key]: val }));

    useEffect(() => {
        const checkRoles = async () => {
            if (user?.uid) {
                const docSnap = await getDoc(doc(db, "users", user.uid));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.role === 'admin') setIsAdmin(true);
                    
                    if (data.is_premium === true) {
                        setIsCompanyUser(true);
                        setIsPending(false); 
                    } else if (data.subscription_status === 'pending_approval') {
                        setIsCompanyUser(false);
                        setIsPending(true); 
                    } else {
                        setIsCompanyUser(false);
                        setIsPending(false);
                    }
                }
            }
        };
        checkRoles();
    }, [user, modals.applyCompany]); 

    const fetchData = useCallback(async () => {
        if (!user) return;
        try {
            const txRes = await fetch(`${API_URL}/transactions?user_id=${user.uid}`);
            const txs = await txRes.json();
            let balance = 0;
            txs.forEach((tx) => { if (!tx.family_id) tx.type === 'income' ? balance += tx.amount : balance -= tx.amount; });
            setSummaryData({ netPosition: balance });

            const gRes = await fetch(`${API_URL}/goals?user_id=${user.uid}`);
            if (gRes.ok) setActiveGoalsCount((await gRes.json()).filter(g => g.status === 'active').length);

            const lRes = await fetch(`${API_URL}/loans?user_id=${user.uid}`);
            if (lRes.ok) {
                const loans = await lRes.json();
                let out = 0;
                loans.forEach(l => { if (l.creditor_id === user.uid && (l.status === 'outstanding' || l.status === 'pending_confirmation')) out += ((l.total_owed || l.amount) - (l.repaid_amount || 0)); });
                setLendingSummary({ outstanding: out });
            }
        } catch (e) { console.error(e); setSummaryError("Error"); }
    }, [user, API_URL]);

    const getReport = useCallback(async () => {
        if (!user) return;
        setReportLoading(true); setReportError(null);
        try {
            // FIX: Independent Date Objects to avoid mutation issues
            const endDate = new Date();
            const startDate = new Date();
            
            if (period === 'weekly') {
                startDate.setDate(endDate.getDate() - 7);
            } else if (period === 'yearly') {
                startDate.setFullYear(endDate.getFullYear() - 1);
            } else {
                // Monthly default
                startDate.setMonth(endDate.getMonth() - 1);
            }

            const res = await fetch(`${API_URL}/transactions?user_id=${user.uid}&startDate=${startDate.toISOString()}`);
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();
            
            const txs = data.filter(tx => !tx.family_id).map(tx => ({ ...tx, created_at: { toDate: () => new Date(tx.created_at) } }));
            let inflow = 0, outflow = 0;
            txs.forEach(tx => tx.type === 'income' ? inflow += tx.amount : outflow += tx.amount);
            
            setReport({ 
                chartData: formatDataForChart(txs), 
                totalInflow: inflow, 
                totalOutflow: outflow, 
                netPosition: inflow - outflow, 
                // FIX: Dynamic Date Range Title
                reportTitle: `Funds Report: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 
                transactionCount: txs.length 
            });
        } catch { setReportError("No Data"); } finally { setReportLoading(false); }
    }, [user, period, API_URL]);

    const refresh = useCallback(() => { fetchData(); getReport(); }, [fetchData, getReport]);

    useEffect(() => { if (user) { setIsInitialLoading(true); refresh(); setIsInitialLoading(false); } }, [user, refresh]);
    useEffect(() => { if (!isInitialLoading) getReport(); }, [period, isInitialLoading, getReport]);

    const handleUpgradeSubmit = async (paymentData) => {
        try {
            const targetUserId = paymentData.userId || user.uid;
            const userRef = doc(db, "users", targetUserId);
            
            await updateDoc(userRef, {
                subscription_status: 'pending_approval',
                payment_ref: paymentData.paymentRef,
                payment_method: paymentData.method || 'Manual',
                premium_plan: paymentData.plan,
                request_date: serverTimestamp(),
                is_premium: false 
            });

            setIsPending(true);
            setIsCompanyUser(false);

            toggleModal('applyCompany', false);
            alert(`Success! Ref No. ${paymentData.paymentRef} submitted. Please wait for Admin approval.`);
        } catch (error) {
            console.error("Payment Submission Error:", error);
            alert("Failed to submit request. Please try again.");
        }
    };

    const renderLoanModal = () => {
        if (loanFlowStep === 'family') return <RecordLoanFlowWidget onSuccess={() => { toggleModal('recordLoan', false); refresh(); }} onRequestCreateFamily={() => { toggleModal('recordLoan', false); toggleModal('family', true); }} />;
        if (loanFlowStep === 'personal') return <CreatePersonalLoanWidget onSuccess={() => { toggleModal('recordLoan', false); refresh(); }} />;
        return <RecordLoanChoiceWidget onSelectFamilyLoan={() => setLoanFlowStep('family')} onSelectPersonalLoan={() => setLoanFlowStep('personal')} />;
    };

    if (activeFamilyRealm) return <Suspense fallback={<div/>}><FamilyRealm family={activeFamilyRealm} onBack={() => setActiveFamilyRealm(null)} onDataChange={refresh} /></Suspense>;
    if (showCompanyRealm) return <Suspense fallback={<div/>}><CompanyRealm company={{ id: user.uid, name: "Company" }} onBack={() => setShowCompanyRealm(false)} onDataChange={refresh} /></Suspense>;

    return (
        <div className="w-full">
            {/* --- HEADER --- */}
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-1 h-12 bg-indigo-600 rounded-full opacity-80"></div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-none">
                            {userLastName}
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-1 tracking-wide">
                            Personal Realm
                        </p>
                    </div>
                </div>

                {/* --- RESPONSIVE BUTTON GRID --- */}
                <div className="w-full md:w-auto">
                    <div className="grid grid-cols-2 gap-3 md:flex md:items-center">
                        
                        <div className="col-span-2 md:col-span-1 md:w-auto">
                            <Btn onClick={() => toggleModal('createTx', true)} type="pri" icon={Icons.Plus} className="w-full">
                                Transaction
                            </Btn>
                        </div>

                        <Btn onClick={() => toggleModal('createGoal', true)} icon={Icons.Plus}>Goal</Btn>
                        <Btn onClick={() => { setLoanFlowStep('choice'); toggleModal('recordLoan', true); }} icon={Icons.Plus}>Loan</Btn>
                        
                        <div className="hidden md:block w-px h-10 bg-slate-200 mx-1"></div>
                        
                        <Btn onClick={() => toggleModal('family', true)} icon={Icons.Users}>Families</Btn>
                        
                        {isCompanyUser ? (
                            <Btn onClick={() => setShowCompanyRealm(true)} type="comp" icon={Icons.Build}>
                                Company
                            </Btn>
                        ) : isPending ? (
                            <Btn onClick={() => alert("Your payment is being verified by Admin.")} type="pending" icon={Icons.Lock} disabled={true}>
                                Pending Review
                            </Btn>
                        ) : (
                            <Btn onClick={() => toggleModal('applyCompany', true)} type="sec" icon={Icons.Lock}>
                                Unlock Company
                            </Btn>
                        )}
                        
                        {isAdmin && (
                            <div className="col-span-2 md:col-span-1 md:w-auto">
                                <Btn onClick={() => navigate('/admin')} icon={Icons.Lock} className="w-full">
                                    Admin
                                </Btn>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <DashboardCard title="Personal Funds" value={summaryError ? 'Error' : `₱${parseFloat(summaryData?.netPosition || 0).toLocaleString()}`} subtext="Available Balance" linkText="View Transactions" onClick={() => toggleModal('transactions', true)} icon={Icons.Wallet} colorClass="text-emerald-600" />
                <DashboardCard title="Active Goals" value={activeGoalsCount} subtext="Targets in Progress" linkText="View Goals" onClick={() => toggleModal('goals', true)} icon={Icons.Flag} colorClass="text-rose-600" />
                <DashboardCard title="Outstanding Loans" value={`₱${lendingSummary.outstanding.toLocaleString()}`} subtext="Total Receivables" linkText="Manage Lending" onClick={() => toggleModal('lending', true)} icon={Icons.Gift} colorClass="text-amber-600" />
            </div>

            <div className="dashboard-section">
                <div className="flex justify-center gap-2 mb-6 bg-slate-100 p-1 rounded-xl w-fit mx-auto">
                    {['weekly', 'monthly', 'yearly'].map(p => (
                        <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1 text-sm rounded-lg capitalize transition ${period === p ? 'bg-white shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-800'}`}>{p}</button>
                    ))}
                </div>
                {reportLoading ? <div className="h-96 flex items-center justify-center text-slate-400">Loading Report...</div> : 
                 reportError ? <p className="text-red-500 text-center py-10">{reportError}</p> : 
                 <Suspense fallback={<div className="h-96"/>}><PersonalReportChartWidget report={report} /></Suspense>}
            </div>

            <Suspense fallback={null}>
                {modals.transactions && <Modal isOpen={modals.transactions} onClose={() => toggleModal('transactions', false)} title="Shared Personal Transactions"><PersonalTransactionsWidget /></Modal>}
                {modals.goals && <Modal isOpen={modals.goals} onClose={() => toggleModal('goals', false)} title="Shared Personal Goals"><GoalListsWidget onDataChange={refresh} /></Modal>}
                {modals.family && <Modal isOpen={modals.family} onClose={() => toggleModal('family', false)} title="Manage Family Access"><MyFamiliesListWidget onEnterRealm={setActiveFamilyRealm} /></Modal>}
                {modals.lending && <Modal isOpen={modals.lending} onClose={() => toggleModal('lending', false)} title="Shared Loan Tracker"><LoanTrackingWidget onDataChange={refresh} /></Modal>}
                {modals.createTx && <Modal isOpen={modals.createTx} onClose={() => toggleModal('createTx', false)} title="Record New Transaction"><CreateTransactionWidget onSuccess={() => { toggleModal('createTx', false); refresh(); }} /></Modal>}
                {modals.createGoal && <Modal isOpen={modals.createGoal} onClose={() => toggleModal('createGoal', false)} title="Record New Goal"><CreateGoalWidget onSuccess={() => { toggleModal('createGoal', false); fetchData(); }} /></Modal>}
                {modals.recordLoan && <Modal isOpen={modals.recordLoan} onClose={() => { toggleModal('recordLoan', false); setLoanFlowStep('choice'); }} title="Record New Loan">{renderLoanModal()}</Modal>}
                
                {modals.applyCompany && (
                    <Modal isOpen={modals.applyCompany} onClose={() => toggleModal('applyCompany', false)} title="Unlock Company">
                        <ApplyCompanyWidget 
                            onClose={() => toggleModal('applyCompany', false)} 
                            onUpgradeSuccess={handleUpgradeSubmit} 
                        />
                    </Modal>
                )}
            </Suspense>
        </div>
    );
}