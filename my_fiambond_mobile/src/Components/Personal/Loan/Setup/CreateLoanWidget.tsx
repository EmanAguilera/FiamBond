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

interface Member { id: string; full_name: string; }
interface CreateLoanWidgetProps { 
    family: { id: string }; 
    members: Member[]; 
    onSuccess?: () => void; 
}

// --- CONFIGURATION ---
const CLOUD_URL = `https://api.cloudinary.com/v1_1/dzcnbrgjy/image/upload`;
const API_URL = 'http://localhost:3000'; 

export default function CreateLoanWidget({ family, members, onSuccess }: CreateLoanWidgetProps) {
    const { user } = useContext(AppContext) as any;
    
    const [form, setForm] = useState({ 
        amount: "", 
        interest: "", 
        desc: "", 
        debtorId: "", 
        deadline: new Date() 
    });
    
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Filter out current user from potential debtors
    const otherMembers = (members || []).filter(m => String(m.id) !== String(user?.uid));

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
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setForm({ ...form, deadline: selectedDate });
        }
    };

    // --- SUBMIT LOGIC ---
    const submit = async () => {
        if (!user) return Alert.alert("Error", "Login required");
        if (!form.debtorId) return Alert.alert("Error", "Please select a family member");
        if (!form.amount || !form.desc) return Alert.alert("Error", "Amount and Description are required");

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
                    name: filename || 'loan_receipt.jpg',
                    type: type,
                } as any);
                formData.append('upload_preset', "ml_default");

                const cloudRes = await fetch(CLOUD_URL, {
                    method: 'POST',
                    body: formData,
                    headers: { 'content-type': 'multipart/form-data' },
                });

                if (cloudRes.ok) {
                    const cloudData = await cloudRes.json();
                    attachment_url = cloudData.secure_url;
                }
            }

            const debtorName = members.find(m => String(m.id) === String(form.debtorId))?.full_name || 'Member';
            const principal = parseFloat(form.amount) || 0;
            const interest = parseFloat(form.interest) || 0;

            // 2. Create Loan Record
            const loanRes = await fetch(`${API_URL}/loans`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    family_id: family.id,
                    creditor_id: user.uid,
                    debtor_id: form.debtorId,
                    debtor_name: debtorName,
                    amount: principal,
                    interest_amount: interest,
                    total_owed: principal + interest,
                    repaid_amount: 0,
                    description: form.desc,
                    deadline: form.deadline.toISOString(),
                    status: "pending_confirmation",
                    attachment_url
                })
            });

            if (!loanRes.ok) throw new Error("Loan creation failed");

            // 3. Record Personal Transaction (Expense for Lender)
            await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.uid,
                    family_id: null,
                    type: "expense",
                    amount: principal,
                    description: `Loan to ${debtorName}: ${form.desc}`,
                    attachment_url,
                    created_at: new Date().toISOString()
                })
            });

            Alert.alert("Success", "Loan Request Sent");
            setForm({ amount: "", interest: "", desc: "", debtorId: "", deadline: new Date() });
            setImageUri(null);
            onSuccess?.();
        } catch (e) {
            Alert.alert("Error", "Error processing loan");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const inputLabelStyle = "text-sm font-bold text-slate-700 mb-2";
    const inputFieldStyle = "bg-white border border-slate-200 p-4 rounded-2xl text-slate-800 text-base mb-5";

    return (
        <ScrollView className="flex-1 p-1" keyboardShouldPersistTaps="handled">
            
            {/* DEBTOR SELECTOR */}
            <Text className={inputLabelStyle}>Lending To</Text>
            <View className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-5">
                {otherMembers.length > 0 ? (
                    otherMembers.map((m) => (
                        <TouchableOpacity 
                            key={m.id}
                            onPress={() => setForm({ ...form, debtorId: m.id })}
                            className={`p-4 border-b border-slate-50 ${form.debtorId === m.id ? 'bg-indigo-50' : ''}`}
                        >
                            <Text className={`font-semibold ${form.debtorId === m.id ? 'text-indigo-600' : 'text-slate-600'}`}>
                                {m.full_name} {form.debtorId === m.id ? '✓' : ''}
                            </Text>
                        </TouchableOpacity>
                    ))
                ) : (
                    <Text className="p-4 text-slate-400 italic">No other members in family.</Text>
                )}
            </View>

            {/* AMOUNT & INTEREST */}
            <View className="flex-row gap-x-3">
                <View className="flex-1">
                    <Text className={inputLabelStyle}>Amount (₱)</Text>
                    <TextInput 
                        placeholder="0.00"
                        keyboardType="numeric"
                        value={form.amount}
                        onChangeText={(val) => setForm({ ...form, amount: val })}
                        className={inputFieldStyle}
                    />
                </View>
                <View className="flex-1">
                    <Text className={inputLabelStyle}>Interest (₱)</Text>
                    <TextInput 
                        placeholder="0.00"
                        keyboardType="numeric"
                        value={form.interest}
                        onChangeText={(val) => setForm({ ...form, interest: val })}
                        className={inputFieldStyle}
                    />
                </View>
            </View>

            {/* DESCRIPTION */}
            <Text className={inputLabelStyle}>Description</Text>
            <TextInput 
                placeholder="e.g. Lunch money"
                value={form.desc}
                onChangeText={(val) => setForm({ ...form, desc: val })}
                className={inputFieldStyle}
            />

            {/* DEADLINE PICKER */}
            <Text className={inputLabelStyle}>Deadline <Text className="text-slate-400 font-normal">(Optional)</Text></Text>
            <TouchableOpacity 
                onPress={() => setShowDatePicker(true)}
                className={inputFieldStyle}
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
            <Text className={inputLabelStyle}>Receipt <Text className="text-slate-400 font-normal">(Optional)</Text></Text>
            <TouchableOpacity 
                onPress={pickImage}
                className="bg-white border-2 border-dashed border-slate-200 p-6 rounded-2xl items-center justify-center mb-8"
            >
                {imageUri ? (
                    <View className="items-center">
                        <Image source={{ uri: imageUri }} className="w-20 h-20 rounded-lg mb-2" />
                        <Text className="text-indigo-600 font-bold text-xs">Change Photo</Text>
                    </View>
                ) : (
                    <View className="items-center">
                        <Text className="text-indigo-600 font-bold">Upload Photo</Text>
                        <Text className="text-slate-400 text-[10px] mt-1">Select proof of transfer</Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* SUBMIT BUTTON */}
            <TouchableOpacity 
                onPress={submit}
                disabled={loading || otherMembers.length === 0}
                className={`w-full py-5 rounded-2xl shadow-lg items-center mb-10 ${
                    loading || otherMembers.length === 0 ? 'bg-indigo-300' : 'bg-indigo-600 shadow-indigo-200'
                }`}
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