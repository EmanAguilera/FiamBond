import React, { useState, useContext } from "react";
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator, 
    Alert, 
    Platform,
    Image 
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppContext } from "../../../../Context/AppContext";

interface CreatePersonalLoanWidgetProps {
    onSuccess?: () => void;
}

// --- CONFIGURATION ---
const CLOUD_URL = `https://api.cloudinary.com/v1_1/dzcnbrgjy/image/upload`;
const API_URL = 'https://super-duper-engine-57wjxxp4jxq2p64w-3000.app.github.dev/api'; 

export default function CreatePersonalLoanWidget({ onSuccess }: CreatePersonalLoanWidgetProps) {
    const { user } = useContext(AppContext) as any;
    
    const [form, setForm] = useState({ 
        amount: "", 
        interest: "", 
        desc: "", 
        debtorName: "", 
        deadline: new Date() 
    });
    
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // --- IMAGE PICKER ---
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    // --- DATE PICKER HANDLER ---
    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS to see the wheel
        if (selectedDate) {
            setForm({ ...form, deadline: selectedDate });
        }
    };

    // --- SUBMIT LOGIC ---
    const submit = async () => {
        if (!user) return Alert.alert("Error", "Login required");
        if (!form.debtorName || !form.amount || !form.desc) {
            return Alert.alert("Error", "Please fill in all required fields");
        }

        setLoading(true);
        try {
            let attachment_url = null;

            // 1. Upload to Cloudinary if image exists
            if (imageUri) {
                const formData = new FormData();
                const filename = imageUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : `image`;

                formData.append('file', {
                    uri: imageUri,
                    name: filename || 'personal_loan_receipt.jpg',
                    type: type,
                } as any);
                formData.append('upload_preset', "ml_default");

                const cloudRes = await fetch(CLOUD_URL, {
                    method: 'POST',
                    body: formData
                });

                if (cloudRes.ok) {
                    const cloudData = await cloudRes.json();
                    attachment_url = cloudData.secure_url;
                }
            }

            const principal = parseFloat(form.amount) || 0;
            const interest = parseFloat(form.interest) || 0;

            // 2. Create Loan Record
            const loanRes = await fetch(`${API_URL}/loans`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    family_id: null,
                    creditor_id: user.uid,
                    debtor_id: null,
                    debtor_name: form.debtorName,
                    amount: principal,
                    interest_amount: interest,
                    total_owed: principal + interest,
                    repaid_amount: 0,
                    description: form.desc,
                    deadline: form.deadline.toISOString(),
                    status: "outstanding",
                    attachment_url
                })
            });

            if (!loanRes.ok) throw new Error("Loan creation failed");

            // 3. Record Transaction (Expense)
            await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.uid,
                    family_id: null,
                    type: "expense",
                    amount: principal,
                    description: `Personal loan to ${form.debtorName}: ${form.desc}`,
                    attachment_url,
                    created_at: new Date().toISOString()
                })
            });

            Alert.alert("Success", "Personal Loan Created");
            setForm({ amount: "", interest: "", desc: "", debtorName: "", deadline: new Date() });
            setImageUri(null);
            onSuccess?.();
        } catch (e) {
            Alert.alert("Error", "Error processing loan");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const labelStyle = "text-sm font-bold text-slate-700 mb-2";
    const inputStyle = "bg-white border border-slate-200 p-4 rounded-2xl text-slate-800 text-base mb-5";

    return (
        <ScrollView className="flex-1 p-1" keyboardShouldPersistTaps="handled">
            
            {/* DEBTOR NAME */}
            <Text className={labelStyle}>Lending To (Name)</Text>
            <TextInput 
                placeholder="e.g. John Doe"
                placeholderTextColor="#94a3b8"
                value={form.debtorName}
                onChangeText={(val) => setForm({ ...form, debtorName: val })}
                className={inputStyle}
            />

            {/* AMOUNT & INTEREST */}
            <View className="flex-row gap-x-3">
                <View className="flex-1">
                    <Text className={labelStyle}>Amount (₱)</Text>
                    <TextInput 
                        placeholder="0.00"
                        placeholderTextColor="#94a3b8"
                        keyboardType="numeric"
                        value={form.amount}
                        onChangeText={(val) => setForm({ ...form, amount: val })}
                        className={`${inputStyle} font-bold`}
                    />
                </View>
                <View className="flex-1">
                    <Text className={labelStyle}>Interest (₱)</Text>
                    <TextInput 
                        placeholder="0.00"
                        placeholderTextColor="#94a3b8"
                        keyboardType="numeric"
                        value={form.interest}
                        onChangeText={(val) => setForm({ ...form, interest: val })}
                        className={inputStyle}
                    />
                </View>
            </View>

            {/* DESCRIPTION */}
            <Text className={labelStyle}>Description</Text>
            <TextInput 
                placeholder="e.g. Emergency Cash"
                placeholderTextColor="#94a3b8"
                value={form.desc}
                onChangeText={(val) => setForm({ ...form, desc: val })}
                className={inputStyle}
            />

            {/* DEADLINE PICKER */}
            <Text className={labelStyle}>Deadline <Text className="text-slate-400 font-normal">(Optional)</Text></Text>
            <TouchableOpacity 
                onPress={() => setShowDatePicker(true)}
                className={inputStyle}
            >
                <Text className="text-slate-700">{form.deadline.toLocaleDateString()}</Text>
            </TouchableOpacity>

            {showDatePicker && (
                <DateTimePicker
                    value={form.deadline}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    minimumDate={new Date()}
                />
            )}

            {/* RECEIPT PICKER */}
            <Text className={labelStyle}>Receipt <Text className="text-slate-400 font-normal">(Optional)</Text></Text>
            <TouchableOpacity 
                onPress={pickImage}
                className="bg-white border-2 border-dashed border-slate-200 p-6 rounded-2xl items-center justify-center mb-8"
            >
                {imageUri ? (
                    <View className="items-center">
                        <Image source={{ uri: imageUri }} className="w-20 h-20 rounded-lg mb-2" />
                        <Text className="text-indigo-600 font-bold text-xs">Change Attachment</Text>
                    </View>
                ) : (
                    <View className="items-center">
                        <View className="bg-slate-50 p-3 rounded-full mb-2">
                             <Text className="text-xl">📷</Text>
                        </View>
                        <Text className="text-indigo-600 font-bold">Pick Photo</Text>
                        <Text className="text-slate-400 text-[10px] mt-1">Proof of transfer / receipt</Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* SUBMIT BUTTON */}
            <TouchableOpacity 
                onPress={submit}
                disabled={loading}
                activeOpacity={0.7}
                className={`w-full py-5 rounded-2xl shadow-lg items-center mb-10 ${
                    loading ? 'bg-indigo-300' : 'bg-indigo-600'
                }`}
                style={!loading && { shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text className="text-white font-bold text-lg">Confirm & Lend</Text>
                )}
            </TouchableOpacity>

        </ScrollView>
    );
}