import { useState, useCallback, useContext, useEffect, lazy, Suspense } from 'react';
import { AppContext } from '../Context/AppContext';
import FamilyListItem from './FamilyListItems.jsx';

// --- LAZY LOADING SUB-VIEWS ---
const FamilyMembersView = lazy(() => import('./FamilyMembersView.jsx'));
const FamilyLedgerView = lazy(() => import('./FamilyLedgerView.jsx'));

// --- SKELETON LOADER COMPONENT ---
const FamilyListSkeleton = () => (
    <div className="animate-pulse">
        <h2 className="h-7 w-1/3 bg-slate-200 rounded mb-4"></h2>
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 bg-slate-100 border border-slate-200 rounded-md">
                    <div className="h-5 w-1/2 bg-slate-200 rounded"></div>
                    <div className="h-4 w-1/4 bg-slate-200 rounded mt-2"></div>
                    <div className="flex gap-2 mt-3 border-t border-slate-200 pt-3">
                        <div className="h-8 w-32 bg-slate-200 rounded"></div>
                        <div className="h-8 w-28 bg-slate-200 rounded"></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// --- MAIN WIDGET ---
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
    
    if (loadingList) {
        return <FamilyListSkeleton />;
    }

    if (listError) {
        return <p className="error text-center py-4">{listError}</p>;
    }

    return (
        <div>
            {view === 'list' && (
                <div>
                    <h2 className="font-bold text-xl mb-4 text-gray-800">Your Families</h2>
                    {families.length > 0 ? (
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
                    ) : (
                        <p className="text-gray-600 italic text-center py-4">You are not a member of any families yet.</p>
                    )}
                </div>
            )}

            <Suspense fallback={<p className="text-center py-10">Loading View...</p>}>
                {view === 'members' && <FamilyMembersView family={selectedFamily} onBack={handleBackToList} onFamilyUpdate={handleFamilyUpdated} />}
                {view === 'ledger' && <FamilyLedgerView family={selectedFamily} onBack={handleBackToList} />}
            </Suspense>
        </div>
    );
}