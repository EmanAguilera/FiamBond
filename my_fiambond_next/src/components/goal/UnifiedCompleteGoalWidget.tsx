'use client';

import { useState, useContext, FormEvent, ChangeEvent } from 'react';
import { AppContext } from "../../context/AppContext";
import { API_BASE_URL } from '../../config/apiConfig';
import { toast } from 'react-hot-toast';

// 🏎️ Simplex Move: Import your unified loader
import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";

interface Goal {
    id?: string;
    _id?: string;
    name: string;
    target_amount: number | string;
    family_id?: string | null;
    company_id?: string | null;
}

type GoalMode = 'personal' | 'family' | 'company';

interface Props {
    goal: Goal;
    mode: GoalMode;
    onSuccess: () => void;
}

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export default function UnifiedCompleteGoalWidget({ goal, mode, onSuccess }: Props) {
    const context = useContext(AppContext) as any || {};
    const user = context.user;

    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Confirm & Complete');

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setFile(e.target.files[0]);
    };

    const handleComplete = async (e: FormEvent) => {
        e.preventDefault();

        if (!user || !user.uid) {
            return toast.error("User session not found. Please log in again.");
        }

        const goalId = goal.id || goal._id;
        const amount = typeof goal.target_amount === 'string' ? parseFloat(goal.target_amount) : goal.target_amount;

        setLoading(true);
        try {
            let achievementUrl = null;

            // 1. Upload to Cloudinary
            if (file) {
                setStatusMessage("Uploading proof...");
                const fd = new FormData();
                fd.append('file', file);
                fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                
                const cloudRes = await fetch(CLOUDINARY_API_URL, { method: 'POST', body: fd });
                if (!cloudRes.ok) throw new Error('Photo upload failed');
                const cloudData = await cloudRes.json();
                achievementUrl = cloudData.secure_url;
            }

            // 2. Update Goal Status
            setStatusMessage("Updating status...");
            const goalUpdateRes = await fetch(`${API_BASE_URL}/goals/${goalId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: "completed",
                    completed_at: new Date().toISOString(),
                    completed_by_user_id: user.uid, 
                    achievement_url: achievementUrl,
                })
            });
            if (!goalUpdateRes.ok) throw new Error("Failed to update goal");

            // 3. Record Transaction (Expense)
            setStatusMessage("Recording ledger...");
            const txDescription = mode === 'company' 
                ? `Target Achieved: ${goal.name}` 
                : mode === 'family' 
                    ? `Family Goal Achieved: ${goal.name}` 
                    : `Goal Achieved: ${goal.name}`;

            const txPayload = {
                user_id: user.uid,
                family_id: mode === 'family' ? goal.family_id : null,
                company_id: mode === 'company' ? goal.company_id : null,
                type: 'expense',
                amount: amount,
                description: txDescription,
                created_at: new Date().toISOString(),
                attachment_url: achievementUrl,
            };

            const txRes = await fetch(`${API_BASE_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(txPayload)
            });

            if (!txRes.ok) throw new Error("Goal updated, but ledger entry failed");

            toast.success(mode === 'company' ? "Target Achieved!" : "Goal Completed!");
            onSuccess();
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Error completing goal");
        } finally {
            setLoading(false);
            setStatusMessage('Confirm & Complete');
        }
    };

    return (
        <form onSubmit={handleComplete} className="space-y-6">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                    {mode === 'company' ? 'Strategic Target' : 'Target Achievement'}
                </p>
                <p className="font-extrabold text-xl text-slate-800">{goal.name}</p>
                
                <div className="mt-3 flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                        ₱
                    </div>
                    <p>
                        A {mode} expense of 
                        <span className="font-bold text-slate-800 ml-1">
                            ₱{Number(goal.target_amount).toLocaleString()}
                        </span> will be recorded.
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 ml-1">
                    Proof of Achievement <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange} 
                    disabled={loading} 
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50/50 transition-all" 
                />
            </div>
            
            <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-70 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 active:scale-[0.98]" 
            >
                {loading ? (
                    <UnifiedLoadingWidget 
                        type="inline" 
                        message={statusMessage} 
                    />
                ) : (
                    'Confirm & Complete Goal'
                )}
            </button>
        </form>
    );
}