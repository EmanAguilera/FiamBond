import { useState, useCallback, useContext, useEffect, lazy, Suspense } from 'react';
import { AppContext } from '../Context/AppContext';
import FamilyListItem from './FamilyListItems.jsx';

// --- LAZY LOADING ---
// These components will now be loaded on-demand, not during the initial page load.
// This significantly improves the initial loading speed.
const FamilyLedgerView = lazy(() => import('./FamilyLedgerView.jsx'));
const FamilyMembersView = lazy(() => import('./FamilyMembersView.jsx'));

// --- Main Family Management Component ---
export default function FamilyManagementWidget() {
    const { token } = useContext(AppContext);
    
    // State for managing the current view and selected family
    const [view, setView] = useState('list');
    const [selectedFamily, setSelectedFamily] = useState(null);
    
    // State for the list of families
    const [families, setFamilies] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [listError, setListError] = useState(null);
    const [loadingList, setLoadingList] = useState(true);
    
    /**
     * Fetches families from the API. Wrapped in useCallback so it can be used
     * as a dependency in other hooks without causing re-renders.
     */
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
    }, [token]); // This function only needs to be recreated if the token changes.

    // Initial data load
    useEffect(() => {
        getFamilies();
    }, [getFamilies]);

    /**
     * Handles updating a family in the local state.
     * Wrapped in useCallback to ensure it's a stable prop for the memoized FamilyListItem.
     */
    const handleFamilyUpdated = useCallback((updatedFamily) => {
        setFamilies(currentFamilies => 
            currentFamilies.map(f => (f.id === updatedFamily.id ? updatedFamily : f))
        );
        // Also update the selected family if it's the one being edited
        if (selectedFamily?.id === updatedFamily.id) {
            setSelectedFamily(updatedFamily);
        }
    }, [selectedFamily]); // Re-create only if the selectedFamily changes.

    /**
     * Handles deleting a family and refreshing the list.
     * Wrapped in useCallback for performance.
     */
    const handleFamilyDeleted = useCallback(() => {
        const currentPage = pagination?.current_page || 1;
        // If the last item on a page is deleted, go to the previous page.
        const pageToFetch = (families.length === 1 && currentPage > 1) ? currentPage - 1 : currentPage;
        getFamilies(pageToFetch);
    }, [pagination, families.length, getFamilies]); // Depends on these values to work correctly.

    // --- Navigation Handlers ---
    const handleViewMembers = (family) => { setSelectedFamily(family); setView('members'); };
    const handleViewLedger = (family) => { setSelectedFamily(family); setView('ledger'); };
    const handleBackToList = () => { setSelectedFamily(null); setView('list'); };
    
    // --- CONDITIONAL RENDERING WITH SUSPENSE ---
    
    // Show a loading indicator while the heavy 'members' component is fetched
    if (view === 'members') {
        return (
            <Suspense fallback={<p className="text-center py-10">Loading Members View...</p>}>
                <FamilyMembersView family={selectedFamily} onBack={handleBackToList} onFamilyUpdate={handleFamilyUpdated} />
            </Suspense>
        );
    }
    
    // Show a loading indicator while the heavy 'ledger' component (with charts) is fetched
    if (view === 'ledger') {
        return (
            <Suspense fallback={<p className="text-center py-10">Loading Ledger View...</p>}>
                <FamilyLedgerView family={selectedFamily} onBack={handleBackToList} />
            </Suspense>
        );
    }
    
    // --- MAIN LIST VIEW ---
    return (
        <div>
            <h2 className="font-bold text-xl mb-4 text-gray-800">Your Families</h2>
            {loadingList ? (
                <p className="text-center py-4">Loading families...</p>
            ) : listError ? (
                <p className="error text-center py-4">{listError}</p>
            ) : families.length > 0 ? (
                <div className="space-y-4">
                    {families.map((family) => (
                        <div key={family.id} className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                            <FamilyListItem
                                family={family}
                                onFamilyUpdated={handleFamilyUpdated} // Passing stable, memoized function
                                onFamilyDeleted={handleFamilyDeleted} // Passing stable, memoized function
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
    );
}