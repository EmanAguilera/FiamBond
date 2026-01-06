import React, { useState, useContext, useEffect } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    Alert, 
    ActivityIndicator,
    Platform 
} from 'react-native';
import { AppContext } from '../../../Context/AppContext.jsx';

// --- INTERFACES FOR TYPE SAFETY ---
// The Goal interface (Needs to be defined in RN/TSX file)
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

// Placeholder for the native file/receipt object
interface NativeFile {
    uri: string;
    name: string;
    type: string; // e.g., 'image/jpeg', 'application/pdf'
}

// Interfaces for Context Fix (Error 2339)
interface User { 
    uid: string; 
    [key: string]: any; 
}
interface AppContextType { 
    user: User | null; 
    [key: string]: any; 
}
// ------------------------------------

// Cloudinary constants (use process.env in RN/Expo)
const CLOUDINARY_CLOUD_NAME = process.env.VITE_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = process.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export default function CompleteGoalWidget({ goal, onSuccess }: CompleteGoalWidgetProps) {
    // FIX: Assert context type with non-null assertion (!)
    const { user } = useContext(AppContext)! as AppContextType; 
    
    const API_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';

    const [attachmentFile, setAttachmentFile] = useState<NativeFile | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('Confirm & Complete Goal');

    // Placeholder for native file picker
    const handleNativeFileUpload = async () => {
        Alert.alert("File Picker", "Native file picker integration required.");
        
        // Simulating file selection for development:
        // setAttachmentFile({ uri: 'file:///temp/test.jpg', name: 'achievement.jpg', type: 'image/jpeg' });
    };

    const handleConfirmCompletion = async () => {
        // Safe check for user object access (user is now User | null)
        if (!user || !user.uid) {
            Alert.alert("Error", "Login required");
            return;
        }
        
        setLoading(true);
        setError(null);

        try {
            let achievementUrl: string | null = null;

            // 1. Upload Image
            if (attachmentFile) {
                setStatusMessage("Uploading photo...");
                const uploadFormData = new FormData();
                
                // Append the native file object to FormData
                uploadFormData.append('file', {
                    uri: attachmentFile.uri,
                    name: attachmentFile.name,
                    type: attachmentFile.type,
                } as any); // Cast to any to satisfy FormData requirements for file objects

                uploadFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                
                const response = await fetch(CLOUDINARY_API_URL, { 
                    method: 'POST', 
                    body: uploadFormData,
                    // RN handles Content-Type for multipart/form-data automatically
                    headers: {}, 
                });

                if (!response.ok) throw new Error('Failed to upload achievement photo.');
                
                const data = await response.json();
                achievementUrl = data.secure_url;
            }

            // 2. Update Goal Status (Use API_URL)
            setStatusMessage("Updating Goal...");
            
            const goalUpdatePayload = {
                status: "completed",
                completed_at: new Date(), 
                completed_by_user_id: user.uid, // SAFE access now
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
                user_id: user.uid, // SAFE access now
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
            
            Alert.alert("Success", "Goal successfully completed and transaction recorded!");
            onSuccess();

        } catch (err: any) {
            console.error("Failed to complete goal:", err);
            setError(err.message || "Could not complete the goal.");
            Alert.alert("Error", err.message || "Could not complete the goal.");
        } finally {
            setLoading(false);
            setStatusMessage('Confirm & Complete Goal');
        }
    };

    const targetAmountFormatted = `₱${goal.target_amount.toLocaleString()}`;

    return (
        <View style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.subtitle}>You are about to complete the goal:</Text>
                <Text style={styles.title}>{goal.name}</Text>
                
                <Text style={styles.infoText}>
                    {goal.family_id 
                        ? `An expense of ${targetAmountFormatted} will be recorded from the family's shared balance.`
                        : `An expense of ${targetAmountFormatted} will be recorded from your personal balance.`
                    }
                </Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.section}>
                <Text style={styles.label}>
                    Upload a Photo of Your Achievement (Optional)
                </Text>
                <TouchableOpacity 
                    onPress={handleNativeFileUpload} 
                    disabled={loading} 
                    style={styles.fileButton}
                >
                    <Text style={styles.fileButtonText}>
                        {attachmentFile ? `File Selected: ${attachmentFile.name}` : "Tap to Select Photo/File"}
                    </Text>
                    {attachmentFile && (
                         <TouchableOpacity onPress={() => setAttachmentFile(null)} style={styles.fileClearButton}>
                            <Text style={styles.fileClearText}>✕</Text>
                         </TouchableOpacity>
                    )}
                </TouchableOpacity>
                {attachmentFile && <Text style={styles.fileNameText}>Selected: {attachmentFile.name}</Text>}
            </View>
            
            {error && <Text style={styles.errorText}>{error}</Text>}
            
            <TouchableOpacity 
                onPress={handleConfirmCompletion} 
                style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>{statusMessage}</Text>}
            </TouchableOpacity>
        </View>
    );
}

// --- REACT NATIVE STYLESHEET ---
const styles = StyleSheet.create({
    container: {
        gap: 16, // space-y-4
        padding: 16,
    },
    section: {
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#4B5563', // text-gray-600
    },
    title: {
        fontWeight: '600', // font-semibold
        fontSize: 18, // text-lg
        color: '#1F2937', // text-gray-800
        marginTop: 4, // mt-1
    },
    infoText: {
        fontSize: 14,
        color: '#6B7280', // text-gray-500
        marginTop: 8, // mt-2
    },
    divider: {
        borderBottomWidth: 1,
        borderColor: '#E5E7EB', // hr
    },
    label: {
        fontSize: 14,
        fontWeight: '500', // font-medium
        color: '#374151', // text-gray-700
        marginBottom: 8,
    },

    // File Upload Button Styles
    fileButton: {
        marginTop: 4, // mt-1
        width: '100%',
        paddingVertical: 10, // py-2
        paddingHorizontal: 16, // px-4
        borderRadius: 8, // rounded-md
        borderWidth: 1,
        borderColor: '#D1D5DB', // border-gray-300
        backgroundColor: '#F9FAFB', // bg-gray-50
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    fileButtonText: {
        fontSize: 14, // text-sm
        fontWeight: '600', // font-semibold
        color: '#4F46E5', // text-blue-700
        flexShrink: 1,
    },
    fileClearButton: {
        padding: 4,
        borderRadius: 10,
        backgroundColor: '#E5E7EB',
        marginLeft: 8,
    },
    fileClearText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#4B5563',
    },
    fileNameText: {
        fontSize: 12,
        color: '#4F46E5',
        marginTop: 4,
        paddingHorizontal: 4,
    },


    // Submit Button Styles
    submitButton: {
        width: '100%',
        paddingVertical: 12, // py-3
        backgroundColor: '#4F46E5', // primary-btn / bg-indigo-600
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4, // shadow-md
    },
    submitButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    
    // Error Text
    errorText: {
        color: '#EF4444', // error
        textAlign: 'center',
        fontSize: 14,
    }
});