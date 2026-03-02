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
type PayrollSubtype = "salary" | "advance";

export default function CreateUnifiedTransactionWidget({ onSuccess, companyData, familyData, members = [] }: UnifiedProps) {
    /** * ⭐️ FIX 2345: Cast AppContext to any to bypass the boolean mismatch 
     */
    const { user } = useContext(AppContext as any) as { user: any };
    
    const companyId = companyData?.id || (typeof companyData === 'string' ? companyData : null);
    const realm = companyId ? 'company' : familyData ? 'family' : 'personal';

    const [form, setForm] = useState({ 
        desc: "", 
        amt: "", 
        type: "expense" as TransactionType,
        payrollSubtype: "salary" as PayrollSubtype,
        employeeId: ""
    });
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Dynamic Labels
    const incomeLabel = realm === 'company' ? 'Revenue' : 'Income';
    const incomePlaceholder = realm === 'company' ? "e.g. Sales" : realm === 'family' ? "e.g. Monthly Contribution" : "e.g. Salary";
    const expensePlaceholder = realm === 'company' ? "e.g. Office Rent" : realm === 'family' ? "e.g. Electricity Bill" : "e.g. Grocery";

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const submit = async () => {
        // ⭐️ Mobile Alert instead of toast
        if (!user) return Alert.alert("Error", "Login required");
        if (!form.amt || parseFloat(form.amt) <= 0) return Alert.alert("Error", "Enter a valid amount");
        if (form.type === 'payroll' && !form.employeeId) return Alert.alert("Error", "Select an employee");

        setLoading(true);
        try {
            let attachment_url = null;
            const timestamp = new Date().toISOString();

            // Cloudinary Mobile Upload Logic
            if (imageUri) {
                const fd = new FormData();
                // @ts-ignore
                fd.append('file', { 
                    uri: imageUri, 
                    type: 'image/jpeg', 
                    name: 'upload.jpg' 
                } as any);
                fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                
                const cloudRes = await fetch(CLOUD_URL, { method: 'POST', body: fd });
                if (cloudRes.ok) {
                    const cloudData = await cloudRes.json();
                    attachment_url = cloudData.secure_url;
                }
            }
            
            const employee = members.find(m => m.id === form.employeeId);
            const isPayroll = form.type === 'payroll';
            const finalDesc = isPayroll 
                ? `${form.payrollSubtype === 'salary' ? 'Salary' : 'Cash Advance'} for ${employee?.full_name || 'Employee'} - ${form.desc}`
                : form.desc;

            const transactionBody = {
                user_id: user.uid, 
                description: finalDesc,
                amount: parseFloat(form.amt), 
                type: isPayroll ? 'expense' : form.type,
                category: isPayroll ? (form.payrollSubtype === 'salary' ? 'Payroll' : 'Cash Advance') : null,
                attachment_url,
                created_at: timestamp,
                family_id: realm === 'family' ? familyData?.id : null, 
                company_id: realm === 'company' ? companyId : null,
            };

            const res = await fetch(`${API_BASE_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionBody)
            });

            if (!res.ok) throw new Error(`Failed to save record`);

            // Family Sync Logic
            if (realm === 'family' && familyData) {
                const personalSyncBody = {
                    user_id: user.uid,
                    description: `Family Sync (${familyData.family_name}): ${form.desc}`,
                    amount: parseFloat(form.amt),
                    type: 'expense', 
                    attachment_url,
                    created_at: timestamp
                };
                await fetch(`${API_BASE_URL}/transactions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(personalSyncBody) });
            }
            
            Alert.alert("Success", isPayroll ? "Payroll Disbursed" : "Transaction Recorded");
            setForm({ desc: "", amt: "", type: "expense", payrollSubtype: "salary", employeeId: "" });
            setImageUri(null);
            if (onSuccess) onSuccess();

        } catch (error: any) { 
            Alert.alert("Error", error.message || "Error saving record"); 
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView className="space-y-5 px-1">
            <View className="flex-row p-1 bg-slate-100 rounded-2xl mb-5">
                {['income', 'expense', 'payroll'].map((t) => (
                    (t !== 'payroll' || realm === 'company') && (
                        <TouchableOpacity 
                            key={t}
                            onPress={() => setForm({ ...form, type: t as any })}
                            className={`flex-1 py-3 rounded-xl items-center ${form.type === t ? 'bg-white shadow-sm' : ''}`}
                        >
                            <Text className={`font-bold ${form.type === t ? (t === 'income' ? 'text-emerald-600' : t === 'payroll' ? 'text-indigo-600' : 'text-rose-600') : 'text-slate-500'}`}>
                                {t === 'income' ? incomeLabel : t.charAt(0).toUpperCase() + t.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    )
                ))}
            </View>

            <View className="space-y-4">
                <View>
                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Amount (₱)</Text>
                    <TextInput 
                        keyboardType="numeric"
                        placeholder="0.00"
                        value={form.amt}
                        onChangeText={(val) => setForm({ ...form, amt: val })}
                        className="bg-white p-5 border border-slate-200 rounded-2xl text-2xl font-bold text-slate-800"
                    />
                </View>

                <View>
                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Description</Text>
                    <TextInput 
                        placeholder={form.type === 'income' ? incomePlaceholder : expensePlaceholder}
                        value={form.desc}
                        onChangeText={(val) => setForm({ ...form, desc: val })}
                        className="bg-white p-5 border border-slate-200 rounded-2xl font-medium text-slate-700"
                    />
                </View>

                <TouchableOpacity onPress={pickImage} className="border-2 border-dashed border-slate-200 rounded-2xl p-5 bg-slate-50 items-center">
                    <Text className="text-slate-500 font-bold">
                        {imageUri ? "✅ Receipt Attached" : "📸 Attach Receipt/PDF"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={submit}
                    disabled={loading}
                    className={`p-5 rounded-2xl items-center shadow-lg active:scale-[0.98] ${
                        form.type === 'income' ? 'bg-emerald-600' : form.type === 'payroll' ? 'bg-indigo-600' : 'bg-rose-600'
                    }`}
                >
                    {loading ? (
                        <UnifiedLoadingWidget type="inline" message="Processing..." />
                    ) : (
                        <Text className="text-white font-black text-lg">
                            {form.type === 'payroll' ? 'Confirm Disbursement' : 'Save Transaction'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}