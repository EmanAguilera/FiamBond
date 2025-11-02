import { useState, useCallback, useContext, useEffect, lazy, Suspense } from 'react';
import { AppContext } from '../../Context/AppContext.jsx';
import { db } from '../../config/firebase-config.js';
import { collection, query, where, getDocs, orderBy, documentId } from 'firebase/firestore';
import FamilyListItem from './FamilyListItems.jsx';

const CreateFamilyWidget = lazy(() => import('./CreateFamilyWidget.tsx'));

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
                setLoadingList(false);
                return;
            }

            const ownerIds = [...new Set(fetchedFamilies.map(f => f.owner_id))];
            const usersRef = collection(db, "users");
            const ownersQuery = query(usersRef, where(documentId(), "in", ownerIds));
            const ownersSnapshot = await getDocs(ownersQuery);

            const ownersMap = {};
            ownersSnapshot.forEach(doc => {
                ownersMap[doc.id] = doc.data();
            });

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

    const handleFamilyCreated = () => {
        console.log("New family created, refreshing the list...");
        getFamilies();
    };
    
    function handleFamilyDeleted() {
        getFamilies();
    }
    
    if (loadingList) {
        return <FamilyListSkeleton />;
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-bold text-lg mb-2 text-gray-700">Create a New Family</h3>
                {/* THE FIX IS HERE: The typo 'Suspesse' has been corrected to 'Suspense' */}
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
                                    <button onClick={() => onEnterRealm(family)} className="primary-btn-sm">
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