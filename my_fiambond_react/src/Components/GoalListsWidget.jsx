import { useContext, useEffect, useState, useCallback } from "react";
import { AppContext } from "../Context/AppContext.jsx";
import { db } from '../config/firebase-config'; // Adjust path
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    serverTimestamp, 
    documentId, 
    orderBy
} from 'firebase/firestore';

// --- FULL SKELETON LOADER COMPONENT ---
const GoalListsSkeleton = () => (
    <div className="space-y-8 animate-pulse">
      {/* Skeleton for Active Goals */}
      <div>
        <div className="h-7 w-1/3 bg-slate-200 rounded mb-4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 bg-slate-100 border border-slate-200 rounded-md">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="h-6 w-48 bg-slate-200 rounded"></div>
                  <div className="h-4 w-24 bg-slate-200 rounded mt-2"></div>
                  <div className="h-3 w-32 bg-slate-200 rounded mt-3"></div>
                  <div className="h-3 w-40 bg-slate-200 rounded mt-2"></div>
                </div>
                <div className="h-7 w-28 bg-slate-200 rounded"></div>
              </div>
              <div className="flex justify-end mt-3 space-x-2">
                <div className="h-7 w-28 bg-slate-200 rounded-md"></div>
                <div className="h-7 w-20 bg-slate-200 rounded-md"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Skeleton for Completed Goals */}
      <div>
        <div className="h-7 w-1/2 bg-slate-200 rounded mb-4"></div>
        <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
                <div key={i} className="p-4 bg-slate-100 border border-slate-200 rounded-md">
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <div className="h-6 w-56 bg-slate-200 rounded"></div>
                            <div className="h-4 w-20 bg-slate-200 rounded mt-2"></div>
                            <div className="h-3 w-40 bg-slate-200 rounded mt-3"></div>
                        </div>
                        <div className="h-7 w-32 bg-slate-200 rounded"></div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
);


export default function GoalListsWidget({ family }) {
  const { user } = useContext(AppContext);

  const [activeGoals, setActiveGoals] = useState([]);
  const [completedGoals, setCompletedGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);

  const getGoals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setListError(null);
    try {
        let goalsQuery;

        // Conditionally build the query for either family or personal goals
        if (family) {
            // Query for FAMILY goals
            goalsQuery = query(
                collection(db, "goals"),
                where("family_id", "==", family.id),
                where("status", "in", ["active", "completed"]),
                orderBy("created_at", "desc")
            );
        } else {
            // Query for PERSONAL goals
            goalsQuery = query(
                collection(db, "goals"),
                where("family_id", "==", null),
                // THIS IS THE CRITICAL FIX: The query must prove it's only asking for the current user's goals
                // to satisfy the security rules.
                where("user_id", "==", user.uid),
                where("status", "in", ["active", "completed"]),
                orderBy("created_at", "desc")
            );
        }

        const goalsSnapshot = await getDocs(goalsQuery);
        const allGoals = goalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // --- Data Enrichment ---
        const userIds = new Set();
        const familyIds = new Set();
        allGoals.forEach(goal => {
            if (goal.user_id) userIds.add(goal.user_id);
            if (goal.completed_by_user_id) userIds.add(goal.completed_by_user_id);
            if (goal.family_id) familyIds.add(goal.family_id);
        });

        const usersMap = {};
        if (userIds.size > 0) {
            const usersQuery = query(collection(db, "users"), where(documentId(), "in", [...userIds]));
            const usersSnapshot = await getDocs(usersQuery);
            usersSnapshot.forEach(doc => usersMap[doc.id] = doc.data());
        }

        const familiesMap = {};
        if (familyIds.size > 0) {
            const familiesQuery = query(collection(db, "families"), where(documentId(), "in", [...familyIds]));
            const familiesSnapshot = await getDocs(familiesQuery);
            familiesSnapshot.forEach(doc => familiesMap[doc.id] = doc.data());
        }

        const enrichedGoals = allGoals.map(goal => ({
            ...goal,
            user: usersMap[goal.user_id] || { full_name: 'Unknown' },
            completed_by: usersMap[goal.completed_by_user_id],
            family: familiesMap[goal.family_id]
        }));
        
        setActiveGoals(enrichedGoals.filter(g => g.status === 'active'));
        setCompletedGoals(enrichedGoals.filter(g => g.status === 'completed'));

    } catch (err) {
      console.error("Failed to get goals:", err);
      setListError("Could not load your goals. Check permissions and indexes.");
    } finally {
      setLoading(false);
    }
  }, [user, family]);

  useEffect(() => {
    getGoals();
  }, [getGoals]);

  async function handleMarkAsComplete(goalId) {
    if (!user) return;
    setListError(null);
    try {
        const goalDocRef = doc(db, "goals", goalId);
        await updateDoc(goalDocRef, {
            status: "completed",
            completed_at: serverTimestamp(),
            completed_by_user_id: user.uid
        });
        getGoals();
    } catch {
        setListError("Could not update the goal.");
    }
  }

  async function handleDeleteGoal(goalId) {
    if (!window.confirm("Are you sure you want to abandon this goal? This action cannot be undone.")) return;
    setListError(null);
    try {
        await deleteDoc(doc(db, "goals", goalId));
        getGoals();
    } catch {
        setListError("Could not delete the goal.");
    }
  }

  if (loading) return <GoalListsSkeleton />;
  if (listError) return <p className="error text-center py-10">{listError}</p>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-bold text-xl mb-4 text-gray-800">Active Goals</h2>
        {activeGoals.length > 0 ? (
          <div className="space-y-3">
            {activeGoals.map((goal) => {
              const deadlineDate = goal.target_date?.toDate();
              const isOverdue = deadlineDate && new Date() > deadlineDate;
              return (
                <div key={goal.id} className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-lg text-gray-700 break-words">{goal.name}</h3>
                      {goal.family ? (
                        <p className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full inline-block mt-1">For: {goal.family.family_name}</p>
                      ) : (
                        <p className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-1 rounded-full inline-block mt-1">Personal Goal</p>
                      )}
                      <div className="text-xs text-gray-500 mt-2 space-y-1">
                          <p>Created by: <span className="font-medium text-gray-700">{goal.user.full_name}</span></p>
                          <p>Date Added: <span className="font-medium">{goal.created_at.toDate().toLocaleDateString()}</span></p>
                          {deadlineDate && <p>Deadline: <span className="font-medium">{deadlineDate.toLocaleDateString()}</span></p>}
                      </div>
                    </div>
                    <p className="font-bold text-lg text-indigo-600 flex-shrink-0">₱{parseFloat(goal.target_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  {isOverdue ? (
                    <div className="mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded-r-md">
                      <p className="text-sm font-bold">Deadline Passed</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => handleMarkAsComplete(goal.id)} className="success-btn-sm text-xs">Mark as Complete</button>
                        <button onClick={() => handleDeleteGoal(goal.id)} className="danger-btn-sm text-xs">Abandon</button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-right mt-3 space-x-2">
                      <button onClick={() => handleMarkAsComplete(goal.id)} className="success-btn-sm text-xs">Mark as Complete</button>
                      <button onClick={() => handleDeleteGoal(goal.id)} className="danger-btn-sm text-xs">Abandon</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : <p className="text-gray-600 italic">You have no active goals yet.</p>}
      </div>
      <div>
        <h2 className="font-bold text-xl mb-4 text-gray-800">Completed Goals</h2>
        {completedGoals.length > 0 ? (
          <div className="space-y-3">
            {completedGoals.map((goal) => (
              <div key={goal.id} className="p-4 bg-green-50 border border-green-200 rounded-md opacity-80">
                 <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-lg text-green-800 break-words">{goal.name}</h3>
                    {goal.family ? (<p className="text-xs font-bold text-green-700">For Family: {goal.family.family_name}</p>) : (<p className="text-xs font-bold text-slate-600">Personal Goal</p>)}
                    <div className="text-xs text-gray-600 mt-2 space-y-1">
                        <p>Created by: <span className="font-medium">{goal.user.full_name}</span></p>
                        {goal.completed_by && <p>Completed by: <span className="font-medium">{goal.completed_by.full_name}</span></p>}
                    </div>
                  </div>
                  <p className="font-bold text-lg text-green-700 flex-shrink-0">₱{parseFloat(goal.target_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-gray-600 italic">You have not completed any goals yet.</p>}
      </div>
    </div>
  );
}