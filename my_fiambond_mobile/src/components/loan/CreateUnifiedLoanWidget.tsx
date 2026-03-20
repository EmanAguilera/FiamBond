"use client";

import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppContext } from '@/context/AppContext';
import { API_BASE_URL } from '@/config/apiConfig';
import UnifiedLoadingWidget from "@/components/ui/UnifiedLoadingWidget";

interface Member {
  id: string;
  full_name: string;
}

interface UnifiedLoanWidgetProps {
  mode: 'family' | 'personal';
  family?: { id: string; name: string }; 
  members?: Member[];       
  onSuccess?: () => void;
  onSwitchFamily?: () => void;
}

export default function UnifiedLoanWidget({ mode, family, members = [], onSuccess, onSwitchFamily }: UnifiedLoanWidgetProps) {
  const context = useContext(AppContext as any) as { user: any } || {};
  const user = context.user;

  const [form, setForm] = useState({ 
    amount: "", 
    interest: "", 
    desc: "", 
    debtorId: "", 
    debtorName: "", 
    deadline: null as Date | null 
  });
  
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isFamily = mode === 'family';
  const isWeb = Platform.OS === 'web';

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  // 1:1 Styling Constants from your HTML
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1";
  const inputClass = "w-full p-4 border border-slate-200 rounded-xl bg-white text-slate-700 font-medium";
  const placeholderColor = "#cbd5e1"; // Standard Gray Placeholder

  return (
    <View className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* 1:1 Header Selection */}
      {isFamily ? (
        /* Family Mode Header */
        <View className="flex-row items-center justify-between px-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <TouchableOpacity onPress={onSwitchFamily} className="bg-indigo-50 px-3 py-1 rounded-full">
            <Text className="text-xs font-black text-indigo-600 uppercase">← Switch Family</Text>
          </TouchableOpacity>
          <View className="items-end">
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected Group</Text>
            <Text className="text-xs font-black text-slate-700">{family?.name || 'Aguilera'}</Text>
          </View>
        </View>
      ) : (
        /* Personal Mode Header - 1:1 match with your snippet */
        <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-2">
           <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
             External Loan Tracking
           </Text>
        </View>
      )}

      {/* Borrower Input */}
      <View>
        <Text className={labelClass}>{isFamily ? 'Lending To' : "Borrower's Name"}</Text>
        {isWeb && isFamily ? (
          <select 
            className={inputClass}
            value={form.debtorId}
            onChange={(e) => setForm({...form, debtorId: e.target.value})}
            style={{ appearance: 'none', outline: 'none', cursor: 'pointer', height: 56 }}
          >
            <option value="">Select Family Member</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
          </select>
        ) : (
          <TextInput
            placeholder={isFamily ? "Select Family Member" : "Who are you lending to?"}
            placeholderTextColor={placeholderColor}
            value={isFamily ? form.debtorId : form.debtorName}
            onChangeText={t => isFamily ? setForm({...form, debtorId: t}) : setForm({...form, debtorName: t})}
            className={inputClass}
          />
        )}
      </View>

      {/* Principal & Interest Grid */}
      <View className="flex-row gap-4">
        <View className="flex-1">
          <Text className={labelClass}>Principal (₱)</Text>
          <TextInput
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor={placeholderColor}
            value={form.amount}
            onChangeText={t => setForm({...form, amount: t})}
            className={`${inputClass} font-mono`}
          />
        </View>
        <View className="flex-1">
          <Text className={labelClass}>Interest (Optional)</Text>
          <TextInput
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor={placeholderColor}
            value={form.interest}
            onChangeText={t => setForm({...form, interest: t})}
            className={`${inputClass} font-mono text-emerald-600`}
          />
        </View>
      </View>

      {/* Purpose Description */}
      <View>
        <Text className={labelClass}>Purpose / Description</Text>
        <TextInput
          placeholder={isFamily ? "e.g. Shared grocery expense" : "e.g. Rent assistance"}
          placeholderTextColor={placeholderColor}
          value={form.desc}
          onChangeText={t => setForm({...form, desc: t})}
          className={inputClass}
        />
      </View>

      {/* Date & File Grid */}
      <View className="flex-row gap-4">
        <View className="flex-1">
          <Text className={labelClass}>{isFamily ? 'Due Date' : 'Expected Repayment'}</Text>
          {isWeb ? (
            <div className={inputClass} style={{ padding: '0 16px', display: 'flex', alignItems: 'center', height: '56px' }}>
              <input 
                type="date" 
                style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', color: '#334155' }}
                onChange={(e) => setForm({...form, deadline: new Date(e.target.value)})}
              />
            </div>
          ) : (
            <TouchableOpacity onPress={() => setShowDatePicker(true)} className={inputClass}>
              <Text style={{ color: form.deadline ? '#334155' : placeholderColor }}>
                {form.deadline ? form.deadline.toLocaleDateString() : "mm/dd/yyyy"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View className="flex-1">
          <Text className={labelClass}>{isFamily ? 'Proof of Transfer' : 'Upload Receipt'}</Text>
          <TouchableOpacity 
            onPress={pickImage} 
            className="w-full border border-dashed border-slate-200 rounded-xl p-2 flex-row items-center bg-white h-[56px]"
          >
            <View className="bg-indigo-50 px-3 py-2 rounded-xl">
              <Text className="text-[10px] font-black text-indigo-700 uppercase">Choose File</Text>
            </View>
            <Text numberOfLines={1} className="text-[10px] text-slate-400 ml-3 flex-1">
              {imageUri ? "Attached" : "No file chosen"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Button */}
      <TouchableOpacity
        onPress={() => {}} 
        disabled={loading}
        className="w-full py-4 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 items-center active:scale-[0.98]"
      >
        {loading ? (
          <UnifiedLoadingWidget type="inline" message="Processing..." />
        ) : (
          <Text className="text-white font-black uppercase tracking-widest text-sm">
            {isFamily ? 'Confirm & Create Loan' : 'Record Personal Loan'}
          </Text>
        )}
      </TouchableOpacity>

      {/* 1:1 Disclaimer Footer */}
      <Text className="text-[10px] text-center text-slate-400 font-medium leading-relaxed pb-4">
        {isFamily 
          ? "This will deduct the principal from your balance immediately. The borrower must confirm receipt for the loan to become active."
          : "This records an external debt. Since the borrower isn't on the platform, you will need to manually record their repayments later."}
      </Text>

      {!isWeb && showDatePicker && (
        <DateTimePicker
          value={form.deadline || new Date()}
          mode="date"
          onChange={(e, d) => { setShowDatePicker(false); if(d) setForm({...form, deadline: d}); }}
        />
      )}
    </View>
  );
}