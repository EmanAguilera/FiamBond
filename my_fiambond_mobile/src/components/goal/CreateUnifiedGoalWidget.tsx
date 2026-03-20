"use client";

import React, { useState, useContext, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, Platform, Alert, ScrollView } from "react-native";
import { AppContext } from "@/context/AppContext";
import { API_BASE_URL } from '@/config/apiConfig';
import DateTimePicker from '@react-native-community/datetimepicker';
import UnifiedLoadingWidget from "@/components/ui/UnifiedLoadingWidget";
import { Ionicons } from '@expo/vector-icons';

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
  const context = useContext(AppContext as any) as { user: any } || {};
  const user = context.user;

  const [formData, setFormData] = useState({
    name: "",
    target_amount: "",
    target_date: null as Date | null
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const webInputRef = useRef<HTMLInputElement>(null);
  const isWeb = Platform.OS === 'web';

  const displayLabels = {
    name: labels?.title || (mode === 'company' ? "Target Name" : "Goal Name"),
    button: labels?.button || "Set Goal",
  };

  const handleSubmit = async () => {
    if (!user?.uid) return Alert.alert("Error", "Login required");
    if (!formData.target_date) return Alert.alert("Error", "Please select a target date");

    setLoading(true);
    try {
      const payload = {
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
      Alert.alert("Success", "New Goal Target Set");
      setFormData({ name: "", target_amount: "", target_date: null });
      onSuccess?.();
    } catch (err) {
      Alert.alert("Error", "Error creating goal");
    } finally {
      setLoading(false);
    }
  };

  // UI Styling
  const labelClass = "text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1";
  const inputContainerClass = "w-full border border-slate-200 rounded-xl bg-white flex-row items-center overflow-hidden";
  const placeholderColor = "#cbd5e1";

  return (
    <ScrollView className="bg-white" keyboardShouldPersistTaps="handled">
      {/* WEB ONLY CSS: Hides native icon but keeps it clickable */}
      {isWeb && (
        <style dangerouslySetInnerHTML={{ __html: `
          input[type="date"]::-webkit-calendar-picker-indicator {
            opacity: 0;
            cursor: pointer;
            width: 30px;
            height: 30px;
          }
          input[type="date"] {
            appearance: none;
            -webkit-appearance: none;
            min-height: 56px;
          }
        `}} />
      )}

      <View className="p-1">
        
        {/* Goal Name */}
        <View className="mb-5">
          <Text className={labelClass}>{displayLabels.name}</Text>
          <TextInput
            placeholder={labels?.placeholder || "e.g. Travel Fund"}
            placeholderTextColor={placeholderColor}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            className="w-full p-4 border border-slate-200 rounded-xl bg-white text-slate-700 font-medium"
          />
        </View>

        {/* Target Amount */}
        <View className="mb-5">
          <Text className={labelClass}>Target Amount (₱)</Text>
          <TextInput
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={placeholderColor}
            value={formData.target_amount}
            onChangeText={(text) => setFormData({ ...formData, target_amount: text })}
            className="w-full p-4 border border-slate-200 rounded-xl bg-white text-slate-700 font-medium"
          />
        </View>

        {/* Target Date */}
        <View className="mb-5">
          <Text className={labelClass}>Target Date</Text>
          
          {isWeb ? (
            /* WEB VERSION: Allows typing numbers + single icon click */
            <div 
              className={inputContainerClass} 
              style={{ 
                display: 'flex', 
                position: 'relative', 
                paddingLeft: '16px',
                paddingRight: '12px',
                alignItems: 'center' 
              }}
            >
              <input
                ref={webInputRef}
                type="date"
                value={formData.target_date ? formData.target_date.toISOString().split('T')[0] : ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, target_date: val ? new Date(val) : null });
                }}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  color: formData.target_date ? '#334155' : '#cbd5e1',
                  background: 'transparent',
                  padding: '16px 0',
                }}
              />
              {/* Custom Icon: Positioned so the invisible native picker icon is right on top of it */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons 
                  name="calendar-outline" 
                  size={20} 
                  color="#1e293b" 
                  style={{ position: 'absolute', pointerEvents: 'none' }} 
                />
                {/* 
                   The native invisible icon is actually handled by the browser inside the <input> 
                   above because we didn't use 'display: none'. 
                   The CSS 'opacity: 0' makes the browser icon disappear, 
                   leaving our Ionicons visible in that space.
                */}
              </div>
            </div>
          ) : (
            /* MOBILE VERSION */
            <>
              <TouchableOpacity 
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
                className="w-full p-4 border border-slate-200 rounded-xl bg-white flex-row justify-between items-center"
              >
                <Text className={`text-base font-medium ${formData.target_date ? 'text-slate-700' : 'text-slate-300'}`}>
                  {formData.target_date 
                    ? formData.target_date.toLocaleDateString('en-US') 
                    : "mm/dd/yyyy"}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#1e293b" />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={formData.target_date || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) setFormData({ ...formData, target_date: date });
                  }}
                />
              )}
            </>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={loading} 
          style={{ 
            shadowColor: '#6366f1', 
            shadowOffset: { width: 0, height: 10 }, 
            shadowOpacity: 0.1, 
            shadowRadius: 20, 
            elevation: 5 
          }}
          className={`w-full py-4 rounded-2xl items-center mt-2 ${loading ? 'bg-indigo-400' : 'bg-indigo-600'} active:scale-[0.98]`}
        >
          {loading ? (
            <UnifiedLoadingWidget type="inline" message="Setting Target..." />
          ) : (
            <Text className="text-white font-bold text-lg">{displayLabels.button}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}