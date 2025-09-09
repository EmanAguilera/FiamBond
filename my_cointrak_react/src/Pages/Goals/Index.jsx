import { useContext, useEffect, useState, useCallback } from "react";
import { AppContext } from "../../Context/AppContext";

export default function Goals() {
  const { token } = useContext(AppContext);
  const [activeGoals, setActiveGoals] = useState([]);
  const [completedGoals, setCompletedGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null); // For errors fetching/updating lists
  
  const [formData, setFormData] = useState({
    name: "",
    target_amount: "",
    target_date: "",
    family_id: "",
  });
  
  const [families, setFamilies] = useState([]);
  const [formErrors, setFormErrors] = useState({}); // For validation errors
  const [formError, setFormError] = useState(null); // For general form errors

  const getFamilies = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch families.');
      const data = await res.json();
      setFamilies(data);
    } catch (err) {
      console.error(err); // Log error but don't block UI for this non-critical data
    }
  }, [token]);

  const getGoals = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/goals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Could not load your goals.");
      }
      const data = await res.json();
      setActiveGoals(data.filter((goal) => goal.status === "active"));
      setCompletedGoals(data.filter((goal) => goal.status === "completed"));
    } catch (err) {
      setListError(err.message);
    }
    setLoading(false);
  }, [token]);

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
        headers: {
          Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json",
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 422) {
          setFormErrors(data.errors);
        } else {
          setFormError(data.message || "An unexpected error occurred.");
        }
        return;
      }
      
      setActiveGoals([data, ...activeGoals]);
      setFormData({ name: "", target_amount: "", target_date: "", family_id: "" });
    } catch (err) {
      console.error('Failed to create goal:', err);
      setFormError("A network error occurred. Please try again.");
    }
  }

  async function handleMarkAsComplete(goalId) {
    setListError(null); // Clear previous errors
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/goals/${goalId}/complete`, {
        method: "put",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Could not update the goal.");
      }

      const completedGoal = await res.json();
      setActiveGoals(activeGoals.filter((g) => g.id !== goalId));
      setCompletedGoals([completedGoal, ...completedGoals]);
    } catch (err) {
      setListError(err.message);
    }
  }

  useEffect(() => {
    if (token) {
      getGoals();
      getFamilies();
    }
  }, [token, getGoals, getFamilies]);

  return (
    <>
      <h1 className="title">Set Your Financial Goals</h1>
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
                <div className="text-right mt-3">
                  <button onClick={() => handleMarkAsComplete(goal.id)} className="secondary-btn text-xs">Mark as Complete</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 italic">You have no active goals yet.</p>
        )}
      </div>

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
      </div>
    </>
  );
}