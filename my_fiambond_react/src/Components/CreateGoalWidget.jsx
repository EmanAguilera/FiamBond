import { useContext, useState, useEffect, useCallback } from "react";
import { AppContext } from "../Context/AppContext.jsx";

// This component now accepts an `onSuccess` prop to signal completion.
export default function CreateGoalWidget({ onSuccess }) {
  const { token } = useContext(AppContext);

  const [formData, setFormData] = useState({
    name: "", target_amount: "", target_date: "", family_id: "",
  });
  
  const [families, setFamilies] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState(null);

  // Fetches families for the dropdown
  const getFamiliesForDropdown = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families?page=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch families.');
      const data = await res.json();
      setFamilies(data.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    if (token) getFamiliesForDropdown();
  }, [token, getFamiliesForDropdown]);

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
      
      // On success, call the callback function to close the modal and refresh dashboard data.
      if (onSuccess) {
        onSuccess();
      }
      // Also reset the form for next time
      setFormData({ name: "", target_amount: "", target_date: "", family_id: "" });

    } catch (err) {
      console.error('Failed to create goal:', err);
      setFormError("A network error occurred. Please try again.");
    }
  }

  return (
    <div className="w-full">
      {/* The title will be provided by the Modal */}
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
        <button type="submit" className="primary-btn w-full">Set Goal</button>
      </form>
    </div>
  );
}