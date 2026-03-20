"use client";

import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { AppContext } from "@/context/AppContext";
import * as ImagePicker from 'expo-image-picker'; 
import { API_BASE_URL } from '@/config/apiConfig';
import UnifiedLoadingWidget from "@/components/ui/UnifiedLoadingWidget";

// Logic Constants
const CLOUDINARY_CLOUD_NAME = "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = "ml_default";
const CLOUD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

interface Member { id: string; full_name: string; }
interface UnifiedProps { 
    onSuccess?: () => void; 
    companyData?: any; 
    familyData?: { id: string; family_name: string }; 
    members?: Member[];
}

type TransactionType = "income" | "expense" | "payroll";

export default function CreateUnifiedTransactionWidget({ onSuccess, companyData, familyData, members = [] }: UnifiedProps) {
    const { user } = useContext(AppContext as any) as { user: any };
    
    const companyId = companyData?.id || (typeof companyData === 'string' ? companyData : null);
    const realm = companyId ? 'company' : familyData ? 'family' : 'personal';

    const [form, setForm] = useState({ 
        desc: "", 
        amt: "", 
        type: "income" as TransactionType,
        employeeId: ""
    });
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });
        if (!result.canceled) setImageUri(result.assets[0].uri);
    };

    const submit = async () => {
        if (!user) return Alert.alert("Error", "Login required");
        if (!form.amt || parseFloat(form.amt) <= 0) return Alert.alert("Error", "Enter a valid amount");
        
        setLoading(true);
        try {
            // ... (submit logic remains unchanged)
            Alert.alert("Success", "Transaction Recorded");
            setForm({ desc: "", amt: "", type: "income", employeeId: "" });
            setImageUri(null);
            if (onSuccess) onSuccess();
        } catch (error: any) { 
            Alert.alert("Error", "Error saving record"); 
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView className="space-y-5 px-1 bg-white">
            {/* 1:1 REPLICATION: Toggle Bar */}
            <View className="flex-row gap-3 p-1 bg-slate-100 rounded-xl mb-5">
                {['income', 'expense', 'payroll'].map((t) => (
                    (t !== 'payroll' || realm === 'company') && (
                        <TouchableOpacity 
                            key={t}
                            onPress={() => setForm({ ...form, type: t as any })}
                            // Match: py-2.5, rounded-lg, bg-white (active), shadow-sm
                            className={`flex-1 py-2.5 rounded-lg items-center transition-all ${
                                form.type === t ? 'bg-white shadow-sm' : ''
                            }`}
                        >
                            <Text className={`font-bold ${
                                form.type === t 
                                ? (t === 'income' ? 'text-emerald-600' : t === 'payroll' ? 'text-indigo-600' : 'text-rose-600') 
                                : 'text-slate-500'
                            }`}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    )
                ))}
            </View>

            <View className="space-y-4">
                {/* Amount Input */}
                <View>
                    <Text className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Amount (₱)</Text>
                    <TextInput 
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor="#94a3b8" 
                        value={form.amt}
                        onChangeText={(val) => setForm({ ...form, amt: val })}
                        className="w-full p-4 border border-slate-200 rounded-xl text-2xl font-semibold bg-white text-slate-800"
                    />
                </View>

                {/* Description Input */}
                <View>
                    <Text className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Description</Text>
                    <TextInput 
                        placeholder={form.type === 'income' ? "e.g. Salary" : "e.g. Grocery"}
                        placeholderTextColor="#94a3b8"
                        value={form.desc}
                        onChangeText={(val) => setForm({ ...form, desc: val })}
                        className="w-full p-4 border border-slate-200 rounded-xl bg-white text-slate-700 font-medium"
                    />
                </View>

                {/* Attachment Box */}
                <View>
                    <Text className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Attachment (optional)</Text>
                    <TouchableOpacity 
                        onPress={pickImage}
                        style={{ borderStyle: 'dashed' }}
                        className="flex-row items-center w-full p-3 border border-slate-300 rounded-xl bg-slate-50"
                    >
                        <View className="bg-indigo-50 px-4 py-2 rounded-full">
                            <Text className="text-indigo-700 text-sm font-bold">Choose File</Text>
                        </View>
                        <Text className="ml-4 text-slate-400 text-sm">
                            {imageUri ? "File Selected" : "No file chosen"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Save Button */}
                <TouchableOpacity 
                    onPress={submit}
                    disabled={loading}
                    className={`w-full py-4 rounded-2xl items-center shadow-sm active:scale-[0.98] ${
                        form.type === 'income' ? 'bg-emerald-600' : form.type === 'payroll' ? 'bg-indigo-600' : 'bg-rose-600'
                    }`}
                >
                    {loading ? (
                        <UnifiedLoadingWidget type="inline" message="Saving..." />
                    ) : (
                        <Text className="text-white font-bold text-lg">
                            Save Transaction
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}