import React, { useState, useContext } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    ActivityIndicator, 
    Alert, 
    Image,
    ScrollView 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppContext } from '../../../../Context/AppContext.jsx';

// --- CONFIGURATION ---
const CLOUDINARY_CLOUD_NAME = "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = "ml_default";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

interface MakeRepaymentWidgetProps {
    loan: any;
    onSuccess: () => void;
}

export default function MakeRepaymentWidget({ loan, onSuccess }: MakeRepaymentWidgetProps) {
    const { user } = useContext(AppContext) as any;
    
    // Replace with your local machine IP if testing on a physical device
    const API_URL = 'http://localhost:3000';

    const totalOwed = loan.total_owed || loan.amount;
    const outstanding = totalOwed - (loan.repaid_amount || 0);

    const [amount, setAmount] = useState<string>(outstanding.toFixed(2));
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('Submit for Confirmation');

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // --- IMAGE PICKER LOGIC ---
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
            setError(null);
        }
    };

    const handleSubmitForConfirmation = async () => {
        const repaymentAmount = parseFloat(amount);

        // Validation
        if (!user || !loan || !loan.id) {
            setError("Cannot process payment. Missing critical data.");
            return;
        }
        if (isNaN(repaymentAmount) || repaymentAmount <= 0) {
            setError("Please enter a valid, positive amount.");
            return;
        }
        if (repaymentAmount > (outstanding + 0.01)) { // Tiny buffer for float math
            setError(`Payment cannot exceed ₱${outstanding.toFixed(2)}.`);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let receiptUrl = null;

            // 1. Upload Receipt to Cloudinary (Mobile Multi-part Format)
            if (imageUri) {
                setStatusMessage("Uploading receipt...");
                const uploadFormData = new FormData();
                
                const filename = imageUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : `image`;

                uploadFormData.append('file', {
                    uri: imageUri,
                    name: filename || 'repayment.jpg',
                    type: type,
                } as any);
                
                uploadFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

                const response = await fetch(CLOUDINARY_API_URL, { 
                    method: 'POST', 
                    body: uploadFormData,
                    headers: { 'content-type': 'multipart/form-data' }
                });
                
                if (!response.ok) throw new Error('Failed to upload receipt photo.');
                
                const data = await response.json();
                receiptUrl = data.secure_url;
            }
            
            setStatusMessage("Submitting...");

            // 2. Update Loan (PATCH) to add pending_repayment
            const pendingRepaymentData = {
                amount: repaymentAmount,
                submitted_by: user.uid,
                submitted_at: new Date().toISOString(),
                receipt_url: receiptUrl || null,
            };

            const loanResponse = await fetch(`${API_URL}/loans/${loan.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pending_repayment: pendingRepaymentData 
                })
            });

            if (!loanResponse.ok) throw new Error("Failed to submit repayment to server.");

            // 3. Create Expense Transaction (POST)
            const transactionData = {
                user_id: user.uid,
                family_id: null,
                type: 'expense',
                amount: repaymentAmount,
                description: `Loan repayment for: ${loan.description}`,
                attachment_url: receiptUrl,
                created_at: new Date().toISOString()
            };

            const txResponse = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData)
            });

            if (!txResponse.ok) throw new Error("Payment logged, but failed to record transaction.");

            Alert.alert("Success", "Repayment submitted! Please wait for the lender to confirm.");
            onSuccess();

        } catch (err: any) {
            console.error("Repayment Error:", err);
            setError("Could not submit payment. Check your connection.");
        } finally {
            setLoading(false);
            setStatusMessage('Submit for Confirmation');
        }
    };

    return (
        <ScrollView className="p-1 space-y-6" keyboardShouldPersistTaps="handled">
            {/* Header / Info */}
            <View>
                <Text className="text-sm text-slate-500">You are making a repayment for:</Text>
                <Text className="font-bold text-lg text-slate-800 mt-1">{loan.description}</Text>
                
                <View className="bg-rose-50 p-4 rounded-2xl mt-4 border border-rose-100">
                    <Text className="text-xs text-rose-800 font-bold uppercase tracking-wider mb-1">Outstanding Balance</Text>
                    <Text className="text-2xl font-bold text-rose-600">
                        ₱{outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                </View>
            </View>

            <View className="h-[1px] bg-slate-100 w-full" />

            {/* Amount Input */}
            <View>
                <Text className="text-sm font-bold text-slate-700 mb-2">Repayment Amount (₱)</Text>
                <TextInput 
                    value={amount} 
                    onChangeText={setAmount} 
                    keyboardType="numeric"
                    placeholder="0.00"
                    editable={!loading}
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xl font-bold text-slate-800"
                />
            </View>
            
            {/* Attachment Picker */}
            <View>
                <Text className="text-sm font-bold text-slate-700 mb-2">
                    Attach Proof of Payment <Text className="text-slate-400 font-normal">(Optional)</Text>
                </Text>
                
                <TouchableOpacity 
                    onPress={pickImage}
                    disabled={loading}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-6 items-center justify-center bg-slate-50"
                >
                    {imageUri ? (
                        <View className="items-center">
                            <Image source={{ uri: imageUri }} className="w-24 h-24 rounded-xl mb-3" />
                            <Text className="text-indigo-600 font-bold text-xs">Change Attachment</Text>
                        </View>
                    ) : (
                        <View className="items-center">
                            <View className="bg-white p-3 rounded-full mb-2 shadow-sm">
                                <Text className="text-xl">📄</Text>
                            </View>
                            <Text className="text-indigo-600 font-bold text-sm">Pick Proof</Text>
                            <Text className="text-slate-400 text-[10px] mt-1">Tap to browse gallery</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Feedback / Error */}
            {error && (
                <View className="bg-rose-50 p-3 rounded-xl">
                    <Text className="text-rose-600 text-xs text-center font-medium">{error}</Text>
                </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity 
                onPress={handleSubmitForConfirmation} 
                disabled={loading}
                activeOpacity={0.7}
                className={`w-full py-5 rounded-2xl shadow-lg items-center ${
                    loading ? 'bg-indigo-300' : 'bg-indigo-600'
                }`}
                style={!loading && { shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
            >
                {loading ? (
                    <View className="flex-row items-center">
                        <ActivityIndicator color="white" className="mr-2" />
                        <Text className="text-white font-bold text-base">{statusMessage}</Text>
                    </View>
                ) : (
                    <Text className="text-white font-bold text-base">Submit for Confirmation</Text>
                )}
            </TouchableOpacity>

            <View className="px-4">
                <Text className="text-[10px] text-center text-slate-400 leading-4 italic">
                    This will be deducted from your personal balance. The lender must confirm this payment before the loan balance is updated.
                </Text>
            </View>

            {/* Bottom Spacing */}
            <View className="h-10" />
        </ScrollView>
    );
}