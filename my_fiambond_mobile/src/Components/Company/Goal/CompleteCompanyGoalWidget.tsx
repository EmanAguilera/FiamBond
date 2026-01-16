import React, { useState, useContext } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ActivityIndicator, 
    Alert, 
    Image,
    ScrollView 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppContext } from '../../../Context/AppContext';

// --- CONFIGURATION ---
const CLOUD_URL = `https://api.cloudinary.com/v1_1/dzcnbrgjy/image/upload`;
const API_URL = 'https://super-duper-engine-57wjxxp4jxq2p64w-3000.app.github.dev'; // Replace with your local IP if testing on a physical device

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
    const { user } = useContext(AppContext) as any;
    
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusBtn, setStatusBtn] = useState('Confirm & Complete Goal');

    // --- IMAGE PICKER LOGIC ---
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
            setError(null);
        }
    };

    const submit = async () => {
        if (!user) return;

        const goalId = goal.id || goal._id;
        if (!goalId) {
            Alert.alert("Error", "Goal ID missing.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let achievementUrl = null;

            // 1. Upload Proof to Cloudinary (Native FormData Format)
            if (imageUri) {
                setStatusBtn("Uploading proof...");
                const fd = new FormData();
                
                const filename = imageUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : `image`;

                fd.append('file', {
                    uri: imageUri,
                    name: filename || 'achievement.jpg',
                    type: type,
                } as any);
                
                fd.append('upload_preset', "ml_default");
                
                const cloudRes = await fetch(CLOUD_URL, { 
                    method: 'POST', 
                    body: fd,
                    headers: { 'content-type': 'multipart/form-data' }
                });

                if (!cloudRes.ok) throw new Error('Upload failed');
                const cloudData = await cloudRes.json();
                achievementUrl = cloudData.secure_url;
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

            Alert.alert("Success", "Target Achieved & Recorded!");
            if (onSuccess) {
                onSuccess();
            }

        } catch (err: any) {
            console.error("Completion Error:", err);
            setError(err.message || "Error completing target");
            Alert.alert("Error", "Failed to complete target");
        } finally {
            setLoading(false);
            setStatusBtn('Confirm & Complete Goal');
        }
    };

    return (
        <ScrollView className="space-y-6 p-1" keyboardShouldPersistTaps="handled">
            {/* Header Section */}
            <View>
                <Text className="text-sm text-slate-500">You are about to complete the goal:</Text>
                <Text className="font-bold text-xl text-slate-800 mt-1">{goal.name}</Text>
                
                <View className="bg-indigo-50 p-4 rounded-2xl mt-4 border border-indigo-100">
                    <Text className="text-xs text-indigo-700 leading-5">
                        An expense of <Text className="font-bold">₱{parseFloat(goal.target_amount.toString()).toLocaleString()}</Text> will be recorded from the Company Ledger.
                    </Text>
                </View>
            </View>

            {/* Separator */}
            <View className="h-[1px] bg-slate-100 w-full" />

            {/* Image Picker */}
            <View>
                <Text className="text-sm font-bold text-slate-700 mb-3">
                    Upload a Photo of Your Achievement (Optional)
                </Text>
                
                <TouchableOpacity 
                    onPress={pickImage}
                    disabled={loading}
                    activeOpacity={0.7}
                    className="border-2 border-dashed border-slate-200 rounded-3xl p-8 items-center justify-center bg-slate-50"
                >
                    {imageUri ? (
                        <View className="items-center">
                            <Image source={{ uri: imageUri }} className="w-32 h-32 rounded-2xl mb-3" />
                            <Text className="text-indigo-600 font-bold text-xs">Change Photo</Text>
                        </View>
                    ) : (
                        <View className="items-center">
                            <View className="bg-white p-4 rounded-full mb-3 shadow-sm">
                                <Text className="text-2xl">🏆</Text>
                            </View>
                            <Text className="text-indigo-600 font-bold text-sm">Pick Proof Image</Text>
                            <Text className="text-slate-400 text-[10px] mt-1">Tap to browse gallery</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Error Message */}
            {error && (
                <View className="bg-rose-50 p-3 rounded-xl">
                    <Text className="text-rose-600 text-xs text-center font-bold">{error}</Text>
                </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity 
                onPress={submit} 
                disabled={loading}
                activeOpacity={0.8}
                className={`w-full py-5 rounded-2xl shadow-lg items-center ${
                    loading ? 'bg-indigo-300' : 'bg-indigo-600 shadow-indigo-200'
                }`}
                style={!loading && { shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
            >
                {loading ? (
                    <View className="flex-row items-center">
                        <ActivityIndicator color="white" className="mr-2" />
                        <Text className="text-white font-bold text-base">{statusBtn}</Text>
                    </View>
                ) : (
                    <Text className="text-white font-bold text-base">Confirm & Complete Goal</Text>
                )}
            </TouchableOpacity>

            {/* Spacing for keyboard/scroll */}
            <View className="h-10" />
        </ScrollView>
    );
}