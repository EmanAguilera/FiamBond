import React, { useState, useContext } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    Alert, 
    ActivityIndicator, 
    Platform 
} from "react-native";
import { AppContext } from "../../../../Context/AppContext.jsx";

// Cloudinary constants (use process.env in RN/Expo)
const CLOUD_URL = `https://api.cloudinary.com/v1_1/${process.env.VITE_CLOUDINARY_CLOUD_NAME || "dzcnbrgjy"}/image/upload`;
const API_URL = process.env.VITE_API_URL || 'http://localhost:3000/api'; // Simplified URL

// --- INTERFACES FOR TYPE SAFETY ---
interface Loan {
    id: string;
    amount: string | number;
    description: string;
    creditor: { full_name: string };
    [key: string]: any;
}
interface LoanConfirmationWidgetProps {
    loan: Loan; // Use the defined Loan interface
    onSuccess: () => void;
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

export default function LoanConfirmationWidget({ loan, onSuccess }: LoanConfirmationWidgetProps) {
    // FIX: Assert context type with non-null assertion (!)
    const { user } = useContext(AppContext)! as AppContextType; 
    
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirmReceipt = async () => {
        // Safe check for user object access (user is now User | null)
        if (!user || !user.uid || !loan || !loan.id) {
            setError("Cannot process confirmation. Critical data is missing.");
            Alert.alert("Error", "Cannot process confirmation. Critical data is missing.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Update Loan Status (PATCH)
            const loanResponse = await fetch(`${API_URL}/loans/${loan.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: "outstanding",
                    confirmed_at: new Date() // JS Date
                })
            });

            if (!loanResponse.ok) throw new Error("Failed to update loan status.");

            // 2. Create Income Transaction for Debtor (POST)
            const creditorName = loan.creditor?.full_name || 'the lender';
            
            const transactionData = {
                user_id: user.uid, // SAFE access now
                family_id: null, // Personal income
                type: 'income',
                amount: Number(loan.amount),
                description: `Loan received from ${creditorName}: ${loan.description}`,
                // created_at handled by backend
            };

            const txResponse = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData)
            });

            if (!txResponse.ok) throw new Error("Loan confirmed, but failed to record income transaction.");

            Alert.alert("Success", "Loan confirmed and funds recorded as income.");
            if (onSuccess) onSuccess();

        } catch (err: any) {
            console.error("Failed to confirm loan receipt:", err);
            setError("Could not confirm receipt. Please check your connection and try again.");
            Alert.alert("Error", "Could not confirm receipt. Please check your connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View>
                <Text style={styles.promptText}>Please confirm you have received the funds for the following loan:</Text>
                <View style={styles.loanDetailsBox}>
                    <Text style={styles.loanDescription}>{loan.description}</Text>
                    <Text style={styles.loanCreditor}>From: <Text style={styles.loanCreditorName}>{loan.creditor?.full_name || 'Lender'}</Text></Text>
                    <Text style={styles.loanAmount}>
                        Amount: ₱{Number(loan.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                </View>
            </View>
            <View style={styles.divider} />
            {error && <Text style={styles.errorText}>{error}</Text>}
            <TouchableOpacity 
                onPress={handleConfirmReceipt} 
                style={[styles.primaryBtn, loading && styles.btnDisabled]} 
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryBtnText}>Confirm Funds Received</Text>}
            </TouchableOpacity>
            <Text style={styles.infoText}>This will add the loan amount to your personal balance as income.</Text>
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
    loanDetailsBox: {
        marginTop: 8, // mt-2
        padding: 12, // p-3
        backgroundColor: '#F9FAFB', // bg-gray-50
        borderRadius: 6, // rounded-md
        borderWidth: 1,
        borderColor: '#E5E7EB', // border-gray-200
    },
    loanDescription: {
        fontWeight: '600', // font-semibold
        color: '#1F2937', // text-gray-800
    },
    loanCreditor: {
        fontSize: 14, // text-sm
        color: '#6B7280', // text-gray-500
        marginTop: 4, // mt-1
    },
    loanCreditorName: {
        fontWeight: '500', // font-medium
    },
    loanAmount: {
        fontSize: 18, // text-lg
        fontWeight: 'bold',
        color: '#059669', // text-green-600
        marginTop: 8, // mt-2
    },
    divider: {
        borderBottomWidth: 1,
        borderColor: '#E5E7EB', // hr
    },
    errorText: {
        color: '#EF4444', // error
        textAlign: 'center',
        fontSize: 14,
    },
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
    infoText: {
        fontSize: 12, // text-xs
        textAlign: 'center',
        color: '#6B7280', // text-gray-500
    }
});