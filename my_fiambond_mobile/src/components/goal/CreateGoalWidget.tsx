"use client";

import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform, Alert } from 'react-native';
import { AppContext } from '@/context/AppContext';
import { API_BASE_URL } from '@/config/apiConfig';
import DateTimePicker from '@react-native-community/datetimepicker'; 

// 🏎️ Simplex Move: Import your unified loader
import UnifiedLoadingWidget from "@/components/ui/UnifiedLoadingWidget";

interface UnifiedGoalProps {
    realm: 'personal' | 'family' | 'company';
    entityId?: string | number; 
    entityName?: string;       
    onSuccess?: () => void;
}

export default function UnifiedGoalWidget({ realm, entityId, entityName, onSuccess }: UnifiedGoalProps) {
    /** * ⭐️ THE NUCLEAR FIX:
     * Casting AppContext to any to bypass Error 2345 (Boolean mismatch).
     */
    const context = useContext(AppContext as any) as { user: any } || {};
    const user = context.user;

    const [formData, setFormData] = useState({ 
        name: '', 
        target_amount: '', 
        target_date: new Date() 
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    const labels = {
        personal: { title: "Personal Goal", placeholder: "e.g. Travel Fund", success: "Goal Set Successfully!" },
        family: { title: `Family Goal (${entityName || 'Family'})`, placeholder: "e.g. New Home", success: "Family Goal Set!" },
        company: { title: `Strategic Target (${entityName || 'Company'})`, placeholder: "e.g. Q4 Revenue", success: "Strategic Target Set!" }
    };

    const handleSubmit = async () => {
        // ⭐️ Use native Alert instead of toast
        if (!user || !user.uid) return Alert.alert("Error", "Session expired. Please login.");

        if (formData.target_date < new Date(new Date().setHours(0,0,0,0))) {
            return Alert.alert("Error", "Target date cannot be in the past");
        }
        
        setLoading(true);
        try {
            const payload: any = {
                user_id: user.uid,
                name: formData.name,
                target_amount: parseFloat(formData.target_amount),
                target_date: formData.target_date.toISOString(),
                status: 'active'
            };

            if (realm === 'family') payload.family_id = entityId;
            if (realm === 'company') payload.company_id = entityId;
            if (realm === 'personal') payload.family_id = null; 

            const res = await fetch(`${API_BASE_URL}/goals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to create goal");

            Alert.alert("Success", labels[realm].success);
            setFormData({ name: '', target_amount: '', target_date: new Date() });
            if (onSuccess) onSuccess();
        } catch (error: any) {
            Alert.alert("Error", error.message || "Error creating target");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="space-y-5 px-1">
            {/* Goal Name */}
            <View>
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    {labels[realm].title} Name
                </Text>
                <TextInput 
                    className="w-full p-4 border border-slate-200 rounded-2xl bg-white text-slate-700 font-medium"
                    placeholder={labels[realm].placeholder}
                    value={formData.name}
                    onChangeText={(val) => setFormData({...formData, name: val})}
                />
            </View>

            {/* Target Amount */}
            <View>
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Target Amount (₱)
                </Text>
                <TextInput 
                    className="w-full p-4 border border-slate-200 rounded-2xl bg-white text-slate-700 font-bold"
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={formData.target_amount}
                    onChangeText={(val) => setFormData({...formData, target_amount: val})}
                />
            </View>

            {/* Date Picker */}
            <View>
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                    Deadline
                </Text>
                <TouchableOpacity 
                    onPress={() => setShowDatePicker(true)}
                    className="w-full p-4 border border-slate-200 rounded-2xl bg-white"
                >
                    <Text className="text-slate-700 font-medium">
                        {formData.target_date.toLocaleDateString()}
                    </Text>
                </TouchableOpacity>

                {showDatePicker && (
                    <DateTimePicker
                        value={formData.target_date}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (selectedDate) setFormData({...formData, target_date: selectedDate});
                        }}
                    />
                )}
            </View>

            {/* Action Button */}
            <TouchableOpacity 
                onPress={handleSubmit}
                disabled={loading}
                className="w-full py-5 bg-indigo-600 rounded-3xl items-center shadow-lg shadow-indigo-200 active:scale-[0.98]"
            >
                {loading ? (
                    <UnifiedLoadingWidget type="inline" message="Engaging Core..." />
                ) : (
                    <Text className="text-white font-black text-lg">
                        Set {realm.charAt(0).toUpperCase() + realm.slice(1)} Goal
                    </Text>
                )}
            </TouchableOpacity>
        </View>
    ); 
}