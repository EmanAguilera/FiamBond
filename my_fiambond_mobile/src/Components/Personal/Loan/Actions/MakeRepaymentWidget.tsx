import React, { useState, useContext } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    TextInput, 
    StyleSheet, 
    Alert, 
    ActivityIndicator,
    Platform 
} from 'react-native';
import { AppContext } from '../../../../Context/AppContext.jsx';

// Cloudinary constants (use process.env in RN/Expo)
const CLOUDINARY_CLOUD_NAME = process.env.VITE_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy";
const CLOUDINARY_UPLOAD_PRESET = process.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default";
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// --- INTERFACES FOR TYPE SAFETY ---
interface Loan {
    id: string;
    amount: string | number;
    description: string;
    total_owed?: number;
    repaid_amount?: number;
    [key: string]: any;
}
interface LoanConfirmationWidgetProps {
    loan: Loan;
    onSuccess: () => void;
}

// Placeholder type for the native file/receipt object
interface NativeFile {
    uri: string;
    name: string;
    type: string; // e.g., 'image/jpeg', 'application/pdf'
}

// Interfaces for Context Fix (Error 2339)
interface User { 
    uid: string; 
    [key: string]: any; 
}
interface AppContextType { 
    user: User | null; 
    [key: string]: any; 
}
// ------------------------------------


export default function MakeRepaymentWidget({ loan, onSuccess }: LoanConfirmationWidgetProps) {
    // FIX: Assert context type with non-null assertion (!)
    const { user } = useContext(AppContext)! as AppContextType; 
    const API_URL = 'http://localhost:3000/api'; // Simplified URL

    const totalOwed = loan.total_owed || loan.amount;
    const outstanding = Number(totalOwed) - (loan.repaid_amount || 0);

    const [amount, setAmount] = useState<string>(outstanding.toFixed(2));
    const [attachmentFile, setAttachmentFile] = useState<NativeFile | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('Submit for Confirmation');

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Placeholder for native file picker
    const handleNativeFileUpload = async () => {
        Alert.alert("File Picker", "Native file picker integration required.");
    };

    const handleSubmitForConfirmation = async () => {
        const repaymentAmount = parseFloat(amount);

        // Safe check for user object access (user is now User | null)
        if (!user || !user.uid || !loan || !loan.id) {
            setError("Cannot process payment. Missing user or loan data.");
            Alert.alert("Error", "Cannot process payment. Missing user or loan data.");
            return;
        }
        if (isNaN(repaymentAmount) || repaymentAmount <= 0) {
            setError("Please enter a valid, positive amount.");
            Alert.alert("Error", "Please enter a valid, positive amount.");
            return;
        }
        if (repaymentAmount > outstanding) {
            setError(`Payment cannot exceed the outstanding amount of ₱${outstanding.toFixed(2)}.`);
            Alert.alert("Error", `Payment cannot exceed the outstanding amount of ₱${outstanding.toFixed(2)}.`);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let receiptUrl = null;

            // 1. Upload Receipt to Cloudinary
            if (attachmentFile) {
                setStatusMessage("Uploading receipt...");
                const uploadFormData = new FormData();
                
                // Append the native file object to FormData
                uploadFormData.append('file', {
                    uri: attachmentFile.uri,
                    name: attachmentFile.name,
                    type: attachmentFile.type,
                } as any);

                uploadFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

                const response = await fetch(CLOUDINARY_API_URL, { 
                    method: 'POST', 
                    body: uploadFormData,
                    // RN handles Content-Type for multipart/form-data automatically
                    headers: {}, 
                });

                if (!response.ok) throw new Error('Failed to upload receipt.');
                
                const data = await response.json();
                receiptUrl = data.secure_url;
            }
            
            setStatusMessage("Submitting for confirmation...");

            // 2. Update Loan (PATCH) to add pending_repayment
            const pendingRepaymentData = {
                amount: repaymentAmount,
                submitted_by: user.uid, // SAFE access now
                submitted_at: new Date(),
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
                user_id: user.uid, // SAFE access now
                family_id: null,
                type: 'expense',
                amount: repaymentAmount,
                description: `Loan repayment for: ${loan.description}`,
                attachment_url: receiptUrl
            };

            const txResponse = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData)
            });

            if (!txResponse.ok) throw new Error("Repayment submitted, but failed to record expense.");

            Alert.alert("Success", "Repayment submitted for confirmation by the lender.");
            onSuccess();

        } catch (err: any) {
            console.error("Failed to submit repayment:", err);
            setError("Could not submit payment. Please check your connection and try again.");
            Alert.alert("Error", "Could not submit payment. Please check your connection and try again.");
        } finally {
            setLoading(false);
            setStatusMessage('Submit for Confirmation');
        }
    };

    return (
        <View style={styles.container}>
            <View>
                <Text style={styles.promptText}>You are making a repayment for:</Text>
                <Text style={styles.loanDescription}>{loan.description}</Text>
                <Text style={styles.outstandingAmount}>
                    Outstanding: ₱{outstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
            </View>
            <View style={styles.divider} />
            
            <View>
                <Text style={styles.label}>Repayment Amount (₱)</Text>
                <TextInput 
                    style={styles.amountInput} 
                    keyboardType="numeric" 
                    value={amount} 
                    onChangeText={(text) => setAmount(text.replace(/[^0-9.]/g, ''))} 
                    editable={!loading} 
                />
            </View>
            
            <View>
                <Text style={styles.label}>
                    Attach Proof of Payment <Text style={styles.labelOptional}>(Optional)</Text>
                </Text>
                <TouchableOpacity 
                    onPress={handleNativeFileUpload} 
                    style={styles.fileButton}
                    disabled={loading}
                >
                    <Text style={styles.fileButtonText}>
                        {attachmentFile ? `File Selected: ${attachmentFile.name}` : "Tap to Select Receipt/File"}
                    </Text>
                    {attachmentFile && (
                         <TouchableOpacity onPress={() => setAttachmentFile(null)} style={styles.fileClearButton}>
                            <Text style={styles.fileClearText}>✕</Text>
                         </TouchableOpacity>
                    )}
                </TouchableOpacity>
                {attachmentFile && <Text style={styles.fileNameText}>Selected: {attachmentFile.name}</Text>}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
            
            <TouchableOpacity 
                onPress={handleSubmitForConfirmation} 
                style={[styles.primaryBtn, loading && styles.btnDisabled]} 
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryBtnText}>{statusMessage}</Text>}
            </TouchableOpacity>
            
            <Text style={styles.infoText}>
                This will be deducted from your personal balance. The lender must confirm this payment.
            </Text>
        </View>
    );
}

// --- REACT NATIVE STYLESHEET ---
const styles = StyleSheet.create({
    container: {
        gap: 16, // space-y-4
        padding: 16,
    },
    promptText: {
        fontSize: 14,
        color: '#4B5563', // text-gray-600
    },
    loanDescription: {
        fontWeight: '600', // font-semibold
        color: '#1F2937', // text-gray-800
        marginTop: 4,
    },
    outstandingAmount: {
        fontSize: 18, // text-lg
        fontWeight: 'bold',
        color: '#DC2626', // text-red-600
        marginTop: 8, // mt-2
    },
    divider: {
        borderBottomWidth: 1,
        borderColor: '#E5E7EB', // hr
    },
    label: {
        fontSize: 14,
        fontWeight: '500', // font-medium
        color: '#374151', // text-gray-700
        marginBottom: 4,
    },
    labelOptional: {
        color: '#9CA3AF', // text-gray-400
        fontWeight: 'normal',
    },
    amountInput: {
        width: '100%',
        padding: 8, // p-2
        borderWidth: 1,
        borderColor: '#D1D5DB', // border-gray-300
        borderRadius: 6, // rounded-md
        fontSize: 16,
        color: '#1F2937',
    },

    // File Upload (Simulated)
    fileButton: {
        padding: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB', 
        borderRadius: 8,
        backgroundColor: '#F9FAFB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    fileButtonText: {
        fontSize: 14,
        color: '#64748B',
        flexShrink: 1,
    },
    fileClearButton: {
        padding: 4,
        borderRadius: 10,
        backgroundColor: '#E5E7EB',
        marginLeft: 8,
    },
    fileClearText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#4B5563',
    },
    fileNameText: {
        fontSize: 12,
        color: '#4F46E5',
        marginTop: 4,
        paddingHorizontal: 4,
    },
    
    // Button Styles
    primaryBtn: {
        width: '100%', // w-full
        paddingVertical: 12, // py-3
        backgroundColor: '#4F46E5', // primary-btn / bg-indigo-600
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4, // shadow-md
    },
    primaryBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    btnDisabled: {
        opacity: 0.5,
    },
    errorText: {
        color: '#EF4444', // error
        textAlign: 'center',
        fontSize: 14,
    },
    infoText: {
        fontSize: 12, // text-xs
        textAlign: 'center',
        color: '#6B7280', // text-gray-500
    }
});