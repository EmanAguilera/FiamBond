'use client';

import { useState, useContext, FormEvent, ChangeEvent } from 'react';
import { AppContext } from '../../../Context/AppContext';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '@/src/config/apiConfig';

// Cloudinary Config (Environment variables preferred)
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";
const CLOUD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

interface Goal {
    id?: string;
    _id?: string;
    name: string;
    target_amount: number;
    company_id: string;
}

interface Props {
    goal: Goal;
    onSuccess: () => void;
}

export default function CompleteCompanyGoalWidget({ goal, onSuccess }: Props) {
    const { user } = useContext(AppContext);
    
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusBtn, setStatusBtn] = useState('Confirm & Complete Goal');

    const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
        setFile(e.target.files?.[0] || null);
    };

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user) return toast.error("User session not found.");

        const goalId = goal.id || goal._id;
        if (!goalId) {
            toast.error("Error: Goal ID missing.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let achievementUrl = null;

            // 1. Upload Proof to Cloudinary
            if (file) {
                setStatusBtn("Uploading proof...");
                const fd = new FormData();
                fd.append('file', file);
                fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                
                const cloudRes = await fetch(CLOUD_URL, { method: 'POST', body: fd });
                if (!cloudRes.ok) throw new Error('Cloudinary upload failed');
                const cloudData = await cloudRes.json();
                achievementUrl = cloudData.secure_url;
            }

            // 2. Update Goal Status via API_BASE_URL
            setStatusBtn("Updating Target...");
            const goalRes = await fetch(`${API_BASE_URL}/goals/${goalId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: "completed",
                    completed_at: new Date().toISOString(),
                    completed_by_user_id: user.uid,
                    achievement_url: achievementUrl
                })
            });

            if (!goalRes.ok) throw new Error("Failed to update goal status");

            // 3. Record Company Expense via API_BASE_URL
            setStatusBtn("Recording Expense...");
            const txRes = await fetch(`${API_BASE_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.uid,
                    company_id: goal.company_id, 
                    type: 'expense', 
                    amount: Number(goal.target_amount),
                    description: `Target Achieved: ${goal.name}`,
                    created_at: new Date().toISOString(),
                    attachment_url: achievementUrl
                })
            });

            if (!txRes.ok) throw new Error("Failed to record ledger expense");

            toast.success("Target Achieved & Recorded!");
            if (onSuccess) onSuccess();

        } catch (err: any) {
            console.error("Completion Error:", err);
            setError(err.message || "Error completing target");
            toast.error(err.message || "Failed to complete target");
        } finally {
            setLoading(false);
            setStatusBtn('Confirm & Complete Goal');
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div>
                <p className="text-sm text-slate-600">You are about to complete the goal:</p>
                <p className="font-bold text-lg text-slate-800 mt-1">{goal.name}</p>
                
                <p className="text-sm text-slate-500 mt-2">
                    An expense of <span className="font-bold text-slate-700">₱{parseFloat(goal.target_amount.toString()).toLocaleString()}</span> will be recorded in the Company Ledger.
                </p>
            </div>

            <hr className="border-slate-100" />

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                    Upload Proof of Achievement <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFile}
                    disabled={loading}
                    className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors border border-slate-200 rounded-lg p-1.5"
                />
            </div>

            {error && (
                <div className="p-3 bg-rose-50 rounded-lg">
                    <p className="text-center text-xs font-bold text-rose-500">{error}</p>
                </div>
            )}

            <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100"
            >
                {loading ? statusBtn : 'Confirm & Complete Goal'}
            </button>
        </form>
    );
}