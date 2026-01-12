import React, { useState, useContext } from "react";
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator, 
    Alert, 
    Modal, 
    Image 
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { AppContext } from "../../../Context/AppContext";

// --- CONFIGURATION ---
const CLOUD_URL = `https://api.cloudinary.com/v1_1/dzcnbrgjy/image/upload`;
const API_URL = 'http://localhost:3000'; // Replace with local IP for physical devices

interface Props { 
    company: { id: string | number }; 
    onSuccess?: () => void; 
}

export default function CreateCompanyTransactionWidget({ company, onSuccess }: Props) {
    const { user } = useContext(AppContext) as any;
    const [form, setForm] = useState({ desc: "", amt: "", type: "expense" as "income" | "expense" });
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [conflict, setConflict] = useState<{ name: string } | null>(null);

    // --- IMAGE PICKER LOGIC ---
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

    const submit = async () => {
        if (!user) return Alert.alert("Error", "Login required");
        if (!form.amt || !form.desc) return Alert.alert("Error", "Please fill in all required fields");

        setLoading(true);
        try {
            let attachment_url = null;

            // 1. Upload Receipt to Cloudinary (Native FormData format)
            if (imageUri) {
                const formData = new FormData();
                const filename = imageUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : `image`;

                formData.append('file', {
                    uri: imageUri,
                    name: filename || 'receipt.jpg',
                    type: type,
                } as any);
                
                formData.append('upload_preset', "ml_default");

                const cloudRes = await fetch(CLOUD_URL, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'content-type': 'multipart/form-data',
                    },
                });

                if (cloudRes.ok) {
                    const cloudData = await cloudRes.json();
                    attachment_url = cloudData.secure_url;
                }
            }

            // 2. API Submission
            const res = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.uid, 
                    company_id: company.id, 
                    description: form.desc,
                    amount: parseFloat(form.amt), 
                    type: form.type, 
                    attachment_url,
                    created_at: new Date().toISOString()
                })
            });

            if (!res.ok) throw new Error("Server error");

            Alert.alert("Success", `${form.type === 'income' ? 'Revenue' : 'Expense'} Recorded`);
            
            // Reset Form
            setForm({ desc: "", amt: "", type: "expense" });
            setImageUri(null); 
            setConflict(null);
            onSuccess?.();

        } catch (e) {
            Alert.alert("Error", "Error saving record. Please check your connection.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView className="flex-1 p-1" keyboardShouldPersistTaps="handled">
            
            {/* --- CONFLICT MODAL --- */}
            <Modal visible={!!conflict} transparent animationType="fade">
                <View className="flex-1 bg-black/60 items-center justify-center p-6">
                    <View className="bg-white p-6 rounded-3xl w-full items-center shadow-xl">
                        <Text className="text-xl font-bold mb-2">Conflict Detected</Text>
                        <Text className="text-indigo-600 font-bold text-lg mb-6">{conflict?.name}</Text>
                        
                        <View className="flex-row gap-3 w-full">
                            <TouchableOpacity 
                                onPress={() => submit()} 
                                className="flex-1 bg-rose-50 p-4 rounded-2xl items-center"
                            >
                                <Text className="text-rose-700 font-bold">Abandon</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => submit()} 
                                className="flex-1 bg-indigo-600 p-4 rounded-2xl items-center"
                            >
                                <Text className="text-white font-bold">Proceed</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* --- TYPE SELECTOR --- */}
            <View className="flex-row gap-3 mb-6">
                <TouchableOpacity 
                    onPress={() => setForm({ ...form, type: 'income' })}
                    className={`flex-1 py-4 rounded-2xl items-center border-2 transition ${
                        form.type === 'income' 
                        ? 'bg-emerald-50 border-emerald-500' 
                        : 'bg-white border-slate-100'
                    }`}
                >
                    <Text className={`font-bold ${form.type === 'income' ? 'text-emerald-700' : 'text-slate-400'}`}>
                        + Revenue
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={() => setForm({ ...form, type: 'expense' })}
                    className={`flex-1 py-4 rounded-2xl items-center border-2 transition ${
                        form.type === 'expense' 
                        ? 'bg-rose-50 border-rose-500' 
                        : 'bg-white border-slate-100'
                    }`}
                >
                    <Text className={`font-bold ${form.type === 'expense' ? 'text-rose-700' : 'text-slate-400'}`}>
                        - Expense
                    </Text>
                </TouchableOpacity>
            </View>

            {/* --- AMOUNT INPUT --- */}
            <View className="mb-5">
                <Text className="text-sm font-bold text-slate-700 mb-2">Amount (₱)</Text>
                <TextInput 
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={form.amt}
                    onChangeText={(val) => setForm({ ...form, amt: val })}
                    className="bg-white border border-slate-200 p-4 rounded-2xl text-2xl font-bold text-slate-800"
                />
            </View>
            
            {/* --- DESCRIPTION INPUT --- */}
            <View className="mb-5">
                <Text className="text-sm font-bold text-slate-700 mb-2">Description</Text>
                <TextInput 
                    placeholder={form.type === 'income' ? "e.g. Sales" : "e.g. Office Rent"}
                    value={form.desc}
                    onChangeText={(val) => setForm({ ...form, desc: val })}
                    className="bg-white border border-slate-200 p-4 rounded-2xl text-base text-slate-800"
                />
            </View>
            
            {/* --- RECEIPT PICKER --- */}
            <View className="mb-8">
                <Text className="text-sm font-bold text-slate-700 mb-2">
                    Receipt <Text className="text-slate-400 font-normal">(Optional)</Text>
                </Text>
                
                <TouchableOpacity 
                    onPress={pickImage}
                    className="bg-white border-2 border-dashed border-slate-200 p-6 rounded-2xl items-center justify-center"
                >
                    {imageUri ? (
                        <View className="items-center">
                            <Image source={{ uri: imageUri }} className="w-20 h-20 rounded-lg mb-2" />
                            <Text className="text-indigo-600 font-bold text-xs">Change Photo</Text>
                        </View>
                    ) : (
                        <View className="items-center">
                            <View className="bg-slate-50 p-3 rounded-full mb-2 shadow-sm">
                                <Text className="text-xl">📸</Text>
                            </View>
                            <Text className="text-indigo-600 font-bold">Upload Photo</Text>
                            <Text className="text-slate-400 text-[10px] mt-1">Tap to select receipt</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* --- SUBMIT BUTTON --- */}
            <TouchableOpacity 
                onPress={submit}
                disabled={loading}
                className={`w-full py-5 rounded-2xl shadow-lg items-center ${
                    loading ? 'bg-indigo-300' : 'bg-indigo-600 shadow-indigo-200'
                }`}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text className="text-white font-bold text-lg">Save Record</Text>
                )}
            </TouchableOpacity>

            <View className="mt-4 px-4">
                <Text className="text-xs text-center text-slate-400 italic leading-4">
                    Transaction will be recorded in the <Text className="font-bold text-indigo-500">Corporate Realm</Text>.
                </Text>
            </View>

            {/* Spacing for keyboard */}
            <View className="h-20" />

        </ScrollView>
    );
}