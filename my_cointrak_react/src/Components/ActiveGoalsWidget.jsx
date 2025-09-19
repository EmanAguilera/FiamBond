import { useContext, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../Context/AppContext";

export default function ActiveGoalsWidget() {
  const { token } = useContext(AppContext);
  const [activeGoals, setActiveGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getActiveGoals = useCallback(async () => {
    if (!token) return;
    try {
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

  // --- START: MODIFIED JSX WITH NEW DESIGN ---
  return (
     <div className="w-full max-w-3xl mx-auto dashboard-section"> {/* Added dashboard-section for consistent spacing */}
    <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-2xl text-gray-800">Your Active Goals</h3>
        <Link to="/goals" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
          View All &rarr;
        </Link>
    </div>

    {loading ? ( <p>Loading...</p> ) : error ? ( <p className="error">{error}</p> ) : 
    activeGoals.length > 0 ? (
      // Use dashboard-card with p-0 to contain the items
      <div className="dashboard-card p-0"> 
        {activeGoals.map((goal) => (
          // --- APPLYING THE CORRECT CLASSES ---
          <div
            key={goal.id}
            // Use transaction-item for the hover effect and layout
            className="transaction-item border-b last:border-b-0 border-gray-100"
          >
            <div>
              {/* Use transaction-description for the main title */}
              <p className="transaction-description">{goal.name}</p>
              {/* Use transaction-date for the subtext to get the smaller font */}
              <small className="transaction-date">
                {goal.family ? `For Family: ${goal.family.first_name}` : 'Personal Goal'}
              </small>
            </div>
            {/* Use transaction-amount for the value */}
            <p className="transaction-amount text-indigo-600">
              ₱{parseFloat(goal.target_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          // --- END OF CHANGES ---
        ))}
      </div>
    ) : (
      <div className="dashboard-card p-6 text-center">
        <p className="text-gray-600 italic">You have no active goals. <Link to="/goals" className="font-semibold text-indigo-600">Set one now!</Link></p>
      </div>
    )}
  </div>
);
  // --- END: MODIFIED JSX ---
}