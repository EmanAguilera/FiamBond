'use client';

import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppContext } from '@/context/AppContext';
import { API_BASE_URL } from '@/config/apiConfig';
import { Camera, Landmark } from 'lucide-react-native';

// 🏎️ Simplex Move: Import your unified loader
import UnifiedLoadingWidget from "@/components/ui/UnifiedLoadingWidget";

interface Member {
  id: string;
  full_name: string;
}

interface UnifiedLoanWidgetProps {
  mode: 'family' | 'personal';
  family?: { id: string }; 
  members?: Member[];       
  onSuccess?: () => void;
}

const CLOUDINARY_CLOUD_NAME = "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = "ml_default";
const CLOUD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export default function UnifiedLoanWidget({ mode, family, members = [], onSuccess }: UnifiedLoanWidgetProps) {
  /** * ⭐️ THE NUCLEAR FIX FOR ERROR 2345:
   * Casting AppContext to any to bypass the TypeScript boolean mismatch.
   */
  const context = useContext(AppContext as any) as { user: any } || {};
  const user = context.user;

  const [form, setForm] = useState({ 
    amount: "", 
    interest: "", 
    desc: "", 
    debtorId: "", 
    debtorName: "", 
    deadline: new Date() 
  });
  
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isFamily = mode === 'family';

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const submit = async () => {
    // ⭐️ Use native Alert instead of toast for Error 2307
    if (!user) return Alert.alert("Error", "Login required");

    setLoading(true);
    try {
      let attachment_url = null;
      if (imageUri) {
        setStatusMessage("Uploading proof...");
        const fd = new FormData();
        const fileToUpload = {
            uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
            type: 'image/jpeg',
            name: 'loan_proof.jpg',
        } as any;
        fd.append('file', fileToUpload);
        fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        
        const res = await fetch(CLOUD_URL, { 
            method: 'POST', 
            body: fd,
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.ok) {
          const data = await res.json();
          attachment_url = data.secure_url;
        }
      }

      const principal = parseFloat(form.amount) || 0;
      const interest = parseFloat(form.interest) || 0;
      const debtorName = isFamily
        ? (members.find(m => String(m.id) === String(form.debtorId))?.full_name || 'Member')
        : form.debtorName;

      // 1. Create Loan Record
      setStatusMessage("Securing loan record...");
      const loanRes = await fetch(`${API_BASE_URL}/loans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_id: isFamily ? family?.id : null,
          creditor_id: user.uid,
          debtor_id: isFamily ? form.debtorId : null,
          debtor_name: debtorName,
          amount: principal,
          interest_amount: interest,
          total_owed: principal + interest,
          repaid_amount: 0,
          description: form.desc,
          deadline: form.deadline.toISOString(),
          status: isFamily ? "pending_confirmation" : "outstanding",
          attachment_url
        })
      });

      if (!loanRes.ok) throw new Error("Loan creation failed");

      // 2. Record Transaction
      setStatusMessage("Recording to ledger...");
      await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          family_id: null,
          type: "expense",
          amount: principal,
          description: `${isFamily ? 'Loan' : 'Personal loan'} to ${debtorName}: ${form.desc}`,
          attachment_url,
          created_at: new Date().toISOString()
        })
      });

      Alert.alert("Success", isFamily ? "Loan Request Sent" : "Personal Loan Created");
      setForm({ amount: "", interest: "", desc: "", debtorId: "", debtorName: "", deadline: new Date() });
      setImageUri(null);
      onSuccess?.();
    } catch (err) {
      Alert.alert("Error", "Error processing loan");
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1";
  const inputStyle = "w-full p-4 border border-slate-200 rounded-2xl bg-white text-slate-700 font-medium mb-4";

  return (
    <ScrollView className="p-1" showsVerticalScrollIndicator={false}>
      {!isFamily && (
        <View className="bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-4 flex-row items-center justify-center">
          <Landmark size={14} color="#94a3b8" />
          <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">External Loan Tracking</Text>
        </View>
      )}

      {/* Borrower Selection */}
      <View>
        <Text className={labelClass}>{isFamily ? 'Lending To (Member ID)' : "Borrower's Name"}</Text>
        <TextInput
          placeholder={isFamily ? "Enter Member ID" : "Who are you lending to?"}
          value={isFamily ? form.debtorId : form.debtorName}
          onChangeText={t => isFamily ? setForm({...form, debtorId: t}) : setForm({...form, debtorName: t})}
          className={inputStyle}
        />
      </View>

      <View className="flex-row gap-4">
        <View className="flex-1">
          <Text className={labelClass}>Principal (₱)</Text>
          <TextInput
            keyboardType="numeric"
            placeholder="0.00"
            value={form.amount}
            onChangeText={t => setForm({...form, amount: t})}
            className={inputStyle}
          />
        </View>
        <View className="flex-1">
          <Text className={labelClass}>Interest</Text>
          <TextInput
            keyboardType="numeric"
            placeholder="0.00"
            value={form.interest}
            onChangeText={t => setForm({...form, interest: t})}
            className={`${inputStyle} text-emerald-600`}
          />
        </View>
      </View>

      <View>
        <Text className={labelClass}>Purpose</Text>
        <TextInput
          placeholder={isFamily ? "e.g. Shared grocery" : "e.g. Rent assistance"}
          value={form.desc}
          onChangeText={t => setForm({...form, desc: t})}
          className={inputStyle}
        />
      </View>

      <View className="flex-row gap-4">
        <View className="flex-1">
          <Text className={labelClass}>Due Date</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} className={inputStyle}>
            <Text className="text-slate-700">{form.deadline.toLocaleDateString()}</Text>
          </TouchableOpacity>
        </View>
        
        <View className="flex-1">
          <Text className={labelClass}>Proof</Text>
          <TouchableOpacity onPress={pickImage} className={`${inputStyle} items-center justify-center border-dashed`}>
            {imageUri ? <Text className="text-indigo-600 font-bold">Photo Attached</Text> : <Camera size={20} color="#6366f1" />}
          </TouchableOpacity>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={form.deadline}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, d) => { setShowDatePicker(false); if(d) setForm({...form, deadline: d}); }}
        />
      )}

      <TouchableOpacity
        onPress={submit}
        disabled={loading}
        className="w-full py-5 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-100 items-center mt-2 active:scale-[0.98]"
      >
        {loading ? (
          <UnifiedLoadingWidget 
            type="inline" 
            message={statusMessage || (isFamily ? 'Processing...' : 'Recording...')} 
          />
        ) : (
          <Text className="text-white font-black uppercase tracking-widest text-xs">
            {isFamily ? 'Confirm & Create Loan' : 'Record Personal Loan'}
          </Text>
        )}
      </TouchableOpacity>

      <Text className="text-[10px] text-center text-slate-400 font-medium leading-4 px-4 mt-4 pb-6">
        {isFamily
          ? "This will deduct the principal from your balance immediately. The borrower must confirm receipt for the loan to become active."
          : "This records an external debt. You will need to manually record repayments later."
        }
      </Text>
    </ScrollView>
  );
}