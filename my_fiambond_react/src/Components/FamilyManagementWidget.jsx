// Components/FamilyManagementWidget.jsx

import { useState, useCallback, useContext, useEffect } from 'react';
import { AppContext } from '../Context/AppContext.jsx';
import { db } from '../config/firebase-config'; // Adjust path
import { collection, query, where, getDocs, orderBy, documentId } from 'firebase/firestore';
import FamilyListItem from './FamilyListItems.jsx';

// --- FULL SKELETON LOADER COMPONENT ---
const FamilyListSkeleton = () => (
    <div className="animate-pulse">
        <h2 className="h-7 w-1/3 bg-slate-200 rounded mb-4"></h2>
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 bg-slate-100 border border-slate-200 rounded-md">
                    <div className="h-5 w-1/2 bg-slate-200 rounded"></div>
                    <div className="h-4 w-1/4 bg-slate-200 rounded mt-2"></div>
                    <div className="mt-3 border-t border-slate-200 pt-3">
                        <div className="h-8 w-40 bg-slate-200 rounded"></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default function FamilyManagementWidget({ onEnterRealm }) {
    const { user } = useContext(AppContext);
    
    const [families, setFamilies] = useState([]);
    const [listError, setListError] = useState(null);
    const [loadingList, setLoadingList] = useState(true);

    const handleFamilyUpdated = useCallback((updatedFamily) => {
        setFamilies(currentFamilies => currentFamilies.map(f => (f.id === updatedFamily.id ? updatedFamily : f)));
    }, []);

    const getFamilies = useCallback(async () => {
        if (!user) return;
        setLoadingList(true);
        setListError(null);
        try {
            // Step 1: Query the 'families' collection to find all families the user is a member of.
            const familiesRef = collection(db, "families");
            const q = query(
                familiesRef,
                where("member_ids", "array-contains", user.uid),
                orderBy("created_at", "desc")
            );

            const querySnapshot = await getDocs(q);
            const fetchedFamilies = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            if (fetchedFamilies.length === 0) {
                setFamilies([]);
                return;
            }

            // Step 2: Enrich the data with the owner's full name.
            // Get a unique list of all owner IDs from the fetched families.
            const ownerIds = [...new Set(fetchedFamilies.map(f => f.owner_id))];

            // Query the 'users' collection to get the profiles for these owners.
            const usersRef = collection(db, "users");
            const ownersQuery = query(usersRef, where(documentId(), "in", ownerIds));
            const ownersSnapshot = await getDocs(ownersQuery);

            // Create a simple map for easy lookup: { 'owner_uid': { full_name: 'John Doe' }, ... }
            const ownersMap = {};
            ownersSnapshot.forEach(doc => {
                ownersMap[doc.id] = doc.data();
            });

            // Step 3: Merge the owner's data into each family object.
            const enrichedFamilies = fetchedFamilies.map(family => ({
                ...family,
                owner: ownersMap[family.owner_id] || { full_name: 'Unknown Owner' }
            }));

            setFamilies(enrichedFamilies);

        } catch (error) {
            console.error("Failed to fetch families:", error);
            if (error.code === 'failed-precondition') {
                setListError("Query requires an index. Please create a composite index in Firestore for the 'families' collection.");
            } else {
                setListError("Could not load your families.");
            }
        } finally {
            setLoadingList(false);
        }
    }, [user]);

    useEffect(() => { 
        getFamilies(); 
    }, [getFamilies]);

    // This function is called from FamilyListItem after a family is deleted.
    // The simplest way to update the list is to just re-fetch it.
    function handleFamilyDeleted() {
        getFamilies();
    }
    
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
                            <div className="flex flex-wrap gap-2 mt-3 border-t border-gray-200 pt-3">
                                <button onClick={() => onEnterRealm(family)} className="primary-btn-sm">
                                    Enter Family Realm
                                </button>
                            </div>
                        </div>
                    ))}
                    {/* Pagination is removed in favor of a fetch-all approach, suitable for a smaller number of families per user. */}
                </div>
            ) : (
                <p className="text-gray-600 italic text-center py-4">You are not a member of any families yet.</p>
            )}
        </div>
    );
}