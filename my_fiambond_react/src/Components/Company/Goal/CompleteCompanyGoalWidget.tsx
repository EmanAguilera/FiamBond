import { useState, useContext, FormEvent, ChangeEvent } from 'react';
import { AppContext } from '../../../Context/AppContext';
import { toast } from 'react-hot-toast';

const CLOUD_URL = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy"}/image/upload`;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
        if (!user) return;

        const goalId = goal.id || goal._id;
        if (!goalId) {
            toast.error("Error: Goal ID missing.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let achievementUrl = null;

            // 1. Upload Proof
            if (file) {
                setStatusBtn("Uploading proof...");
                const fd = new FormData();
                fd.append('file', file);
                fd.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default");
                
                const res = await fetch(CLOUD_URL, { method: 'POST', body: fd });
                if (!res.ok) throw new Error('Upload failed');
                achievementUrl = (await res.json()).secure_url;
            }

            // 2. Update Goal Status
            setStatusBtn("Updating Target...");
            const goalRes = await fetch(`${API_URL}/goals/${goalId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: "completed",
                    completed_at: new Date().toISOString(),
                    completed_by_user_id: user.uid,
                    achievement_url: achievementUrl
                })
            });

            if (!goalRes.ok) throw new Error("Failed to update goal");

            // 3. Record Company Expense
            setStatusBtn("Recording Expense...");
            const txRes = await fetch(`${API_URL}/transactions`, {
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

            if (!txRes.ok) throw new Error("Failed to record expense");

            toast.success("Target Achieved & Recorded!");
            if (onSuccess) {
                onSuccess();
            }

        } catch (err: any) {
            console.error("Completion Error:", err);
            setError(err.message || "Error completing target");
            toast.error("Failed to complete target");
        } finally {
            setLoading(false);
            setStatusBtn('Confirm & Complete Goal');
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            {/* Header Section matching the Screenshot */}
            <div>
                <p className="text-sm text-gray-600">You are about to complete the goal:</p>
                <p className="font-semibold text-lg text-gray-800 mt-1">{goal.name}</p>
                
                <p className="text-sm text-gray-500 mt-2">
                    An expense of ₱{parseFloat(goal.target_amount.toString()).toLocaleString()} will be recorded from the Company Ledger.
                </p>
            </div>

            <hr className="border-gray-200" />

            {/* File Input matching the Screenshot style */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload a Photo of Your Achievement (Optional)
                </label>
                <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFile}
                    disabled={loading}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                />
            </div>

            {error && <p className="text-center text-sm font-bold text-rose-500">{error}</p>}

            {/* Submit Button */}
            <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
            >
                {loading ? statusBtn : 'Confirm & Complete Goal'}
            </button>
        </form>
    );
}