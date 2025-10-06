import { useContext, useEffect, useState, useCallback } from "react";
import { AppContext } from "../Context/AppContext.jsx";

// --- SKELETON LOADER COMPONENT ---
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
                  <div className="h-3 w-40 bg-slate-200 rounded mt-2"></div> {/* For dates */}
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
  const { token } = useContext(AppContext);

  // State for the lists and their pagination
  const [activeGoals, setActiveGoals] = useState([]);
  const [completedGoals, setCompletedGoals] = useState([]);
  const [activePagination, setActivePagination] = useState(null);
  const [completedPagination, setCompletedPagination] = useState(null);
  
  // General state for the component
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);

  // Fetches a page of ACTIVE goals
  const getActiveGoals = useCallback(async (page = 1) => {
    if (!token) return;
    try {
      let url = `${import.meta.env.VITE_API_URL}/api/goals?status=active&page=${page}`;
      if (family) {
        url += `&family_id=${family.id}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Could not load your active goals.");
      
      const data = await res.json();
      setActiveGoals(data.data || []);
      const { data: _, ...paginationData } = data;
      setActivePagination(paginationData);
    } catch (err) {
      setListError(err.message);
    }
  }, [token, family]); 
  
  // Fetches a page of COMPLETED goals
  const getCompletedGoals = useCallback(async (page = 1) => {
    if (!token) return;
    try {
      let url = `${import.meta.env.VITE_API_URL}/api/goals?status=completed&page=${page}`;
      if (family) {
        url += `&family_id=${family.id}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Could not load your completed goals.");
      
      const data = await res.json();
      setCompletedGoals(data.data || []);
      const { data: _, ...paginationData } = data;
      setCompletedPagination(paginationData);
    } catch (err) {
      setListError(err.message);
    }
  }, [token, family]);

  // Initial data load for both lists
  useEffect(() => {
    if (token) {
      setLoading(true);
      setListError(null);
      Promise.all([getActiveGoals(), getCompletedGoals()]).finally(() => setLoading(false));
    }
  }, [token, getActiveGoals, getCompletedGoals]);

  // Handler for completing a goal
  async function handleMarkAsComplete(goalId) {
    setListError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/goals/${goalId}/complete`, {
        method: "put",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Could not update the goal.");
      }

      getActiveGoals(1);
      getCompletedGoals(1);
    } catch (err) {
      setListError(err.message);
    }
  }

  // Handler for deleting a goal
  async function handleDeleteGoal(goalId) {
    if (!window.confirm("Are you sure you want to abandon this goal? This action cannot be undone.")) {
      return;
    }
    setListError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/goals/${goalId}`, {
        method: "delete",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Could not delete the goal.");
      }

      getActiveGoals(activePagination?.current_page || 1);
    } catch (err) {
      setListError(err.message);
    }
  }

  if (loading) return <GoalListsSkeleton />;
  if (listError) return <p className="error text-center py-10">{listError}</p>;

  return (
    <div className="space-y-8">
      {/* --- ACTIVE GOALS LIST --- */}
      <div className="w-full">
        <h2 className="font-bold text-xl mb-4 text-gray-800">Your Active Goals</h2>
        {activeGoals.length > 0 ? (
          <div className="space-y-3">
            {activeGoals.map((goal) => {
              const isOverdue = goal.target_date && new Date() > new Date(goal.target_date);
              // MODIFIED: Format dates for display
              const creationDate = new Date(goal.created_at).toLocaleDateString();
              const deadlineDate = goal.target_date ? new Date(goal.target_date).toLocaleDateString() : null;

              return (
                <div key={goal.id} className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-lg text-gray-700 break-words">{goal.name}</h3>
                      {goal.family ? (
                        <p className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full inline-block mt-1">For: {goal.family.first_name}</p>
                      ) : (
                        <p className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-1 rounded-full inline-block mt-1">Personal Goal</p>
                      )}
                      
                      {/* MODIFIED: Added this block to display the dates */}
                      <div className="text-xs text-gray-500 mt-2 space-y-1">
                          <p>Created: <span className="font-medium">{creationDate}</span></p>
                          {deadlineDate && (
                            <p>Deadline: <span className="font-medium">{deadlineDate}</span></p>
                          )}
                      </div>

                    </div>
                    <p className="font-bold text-lg text-indigo-600 flex-shrink-0">₱{parseFloat(goal.target_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  {isOverdue ? (
                    <div className="mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded-r-md">
                      <p className="text-sm font-bold">Deadline Passed</p>
                      <p className="text-xs mb-3">The target date for this goal has passed. What would you like to do?</p>
                      <div className="flex items-center gap-2">
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
        
        {activePagination && activePagination.last_page > 1 && (
            <div className="flex justify-between items-center mt-6">
                <button onClick={() => getActiveGoals(activePagination.current_page - 1)} disabled={activePagination.current_page === 1} className="pagination-btn">&larr; Previous</button>
                <span className="pagination-text">Page {activePagination.current_page} of {activePagination.last_page}</span>
                <button onClick={() => getActiveGoals(activePagination.current_page + 1)} disabled={activePagination.current_page === activePagination.last_page} className="pagination-btn">Next &rarr;</button>
            </div>
        )}
      </div>

      {/* --- COMPLETED GOALS LIST --- */}
      <div className="w-full">
        <h2 className="font-bold text-xl mb-4 text-gray-800">Completed Goals</h2>
        {completedGoals.length > 0 ? (
          <div className="space-y-3">
            {completedGoals.map((goal) => (
              <div key={goal.id} className="p-4 bg-green-50 border border-green-200 rounded-md opacity-80">
                 <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-lg text-green-800 break-words">{goal.name}</h3>
                    {goal.family ? (<p className="text-xs font-bold text-green-700">For Family: {goal.family.first_name}</p>) : (<p className="text-xs font-bold text-slate-600">Personal Goal</p>)}
                  </div>
                  <p className="font-bold text-lg text-green-700 flex-shrink-0">₱{parseFloat(goal.target_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-gray-600 italic">You have not completed any goals yet.</p>}
        
        {completedPagination && completedPagination.last_page > 1 && (
             <div className="flex justify-between items-center mt-6">
                <button onClick={() => getCompletedGoals(completedPagination.current_page - 1)} disabled={completedPagination.current_page === 1} className="pagination-btn">&larr; Previous</button>
                <span className="pagination-text">Page {completedPagination.current_page} of {completedPagination.last_page}</span>
                <button onClick={() => getCompletedGoals(completedPagination.current_page + 1)} disabled={completedPagination.current_page === completedPagination.last_page} className="pagination-btn">Next &rarr;</button>
            </div>
        )}
      </div>
    </div>
  );
}