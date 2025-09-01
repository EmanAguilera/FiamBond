import { useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../Context/AppContext.jsx";

// The modal component remains unchanged as its styling is already self-contained and effective.
function CoinTossModal({ goal, onAbandon, onAcknowledge }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl text-center w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">A Choice Must Be Made</h2>
        <p className="mb-6 text-slate-700">
          This action conflicts with your goal: <span className="font-bold text-indigo-600">"{goal.name}"</span>.
          You have introduced a variable. You must call it.
        </p>
        <div className="space-y-4">
          <button onClick={onAbandon} className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-md hover:bg-red-700 transition-colors">
            [ Abandon Goal ]
          </button>
          <button onClick={onAcknowledge} className="w-full bg-slate-600 text-white font-bold py-3 px-4 rounded-md hover:bg-slate-700 transition-colors">
            [ Acknowledge Consequence ]
          </button>
        </div>
      </div>
    </div>
  );
}


export default function CreateTransaction() {
  const navigate = useNavigate();
  const { token } = useContext(AppContext);

  const [formData, setFormData] = useState({ 
    description: "", 
    amount: "", 
    type: "expense",
    family_id: "" // <-- Add family_id to state, empty string for "Personal"
  });
  const [errors, setErrors] = useState({});
  const [conflict, setConflict] = useState(null);

  // --- START OF FIX ---
  // State to hold the user's families for the dropdown
  const [families, setFamilies] = useState([]);

  // Function to fetch the families the user belongs to
  const getFamilies = useCallback(async () => {
    const res = await fetch("/api/families", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setFamilies(data);
    }
  }, [token]);

  // Fetch families when the component mounts
  useEffect(() => {
    if (token) {
      getFamilies();
    }
  }, [token, getFamilies]);
  // --- END OF FIX ---


  async function handleCreateTransaction(e, force = false) {
    if (e) e.preventDefault();
    
    // Make sure we send a clean payload
    const bodyPayload = { ...formData };
    if (force) {
      bodyPayload.force_creation = true;
    }
    // If 'family_id' is an empty string, remove it so the backend sees it as null
    if (bodyPayload.family_id === "") {
        delete bodyPayload.family_id;
    }

    const res = await fetch("/api/transactions", {
      method: "post",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(bodyPayload),
    });

    const data = await res.json();

    if (res.status === 409) {
      setConflict(data.goal);
    } else if (res.status === 422) {
      setErrors(data.errors);
      setConflict(null);
    } else if (res.ok) {
      navigate("/");
    }
  }

  async function handleAbandon() {
    await fetch(`/api/goals/${conflict.id}`, {
        method: 'delete',
        headers: { Authorization: `Bearer ${token}` }
    });
    handleCreateTransaction(null, true); 
  }

  function handleAcknowledge() {
    handleCreateTransaction(null, true);
  }

  return (
    <>
      {conflict && (
        <CoinTossModal 
            goal={conflict}
            onAbandon={handleAbandon}
            onAcknowledge={handleAcknowledge}
        />
      )}

      <h1 className="title">Add a New Transaction</h1>

      {/* The main card container, styled like the other pages */}
      <div className="w-full max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleCreateTransaction} className="space-y-6">
          {/* Radio buttons for transaction type */}
          <div className="flex justify-center gap-8 text-gray-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="expense"
                checked={formData.type === "expense"}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              Expense
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="type"
                value="income"
                checked={formData.type === "income"}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              Income
            </label>
          </div>

            <div>
            <select
                value={formData.family_id}
                onChange={(e) => setFormData({ ...formData, family_id: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
                <option value="">-- Personal Transaction --</option>
                {families.map((family) => (
                    <option key={family.id} value={family.id}>
                        For Family: {family.first_name}
                    </option>
                ))}
            </select>
            {errors.family_id && <p className="error">{errors.family_id[0]}</p>}
          </div>
          {/* --- END OF FIX --- */}
          
          <div>
            <input
              type="text"
              placeholder="Description (e.g., Groceries, Paycheck)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.description && <p className="error">{errors.description[0]}</p>}
          </div>
          <div>
            <input
              type="number"
              placeholder="Amount"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.amount && <p className="error">{errors.amount[0]}</p>}
          </div>
          <button type="submit" className="primary-btn">
            Save Transaction
          </button>
        </form>
      </div>
    </>
  );
}