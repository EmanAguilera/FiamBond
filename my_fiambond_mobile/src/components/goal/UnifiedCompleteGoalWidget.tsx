"use client";

import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, Image, Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppContext } from '@/context/AppContext';
import { API_BASE_URL } from '@/config/apiConfig';
import { CheckCircle2 } from 'lucide-react-native';
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
    const context = useContext(AppContext as any) as { user: any } || {};
    const user = context.user;

    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Confirming...');

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });
        if (!result.canceled) setImageUri(result.assets[0].uri);
    };

    const handleComplete = async () => {
        if (!user?.uid) return Alert.alert("Error", "User session not found.");
        
        const goalId = goal.id || goal._id;
        const amount = typeof goal.target_amount === 'string' ? parseFloat(goal.target_amount) : goal.target_amount;

        setLoading(true);
        try {
            let achievementUrl = null;
            if (imageUri) {
                setStatusMessage("Uploading proof...");
                const formData = new FormData();
                const fileToUpload = {
                    uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
                    type: 'image/jpeg',
                    name: 'achievement.jpg',
                } as any;
                formData.append('file', fileToUpload);
                formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                const cloudRes = await fetch(CLOUDINARY_API_URL, { method: 'POST', body: formData });
                const cloudData = await cloudRes.json();
                achievementUrl = cloudData.secure_url;
            }

            setStatusMessage("Finalizing...");
            await fetch(`${API_BASE_URL}/goals/${goalId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: "completed",
                    completed_at: new Date().toISOString(),
                    completed_by_user_id: user.uid, 
                    achievement_url: achievementUrl,
                })
            });

            await fetch(`${API_BASE_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.uid,
                    family_id: mode === 'family' ? goal.family_id : null,
                    company_id: mode === 'company' ? goal.company_id : null,
                    type: 'expense',
                    amount: amount,
                    description: `Goal Achieved: ${goal.name}`,
                    created_at: new Date().toISOString(),
                    attachment_url: achievementUrl,
                })
            });

            Alert.alert("Success", "Goal Completed!");
            onSuccess();
        } catch (err: any) {
            Alert.alert("Error", "Failed to complete goal.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="space-y-6">
            
            {/* Target Card */}
            <View className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Target Achievement
                </Text>
                <Text className="font-extrabold text-xl text-slate-800">
                    {goal.name}
                </Text>
                
                <View className="mt-3 flex-row items-center">
                    {/* Circle Icon */}
                    <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center">
                        <Text className="text-indigo-600 font-bold text-lg">₱</Text>
                    </View>
                    <Text className="ml-3 text-sm text-slate-600 flex-1">
                        A personal expense of 
                        <Text className="font-bold text-slate-800 ml-1">₱{Number(goal.target_amount).toLocaleString()}</Text>
                        <Text> will be recorded.</Text>
                    </Text>
                </View>
            </View>

            {/* Proof Section */}
            <View className="space-y-2">
                <Text className="text-sm font-bold text-slate-700 ml-1">
                    Proof of Achievement <Text className="text-slate-400 font-normal">(Optional)</Text>
                </Text>
                
                {/* 1:1 File Input Style: Dashed Border */}
                <TouchableOpacity 
                    onPress={pickImage}
                    disabled={loading}
                    className="w-full border border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50/50 flex-row items-center"
                >
                    {imageUri ? (
                        <View className="flex-row items-center w-full">
                            <Image source={{ uri: imageUri }} className="w-10 h-10 rounded-lg" />
                            <Text className="ml-4 text-xs font-bold text-indigo-600 uppercase">Change Photo</Text>
                        </View>
                    ) : (
                        <>
                            <View className="bg-indigo-50 px-4 py-2.5 rounded-xl">
                                <Text className="text-xs font-bold text-indigo-700 uppercase">Choose File</Text>
                            </View>
                            <Text className="ml-4 text-xs text-slate-500 font-medium">
                                No file chosen
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
            
            {/* Submit Button */}
            <TouchableOpacity 
                onPress={handleComplete}
                disabled={loading}
                className="w-full py-4 bg-indigo-600 rounded-2xl flex-row items-center justify-center shadow-lg shadow-indigo-100 active:scale-[0.98]" 
            >
                {loading ? (
                    <UnifiedLoadingWidget type="inline" message={statusMessage} />
                ) : (
                    <>
                        <CheckCircle2 size={18} color="white" strokeWidth={2.5} />
                        <Text className="text-white font-bold text-base ml-2">Confirm & Complete Goal</Text>
                    </>
                )}
            </TouchableOpacity>

            {/* Bottom padding to prevent clipping in ScrollView */}
            <View className="h-4" />
        </View>
    );
}