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
import * as FileSystem from 'expo-file-system';
import { AppContext } from '../../../Context/AppContext.jsx';

// The Goal interface
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

const CLOUDINARY_CLOUD_NAME = "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = "ml_default";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export default function CompleteGoalWidget({ goal, onSuccess }: CompleteGoalWidgetProps) {
    const { user } = useContext(AppContext) as any;
    
    // API URL for mobile testing (Replace localhost with your IP if testing on physical device)
    const API_URL = 'https://super-duper-engine-57wjxxp4jxq2p64w-3000.app.github.dev/api';

    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('Confirm & Complete Goal');

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

    const handleConfirmCompletion = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);

        try {
            let achievementUrl: string | null = null;

            // 1. Upload Image to Cloudinary (Mobile FormData Format)
            if (imageUri) {
                setStatusMessage("Uploading photo...");
                const uploadFormData = new FormData();
                
                // Read file as base64 and create blob for proper upload
                const fileData = await FileSystem.readAsStringAsync(imageUri, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                
                const filename = imageUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : `image/jpeg`;
                
                // Create blob from base64 data
                const blob = new Blob([Uint8Array.from(atob(fileData), c => c.charCodeAt(0))], { type });
                uploadFormData.append('file', blob, filename || 'achievement.jpg');
                
                uploadFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                
                const response = await fetch(CLOUDINARY_API_URL, { 
                    method: 'POST', 
                    body: uploadFormData
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Cloudinary error:', errorText);
                    throw new Error('Failed to upload achievement photo.');
                }
                
                const data = await response.json();
                achievementUrl = data.secure_url;
            }

            // 2. Update Goal Status
            setStatusMessage("Updating Goal...");
            
            const goalUpdatePayload = {
                status: "completed",
                completed_at: new Date().toISOString(), 
                completed_by_user_id: user.uid,
                ...(achievementUrl && { achievement_url: achievementUrl }),
            };

            const goalResponse = await fetch(`${API_URL}/goals/${goal.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(goalUpdatePayload)
            });

            if (!goalResponse.ok) throw new Error("Failed to update goal status on server.");

            // 3. Create Transaction
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

            const transactionResponse = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionPayload)
            });

            if (!transactionResponse.ok) throw new Error("Goal updated, but failed to record transaction.");
            
            Alert.alert("Success", "Goal completed and transaction recorded!");
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
        <ScrollView className="space-y-6 p-1">
            <View>
                <Text className="text-sm text-slate-500">You are about to complete the goal:</Text>
                <Text className="font-bold text-xl text-slate-800 mt-1">{goal.name}</Text>
                
                <View className="bg-indigo-50 p-4 rounded-2xl mt-4 border border-indigo-100">
                    <Text className="text-xs text-indigo-700 leading-5">
                        {goal.family_id 
                            ? `An expense of ₱${goal.target_amount.toLocaleString()} will be recorded from the family's shared balance.`
                            : `An expense of ₱${goal.target_amount.toLocaleString()} will be recorded from your personal balance.`
                        }
                    </Text>
                </View>
            </View>

            <View className="h-[1px] bg-slate-100 w-full" />

            <View>
                <Text className="text-sm font-bold text-slate-700 mb-3">
                    Upload a Photo of Your Achievement (Optional)
                </Text>
                
                <TouchableOpacity 
                    onPress={pickImage}
                    disabled={loading}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-6 items-center justify-center bg-slate-50"
                >
                    {imageUri ? (
                        <View className="items-center">
                            <Image source={{ uri: imageUri }} className="w-24 h-24 rounded-xl mb-3" />
                            <Text className="text-indigo-600 font-bold text-xs">Change Photo</Text>
                        </View>
                    ) : (
                        <View className="items-center">
                            <View className="bg-white p-3 rounded-full mb-2 shadow-sm">
                                <Text className="text-xl">📸</Text>
                            </View>
                            <Text className="text-indigo-600 font-bold text-sm">Pick Image</Text>
                            <Text className="text-slate-400 text-[10px] mt-1">Tap to open gallery</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
            
            {error && (
                <View className="bg-rose-50 p-3 rounded-xl">
                    <Text className="text-rose-600 text-xs text-center font-medium">{error}</Text>
                </View>
            )}
            
            <TouchableOpacity 
                onPress={handleConfirmCompletion} 
                disabled={loading}
                className={`w-full py-4 rounded-2xl shadow-lg items-center ${
                    loading ? 'bg-indigo-300' : 'bg-indigo-600'
                }`}
            >
                {loading ? (
                    <View className="flex-row items-center">
                        <ActivityIndicator color="white" className="mr-2" />
                        <Text className="text-white font-bold text-base">{statusMessage}</Text>
                    </View>
                ) : (
                    <Text className="text-white font-bold text-base">Confirm & Complete Goal</Text>
                )}
            </TouchableOpacity>
            
            {/* Keyboard spacing */}
            <View className="h-10" />
        </ScrollView>
    );
}