'use client'; 

import React, { useState, useContext, FormEvent } from "react";
import { AppContext } from "../../context/AppContext";
import { API_BASE_URL } from '../../config/apiConfig';
import { toast } from "react-hot-toast";

// 🏎️ Simplex Move: Import your unified loader
import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";

type GoalMode = 'personal' | 'family' | 'company';

interface GoalFormWidgetProps {
  mode: GoalMode;
  entityId?: string | number; 
  onSuccess?: () => void;
  labels?: {
    title?: string;
    button?: string;
    placeholder?: string;
  };
}

export default function GoalFormWidget({ mode, entityId, onSuccess, labels }: GoalFormWidgetProps) {
  // FIX: Cast context to 'any' to prevent 'never' type loop
  const context = useContext(AppContext) as any || {};
  const user = context.user;

  const [formData, setFormData] = useState({ 
    name: "", 
    target_amount: "", 
    target_date: "" 
  });
  const [loading, setLoading] = useState(false);

  // Dynamic labels based on mode
  const displayLabels = {
    name: labels?.title || (mode === 'company' ? "Target Name" : "Goal Name"),
    button: labels?.button || (
        mode === 'company' ? "Set Target" : 
        mode === 'family' ? "Set Family Goal" : "Set Goal"
    ),
    placeholder: labels?.placeholder || (
        mode === 'company' ? "e.g. Q4 Revenue" : 
        mode === 'family' ? "e.g. Family Vacation" : "e.g. Travel Fund"
    )
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!user || !user.uid) {
      return toast.error("Login required");
    }

    if (new Date(formData.target_date) < new Date(new Date().setHours(0,0,0,0))) {
      return toast.error("Target date cannot be in the past");
    }

    setLoading(true);
    try {
      const payload: any = {
        user_id: user.uid,
        name: formData.name,
        target_amount: parseFloat(formData.target_amount),
        target_date: new Date(formData.target_date).toISOString(), 
        status: "active",
        family_id: mode === 'family' ? entityId : null,
        company_id: mode === 'company' ? entityId : null,
      };

      const res = await fetch(`${API_BASE_URL}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Server error');

      toast.success(`${displayLabels.name} Set Successfully`);
      setFormData({ name: "", target_amount: "", target_date: "" });
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error("Error creating goal");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full p-4 border border-slate-200 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300 font-medium";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label className={labelClass}>{displayLabels.name}</label>
        <input
          type="text"
          required
          placeholder={displayLabels.placeholder}
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          className={inputClass}
        />
      </div>

      {/* Amount */}
      <div>
        <label className={labelClass}>Target Amount (₱)</label>
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
        <label className={labelClass}>Target Date</label>
        <input
          type="date"
          required
          value={formData.target_date}
          onChange={e => setFormData({...formData, target_date: e.target.value})}
          className={inputClass}
        />
      </div>

      {/* 🛡️ Unified Button Feedback */}
      <button 
        type="submit"
        disabled={loading} 
        className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-70 transition-all active:scale-[0.98] shadow-lg shadow-indigo-100 mt-2"
      >
        {loading ? (
          <UnifiedLoadingWidget 
            type="inline" 
            message={mode === 'company' ? 'Syncing Target...' : 'Engaging Goal...'} 
          />
        ) : displayLabels.button}
      </button>
    </form>
  );
}