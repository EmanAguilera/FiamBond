import { useState, useCallback, useContext, useEffect, lazy, Suspense } from 'react';
import { AppContext } from '../../../Context/AppContext.jsx';
import { db } from '../../../config/firebase-config.js';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';

import FamilyListItem from '../../Family/Shared/FamilyListItems.jsx';

const CreateFamilyWidget = lazy(() => import('../../Family/Onboarding/CreateFamilyWidget.tsx'));

// --- FULL SKELETON LOADER COMPONENT ---
const FamilyListSkeleton = () => (
    <div className="animate-pulse">
        <h2 className="h-7 w-1/3 bg-slate-200 rounded mb-4"></h2>
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 bg-slate-100 border border-slate-200 rounded-md">
                    <div className="h-5 w-1/2 bg-slate-200 rounded"></div>
                    <div className="h-4 w-1/4 bg-slate-200 rounded mt-2"></div>
                </div>
            ))}
        </div>
    </div>
);

export default function FamilyManagementWidget({ onEnterRealm }) {
    const { user } = useContext(AppContext);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    
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
            // 1. FETCH FAMILIES FROM NODE.JS BACKEND
            const response = await fetch(`${API_URL}/families?user_id=${user.uid}`);
            
            if (!response.ok) throw new Error('Failed to fetch families from server.');

            const rawFamilies = await response.json();

            // 2. TRANSFORM DATA (CRITICAL FIX: Ensure _id maps to id correctly)
            const fetchedFamilies = rawFamilies.map(f => ({
                ...f,
                // Prefer _id (MongoDB default), fallback to id, ensure it's a string
                id: (f._id || f.id).toString(), 
                member_ids: f.member_ids || []
            }));

            if (fetchedFamilies.length === 0) {
                setFamilies([]);
                setLoadingList(false);
                return;
            }

            // 3. FETCH OWNERS FROM FIREBASE
            const ownerIds = [...new Set(fetchedFamilies.map(f => f.owner_id))];
            const ownersMap = {};

            if (ownerIds.length > 0) {
                const usersRef = collection(db, "users");
                const ownersQuery = query(usersRef, where(documentId(), "in", ownerIds.slice(0, 10))); 
                const ownersSnapshot = await getDocs(ownersQuery);
                ownersSnapshot.forEach(doc => { ownersMap[doc.id] = doc.data(); });
            }

            const enrichedFamilies = fetchedFamilies.map(family => ({
                ...family,
                owner: ownersMap[family.owner_id] || { full_name: 'Unknown Owner' }
            }));

            setFamilies(enrichedFamilies);

        } catch (error) {
            console.error("Failed to fetch families:", error);
            setListError("Could not load your families.");
        } finally {
            setLoadingList(false);
        }
    }, [user, API_URL]);

    useEffect(() => { getFamilies(); }, [getFamilies]);

    const handleFamilyCreated = () => {
        console.log("New family created, refreshing list...");
        getFamilies();
    };
    
    function handleFamilyDeleted() { getFamilies(); }

    const handleEnterClick = (family) => {
        // DEBUG: Check if the ID is valid before sending to Realm
        console.log("Enter Realm Clicked for:", family.family_name, "ID:", family.id);
        if (!family.id) {
            alert("Error: Invalid Family ID. Please refresh the page.");
            return;
        }
        onEnterRealm(family);
    };
    
    if (loadingList) return <FamilyListSkeleton />;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-bold text-lg mb-2 text-gray-700">Create a New Family</h3>
                <Suspense fallback={<div className="h-10 w-full bg-slate-200 rounded animate-pulse"></div>}>
                    <CreateFamilyWidget onSuccess={handleFamilyCreated} />
                </Suspense>
            </div>

            <hr className="border-gray-200" />

            <div>
                <h2 className="font-bold text-xl mb-4 text-gray-800">Your Existing Families</h2>
                {listError && <p className="error text-center py-4">{listError}</p>}
                
                {!listError && families.length > 0 ? (
                    <div className="space-y-4">
                        {families.map((family) => (
                            <div key={family.id} className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                                <FamilyListItem
                                    family={family}
                                    onFamilyUpdated={handleFamilyUpdated}
                                    onFamilyDeleted={handleFamilyDeleted}
                                />
                                <div className="flex flex-wrap gap-2 mt-3 border-t border-gray-200 pt-3">
                                    {/* Use wrapper function to log ID */}
                                    <button onClick={() => handleEnterClick(family)} className="primary-btn-sm">
                                        Enter Family Realm
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    !listError && <p className="text-gray-600 italic text-center py-4">You are not a member of any families yet.</p>
                )}
            </div>
        </div>
    );
}