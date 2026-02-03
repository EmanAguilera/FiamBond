'use client'; // Required due to the use of useState, useContext, and browser APIs (fetch)

import { useContext, useState, FormEvent } from "react";
import { AppContext } from "../../../Context/AppContext.jsx";
import { API_BASE_URL } from '@/src/config/apiConfig';
import { toast } from "react-hot-toast";

interface Props {
  family: { id: string; family_name?: string };
  onSuccess?: () => void;
}

export default function CreateFamilyGoalWidget({ family, onSuccess }: Props) {
  const { user } = useContext(AppContext);

  const [formData, setFormData] = useState({ name: "", target_amount: "", target_date: "" });
  const [loading, setLoading] = useState(false);

  const handleCreateGoal = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Login required");
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          family_id: family.id, // Family Goal
          name: formData.name,
          target_amount: parseFloat(formData.target_amount),
          target_date: new Date(formData.target_date).toISOString(),
          status: "active",
        }),
      });

      if (!res.ok) throw new Error('Failed to create goal');
      
      toast.success("Family Goal Set!");
      setFormData({ name: "", target_amount: "", target_date: "" });
      onSuccess?.();
    } catch (err) {
      console.error("Goal creation error:", err);
      toast.error("Error creating goal");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full p-3 border border-slate-200 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400";

  return (
    <form onSubmit={handleCreateGoal} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Goal Name</label>
        <input
          type="text"
          required
          placeholder="e.g. Family Vacation"
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

      <button 
        disabled={loading} 
        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition shadow-lg shadow-indigo-200 mt-2 active:scale-[0.98]"
      >
        {loading ? 'Setting Goal...' : 'Set Family Goal'}
      </button>
    </form>
  );
}