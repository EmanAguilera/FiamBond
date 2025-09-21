import { useContext, useState } from "react";
import { AppContext } from "../Context/AppContext.jsx";

export default function CreateFamilyWidget({ onSuccess }) {
  const { token } = useContext(AppContext);
  const [familyName, setFamilyName] = useState("");
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);

  async function handleCreateFamily(e) {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/families`, {
        method: "post",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ first_name: familyName }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 422) {
          setErrors(data.errors);
        } else {
          setGeneralError(data.message || "Failed to create the family.");
        }
        return;
      }

      // On success, reset the form and call the callback
      setFamilyName("");
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to create family:', error);
      setGeneralError('A network error occurred. Please check your connection.');
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleCreateFamily} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Family Name (e.g., Smith Household)"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.first_name && <p className="error">{errors.first_name[0]}</p>}
        </div>
        {generalError && <p className="error">{generalError}</p>}
        <button type="submit" className="primary-btn w-full">Create Family</button>
      </form>
    </div>
  );
}