'use client'; // Required due to the use of useState, useContext, and browser APIs (fetch)

import React, { useContext, useState, FormEvent } from "react";
import { AppContext } from "../../../Context/AppContext";
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

    // Basic validation to ensure the date isn't in the past (Consistent with other Goal Widgets)
    if (new Date(formData.target_date) < new Date(new Date().setHours(0,0,0,0))) {
      return toast.error("Target date cannot be in the past");
    }
    
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

  // Replicated input class from CreateCompanyGoalWidget / CreateGoalWidget
  const inputClass = "w-full p-4 border border-slate-200 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300 font-medium";

  return (
    <form onSubmit={handleCreateGoal} className="space-y-5"> {/* Replicated space-y-5 */}
      {/* Name */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1"> {/* Replicated label style */}
          Goal Name
        </label>
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
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1"> {/* Replicated label style */}
          Target Amount (₱)
        </label>
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
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1"> {/* Replicated label style */}
          Target Date
        </label>
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
        // Replicated button style from CreateCompanyGoalWidget
        className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-[0.98] shadow-lg shadow-indigo-100 mt-2"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Setting Goal...
          </span>
        ) : 'Set Family Goal'}
      </button>
    </form>
  );
}