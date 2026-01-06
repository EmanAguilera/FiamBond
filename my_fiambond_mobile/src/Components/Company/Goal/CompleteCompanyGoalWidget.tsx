import React, { useState, useContext } from "react";
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    Alert, 
    ActivityIndicator, 
    Platform 
} from "react-native";
import { AppContext } from "../../../Context/AppContext.jsx";

// Cloudinary constants (use process.env in RN/Expo)
const CLOUDINARY_CLOUD_NAME = process.env.VITE_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = process.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default";
const CLOUD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
const API_URL = 'http://localhost:3000/api'; // Simplified URL

// --- INTERFACES FOR TYPE SAFETY ---
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

interface NativeFile {
    uri: string;
    name: string;
    type: string; // e.g., 'image/jpeg', 'application/pdf'
}

// Define the expected structure of the user object retrieved from context
interface User { 
    uid: string; 
    [key: string]: any; 
}
// Define the structure of the context itself (assuming it provides a nullable user)
interface AppContextType { 
    user: User | null; 
    [key: string]: any; 
}
// ------------------------------------

export default function CompleteCompanyGoalWidget({ goal, onSuccess }: Props) {
    // FIX: Assert the context type with non-null assertion (!)
    // This resolves the error 2339 by guaranteeing to the compiler that 
    // the value returned by useContext is not null.
    const { user } = useContext(AppContext)! as AppContextType; 
    
    const [file, setFile] = useState<NativeFile | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusBtn, setStatusBtn] = useState('Confirm & Complete Goal');

    // Placeholder for native file picker
    const handleNativeFileUpload = async () => {
        Alert.alert("File Picker", "Native file picker integration required.");
    };

    const submit = async () => {
        // Safe check for user object access (user is now User | null)
        if (!user || !user.uid) return Alert.alert("Error", "Login required");

        const goalId = goal.id || goal._id;
        if (!goalId) {
            Alert.alert("Error", "Goal ID missing.");
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
                
                // Append the native file object to FormData
                fd.append('file', {
                    uri: file.uri,
                    name: file.name,
                    type: file.type,
                } as any);

                fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                
                const res = await fetch(CLOUD_URL, { 
                    method: 'POST', 
                    body: fd,
                    // RN handles Content-Type for multipart/form-data automatically
                    headers: {}, 
                });
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
                    completed_by_user_id: user.uid, // SAFE access now
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
                    user_id: user.uid, // SAFE access now
                    company_id: goal.company_id, 
                    type: 'expense', 
                    amount: Number(goal.target_amount),
                    description: `Target Achieved: ${goal.name}`,
                    created_at: new Date().toISOString(),
                    attachment_url: achievementUrl
                })
            });

            if (!txRes.ok) throw new Error("Failed to record expense");

            Alert.alert("Success", "Target Achieved & Recorded!");
            if (onSuccess) {
                onSuccess();
            }

        } catch (err: any) {
            console.error("Completion Error:", err);
            setError(err.message || "Error completing target");
            Alert.alert("Error", err.message || "Failed to complete target");
        } finally {
            setLoading(false);
            setStatusBtn('Confirm & Complete Goal');
        }
    };

    const targetAmountFormatted = `₱${parseFloat(goal.target_amount.toString()).toLocaleString()}`;

    return (
        <View style={styles.container}>
            {/* Header Section */}
            <View>
                <Text style={styles.subtitle}>You are about to complete the goal:</Text>
                <Text style={styles.title}>{goal.name}</Text>
                
                <Text style={styles.infoText}>
                    An expense of {targetAmountFormatted} will be recorded from the Company Ledger.
                </Text>
            </View>

            <View style={styles.divider} />

            {/* File Input */}
            <View>
                <Text style={styles.label}>
                    Upload a Photo of Your Achievement <Text style={styles.labelOptional}>(Optional)</Text>
                </Text>
                <TouchableOpacity 
                    onPress={handleNativeFileUpload} 
                    disabled={loading}
                    style={styles.fileButton}
                >
                    <Text style={styles.fileButtonText}>
                        {file ? `File Selected: ${file.name}` : "Tap to Select Photo/File"}
                    </Text>
                    {file && (
                         <TouchableOpacity onPress={() => setFile(null)} style={styles.fileClearButton}>
                            <Text style={styles.fileClearText}>✕</Text>
                         </TouchableOpacity>
                    )}
                </TouchableOpacity>
                {file && <Text style={styles.fileNameText}>Selected: {file.name}</Text>}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Submit Button */}
            <TouchableOpacity 
                onPress={submit}
                disabled={loading} 
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            >
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>{statusBtn}</Text>}
            </TouchableOpacity>
        </View>
    );
}

// --- REACT NATIVE STYLESHEET ---
const styles = StyleSheet.create({
    container: {
        padding: 16, // p-4
        gap: 16, // space-y-4
    },
    subtitle: { fontSize: 14, color: '#4B5563' },
    title: { fontWeight: '600', fontSize: 18, color: '#1F2937', marginTop: 4 },
    infoText: { fontSize: 14, color: '#6B7280', marginTop: 8 },
    divider: { borderBottomWidth: 1, borderColor: '#E5E7EB' },
    label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 },
    labelOptional: { color: '#9CA3AF', fontWeight: 'normal' },
    fileButton: {
        marginTop: 4, width: '100%', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6, borderWidth: 1,
        borderColor: '#E5E7EB', backgroundColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    fileButtonText: { fontSize: 14, fontWeight: '600', color: '#2563EB', flexShrink: 1 },
    fileClearButton: { padding: 4, borderRadius: 10, backgroundColor: '#D1D5DB', marginLeft: 8 },
    fileClearText: { fontSize: 12, fontWeight: 'bold', color: '#4B5563' },
    fileNameText: { fontSize: 12, color: '#4F46E5', marginTop: 4, paddingHorizontal: 4 },
    errorText: { textAlign: 'center', fontSize: 14, fontWeight: 'bold', color: '#F43F5E' },
    submitButton: {
        width: '100%', paddingVertical: 12, backgroundColor: '#4F46E5', borderRadius: 8, alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3,
    },
    submitButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    submitButtonDisabled: { opacity: 0.5 },
});