import { useContext, useEffect, useState, useCallback } from "react";
import { AppContext } from "../../Context/AppContext";

export default function Goals() {
  const { token } = useContext(AppContext);
  const [goals, setGoals] = useState([]);
  const [formData, setFormData] = useState({ name: "", target_amount: "" });
  const [errors, setErrors] = useState({});

  const getGoals = useCallback(async () => {
    const res = await fetch("/api/goals", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setGoals(data);
    }
  }, [token]);

  async function handleCreateGoal(e) {
    e.preventDefault();
    const res = await fetch("/api/goals", {
      method: "post",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    if (res.status === 422) {
      setErrors(data.errors);
    } else if (res.ok) {
      // Add the new goal to the top of the list
      setGoals([data, ...goals]);
      setFormData({ name: "", target_amount: "" });
      setErrors({});
    }
  }

  useEffect(() => {
    if (token) getGoals();
  }, [token, getGoals]);

  return (
    <>
      <h1 className="title">Set Your Financial Goals</h1>

      {/* Create Goal Card */}
      <div className="w-full max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="font-bold text-xl mb-4 text-gray-800">Create a New Goal</h2>
        <form onSubmit={handleCreateGoal} className="space-y-4">
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
          <button type="submit" className="primary-btn">
            Set Goal
          </button>
        </form>
      </div>

      {/* Your Active Goals Card */}
      <div className="w-full max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="font-bold text-xl mb-4 text-gray-800">Your Active Goals</h2>
        {goals.length > 0 ? (
          <div className="space-y-3">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="p-4 bg-gray-50 border border-gray-200 rounded-md transition duration-200 ease-in-out hover:bg-gray-100"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg text-gray-700">{goal.name}</h3>
                  <p className="font-bold text-lg text-indigo-600">₱{parseFloat(goal.target_amount).toLocaleString()}</p>
                </div>
                {goal.consequence_note && (
                  <pre className="mt-2 p-2 bg-red-50 text-red-700 text-xs rounded-md whitespace-pre-wrap font-sans">
                    {goal.consequence_note}
                  </pre>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 italic">You have not set any goals yet.</p>
        )}
      </div>
    </>
  );
}