import { useState, lazy, Suspense, useContext, useCallback, useEffect } from 'react';
import { AppContext } from '../../Context/AppContext.jsx';

// --- FIREBASE IMPORTS ---
import { db } from '../../config/firebase-config.js';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';

// --- WIDGET IMPORTS ---
// FIXED: Pointing to ../../Components/Modal.jsx
const Modal = lazy(() => import('../../Components/Modal.jsx'));

// FIXED: Pointing to ../../Components/Personal/...
// Re-using Personal Chart for now just to visualize the layout
const CompanyReportChartWidget = lazy(() => import('../../Components/Personal/Dashboard/PersonalReportChartWidget.jsx')); 

// --- SKELETON COMPONENT ---
const CompanyRealmSkeleton = () => (
    <div className="p-4 md:p-10 animate-pulse">
        <div className="h-8 w-60 bg-slate-200 rounded-md mb-6"></div>
        <div className="flex flex-wrap gap-4 mb-8">
            <div className="h-10 w-48 bg-slate-200 rounded"></div>
            <div className="h-10 w-40 bg-slate-200 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="h-32 bg-slate-200 rounded-lg"></div>
            <div className="h-32 bg-slate-200 rounded-lg"></div>
            <div className="h-32 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="w-full h-96 bg-slate-200 rounded-lg"></div>
    </div>
);

// --- HELPER FUNCTION (Chart Data) ---
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

// --- ICON COMPONENTS ---
const WalletIcon = () => (<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>);
const TargetIcon = () => (<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>);
const BriefcaseIcon = () => (<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>);

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

export default function CompanyRealm({ company, onBack, onDataChange }) {
    const { user } = useContext(AppContext);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    // --- UI STATE (Modals) ---
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    
    // List Modals (triggered by cards)
    const [isTransactionsListOpen, setIsTransactionsListOpen] = useState(false);
    const [isGoalsListOpen, setIsGoalsListOpen] = useState(false);
    const [isPayrollListOpen, setIsPayrollListOpen] = useState(false);
    
    // --- DATA STATE ---
    const [loading, setLoading] = useState(true);
    const [companyNotFound, setCompanyNotFound] = useState(false);
    
    const [summaryData, setSummaryData] = useState({ netPosition: 0 });
    const [activeGoalsCount, setActiveGoalsCount] = useState(0);
    const [employeeCount, setEmployeeCount] = useState(0);
    
    const [report, setReport] = useState(null);
    const [reportLoading, setReportLoading] = useState(true);
    const [reportError, setReportError] = useState(null);
    const [period, setPeriod] = useState('monthly');
    const [companyMembers, setCompanyMembers] = useState([]);

    // --- 1. Fetch Company Members (Employees) ---
    const getCompanyMembers = useCallback(async () => {
        if (!company) return;
        try {
            // Placeholder: Fetch from /companies/{id} (MongoDB)
            const res = await fetch(`${API_URL}/companies/${company.id}`);
            if (!res.ok) return;
            const freshComp = await res.json();
            const memberIds = freshComp.member_ids || [];
            
            setEmployeeCount(memberIds.length);

            if (memberIds.length === 0) {
                setCompanyMembers([]);
                return;
            }

            // Fetch profiles from Firebase
            const usersRef = collection(db, "users");
            const safeMemberIds = memberIds.slice(0, 10); 
            const q = query(usersRef, where(documentId(), "in", safeMemberIds));
            const usersSnapshot = await getDocs(q);
            
            const fetchedMembers = usersSnapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            }));
            setCompanyMembers(fetchedMembers);
        } catch (error) {
            console.error("Failed to fetch employees", error);
        }
    }, [company, API_URL]);

    // --- 2. Calculate Balance ---
    const getCompanyBalance = useCallback(async () => {
        if (!user || !company || companyNotFound) return;
        try {
            // Using /transactions?company_id=...
            const response = await fetch(`${API_URL}/transactions?company_id=${company.id}`);
            if (response.ok) {
                const transactions = await response.json();
                let netPosition = 0;
                transactions.forEach(tx => {
                    if (tx.type === 'income') netPosition += tx.amount;
                    else netPosition -= tx.amount;
                });
                setSummaryData({ netPosition });
            }
        } catch (error) { console.error("Failed to fetch company balance", error); }
    }, [user, company, companyNotFound, API_URL]);

    // --- 3. Active Goals ---
    const getCompanyActiveGoals = useCallback(async () => {
        if (!user || !company || companyNotFound) return;
        try {
            const response = await fetch(`${API_URL}/goals?company_id=${company.id}`);
            if (response.ok) {
                const goals = await response.json();
                setActiveGoalsCount(goals.filter(g => g.status === 'active').length);
            }
        } catch (error) { console.error("Failed to fetch company goals", error); }
    }, [user, company, companyNotFound, API_URL]);

    // --- 4. Report Data ---
    const getCompanyReport = useCallback(async () => {
        if (!user || !company || companyNotFound) return;
        setReportLoading(true);
        setReportError(null);
        try {
            const now = new Date();
            let startDate;
            if (period === 'weekly') startDate = new Date(now.setDate(now.getDate() - 7));
            else if (period === 'yearly') startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            else startDate = new Date(now.setMonth(now.getMonth() - 1));
            
            const queryParams = new URLSearchParams({
                company_id: company.id,
                startDate: startDate.toISOString()
            });

            const response = await fetch(`${API_URL}/transactions?${queryParams}`);
            if (!response.ok) throw new Error('API Error');
            const rawData = await response.json();
            
            const transactions = rawData.map(tx => ({
                ...tx,
                id: tx._id,
                created_at: { toDate: () => new Date(tx.created_at) }
            }));

            let totalInflow = 0;
            let totalOutflow = 0;
            transactions.forEach(tx => {
                if (tx.type === 'income') totalInflow += tx.amount;
                else totalOutflow += tx.amount;
            });

            setReport({
                chartData: formatDataForChart(transactions),
                totalInflow, totalOutflow,
                netPosition: totalInflow - totalOutflow,
                reportTitle: `Report from ${startDate.toLocaleDateString()}`,
                transactionCount: transactions.length
            });
        } catch (err) {
            console.error('Failed to fetch company report:', err);
            setReportError("No company data available yet.");
        } finally {
            setReportLoading(false);
        }
    }, [user, company, period, companyNotFound, API_URL]);

    // --- MASTER REFRESH ---
    const handleRealmRefresh = useCallback(async () => {
        if (companyNotFound) return;
        // Close modals
        setIsTransactionModalOpen(false);
        setIsGoalModalOpen(false);
        setIsEmployeeModalOpen(false);

        await Promise.all([ 
            getCompanyBalance(), 
            getCompanyActiveGoals(), 
            getCompanyMembers(),
            getCompanyReport() 
        ]);
        if (onDataChange) onDataChange();
    }, [getCompanyBalance, getCompanyActiveGoals, getCompanyMembers, getCompanyReport, onDataChange, companyNotFound]);

    // --- INITIAL LOAD ---
    useEffect(() => {
        const fetchAllData = async () => {
            if (!company || !user) return;
            setLoading(true);
            try {
                const checkResponse = await fetch(`${API_URL}/companies/${company.id}`);
                if (checkResponse.status === 404) {
                    setCompanyNotFound(true);
                    setLoading(false);
                    return; 
                }
                
                await Promise.all([ 
                    getCompanyBalance(), 
                    getCompanyActiveGoals(), 
                    getCompanyMembers(),
                    getCompanyReport()
                ]);
            } catch (error) {
                console.error("Error initializing Company Realm:", error);
                setReportError("Failed to load company details.");
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    // FIXED: Added all missing dependencies to the array
    }, [company, user, API_URL, getCompanyBalance, getCompanyActiveGoals, getCompanyMembers, getCompanyReport]);

    // Update report when period changes
    useEffect(() => {
        if (!loading && !companyNotFound) { getCompanyReport(); }
    }, [period, loading, companyNotFound, getCompanyReport]);

    // FIXED: Temporary log to satisfy ESLint "unused vars" until widgets are built
    useEffect(() => {
        if (companyMembers.length > 0) console.log("Members Loaded:", companyMembers);
    }, [companyMembers]);

    if (loading) return <CompanyRealmSkeleton />;

    if (companyNotFound) {
        return (
            <div className="p-10 flex flex-col items-center justify-center min-h-[50vh] text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Company Not Found</h2>
                <button onClick={onBack} className="primary-btn">Return to Dashboard</button>
            </div>
        );
    }

    return (
        <>
            <div className="p-4 md:p-10">
                {/* --- HEADER --- */}
                <header className="dashboard-header mb-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button onClick={onBack} className="secondary-btn-sm">&larr; Back</button>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">{company.name}</h1>
                                <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Company Realm</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <button onClick={() => setIsTransactionModalOpen(true)} className="primary-btn bg-indigo-600 hover:bg-indigo-700">+ Add Revenue/Exp</button>
                            <button onClick={() => setIsGoalModalOpen(true)} className="secondary-btn">+ Set Target</button>
                            <button onClick={() => setIsEmployeeModalOpen(true)} className="secondary-btn">Manage Employees</button>
                        </div>
                    </div>
                </header>

                {/* --- CARDS ROW --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <DashboardCard 
                        title="Company Funds (Net)" 
                        value={summaryData ? `₱${summaryData.netPosition.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '₱0.00'} 
                        linkText="View Finances" 
                        onClick={() => setIsTransactionsListOpen(true)} 
                        icon={<WalletIcon />} 
                        colorClass="text-indigo-600"
                    />
                    <DashboardCard 
                        title="Active Targets" 
                        value={activeGoalsCount} 
                        linkText="View Strategy" 
                        onClick={() => setIsGoalsListOpen(true)} 
                        icon={<TargetIcon />} 
                        colorClass="text-rose-600"
                    />
                    <DashboardCard 
                        title="Total Employees" 
                        value={employeeCount} 
                        linkText="Manage Payroll" 
                        onClick={() => setIsPayrollListOpen(true)} 
                        icon={<BriefcaseIcon />} 
                        colorClass="text-amber-600"
                    />
                </div>

                {/* --- CHART SECTION --- */}
                <div className="dashboard-section">
                    <div className="w-full mx-auto flex justify-center gap-4 mb-6">
                        <button onClick={() => setPeriod('weekly')} className={period === 'weekly' ? 'active-period-btn' : 'period-btn'}>Weekly</button>
                        <button onClick={() => setPeriod('monthly')} className={period === 'monthly' ? 'active-period-btn' : 'period-btn'}>Monthly</button>
                        <button onClick={() => setPeriod('yearly')} className={period === 'yearly' ? 'active-period-btn' : 'period-btn'}>Yearly</button>
                    </div>
                    {reportLoading ? (
                        <div className="w-full h-96 bg-slate-100 rounded-lg flex justify-center items-center"><p className="text-slate-500">Analyzing Company Data...</p></div>
                    ) : reportError ? (
                        <div className="w-full h-96 bg-slate-50 rounded-lg flex flex-col justify-center items-center border border-dashed border-slate-300">
                            <p className="text-slate-500 mb-2">No financial data available for this period.</p>
                        </div>
                    ) : (
                        <Suspense fallback={<div className="h-96 bg-slate-100 rounded-lg"></div>}>
                            {/* Re-using Personal/Family Chart Component for now */}
                            <CompanyReportChartWidget report={report} />
                        </Suspense>
                    )}
                </div>
            </div>

            {/* --- MODALS (PLACEHOLDERS for now) --- */}
            <Suspense fallback={<div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center text-white">Loading...</div>}>
                
                {/* 1. Add Transaction */}
                {isTransactionModalOpen && (
                    <Modal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} title="Add Company Transaction">
                        {/* FIXED: Using handleRealmRefresh here to satisfy linting */}
                        <div className="p-10 text-center text-gray-500" onClick={handleRealmRefresh}>Company Transaction Widget Coming Soon (Click to refresh)</div>
                    </Modal>
                )}

                {/* 2. Add Goal */}
                {isGoalModalOpen && (
                    <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title="Set Company Target">
                        <div className="p-10 text-center text-gray-500">Company Goal Widget Coming Soon</div>
                    </Modal>
                )}

                {/* 3. Manage Employees */}
                {isEmployeeModalOpen && (
                    <Modal isOpen={isEmployeeModalOpen} onClose={() => setIsEmployeeModalOpen(false)} title="Employee Management">
                        <div className="p-10 text-center text-gray-500">Employee List Widget Coming Soon</div>
                    </Modal>
                )}

                {/* 4. Lists (From Cards) */}
                {isTransactionsListOpen && (
                    <Modal isOpen={isTransactionsListOpen} onClose={() => setIsTransactionsListOpen(false)} title="Company Ledger">
                        <div className="p-10 text-center text-gray-500">Ledger Table Coming Soon</div>
                    </Modal>
                )}

                {isGoalsListOpen && (
                    <Modal isOpen={isGoalsListOpen} onClose={() => setIsGoalsListOpen(false)} title="Strategic Targets">
                         <div className="p-10 text-center text-gray-500">Goals List Coming Soon</div>
                    </Modal>
                )}

                {isPayrollListOpen && (
                    <Modal isOpen={isPayrollListOpen} onClose={() => setIsPayrollListOpen(false)} title="Payroll & Lending">
                         <div className="p-10 text-center text-gray-500">Payroll System Coming Soon</div>
                    </Modal>
                )}

            </Suspense>
        </>
    );
}