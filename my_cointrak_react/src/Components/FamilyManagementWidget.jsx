import { useState, useCallback, useContext, useEffect } from 'react';
import { AppContext } from '../Context/AppContext';
import FamilyListItem from './FamilyListItems.jsx'; // Make sure this path is correct

// --- CHART IMPORTS ---
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register chart components once
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- Internal Component for the Ledger View ---
const FamilyLedgerView = ({ family, onBack }) => {
    // This component is correct and does not need changes.
    const { token } = useContext(AppContext);
    const [report, setReport] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('monthly');

    const getReport = useCallback(async (page = 1) => {
        if (page === 1) setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/${family.id}/report?period=${period}&page=${page}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                throw new Error(errorData?.message || "Could not process the report request.");
            }
            const data = await res.json();
            setReport(data);
            setTransactions(data.transactions.data || []);
            const { data: _, ...paginationData } = data.transactions;
            setPagination(paginationData);
        } catch (err) {
            console.error('Failed to fetch family report:', err);
            setError(err.message);
            setReport(null);
        } finally {
            setLoading(false);
        }
    }, [token, family.id, period]);

    useEffect(() => {
        getReport();
    }, [getReport, period]);
    
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: `Family Inflow vs. Outflow for ${family.first_name}` },
        },
    };
    
    return (
        <div>
            <button onClick={onBack} className="secondary-btn-sm mb-6">&larr; Back to Families List</button>
            <div className="w-full mx-auto flex justify-center gap-4 mb-6">
                <button onClick={() => setPeriod('weekly')} className={period === 'weekly' ? 'active-period-btn' : 'period-btn'}>Weekly</button>
                <button onClick={() => setPeriod('monthly')} className={period === 'monthly' ? 'active-period-btn' : 'period-btn'}>Monthly</button>
                <button onClick={() => setPeriod('yearly')} className={period === 'yearly' ? 'active-period-btn' : 'period-btn'}>Yearly</button>
            </div>
            
            {loading ? <p className="text-center">Generating Ledger...</p> :
             error ? <p className="error text-center">{error}</p> :
             report ? (
                <>
                    <div className="mb-8 relative" style={{ height: '350px' }}><Bar options={chartOptions} data={report.chartData} /></div>
                    <div className="space-y-3 text-sm mb-8">
                        <p><span className="font-bold">Summary for:</span> {report.reportTitle}</p>
                        <hr className="border-dashed" />
                        <p className="flex justify-between"><span>Total Inflow:</span> <span className="text-green-600 font-semibold">+₱{parseFloat(report.totalInflow).toFixed(2)}</span></p>
                        <p className="flex justify-between"><span>Total Outflow:</span> <span className="text-red-500 font-semibold">-₱{parseFloat(report.totalOutflow).toFixed(2)}</span></p>
                        <p className={`flex justify-between font-bold text-base ${report.netPosition >= 0 ? 'text-green-700' : 'text-red-700'}`}><span>Net Position:</span> <span>₱{parseFloat(report.netPosition).toFixed(2)}</span></p>
                    </div>
                    <h3 className="font-bold text-lg mb-4">Transactions for this Period</h3>
                    <div className="dashboard-card p-0">
                        {transactions.length > 0 ? transactions.map((transaction) => (
                            <div key={transaction.id} className="transaction-item border-b last:border-b-0 border-gray-100">
                               {/* --- FIX START --- */}
                                <div className="min-w-0 pr-4"> {/* Allow shrinking and add padding */}
                                    <p className="transaction-description break-words">{transaction.description}</p> {/* Wrap long descriptions */}
                                    <small className="transaction-date">
                                    {new Date(transaction.created_at).toLocaleDateString()}
                                    {transaction.user && ` • By: ${transaction.user.full_name}`}
                                    </small>
                                </div>
                                <p className={`transaction-amount flex-shrink-0 ${transaction.type === 'income' ? 'text-green-600' : 'text-red-500'}`}> {/* Prevent amount from shrinking */}
                                {/* --- FIX END --- */}
                                    {transaction.type === 'income' ? '+' : '-'} ₱{parseFloat(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        )) : <p className="p-4 text-center italic">No transactions in this period.</p>}
                    </div>
                    {pagination && pagination.last_page > 1 && (
                        <div className="flex justify-between items-center mt-6">
                            <button onClick={() => getReport(pagination.current_page - 1)} disabled={pagination.current_page === 1} className="pagination-btn">&larr; Previous</button>
                            <span className="pagination-text">Page {pagination.current_page} of {pagination.last_page}</span>
                            <button onClick={() => getReport(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page} className="pagination-btn">Next &rarr;</button>
                        </div>
                    )}
                </>
            ) : <p className="text-center">No report data available.</p>}
        </div>
    );
};


// --- Internal Component for the Members View (with fixes) ---
const FamilyMembersView = ({ family, onBack, onFamilyUpdate }) => {
    const { token } = useContext(AppContext);
    
    const [detailedFamily, setDetailedFamily] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [newMemberEmail, setNewMemberEmail] = useState("");
    const [formErrors, setFormErrors] = useState({});
    const [formMessage, setFormMessage] = useState({ type: '', text: '' });
    const MAX_MEMBERS_PER_FAMILY = 10;

    const getFamilyDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/${family.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Could not load family details.");
            const data = await res.json();
            setDetailedFamily(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token, family.id]);

    useEffect(() => {
        getFamilyDetails();
    }, [getFamilyDetails]);

    async function handleAddMember(e) {
        e.preventDefault();
        setFormMessage({ type: '', text: '' });
        setFormErrors({}); // Reset errors on new submission
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families/${family.id}/members`, {
                method: "post",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ email: newMemberEmail }),
            });
            const data = await res.json();
            if (!res.ok) {
                // --- FIX 2: Handle validation errors (422) by calling setFormErrors ---
                if (res.status === 422) {
                    setFormErrors(data.errors);
                } else {
                    setFormMessage({ type: 'error', text: data.message || "Failed to add member." });
                }
                return;
            }
            setDetailedFamily(data); 
            onFamilyUpdate(data);
            setNewMemberEmail("");
            setFormMessage({ type: 'success', text: "Member added successfully!" });
        } catch (err) {
            // --- FIX 1: Log the caught error to resolve the 'no-unused-vars' warning ---
            console.error("Failed to add member:", err);
            setFormMessage({ type: 'error', text: 'A network error occurred.' });
        }
    }
    
    if (loading) return <p className="text-center py-4">Loading members...</p>;
    if (error) return <p className="error text-center py-4">{error}</p>;

    const members = detailedFamily?.members || [];

    return (
        <div className="space-y-8">
            <button onClick={onBack} className="secondary-btn-sm">&larr; Back to Families List</button>

            {members.length < MAX_MEMBERS_PER_FAMILY ? (
                <div>
                    {/* --- THIS IS THE FIX --- */}
                    <h2 className="font-bold text-xl mb-4 text-gray-800 break-words">
                        Add Member to "{detailedFamily.first_name}"
                    </h2>
                    {/* --- END OF THE FIX --- */}
                    <form onSubmit={handleAddMember} className="space-y-4">
                        <input type="email" placeholder="New Member's Email" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} className="w-full p-2 border rounded-md" />
                        {formErrors.email && <p className="error">{formErrors.email[0]}</p>}
                        {formMessage.text && <p className={`mt-2 text-sm ${formMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{formMessage.text}</p>}
                        <button type="submit" className="primary-btn">Add Member</button>
                    </form>
                </div>
            ) : (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 p-4 rounded-md"><p className="font-bold">Member Limit Reached</p></div>
            )}

            <div>
                <h2 className="font-bold text-xl mb-4 text-gray-800">Current Members ({members.length})</h2>
                <div className="space-y-3">
                    {members.length > 0 ? (
                        members.map((member) => (
                            <div key={member.id} className="p-4 bg-gray-50 border rounded-md">
                                <h3 className="font-semibold text-gray-700">{member.full_name}</h3>
                                <p className="text-sm text-gray-500">{member.email}</p>
                            </div>
                        ))
                    ) : (
                        <p className="italic text-gray-600">This family has no members yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- Main Family Management Component ---
export default function FamilyManagementWidget() {
    const { token } = useContext(AppContext);
    const [view, setView] = useState('list');
    const [selectedFamily, setSelectedFamily] = useState(null);
    const [families, setFamilies] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [listError, setListError] = useState(null);
    const [loadingList, setLoadingList] = useState(true);

    
    
    const getFamilies = useCallback(async (page = 1) => {
        setLoadingList(true);
        setListError(null);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families?page=${page}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Could not load your families.");
            const data = await res.json();
            setFamilies(data.data);
            const { data: _, ...paginationData } = data;
            setPagination(paginationData);
        } catch (error) {
            setListError(error.message);
        } finally {
            setLoadingList(false);
        }
    }, [token]);

    useEffect(() => { getFamilies(); }, [getFamilies]);

    function handleFamilyUpdated(updatedFamily) {
        setFamilies(currentFamilies => currentFamilies.map(f => (f.id === updatedFamily.id ? updatedFamily : f)));
        if (selectedFamily?.id === updatedFamily.id) {
            setSelectedFamily(updatedFamily);
        }
    }

    function handleFamilyDeleted() {
        const currentPage = pagination?.current_page || 1;
        const pageToFetch = (families.length === 1 && currentPage > 1) ? currentPage - 1 : currentPage;
        getFamilies(pageToFetch);
    }

    const handleViewMembers = (family) => { setSelectedFamily(family); setView('members'); };
    const handleViewLedger = (family) => { setSelectedFamily(family); setView('ledger'); };
    const handleBackToList = () => { setSelectedFamily(null); setView('list'); };
    
    if (view === 'members') return <FamilyMembersView family={selectedFamily} onBack={handleBackToList} onFamilyUpdate={handleFamilyUpdated} />;
    if (view === 'ledger') return <FamilyLedgerView family={selectedFamily} onBack={handleBackToList} />;
    
    return (
        <div>
            <h2 className="font-bold text-xl mb-4 text-gray-800">Your Families</h2>
            {loadingList ? <p className="text-center py-4">Loading families...</p> : 
             listError ? <p className="error text-center py-4">{listError}</p> :
             families.length > 0 ? (
                <div className="space-y-4">
                    {families.map((family) => (
                        <div key={family.id} className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                            <FamilyListItem
                                family={family}
                                onFamilyUpdated={handleFamilyUpdated}
                                onFamilyDeleted={handleFamilyDeleted}
                            />
                            <div className="flex flex-wrap gap-2 mt-3 border-t border-gray-200 pt-3">
                                <button onClick={() => handleViewMembers(family)} className="secondary-btn-sm">Manage Members</button>
                                <button onClick={() => handleViewLedger(family)} className="secondary-btn-sm">View Ledger</button>
                            </div>
                        </div>
                    ))}
                     {pagination && pagination.last_page > 1 && (
                        <div className="flex justify-between items-center mt-6">
                            <button onClick={() => getFamilies(pagination.current_page - 1)} disabled={pagination.current_page === 1} className="pagination-btn">&larr; Previous</button>
                            <span className="pagination-text">Page {pagination.current_page} of {pagination.last_page}</span>
                            <button onClick={() => getFamilies(pagination.current_page + 1)} disabled={pagination.current_page === pagination.last_page} className="pagination-btn">Next &rarr;</button>
                        </div>
                    )}
                </div>
            ) : <p className="text-gray-600 italic text-center py-4">You are not a member of any families yet.</p>}
        </div>
    );
}