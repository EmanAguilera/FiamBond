import { useState, useCallback, useContext, useEffect } from 'react';
import { AppContext } from '../Context/AppContext';
import FamilyListItem from './FamilyListItems.jsx';

// --- SKELETON LOADER COMPONENT ---
// Updated to reflect the new button layout.
const FamilyListSkeleton = () => (
    <div className="animate-pulse">
        <h2 className="h-7 w-1/3 bg-slate-200 rounded mb-4"></h2>
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 bg-slate-100 border border-slate-200 rounded-md">
                    {/* Skeleton for FamilyListItem content */}
                    <div className="h-5 w-1/2 bg-slate-200 rounded"></div>
                    <div className="h-4 w-1/4 bg-slate-200 rounded mt-2"></div>
                    {/* Skeleton for the new action button */}
                    <div className="mt-3 border-t border-slate-200 pt-3">
                        <div className="h-8 w-40 bg-slate-200 rounded"></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// --- MAIN WIDGET ---
// The component now accepts `onEnterRealm` to handle navigation.
export default function FamilyManagementWidget({ onEnterRealm }) {
    const { token } = useContext(AppContext);
    
    // Internal view state is no longer needed, as this component only shows the list.
    const [families, setFamilies] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [listError, setListError] = useState(null);
    const [loadingList, setLoadingList] = useState(true);

    const handleFamilyUpdated = useCallback((updatedFamily) => {
        setFamilies(currentFamilies => currentFamilies.map(f => (f.id === updatedFamily.id ? updatedFamily : f)));
    }, []);

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

            // Data Enrichment to fetch full owner details if not present in the list summary.
            const familiesToEnrich = data.data.filter(f => !f.owner);
            if (familiesToEnrich.length > 0) {
                Promise.all(familiesToEnrich.map(family =>
                    fetch(`${import.meta.env.VITE_API_URL}/api/families/${family.id}`, { headers: { Authorization: `Bearer ${token}` } })
                        .then(res => res.ok ? res.json() : null)
                        .then(detailedFamily => {
                            if (detailedFamily) {
                                handleFamilyUpdated(detailedFamily);
                            }
                        })
                        .catch(err => console.error(`Failed to enrich family ${family.id}:`, err))
                ));
            }

        } catch (error) {
            setListError(error.message);
        } finally {
            setLoadingList(false);
        }
    }, [token, handleFamilyUpdated]);

    useEffect(() => { 
        getFamilies(); 
    }, [getFamilies]);

    // This function is called after a family is deleted from FamilyListItem.
    function handleFamilyDeleted() {
        const currentPage = pagination?.current_page || 1;
        // If the last item on a page is deleted, fetch the previous page.
        const pageToFetch = (families.length === 1 && currentPage > 1) ? currentPage - 1 : currentPage;
        getFamilies(pageToFetch);
    }
    
    // --- RENDER LOGIC ---

    if (loadingList) {
        return <FamilyListSkeleton />;
    }

    if (listError) {
        return <p className="error text-center py-4">{listError}</p>;
    }

    return (
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
                            {/* The action button now calls `onEnterRealm` passed via props */}
                            <div className="flex flex-wrap gap-2 mt-3 border-t border-gray-200 pt-3">
                                <button onClick={() => onEnterRealm(family)} className="primary-btn-sm">
                                    Enter Family Realm
                                </button>
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