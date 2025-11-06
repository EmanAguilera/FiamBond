import { useState, useContext, FormEvent, ChangeEvent } from 'react';
import { AppContext } from '../../Context/AppContext.jsx';
import { db } from '../../config/firebase-config.js';
import { doc, serverTimestamp, writeBatch, collection } from 'firebase/firestore';

// The Goal interface is correct
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

// Cloudinary details remain the same
const CLOUDINARY_CLOUD_NAME = "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = "ml_default";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;


export default function CompleteGoalWidget({ goal, onSuccess }: CompleteGoalWidgetProps) {
    const { user } = useContext(AppContext);
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('Confirm & Complete Goal');

    const handleAttachmentChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAttachmentFile(e.target.files[0]);
        }
    };

    const handleConfirmCompletion = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        setError(null);

        try {
            let achievementUrl: string | null = null;

            if (attachmentFile) {
                // ... (Cloudinary upload logic is unchanged) ...
                setStatusMessage("Uploading photo...");
                const uploadFormData = new FormData();
                uploadFormData.append('file', attachmentFile);
                uploadFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                const response = await fetch(CLOUDINARY_API_URL, { method: 'POST', body: uploadFormData });
                if (!response.ok) throw new Error('Failed to upload achievement photo.');
                const data = await response.json();
                achievementUrl = data.secure_url;
            }

            setStatusMessage("Finalizing...");
            const batch = writeBatch(db);

            // 1. Update the Goal Document (this is always the same)
            const goalDocRef = doc(db, "goals", goal.id);
            batch.update(goalDocRef, {
                status: "completed",
                completed_at: serverTimestamp(),
                completed_by_user_id: user.uid,
                ...(achievementUrl && { achievement_url: achievementUrl }),
            });

            // --- THIS IS THE FIX ---
            if (goal.family_id) {
                // IT IS A FAMILY GOAL: Create ONLY ONE transaction for the family.
                // The expense comes from the family's shared fund.
                const familyTransactionRef = doc(collection(db, "transactions"));
                batch.set(familyTransactionRef, {
                    user_id: user.uid, // We still track WHO completed it
                    family_id: goal.family_id,
                    type: 'expense',
                    amount: goal.target_amount,
                    description: `Family Goal Achieved: ${goal.name}`,
                    created_at: serverTimestamp(),
                    attachment_url: achievementUrl,
                });

            } else {
                // IT IS A PERSONAL GOAL: Create one personal transaction (original logic is correct here)
                const personalTransactionRef = doc(collection(db, "transactions"));
                batch.set(personalTransactionRef, {
                    user_id: user.uid,
                    family_id: null,
                    type: 'expense',
                    amount: goal.target_amount,
                    description: `Goal Achieved: ${goal.name}`,
                    created_at: serverTimestamp(),
                    attachment_url: achievementUrl,
                });
            }
            
            await batch.commit();
            onSuccess();

        } catch (err: any) {
            console.error("Failed to complete goal:", err);
            setError(err.message || "Could not complete the goal. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleConfirmCompletion} className="space-y-4">
            <div>
                <p className="text-sm text-gray-600">You are about to complete the goal:</p>
                <p className="font-semibold text-lg text-gray-800 mt-1">{goal.name}</p>
                
                {/* --- FIX: Updated disclaimer text to be accurate --- */}
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