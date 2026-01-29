'use client'; // Required due to the use of useState, useContext, and browser APIs (fetch, FormData, File)

import { useState, useContext, FormEvent, ChangeEvent } from 'react';
import { AppContext } from '../../../Context/AppContext.jsx'; // Fixed Import path (up 3 levels)

// The Goal interface (retained for type clarity, will be stripped in JS conversion)
// NOTE: Since the original file was TSX, I'll keep the types here but ensure it converts correctly to JS/TSX-compatible code.
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

// ⭐️ Next.js change: Replace import.meta.env with process.env.NEXT_PUBLIC_
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// Function component signature with props type annotation (from original .tsx)
export default function CompleteGoalWidget({ goal, onSuccess }: CompleteGoalWidgetProps) {
    const { user } = useContext(AppContext);
    
    // ⭐️ Next.js change: Replace import.meta.env with process.env.NEXT_PUBLIC_
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    // State typing retained from original .tsx
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('Confirm & Complete Goal');

    // Function typing retained from original .tsx
    const handleAttachmentChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachmentFile(e.target.files[0]);
        }
    };

    // Function typing retained from original .tsx
    const handleConfirmCompletion = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        setError(null);

        try {
            let achievementUrl: string | null = null;

            // 1. Upload Image
            if (attachmentFile) {
                setStatusMessage("Uploading photo...");
                const uploadFormData = new FormData();
                uploadFormData.append('file', attachmentFile);
                uploadFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                
                const response = await fetch(CLOUDINARY_API_URL, { method: 'POST', body: uploadFormData });
                if (!response.ok) throw new Error('Failed to upload achievement photo.');
                
                const data = await response.json();
                achievementUrl = data.secure_url;
            }

            // 2. Update Goal Status (Use API_URL)
            setStatusMessage("Updating Goal...");
            
            const goalUpdatePayload = {
                status: "completed",
                completed_at: new Date(), 
                completed_by_user_id: user.uid,
                ...(achievementUrl && { achievement_url: achievementUrl }),
            };

            const goalResponse = await fetch(`${API_URL}/goals/${goal.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(goalUpdatePayload)
            });

            if (!goalResponse.ok) throw new Error("Failed to update goal status on server.");

            // 3. Create Transaction (Use API_URL)
            setStatusMessage("Recording Transaction...");

            const transactionPayload = {
                user_id: user.uid,
                family_id: goal.family_id || null, 
                type: 'expense',
                amount: goal.target_amount,
                description: goal.family_id 
                    ? `Family Goal Achieved: ${goal.name}`
                    : `Goal Achieved: ${goal.name}`,
                created_at: new Date(),
                attachment_url: achievementUrl,
            };

            const transactionResponse = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionPayload)
            });

            if (!transactionResponse.ok) throw new Error("Goal updated, but failed to record transaction.");
            
            onSuccess();

        } catch (err: any) {
            console.error("Failed to complete goal:", err);
            setError(err.message || "Could not complete the goal.");
        } finally {
            setLoading(false);
            setStatusMessage('Confirm & Complete Goal');
        }
    };

    return (
        <form onSubmit={handleConfirmCompletion} className="space-y-4">
            <div>
                <p className="text-sm text-gray-600">You are about to complete the goal:</p>
                <p className="font-semibold text-lg text-gray-800 mt-1">{goal.name}</p>
                
                <p className="text-sm text-gray-500 mt-2">
                    {goal.family_id 
                        ? `An expense of ₱${goal.target_amount.toLocaleString()} will be recorded from the family's shared balance.`
                        : `An expense of ₱${goal.target_amount.toLocaleString()} will be recorded from your personal balance.`
                    }
                </p>
            </div>
            <hr />
            <div>
                <label htmlFor="achievementAttachment" className="block text-sm font-medium text-gray-700">
                    Upload a Photo of Your Achievement (Optional)
                </label>
                <input 
                    id="achievementAttachment" 
                    type="file" 
                    accept="image/*"
                    onChange={handleAttachmentChange} 
                    disabled={loading} 
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                />
            </div>
            
            {error && <p className="error text-center">{error}</p>}
            
            <button type="submit" className="primary-btn w-full" disabled={loading}>
                {loading ? statusMessage : 'Confirm & Complete Goal'}
            </button>
        </form>
    );
}