import { useContext, useState } from "react";
import { AppContext } from "../Context/AppContext.jsx";

export default function CreateFamilyGoalWidget({ family, onSuccess }) {
  const { token } = useContext(AppContext);

  // MODIFIED: Added target_date to the initial state
  const [formData, setFormData] = useState({ name: "", target_amount: "", target_date: "" });
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState(null);

  async function handleCreateGoal(e) {
    e.preventDefault();
    setFormErrors({});
    setFormError(null);
    
    const bodyPayload = { ...formData, family_id: family.id };

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
      
      if (onSuccess) onSuccess();

    } catch (err) {
      console.error('Failed to create family goal:', err);
      setFormError("A network error occurred. Please try again.");
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleCreateGoal} className="space-y-4">
        <div>
          <input type="text" placeholder="Goal Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 border rounded-md"/>
          {formErrors.name && <p className="error">{formErrors.name[0]}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input type="number" placeholder="Target Amount" value={formData.target_amount} onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })} className="w-full p-2 border rounded-md"/>
            {formErrors.target_amount && <p className="error">{formErrors.target_amount[0]}</p>}
          </div>
          {/* MODIFIED: Added the date input field */}
          <div>
            <input type="date" value={formData.target_date} onChange={(e) => setFormData({ ...formData, target_date: e.target.value })} className="w-full p-2 border rounded-md text-gray-500"/>
            {formErrors.target_date && <p className="error">{formErrors.target_date[0]}</p>}
          </div>
        </div>
        {formError && <p className="error">{formError}</p>}
        <button type="submit" className="primary-btn w-full">Set Goal</button>
      </form>
    </div>
  );
}