'use client';

import React, { useState, useContext, FormEvent } from 'react'; // Added React to imports
import { AppContext } from '../../../Context/AppContext';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '@/src/config/apiConfig';

interface Props {
    company: { id: string | number };
    onSuccess?: () => void;
}

export default function CreateCompanyGoalWidget({ company, onSuccess }: Props) {
    const { user } = useContext(AppContext);

    const [formData, setFormData] = useState({ 
        name: '', 
        target_amount: '', 
        target_date: '' 
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user) return toast.error("Session expired. Please login.");

        // Basic validation for target date not in the past (replicated from CreateGoalWidget logic)
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
                    company_id: company.id, // <-- Company-specific logic
                    name: formData.name,
                    target_amount: parseFloat(formData.target_amount),
                    target_date: new Date(formData.target_date).toISOString(),
                    status: 'active'
                })
            });

            if (!res.ok) throw new Error("Failed to create goal");

            toast.success("Strategic Target Set!");
            setFormData({ name: '', target_amount: '', target_date: '' });
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error("Goal Creation Error:", error);
            toast.error(error.message || "Error creating target");
        } finally {
            setLoading(false);
        }
    };

    // Replicating the input class from CreateGoalWidget.tsx
    const inputClass = "w-full p-4 border border-slate-200 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300 font-medium";

    return (
        <form onSubmit={handleSubmit} className="space-y-5"> {/* Replicating space-y-5 */}
            {/* Name - Replicated UI from CreateGoalWidget */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                    Target Name
                </label>
                <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className={inputClass}
                    placeholder="e.g. Q4 Revenue"
                />
            </div>

            {/* Amount - Replicated UI from CreateGoalWidget */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                    Target Amount (₱)
                </label>
                <input 
                    type="number" 
                    step="0.01"
                    required
                    value={formData.target_amount}
                    onChange={e => setFormData({...formData, target_amount: e.target.value})}
                    className={inputClass}
                    placeholder="0.00"
                />
            </div>

            {/* Date - Replicated UI from CreateGoalWidget */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                    Deadline
                </label>
                <input 
                    type="date" 
                    required
                    value={formData.target_date}
                    onChange={e => setFormData({...formData, target_date: e.target.value})}
                    className={inputClass}
                />
            </div>

            {/* Submit Button - Replicated UI from CreateGoalWidget */}
            <button 
                disabled={loading} 
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-[0.98] shadow-lg shadow-indigo-100 mt-2"
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Setting Target...
                    </span>
                ) : 'Set Target'}
            </button>
        </form>
    );
}