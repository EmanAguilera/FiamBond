"use client";

import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, Image, Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppContext } from '@/context/AppContext';
import { API_BASE_URL } from '@/config/apiConfig';
import { Camera, CheckCircle2 } from 'lucide-react-native';

// 🏎️ Simplex Move: Import your unified loader
import UnifiedLoadingWidget from "@/components/ui/UnifiedLoadingWidget";

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

const CLOUDINARY_CLOUD_NAME = "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = "ml_default";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export default function UnifiedCompleteGoalWidget({ goal, mode, onSuccess }: Props) {
    /** * ⭐️ THE NUCLEAR FIX:
     * Casting AppContext to any to solve Error 2345.
     */
    const context = useContext(AppContext as any) as { user: any } || {};
    const user = context.user;

    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Confirm & Complete');

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleComplete = async () => {
        // ⭐️ Native Alert for Error 2307
        if (!user || !user.uid) {
            return Alert.alert("Error", "User session not found. Please log in again.");
        }

        const goalId = goal.id || goal._id;
        const amount = typeof goal.target_amount === 'string' ? parseFloat(goal.target_amount) : goal.target_amount;

        setLoading(true);
        try {
            let achievementUrl = null;

            // 1. Upload to Cloudinary (Mobile Multi-part)
            if (imageUri) {
                setStatusMessage("Uploading proof...");
                const formData = new FormData();
                
                // Native File Casting for React Native FormData
                const fileToUpload = {
                    uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
                    type: 'image/jpeg',
                    name: 'achievement.jpg',
                } as any;

                formData.append('file', fileToUpload);
                formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                
                const cloudRes = await fetch(CLOUDINARY_API_URL, { 
                    method: 'POST', 
                    body: formData,
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                
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

            // 3. Record Transaction
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

            Alert.alert("Success", mode === 'company' ? "Target Achieved!" : "Goal Completed!");
            onSuccess();
        } catch (err: any) {
            Alert.alert("Error", err.message || "Error completing goal");
        } finally {
            setLoading(false);
            setStatusMessage('Confirm & Complete');
        }
    };

    return (
        <View className="space-y-6">
            <View className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    {mode === 'company' ? 'Strategic Target' : 'Target Achievement'}
                </Text>
                <Text className="font-black text-2xl text-slate-800">{goal.name}</Text>
                
                <View className="mt-4 flex-row items-center">
                    <View className="w-10 h-10 rounded-2xl bg-indigo-100 items-center justify-center">
                        <Text className="text-indigo-600 font-black text-lg">₱</Text>
                    </View>
                    <Text className="ml-3 text-slate-600 font-medium flex-1">
                        A {mode} expense of 
                        <Text className="font-bold text-slate-800"> ₱{Number(goal.target_amount).toLocaleString()} </Text>
                        will be recorded.
                    </Text>
                </View>
            </View>

            {/* Native Image Picker */}
            <View className="space-y-2">
                <Text className="text-sm font-bold text-slate-700 ml-1">
                    Proof of Achievement <Text className="text-slate-400 font-normal">(Optional)</Text>
                </Text>
                
                <TouchableOpacity 
                    onPress={pickImage}
                    disabled={loading}
                    className="w-full border-2 border-dashed border-slate-200 rounded-3xl p-6 bg-slate-50 items-center justify-center overflow-hidden"
                >
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} className="w-full h-40 rounded-xl" />
                    ) : (
                        <View className="items-center">
                            <Camera size={28} color="#6366f1" />
                            <Text className="text-indigo-500 font-bold mt-2">Upload Photo</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
                onPress={handleComplete}
                disabled={loading}
                className="w-full py-5 bg-indigo-600 rounded-3xl flex-row items-center justify-center shadow-lg shadow-indigo-200 active:scale-[0.98]" 
            >
                {loading ? (
                    <UnifiedLoadingWidget type="inline" message={statusMessage} />
                ) : (
                    <>
                        <CheckCircle2 size={20} color="white" />
                        <Text className="text-white font-black text-lg ml-2">Confirm & Complete Goal</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );
}