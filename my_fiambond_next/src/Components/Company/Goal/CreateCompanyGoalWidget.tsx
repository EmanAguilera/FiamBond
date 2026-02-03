'use client';

import { useState, useContext, FormEvent } from 'react';
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
        
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/goals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.uid,
                    company_id: company.id,
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

    const inputClass = "w-full p-3 border border-slate-200 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Target Name</label>
                <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className={inputClass}
                    placeholder="e.g. Q4 Revenue"
                />
            </div>

            {/* Amount */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Target Amount (₱)</label>
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

            {/* Date */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Deadline</label>
                <input 
                    type="date" 
                    required
                    value={formData.target_date}
                    onChange={e => setFormData({...formData, target_date: e.target.value})}
                    className={inputClass}
                />
            </div>

            {/* Submit Button */}
            <button 
                disabled={loading} 
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100 mt-2"
            >
                {loading ? 'Setting Target...' : 'Set Target'}
            </button>
        </form>
    );
}