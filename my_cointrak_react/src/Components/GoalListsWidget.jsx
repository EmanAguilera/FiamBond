import { useContext, useEffect, useState, useCallback } from "react";
import { AppContext } from "../Context/AppContext.jsx";

export default function GoalListsWidget() {
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/goals?status=active&page=${page}`, {
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
  }, [token]);
  
  // Fetches a page of COMPLETED goals
  const getCompletedGoals = useCallback(async (page = 1) => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/goals?status=completed&page=${page}`, {
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
  }, [token]);

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

      // Refresh both lists from the first page to reflect the change
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

      // Refresh the active goals from the current page to maintain user context
      getActiveGoals(activePagination?.current_page || 1);
    } catch (err) {
      setListError(err.message);
    }
  }

  if (loading) return <p className="text-center py-10">Loading goals...</p>;
  if (listError) return <p className="error text-center py-10">{listError}</p>;

  return (
    <div className="space-y-8">
      {/* --- ACTIVE GOALS LIST --- */}
      <div className="w-full">
        <h2 className="font-bold text-xl mb-4 text-gray-800">Your Active Goals</h2>
        {activeGoals.length > 0 ? (
          <div className="space-y-3">
            {activeGoals.map((goal) => (
              <div key={goal.id} className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                 <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-700">{goal.name}</h3>
                    {goal.family ? (
                      <p className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full inline-block mt-1">For: {goal.family.first_name}</p>
                    ) : (
                      <p className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-1 rounded-full inline-block mt-1">Personal Goal</p>
                    )}
                  </div>
                  <p className="font-bold text-lg text-indigo-600">₱{parseFloat(goal.target_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right mt-3 space-x-2">
                  <button onClick={() => handleMarkAsComplete(goal.id)} className="success-btn-sm text-xs">Mark as Complete</button>
                  <button onClick={() => handleDeleteGoal(goal.id)} className="danger-btn-sm text-xs">Abandon</button>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-gray-600 italic">You have no active goals yet.</p>}
        
        {/* Active Goals Pagination */}
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
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-green-800">{goal.name}</h3>
                    {goal.family ? (<p className="text-xs font-bold text-green-700">For Family: {goal.family.first_name}</p>) : (<p className="text-xs font-bold text-slate-600">Personal Goal</p>)}
                  </div>
                  <p className="font-bold text-lg text-green-700">₱{parseFloat(goal.target_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-gray-600 italic">You have not completed any goals yet.</p>}
        
        {/* Completed Goals Pagination */}
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