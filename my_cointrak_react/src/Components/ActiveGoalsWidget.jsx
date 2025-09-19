import { useContext, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../Context/AppContext.jsx";

export default function ActiveGoalsWidget() {
  const { token } = useContext(AppContext);
  const [activeGoals, setActiveGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getActiveGoals = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/goals?status=active&limit=3`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Could not load your active goals.");
      setActiveGoals(await res.json());
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
    // The outer wrapper and title have been removed.
    // The modal now provides the title and structure.
    <div>
      {loading ? (<p className="text-gray-500 text-center py-4">Loading goals...</p>) : error ? (<p className="error text-center py-4">{error}</p>) : (
        <div className="dashboard-card p-0">
          {activeGoals.length > 0 ? (
            activeGoals.map((goal) => (
              <div key={goal.id} className="transaction-item border-b last:border-b-0 border-gray-100">
                <div>
                  <p className="transaction-description">{goal.name}</p>
                  <small className="transaction-date">{goal.family ? `For Family: ${goal.family.first_name}` : 'Personal Goal'}</small>
                </div>
                <p className="transaction-amount text-indigo-600">
                  ₱{parseFloat(goal.target_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-600 italic">
              You have no active goals. <Link to="/goals" className="font-semibold text-indigo-600">Set one now!</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}