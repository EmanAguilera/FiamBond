import { useState, lazy, Suspense, useContext, useCallback, useEffect, useRef } from 'react';
import { AppContext } from '../../Context/AppContext.jsx';
import { db } from '../../config/firebase-config.js';
import { collection, query, where, getDocs, getCountFromServer, Timestamp, orderBy, documentId } from 'firebase/firestore';

const Modal = lazy(() => import('../Modal.jsx'));
const FamilyReportChartWidget = lazy(() => import('./FamilyReportChartWidget.jsx'));
const LoanTrackingWidget = lazy(() => import('../Personal/LoanTrackingWidget.jsx'));
const GoalListsWidget = lazy(() => import("../Personal/GoalListsWidget.jsx"));
const CreateLoanWidget = lazy(() => import('../Personal/CreateLoanWidget.js'));
const CreateFamilyTransactionWidget = lazy(() => import('./CreateFamilyTransactionWidget.js'));
const CreateFamilyGoalWidget = lazy(() => import('./CreateFamilyGoalWidget.js'));
const FamilyTransactionsWidget = lazy(() => import('./FamilyTransactionsWidget.jsx'));
const FamilyMembersView = lazy(() => import('./FamilyMembersView.jsx'));

const FamilyRealmSkeleton = () => (
    <div className="p-4 md:p-10 animate-pulse">
        <div className="h-8 w-60 bg-slate-200 rounded-md mb-6"></div>
        <div className="flex flex-wrap gap-4 mb-8">
            <div className="h-10 w-48 bg-slate-200 rounded"></div>
            <div className="h-10 w-40 bg-slate-200 rounded"></div>
            <div className="h-10 w-40 bg-slate-200 rounded"></div>
            <div className="h-10 w-44 bg-slate-200 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="h-32 bg-slate-200 rounded-lg"></div>
            <div className="h-32 bg-slate-200 rounded-lg"></div>
            <div className="h-32 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="w-full h-96 bg-slate-200 rounded-lg"></div>
    </div>
);

const formatDataForChart = (transactions) => {
    if (!transactions || transactions.length === 0) {
        return { labels: [], datasets: [] };
    }
    const data = {};
    transactions.forEach(tx => {
        if (tx.created_at && typeof tx.created_at.toDate === 'function') {
            const date = tx.created_at.toDate().toLocaleDateString();
            if (!data[date]) {
                data[date] = { income: 0, expense: 0 };
            }
            if (tx.type === 'income') {
                data[date].income += tx.amount;
            } else {
                data[date].expense += tx.amount;
            }
        }
    });
    const labels = Object.keys(data).sort((a, b) => new Date(a) - new Date(b));
    return {
        labels,
        datasets: [
            { label: 'Inflow (₱)', data: labels.map(label => data[label].income), backgroundColor: 'rgba(75, 192, 192, 0.5)' },
            { label: 'Outflow (₱)', data: labels.map(label => data[label].expense), backgroundColor: 'rgba(255, 99, 132, 0.5)' }
        ]
    };
};

const WalletIcon = () => (<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>);
const FlagIcon = () => (<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2z"></path></svg>);
const UsersIcon = () => (<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.253-1.282-.721-1.742M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.253-1.282.721-1.742m0 0A4.996 4.996 0 0112 13a4.996 4.996 0 014.279 2.258m-8.558 0A4.997 4.997 0 0012 13a4.997 4.997 0 004.279-2.258M12 13a5 5 0 100-10 5 5 0 000 10z"></path></svg>);

// --- STYLED DASHBOARD CARD COMPONENT ---

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

export default function FamilyRealm({ family, onBack, onDataChange, onFamilyUpdate }) {
    const { user } = useContext(AppContext);

    const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [isGoalsListModalOpen, setIsGoalsListModalOpen] = useState(false);
    const [isFamilyTransactionsModalOpen, setIsFamilyTransactionsModalOpen] = useState(false);
    const [isLoanListModalOpen, setIsLoanListModalOpen] = useState(false);
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

    const [loading, setLoading] = useState(true);
    const [summaryData, setSummaryData] = useState(null);
    const [activeGoalsCount, setActiveGoalsCount] = useState(0);
    const [activeLoansCount, setActiveLoansCount] = useState(0);
    const [report, setReport] = useState(null);
    const [reportLoading, setReportLoading] = useState(true);
    const [reportError, setReportError] = useState(null);
    const [period, setPeriod] = useState('monthly');
    const isInitialMount = useRef(true);

    const [familyMembers, setFamilyMembers] = useState([]);

    const getFamilyBalance = useCallback(async () => {
        if (!user || !family) return;
        try {
            const q = query(collection(db, "transactions"), where("family_id", "==", family.id));
            const querySnapshot = await getDocs(q);
            let netPosition = 0;
            querySnapshot.forEach(doc => {
                const tx = doc.data();
                if (tx.type === 'income') netPosition += tx.amount;
                else netPosition -= tx.amount;
            });
            setSummaryData({ netPosition });
        } catch (error) { console.error("Failed to fetch family balance", error); }
    }, [user, family]);

    const getFamilyActiveGoalsCount = useCallback(async () => {
        if (!user || !family) return;
        try {
            const q = query(collection(db, "goals"), where("family_id", "==", family.id), where("status", "==", "active"));
            const snapshot = await getCountFromServer(q);
            setActiveGoalsCount(snapshot.data().count);
        } catch (error) { console.error("Failed to fetch family goal count", error); }
    }, [user, family]);

    const getFamilyActiveLoansCount = useCallback(async () => {
        if (!user || !family) return;
        try {
            const q = query(collection(db, "loans"), where("family_id", "==", family.id), where("status", "==", "outstanding"));
            const snapshot = await getCountFromServer(q);
            setActiveLoansCount(snapshot.data().count);
        } catch (error) { console.error("Failed to fetch family loan count", error); }
    }, [user, family]);

    const getFamilyReport = useCallback(async () => {
        if (!user || !family) return;
        setReportLoading(true);
        setReportError(null);
        try {
            const now = new Date();
            let startDate;
            if (period === 'weekly') startDate = new Date(now.setDate(now.getDate() - 7));
            else if (period === 'yearly') startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            else startDate = new Date(now.setMonth(now.getMonth() - 1));

            const q = query(
                collection(db, "transactions"),
                where("family_id", "==", family.id),
                where("created_at", ">=", Timestamp.fromDate(startDate)),
                orderBy("created_at", "desc")
            );
            const querySnapshot = await getDocs(q);
            const transactions = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

            let totalInflow = 0;
            let totalOutflow = 0;
            transactions.forEach(tx => {
                if (tx.type === 'income') totalInflow += tx.amount;
                else totalOutflow += tx.amount;
            });
            
            setReport({
                chartData: formatDataForChart(transactions),
                totalInflow,
                totalOutflow,
                netPosition: totalInflow - totalOutflow,
                reportTitle: `Report from ${startDate.toLocaleDateString()}`,
                transactionCount: transactions.length
            });
        } catch (err) {
            console.error('Failed to fetch family report:', err);
            setReportError(err.message);
        } finally {
            setReportLoading(false);
        }
    }, [user, family, period]);
    
    useEffect(() => {
        const fetchAllData = async () => {
            if (!family || !user) return;
            setLoading(true);
            try {
                // Fetch member details first
                if (family.member_ids && family.member_ids.length > 0) {
                    const usersRef = collection(db, "users");
                    const q = query(usersRef, where(documentId(), "in", family.member_ids));
                    const querySnapshot = await getDocs(q);
                    const members = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setFamilyMembers(members);
                } else {
                    setFamilyMembers([]);
                }

                // Then fetch the rest of the dashboard data
                await Promise.all([
                    getFamilyBalance(),
                    getFamilyActiveGoalsCount(),
                    getFamilyActiveLoansCount(),
                    getFamilyReport()
                ]);

            } catch (error) {
                console.error("Error fetching initial Family Realm data:", error);
                setReportError("Failed to load family details.");
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [family, user, getFamilyBalance, getFamilyActiveGoalsCount, getFamilyActiveLoansCount, getFamilyReport]);


    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
        } else if (user && family) {
            getFamilyReport();
        }
    }, [period, user, family, getFamilyReport]);

    const handleSuccess = () => {
        setIsTransactionModalOpen(false);
        setIsGoalModalOpen(false);
        setIsLoanModalOpen(false);
        // Re-fetch everything
        getFamilyBalance();
        getFamilyActiveGoalsCount();
        getFamilyActiveLoansCount();
        getFamilyReport();
        if (onDataChange) {
            onDataChange();
        }
    };

    const handleMembersUpdate = (updatedFamily) => {
        if (onFamilyUpdate) {
            onFamilyUpdate(updatedFamily);
        }
    };
    
    if (loading) return <FamilyRealmSkeleton />;

    return (
        <>
            <div className="p-4 md:p-10">
                <header className="dashboard-header mb-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button onClick={onBack} className="secondary-btn-sm">&larr; Back</button>
                            <h1 className="text-2xl font-bold text-slate-800">{family.family_name}: Family Realm</h1>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <button onClick={() => setIsTransactionModalOpen(true)} className="primary-btn">+ Add Family Transaction</button>
                            <button onClick={() => setIsGoalModalOpen(true)} className="secondary-btn">+ Add Family Goal</button>
                            <button onClick={() => setIsLoanModalOpen(true)} className="secondary-btn">+ Record a Loan</button>
                            <button onClick={() => setIsMembersModalOpen(true)} className="secondary-btn">Manage Members</button>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <DashboardCard 
                        title="Family Money (Net)"
                        value={summaryData ? `₱${parseFloat(summaryData.netPosition).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '₱0.00'}
                        linkText="View Transactions"
                        onClick={() => setIsFamilyTransactionsModalOpen(true)}
                        icon={<WalletIcon />}
                        colorClass="text-emerald-600"
                    />
                     <DashboardCard 
                        title="Active Family Goals"
                        value={activeGoalsCount}
                        linkText="View Goals"
                        onClick={() => setIsGoalsListModalOpen(true)}
                        icon={<FlagIcon />}
                        colorClass="text-rose-600"
                    />
                    <DashboardCard 
                        title="Active Family Loans"
                        value={activeLoansCount}
                        linkText="Manage Lending"
                        onClick={() => setIsLoanListModalOpen(true)}
                        icon={<UsersIcon />}
                        colorClass="text-amber-600"
                    />
                </div>

                <div className="dashboard-section">
                    <div className="w-full mx-auto flex justify-center gap-4 mb-6">
                        <button onClick={() => setPeriod('weekly')} className={period === 'weekly' ? 'active-period-btn' : 'period-btn'}>Weekly</button>
                        <button onClick={() => setPeriod('monthly')} className={period === 'monthly' ? 'active-period-btn' : 'period-btn'}>Monthly</button>
                        <button onClick={() => setPeriod('yearly')} className={period === 'yearly' ? 'active-period-btn' : 'period-btn'}>Yearly</button>
                    </div>
                    
                    {reportLoading ? (
                        <div className="w-full h-96 bg-slate-100 rounded-lg flex justify-center items-center">
                           <p className="text-slate-500">Generating Family Report...</p>
                        </div>
                    ) : reportError ? (
                        <p className="error text-center py-10">{reportError}</p>
                    ) : (
                        <Suspense fallback={<div className="h-96 bg-slate-100 rounded-lg"></div>}>
                            <FamilyReportChartWidget family={family} report={report} />
                        </Suspense>
                    )}
                </div>
            </div>

            <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">Loading...</div>}>
                {isTransactionModalOpen && <Modal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} title={`Add Transaction for ${family.family_name}`}><CreateFamilyTransactionWidget family={family} onSuccess={handleSuccess} /></Modal>}
                {isGoalModalOpen && <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title={`Add Goal for ${family.family_name}`}><CreateFamilyGoalWidget family={family} onSuccess={handleSuccess} /></Modal>}
                {isLoanModalOpen && (
                    <Modal isOpen={isLoanModalOpen} onClose={() => setIsLoanModalOpen(false)} title="Lend Money to a Family Member">
                        <CreateLoanWidget 
                            family={family} 
                            members={familyMembers} 
                            onSuccess={handleSuccess} 
                        />
                    </Modal>
                )}
                {isFamilyTransactionsModalOpen && <Modal isOpen={isFamilyTransactionsModalOpen} onClose={() => setIsFamilyTransactionsModalOpen(false)} title={`Transactions for ${family.family_name}`}><FamilyTransactionsWidget family={family} /></Modal>}
                {isGoalsListModalOpen && <Modal isOpen={isGoalsListModalOpen} onClose={() => setIsGoalsListModalOpen(false)} title={`Goals for ${family.family_name}`}><GoalListsWidget family={family} /></Modal>}
                {isLoanListModalOpen && <Modal isOpen={isLoanListModalOpen} onClose={() => setIsLoanListModalOpen(false)} title={`Lending Activity for ${family.family_name}`}><LoanTrackingWidget family={family} onDataChange={onDataChange} /></Modal>}
                
                {isMembersModalOpen && (
                    <Modal isOpen={isMembersModalOpen} onClose={() => setIsMembersModalOpen(false)} title={`Manage Members for ${family.family_name}`}>
                        <FamilyMembersView
                            family={family}
                            onFamilyUpdate={handleMembersUpdate}
                        />
                    </Modal>
                )}
            </Suspense>
        </>
    );
}