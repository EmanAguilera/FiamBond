import { useContext, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom"; // Import Link for navigation
import { AppContext } from "../Context/AppContext";

export default function ActiveGoalsWidget() {
  const { token } = useContext(AppContext);
  const [activeGoals, setActiveGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getActiveGoals = useCallback(async () => {
    if (!token) return;
    try {
      // Fetch only the 3 most recent active goals
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/goals?status=active&limit=3`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Could not load your active goals.");
      }
      const data = await res.json();
      setActiveGoals(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    getActiveGoals();
  }, [getActiveGoals]);

  return (
    <div className="w-full max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-xl text-gray-800">Your Active Goals</h2>
        {/* Link to the main Goals page */}
        <Link to="/goals" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
          View All &rarr;
        </Link>
      </div>

      {/* Conditional Rendering */}
      {loading ? (
        <p className="text-gray-500">Loading goals...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : activeGoals.length > 0 ? (
        <div className="space-y-3">
          {activeGoals.map((goal) => (
            <div key={goal.id} className="p-4 bg-gray-50 border border-gray-200 rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-md text-gray-700">{goal.name}</h3>
                  {goal.family ? (
                    <p className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full inline-block mt-1">
                      For: {goal.family.first_name}
                    </p>
                  ) : (
                    <p className="text-xs font-bold text-slate-600 bg-slate-200 px-2 py-1 rounded-full inline-block mt-1">
                      Personal Goal
                    </p>
                  )}
                </div>
                <p className="font-bold text-lg text-indigo-600">
                  ₱{parseFloat(goal.target_amount).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 italic">You have no active goals. <Link to="/goals" className="font-semibold text-indigo-600">Set one now!</Link></p>
      )}
    </div>
  );
}