"use client";

import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableOpacity, Platform, Alert } from "react-native";
import { AppContext } from "@/context/AppContext";
import { API_BASE_URL } from '@/config/apiConfig';
import DateTimePicker from '@react-native-community/datetimepicker';

// 🏎️ Simplex Move: Import your unified loader
import UnifiedLoadingWidget from "@/components/ui/UnifiedLoadingWidget";

type GoalMode = 'personal' | 'family' | 'company';

interface GoalFormWidgetProps {
  mode: GoalMode;
  entityId?: string | number; 
  onSuccess?: () => void;
  labels?: {
    title?: string;
    button?: string;
    placeholder?: string;
  };
}

export default function GoalFormWidget({ mode, entityId, onSuccess, labels }: GoalFormWidgetProps) {
  /** * ⭐️ THE NUCLEAR FIX FOR ERROR 2345:
   * Casting AppContext to any to bypass the TypeScript boolean mismatch.
   */
  const context = useContext(AppContext as any) as { user: any } || {};
  const user = context.user;

  const [formData, setFormData] = useState({ 
    name: "", 
    target_amount: "", 
    target_date: new Date() 
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dynamic labels based on mode
  const displayLabels = {
    name: labels?.title || (mode === 'company' ? "Target Name" : "Goal Name"),
    button: labels?.button || (
        mode === 'company' ? "Set Target" : 
        mode === 'family' ? "Set Family Goal" : "Set Goal"
    ),
    placeholder: labels?.placeholder || (
        mode === 'company' ? "e.g. Q4 Revenue" : 
        mode === 'family' ? "e.g. Family Vacation" : "e.g. Travel Fund"
    )
  };

  const handleSubmit = async () => {
    // ⭐️ Use native Alert instead of toast for Error 2307
    if (!user || !user.uid) return Alert.alert("Error", "Login required");

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
        status: "active",
        family_id: mode === 'family' ? entityId : null,
        company_id: mode === 'company' ? entityId : null,
      };

      const res = await fetch(`${API_BASE_URL}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Server error');

      Alert.alert("Success", `${displayLabels.name} Set Successfully`);
      setFormData({ name: "", target_amount: "", target_date: new Date() });
      onSuccess?.();
    } catch (err) {
      Alert.alert("Error", "Error creating goal");
    } finally {
      setLoading(false);
    }
  };

  const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1";
  const inputStyle = "w-full p-4 border border-slate-200 rounded-2xl bg-white text-slate-700 font-medium mb-5";

  return (
    <View className="p-1">
      {/* Goal Name */}
      <Text className={labelClass}>{displayLabels.name}</Text>
      <TextInput
        placeholder={displayLabels.placeholder}
        value={formData.name}
        onChangeText={(text) => setFormData({...formData, name: text})}
        className={inputStyle}
      />

      {/* Amount */}
      <Text className={labelClass}>Target Amount (₱)</Text>
      <TextInput
        keyboardType="numeric"
        placeholder="0.00"
        value={formData.target_amount}
        onChangeText={(text) => setFormData({...formData, target_amount: text})}
        className={inputStyle}
      />

      {/* Date Selector */}
      <Text className={labelClass}>Target Date</Text>
      <TouchableOpacity 
        onPress={() => setShowDatePicker(true)}
        className={inputStyle}
        style={{ justifyContent: 'center' }}
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
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setFormData({...formData, target_date: date});
          }}
        />
      )}

      {/* 🛡️ Unified Button Feedback */}
      <TouchableOpacity 
        onPress={handleSubmit}
        disabled={loading} 
        className="w-full py-5 bg-indigo-600 rounded-3xl items-center shadow-lg shadow-indigo-100 mt-2 active:scale-[0.98]"
      >
        {loading ? (
          <UnifiedLoadingWidget 
            type="inline" 
            message={mode === 'company' ? 'Syncing Target...' : 'Engaging Goal...'} 
          />
        ) : (
          <Text className="text-white font-black text-lg">{displayLabels.button}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}