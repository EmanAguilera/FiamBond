'use client'; // Required due to the use of useState, useContext, and browser APIs

import { useState, useContext, FormEvent, ChangeEvent } from 'react';
import { AppContext } from "../../../Context/AppContext";
import { API_BASE_URL } from '@/src/config/apiConfig';
import { toast } from 'react-hot-toast';

interface Goal {
    id: string; 
    name: string;
    target_amount: number;
    family_id: string | null;
    family?: {
        family_name: string;
    }
}

interface CompleteGoalWidgetProps {
    goal: Goal;
    onSuccess: () => void;
}

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export default function CompleteGoalWidget({ goal, onSuccess }: CompleteGoalWidgetProps) {
    const { user } = useContext(AppContext);
    
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<string>('Confirm & Complete Goal');

    const handleAttachmentChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachmentFile(e.target.files[0]);
        }
    };

    const handleConfirmCompletion = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return toast.error("User session not found");
        
        setLoading(true);

        try {
            let achievementUrl: string | null = null;

            // 1. Upload Achievement Photo
            if (attachmentFile) {
                setStatusMessage("Uploading photo...");
                const uploadFormData = new FormData();
                uploadFormData.append('file', attachmentFile);
                uploadFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                
                const cloudRes = await fetch(CLOUDINARY_API_URL, { method: 'POST', body: uploadFormData });
                if (!cloudRes.ok) throw new Error('Failed to upload achievement photo.');
                
                const cloudData = await cloudRes.json();
                achievementUrl = cloudData.secure_url;
            }

            // 2. Update Goal Status
            setStatusMessage("Updating Goal...");
            
            const goalUpdatePayload = {
                status: "completed",
                completed_at: new Date().toISOString(), 
                completed_by_user_id: user.uid,
                ...(achievementUrl && { achievement_url: achievementUrl }),
            };

            const goalRes = await fetch(`${API_BASE_URL}/goals/${goal.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(goalUpdatePayload)
            });

            if (!goalRes.ok) throw new Error("Failed to update goal status.");

            // 3. Create Automated Transaction
            setStatusMessage("Recording Transaction...");

            const transactionPayload = {
                user_id: user.uid,
                family_id: goal.family_id || null, 
                type: 'expense',
                amount: goal.target_amount,
                description: goal.family_id 
                    ? `Family Goal Achieved: ${goal.name}`
                    : `Goal Achieved: ${goal.name}`,
                created_at: new Date().toISOString(),
                attachment_url: achievementUrl,
            };

            const txRes = await fetch(`${API_BASE_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionPayload)
            });

            if (!txRes.ok) throw new Error("Goal completed, but transaction record failed.");
            
            toast.success("Congratulations! Goal Completed.");
            onSuccess();

        } catch (err: any) {
            console.error("Completion error:", err);
            toast.error(err.message || "Could not complete the goal.");
        } finally {
            setLoading(false);
            setStatusMessage('Confirm & Complete Goal');
        }
    };

    return (
        <form onSubmit={handleConfirmCompletion} className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Target Achievement</p>
                <p className="font-bold text-xl text-slate-800">{goal.name}</p>
                
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        ₱
                    </div>
                    <span>
                        {goal.family_id ? 'Family' : 'Personal'} expense of 
                        <span className="font-bold text-slate-800 ml-1">₱{goal.target_amount.toLocaleString()}</span>
                    </span>
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="achievementAttachment" className="block text-sm font-bold text-slate-700">
                    Proof of Achievement <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative group">
                    <input 
                        id="achievementAttachment" 
                        type="file" 
                        accept="image/*"
                        onChange={handleAttachmentChange} 
                        disabled={loading} 
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:uppercase file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50/50" 
                    />
                </div>
                <p className="text-[10px] text-slate-400 italic">Uploading a photo will attach it to the transaction and the goal history.</p>
            </div>
            
            <button 
                type="submit" 
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2" 
                disabled={loading}
            >
                {loading && (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                {loading ? statusMessage : 'Confirm & Complete Goal'}
            </button>
        </form>
    );
}