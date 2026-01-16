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

interface RecordPersonalRepaymentWidgetProps {
    loan: any; 
    onSuccess: () => void;
}

export default function RecordPersonalRepaymentWidget({ loan, onSuccess }: RecordPersonalRepaymentWidgetProps) {
    const { user } = useContext(AppContext) as any;
    
    // API URL for mobile testing
    const API_URL = 'https://super-duper-engine-57wjxxp4jxq2p64w-3000.app.github.dev/api';
    
    const totalOwed = loan.total_owed || loan.amount;
    const outstanding = totalOwed - (loan.repaid_amount || 0);

    const [amount, setAmount] = useState<string>('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('Record Repayment Received');
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

    const handleRecordRepayment = async () => {
        const repaymentAmount = parseFloat(amount);

        if (!user) { setError("You must be logged in."); return; }
        if (isNaN(repaymentAmount) || repaymentAmount <= 0) { setError("Please enter a valid amount."); return; }
        if (repaymentAmount > (outstanding + 0.01)) { setError(`Amount cannot exceed ₱${outstanding.toFixed(2)}.`); return; }

        setLoading(true);
        setError(null);

        try {
            let receiptUrl = null;

            // 1. Upload Receipt to Cloudinary (Native FormData Format)
            if (imageUri) {
                setStatusMessage("Uploading receipt...");
                const uploadFormData = new FormData();
                
                const filename = imageUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : `image`;

                uploadFormData.append('file', {
                    uri: imageUri,
                    name: filename || 'receipt.jpg',
                    type: type,
                } as any);
                
                uploadFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                
                const response = await fetch(CLOUDINARY_API_URL, {
                    method: 'POST',
                    body: uploadFormData
                });

                if (!response.ok) throw new Error('Failed to upload receipt.');
                const data = await response.json();
                receiptUrl = data.secure_url;
            }

            setStatusMessage("Recording payment...");
            
            // 2. Local Calculation for PATCH
            const currentRepaid = loan.repaid_amount || 0;
            const newRepaidAmount = currentRepaid + repaymentAmount;
            const newStatus = newRepaidAmount >= (totalOwed - 0.01) ? "repaid" : "outstanding";

            const newReceipt = receiptUrl ? {
                url: receiptUrl,
                amount: repaymentAmount,
                recorded_at: new Date().toISOString()
            } : null;

            const existingReceipts = loan.repayment_receipts || [];
            const updatedReceipts = newReceipt ? [...existingReceipts, newReceipt] : existingReceipts;

            // 3. PATCH Loan
            const updatePayload = {
                repaid_amount: newRepaidAmount,
                status: newStatus,
                repayment_receipts: updatedReceipts
            };

            const loanResponse = await fetch(`${API_URL}/loans/${loan.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload)
            });

            if (!loanResponse.ok) throw new Error("Failed to update loan record.");

            // 4. POST Transaction (Record Income for Creditor)
            const debtorName = loan.debtor?.full_name || loan.debtor_name || 'the borrower';
            const creditorIncomeData = {
                user_id: user.uid,
                family_id: null,
                type: 'income',
                amount: repaymentAmount,
                description: `Repayment received from ${debtorName} for: ${loan.description}`,
                attachment_url: receiptUrl,
                created_at: new Date().toISOString()
            };

            const creditorTxResponse = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(creditorIncomeData)
            });

            if (!creditorTxResponse.ok) throw new Error("Failed to record income transaction.");

            // 5. POST Transaction (Record Expense for Debtor)
            if (loan.debtor_id) {
                const creditorName = user.full_name || 'the lender';
                const debtorExpenseData = {
                    user_id: loan.debtor_id,
                    family_id: null,
                    type: 'expense',
                    amount: repaymentAmount,
                    description: `Repayment sent to ${creditorName} for: ${loan.description}`,
                    attachment_url: receiptUrl,
                    created_at: new Date().toISOString()
                };

                const debtorTxResponse = await fetch(`${API_URL}/transactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(debtorExpenseData)
                });
                
                if (!debtorTxResponse.ok) {
                    console.warn(`Failed to record debtor expense for UID: ${loan.debtor_id}`);
                }
            }

            Alert.alert("Success", "Repayment successfully recorded.");
            onSuccess();

        } catch (err: any) {
            console.error("Failed to record repayment:", err);
            setError("Could not record the repayment. Check connection.");
        } finally {
            setLoading(false);
            setStatusMessage('Record Repayment Received');
        }
    };

    const debtorDisplayName = loan.debtor?.full_name || loan.debtor_name || 'Borrower';

    return (
        <ScrollView className="p-1 space-y-6" keyboardShouldPersistTaps="handled">
            <View>
                <Text className="text-sm text-slate-500">Recording a repayment from:</Text>
                <Text className="font-bold text-lg text-slate-800 mt-1">{debtorDisplayName}</Text>
                
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
                <Text className="text-sm font-bold text-slate-700 mb-2">Amount Received (₱)</Text>
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
                    Attach Proof of Receipt <Text className="text-slate-400 font-normal">(Optional)</Text>
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
                                <Text className="text-xl">🧾</Text>
                            </View>
                            <Text className="text-indigo-600 font-bold text-sm">Upload Receipt</Text>
                            <Text className="text-slate-400 text-[10px] mt-1">Select from Gallery</Text>
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
                onPress={handleRecordRepayment} 
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
                    <Text className="text-white font-bold text-base">Record Repayment Received</Text>
                )}
            </TouchableOpacity>

            <View className="px-4">
                <Text className="text-[10px] text-center text-slate-400 leading-4 italic">
                    This will be added to your personal balance as income. The borrower's balance will also be updated.
                </Text>
            </View>

            <View className="h-10" />
        </ScrollView>
    );
}