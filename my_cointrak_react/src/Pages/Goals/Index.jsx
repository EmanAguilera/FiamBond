import { useContext, useEffect, useState, useCallback } from "react";
import { AppContext } from "../../Context/AppContext";

export default function Goals() {
  const { token } = useContext(AppContext);
  const [activeGoals, setActiveGoals] = useState([]);
  const [completedGoals, setCompletedGoals] = useState([]);
  
  const [formData, setFormData] = useState({
    name: "",
    target_amount: "",
    target_date: "",
    family_id: "",
  });
  
  const [families, setFamilies] = useState([]);
  const [errors, setErrors] = useState({});

  const getFamilies = useCallback(async () => {
    // --- FIX IS HERE #1 ---
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setFamilies(data);
    }
  }, [token]);

  const getGoals = useCallback(async () => {
    // --- FIX IS HERE #2 ---
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/goals`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setActiveGoals(data.filter((goal) => goal.status === "active"));
      setCompletedGoals(data.filter((goal) => goal.status === "completed"));
    }
  }, [token]);

  async function handleCreateGoal(e) {
    e.preventDefault();
    const bodyPayload = { ...formData };
    if (bodyPayload.family_id === "") {
      delete bodyPayload.family_id;
    }

    // --- FIX IS HERE #3 ---
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/goals`, {
      method: "post",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(bodyPayload),
    });

    const data = await res.json();
    if (res.status === 422) {
      setErrors(data.errors);
    } else if (res.ok) {
      setActiveGoals([data, ...activeGoals]);
      setFormData({ name: "", target_amount: "", target_date: "", family_id: "" });
      setErrors({});
    }
  }

  async function handleMarkAsComplete(goalId) {
    // --- FIX IS HERE #4 ---
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/goals/${goalId}/complete`, {
      method: "put",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (res.ok) {
      const completedGoal = await res.json();
      setActiveGoals(activeGoals.filter((g) => g.id !== goalId));
      setCompletedGoals([completedGoal, ...completedGoals]);
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
                <option key={family.id} value={family.id}>
                  For Family: {family.first_name}
                </option>
              ))}
            </select>
            {errors.family_id && <p className="error">{errors.family_id[0]}</p>}
          </div>

          <div>
            <input
              type="text"
              placeholder="Goal Name (e.g., Vacation Fund)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.name && <p className="error">{errors.name[0]}</p>}
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
              {errors.target_amount && <p className="error">{errors.target_amount[0]}</p>}
            </div>
            <div>
              <input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-500"
              />
              {errors.target_date && <p className="error">{errors.target_date[0]}</p>}
            </div>
          </div>
          <button type="submit" className="primary-btn">
            Set Goal
          </button>
        </form>
      </div>

      <div className="w-full max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="font-bold text-xl mb-4 text-gray-800">Your Active Goals</h2>
        {activeGoals.length > 0 ? (
          <div className="space-y-3">
            {activeGoals.map((goal) => (
              <div key={goal.id} className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-700">{goal.name}</h3>
                    {goal.family ? (
                      <p className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full inline-block mt-1">
                        For: {goal.family.first_name}
                      </p>
                    ) : (
                      <p className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-1 rounded-full inline-block mt-1">
                        Personal Goal
                      </p>
                    )}
                    {goal.target_date && (
                      <p className="text-sm text-gray-500 mt-2">
                        Target Date: {new Date(goal.target_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <p className="font-bold text-lg text-indigo-600">
                    ₱{parseFloat(goal.target_amount).toLocaleString()}
                  </p>
                </div>
                {goal.consequence_note && (
                  <pre className="mt-2 p-2 bg-red-50 text-red-700 text-xs rounded-md whitespace-pre-wrap font-sans">
                    {goal.consequence_note}
                  </pre>
                )}
                <div className="text-right mt-3">
                  <button onClick={() => handleMarkAsComplete(goal.id)} className="secondary-btn text-xs">
                    Mark as Complete
                  </button>
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
        {completedGoals.length > 0 ? (
          <div className="space-y-3">
            {completedGoals.map((goal) => (
              <div key={goal.id} className="p-4 bg-green-50 border border-green-200 rounded-md opacity-80">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-green-800">{goal.name}</h3>
                    {goal.family ? (
                      <p className="text-xs font-bold text-green-700">
                        For Family: {goal.family.first_name}
                      </p>
                    ) : (
                       <p className="text-xs font-bold text-slate-600">Personal Goal</p>
                    )}
                  </div>
                  <p className="font-bold text-lg text-green-700">
                    ₱{parseFloat(goal.target_amount).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 italic">You have not completed any goals yet.</p>
        )}
      </div>
    </>
  );
}