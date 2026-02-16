'use client'; 

import React, { useState, useContext, FormEvent } from 'react';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../config/apiConfig';

// 🏎️ Simplex Move: Import your unified loader
import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";

interface UnifiedGoalProps {
    realm: 'personal' | 'family' | 'company';
    entityId?: string | number; 
    entityName?: string;       
    onSuccess?: () => void;
}

export default function UnifiedGoalWidget({ realm, entityId, entityName, onSuccess }: UnifiedGoalProps) {
    const context = useContext(AppContext) as any || {};
    const user = context.user;

    const [formData, setFormData] = useState({ 
        name: '', 
        target_amount: '', 
        target_date: '' 
    });
    const [loading, setLoading] = useState(false);

    const labels = {
        personal: { title: "Personal Goal", placeholder: "e.g. Travel Fund", success: "Goal Set Successfully!" },
        family: { title: `Family Goal (${entityName || 'Family'})`, placeholder: "e.g. New Home", success: "Family Goal Set!" },
        company: { title: `Strategic Target (${entityName || 'Company'})`, placeholder: "e.g. Q4 Revenue", success: "Strategic Target Set!" }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!user || !user.uid) {
            return toast.error("Session expired. Please login.");
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
                status: 'active'
            };

            if (realm === 'family') payload.family_id = entityId;
            if (realm === 'company') payload.company_id = entityId;
            if (realm === 'personal') payload.family_id = null; 

            const res = await fetch(`${API_BASE_URL}/goals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to create goal");

            toast.success(labels[realm].success);
            setFormData({ name: '', target_amount: '', target_date: '' });
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error("Goal Creation Error:", error);
            toast.error(error.message || "Error creating target");
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full p-4 border border-slate-200 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300 font-medium";

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                    {labels[realm].title} Name
                </label>
                <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className={inputClass}
                    placeholder={labels[realm].placeholder}
                />
            </div>

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

            {/* 🛡️ Unified Button Feedback Pattern */}
            <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-70 transition-all active:scale-[0.98] shadow-lg shadow-indigo-100 mt-2"
            >
                {loading ? (
                    <UnifiedLoadingWidget 
                        type="inline" 
                        message="Engaging Core..." 
                    />
                ) : (
                    `Set ${realm.charAt(0).toUpperCase() + realm.slice(1)} Goal`
                )}
            </button>
        </form>
    );
}