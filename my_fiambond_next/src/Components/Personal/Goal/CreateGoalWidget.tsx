'use client'; // Required due to the use of useState, useContext, and browser APIs (fetch)

import { useContext, useState, FormEvent } from "react";
import { AppContext } from "../../../Context/AppContext";
import { toast } from "react-hot-toast";

interface CreateGoalWidgetProps {
  onSuccess?: () => void;
}

export default function CreateGoalWidget({ onSuccess }: CreateGoalWidgetProps) {
  const { user } = useContext(AppContext);
  // ⭐️ Next.js change: Replace import.meta.env.VITE_API_URL with process.env.NEXT_PUBLIC_API_URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const [formData, setFormData] = useState({ name: "", target_amount: "", target_date: "" });
  const [loading, setLoading] = useState(false);

  const handleCreateGoal = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Login required");

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          family_id: null, 
          name: formData.name,
          target_amount: parseFloat(formData.target_amount),
          // Ensure date is converted to ISO string for backend
          target_date: new Date(formData.target_date).toISOString(), 
          status: "active",
        }),
      });

      if (!res.ok) throw new Error('Server error');

      toast.success("Goal Set Successfully");
      setFormData({ name: "", target_amount: "", target_date: "" });
      onSuccess?.();
    } catch (err) {
      toast.error("Error creating goal");
    } finally {
      setLoading(false);
    }
  };

  // FIX: Changed 'bg-slate-50' to 'bg-white' so it's always white, not gray.
  const inputClass = "w-full p-3 border border-slate-200 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400";

  return (
    <form onSubmit={handleCreateGoal} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Goal Name</label>
        <input
          type="text"
          required
          placeholder="e.g. New Laptop"
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          className={inputClass}
        />
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Target Amount (₱)</label>
        <input
          type="number"
          step="0.01"
          required
          placeholder="0.00"
          value={formData.target_amount}
          onChange={e => setFormData({...formData, target_amount: e.target.value})}
          className={inputClass} 
        />
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Target Date</label>
        <input
          type="date"
          required
          value={formData.target_date}
          onChange={e => setFormData({...formData, target_date: e.target.value})}
          className={inputClass}
        />
      </div>

      <button disabled={loading} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition shadow-lg shadow-indigo-200 mt-2">
        {loading ? 'Setting Goal...' : 'Set Goal'}
      </button>
    </form>
  );
}