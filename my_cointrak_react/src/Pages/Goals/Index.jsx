import { useContext, useEffect, useState, useCallback } from "react";
import { AppContext } from "../../Context/AppContext";

export default function Goals() {
  const { token } = useContext(AppContext);
  
  // STATE MANAGEMENT for two separate, paginated lists
  const [activeGoals, setActiveGoals]         = useState([]);
  const [completedGoals, setCompletedGoals]   = useState([]);
  const [activePagination, setActivePagination]     = useState(null);
  const [completedPagination, setCompletedPagination] = useState(null);

  // General state for loading and errors
  const [loading, setLoading]     = useState(true);
  const [listError, setListError] = useState(null);
  
  // State for the "Create New Goal" form
  const [formData, setFormData] = useState({
    name: "",
    target_amount: "",
    target_date: "",
    family_id: "",
  });
  
  // State for the families dropdown in the form
  const [families, setFamilies]         = useState([]);
  const [formErrors, setFormErrors]     = useState({});
  const [formError, setFormError]     = useState(null);

  // Fetches families for the dropdown, handling the paginated response
  const getFamiliesForDropdown = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families?page=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch families.');
      const data = await res.json();
      setFamilies(data.data || []); // Make sure to use data.data and provide a fallback
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  // Fetches a specific page of ACTIVE goals from the API
  const getActiveGoals = useCallback(async (page = 1) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/goals?status=active&page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Could not load active goals.");
      const data = await res.json();
      setActiveGoals(data.data);
      const { data: _, ...paginationData } = data;
      setActivePagination(paginationData);
    } catch (err) {
      setListError(err.message);
    }
  }, [token]);
  
  // Fetches a specific page of COMPLETED goals from the API
  const getCompletedGoals = useCallback(async (page = 1) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/goals?status=completed&page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Could not load completed goals.");
      const data = await res.json();
      setCompletedGoals(data.data);
      const { data: _, ...paginationData } = data;
      setCompletedPagination(paginationData);
    } catch (err) {
      setListError(err.message);
    }
  }, [token]);

  // On component load, fetch all necessary data
  useEffect(() => {
    if (token) {
      setLoading(true);
      Promise.all([
        getActiveGoals(),
        getCompletedGoals(),
        getFamiliesForDropdown()
      ]).finally(() => setLoading(false));
    }
  }, [token, getActiveGoals, getCompletedGoals, getFamiliesForDropdown]);

  // Handler for creating a new goal
  async function handleCreateGoal(e) {
    e.preventDefault();
    setFormErrors({});
    setFormError(null);
    
    const bodyPayload = { ...formData };
    if (bodyPayload.family_id === "") {
      delete bodyPayload.family_id;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/goals`, {
        method: "post",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 422) setFormErrors(data.errors);
        else setFormError(data.message || "An unexpected error occurred.");
        return;
      }
      
      // On success, refetch the first page of active goals to show the new one.
      getActiveGoals(1);
      setFormData({ name: "", target_amount: "", target_date: "", family_id: "" });
    } catch (err) {
      console.error('Failed to create goal:', err);
      setFormError("A network error occurred. Please try again.");
    }
  }

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

      // On success, refetch the first page of BOTH lists to keep them accurate.
      getActiveGoals(1);
      getCompletedGoals(1);
    } catch (err) {
      setListError(err.message);
    }
  }

  // --- START OF DELETION FEATURE ---
  // Handler for deleting a goal
  async function handleDeleteGoal(goalId) {
    // Optional: Ask for confirmation before deleting
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

      // On success, refetch the active goals to update the list.
      // We use the current page from pagination state to avoid jumping back to page 1.
      getActiveGoals(activePagination.current_page);
    } catch (err) {
      setListError(err.message);
    }
  }
  // --- END OF DELETION FEATURE ---

  return (
    <>
      <h1 className="title">Set Your Financial Goals</h1>
      
      {/* --- CREATE NEW GOAL FORM --- */}
      <div className="w-full max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="font-bold text-xl mb-4 text-gray-800">Create a New Goal</h2>
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <div>
            <select
              value={formData.family_id}
              onChange={(e) => setFormData({ ...formData, family_id: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Personal Goal --</option>
              {families.map((family) => (
                <option key={family.id} value={family.id}>For Family: {family.first_name}</option>
              ))}
            </select>
            {formErrors.family_id && <p className="error">{formErrors.family_id[0]}</p>}
          </div>
          <div>
            <input
              type="text"
              placeholder="Goal Name (e.g., Vacation Fund)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {formErrors.name && <p className="error">{formErrors.name[0]}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                type="number"
                placeholder="Target Amount"
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {formErrors.target_amount && <p className="error">{formErrors.target_amount[0]}</p>}
            </div>
            <div>
              <input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-500"
              />
              {formErrors.target_date && <p className="error">{formErrors.target_date[0]}</p>}
            </div>
          </div>
          {formError && <p className="error">{formError}</p>}
          <button type="submit" className="primary-btn">Set Goal</button>
        </form>
      </div>

      {/* --- ACTIVE GOALS LIST --- */}
      <div className="w-full max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="font-bold text-xl mb-4 text-gray-800">Your Active Goals</h2>
        {loading ? <p>Loading goals...</p> : listError ? <p className="error">{listError}</p> : activeGoals.length > 0 ? (
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
                    {goal.target_date && (<p className="text-sm text-gray-500 mt-2">Target Date: {new Date(goal.target_date).toLocaleDateString()}</p>)}
                  </div>
                  <p className="font-bold text-lg text-indigo-600">₱{parseFloat(goal.target_amount).toLocaleString()}</p>
                </div>
                {/* --- START OF DELETION FEATURE --- */}
                <div className="text-right mt-3 space-x-2">
                  <button onClick={() => handleMarkAsComplete(goal.id)} className="secondary-btn text-xs">Mark as Complete</button>
                  {/* I recommend adding a more distinct style for a destructive action */}
                  <button onClick={() => handleDeleteGoal(goal.id)} className="danger-btn text-xs">Abandon</button>
                </div>
                {/* --- END OF DELETION FEATURE --- */}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 italic">You have no active goals yet.</p>
        )}
        {/* PAGINATION CONTROLS FOR ACTIVE GOALS */}
        {activePagination && activePagination.last_page > 1 && (
          <div className="flex justify-between items-center mt-6">
            <button onClick={() => getActiveGoals(activePagination.current_page - 1)} disabled={activePagination.current_page === 1} className="secondary-btn disabled:opacity-50">&larr; Previous</button>
            <span className="text-sm text-gray-600">Page {activePagination.current_page} of {activePagination.last_page}</span>
            <button onClick={() => getActiveGoals(activePagination.current_page + 1)} disabled={activePagination.current_page === activePagination.last_page} className="secondary-btn disabled:opacity-50">Next &rarr;</button>
          </div>
        )}
      </div>

      {/* --- COMPLETED GOALS LIST --- */}
      <div className="w-full max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="font-bold text-xl mb-4 text-gray-800">Completed Goals</h2>
        {loading ? <p>Loading goals...</p> : completedGoals.length > 0 ? (
          <div className="space-y-3">
            {completedGoals.map((goal) => (
              <div key={goal.id} className="p-4 bg-green-50 border border-green-200 rounded-md opacity-80">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-green-800">{goal.name}</h3>
                    {goal.family ? (<p className="text-xs font-bold text-green-700">For Family: {goal.family.first_name}</p>) : (<p className="text-xs font-bold text-slate-600">Personal Goal</p>)}
                  </div>
                  <p className="font-bold text-lg text-green-700">₱{parseFloat(goal.target_amount).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !listError && <p className="text-gray-600 italic">You have not completed any goals yet.</p>
        )}
        {/* PAGINATION CONTROLS FOR COMPLETED GOALS */}
        {completedPagination && completedPagination.last_page > 1 && (
          <div className="flex justify-between items-center mt-6">
            <button onClick={() => getCompletedGoals(completedPagination.current_page - 1)} disabled={completedPagination.current_page === 1} className="secondary-btn disabled:opacity-50">&larr; Previous</button>
            <span className="text-sm text-gray-600">Page {completedPagination.current_page} of {completedPagination.last_page}</span>
            <button onClick={() => getCompletedGoals(completedPagination.current_page + 1)} disabled={completedPagination.current_page === completedPagination.last_page} className="secondary-btn disabled:opacity-50">Next &rarr;</button>
          </div>
        )}
      </div>
    </>
  );
}