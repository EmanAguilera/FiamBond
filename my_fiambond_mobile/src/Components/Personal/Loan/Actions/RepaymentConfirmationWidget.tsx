import React, { useState, useContext } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    TextInput, 
    StyleSheet, 
    Alert, 
    ActivityIndicator,
    Linking, // Linking is used for opening the receipt URL
    Platform 
} from 'react-native';
import { AppContext } from '../../../../Context/AppContext.jsx';

// --- INTERFACES FOR TYPE SAFETY ---
interface Loan {
    id: string;
    amount: string | number;
    description: string;
    total_owed?: number | string;
    repaid_amount?: number | string;
    debtor_id?: string;
    debtor?: { full_name: string };
    debtor_name?: string;
    pending_repayment?: {
        amount: number | string;
        receipt_url?: string;
        [key: string]: any;
    } | null;
    repayment_receipts?: any[];
    [key: string]: any;
}

interface RepaymentConfirmationWidgetProps {
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


export default function RepaymentConfirmationWidget({ loan, onSuccess }: RepaymentConfirmationWidgetProps) {
    // FIX: Assert context type with non-null assertion (!)
    const { user } = useContext(AppContext)! as AppContextType; 
    const API_URL = 'http://localhost:3000/api'; // Simplified URL

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const pendingAmount = Number(loan.pending_repayment?.amount) || 0;
    
    const debtorDisplayName = loan.debtor?.full_name || loan.debtor_name || 'The borrower';

    const handleConfirmRepayment = async () => {
        // Safe check for user object access (user is now User | null)
        if (!user || !user.uid || !loan || !loan.id || !loan.pending_repayment) {
            setError("Cannot process confirmation. Critical data is missing.");
            Alert.alert("Error", "Cannot process confirmation. Critical data is missing.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const repaymentAmount = Number(loan.pending_repayment.amount);
            const currentRepaid = Number(loan.repaid_amount || 0);
            const totalOwed = Number(loan.total_owed || loan.amount);

            // 1. Calculate New Values
            const newRepaidAmount = currentRepaid + repaymentAmount;
            // Check if fully paid (allow for tiny floating point differences)
            const newStatus = newRepaidAmount >= (totalOwed - 0.01) ? "repaid" : "outstanding";

            // 2. Preserve Receipt: Move it from 'pending' to 'history'
            let updatedReceipts = loan.repayment_receipts || [];
            if (loan.pending_repayment.receipt_url) {
                updatedReceipts = [...updatedReceipts, {
                    url: loan.pending_repayment.receipt_url,
                    amount: repaymentAmount,
                    recorded_at: new Date()
                }];
            }

            // 3. PATCH Loan: Update amounts, status, receipts, and CLEAR pending_repayment
            const loanUpdatePayload = {
                repaid_amount: newRepaidAmount,
                status: newStatus,
                pending_repayment: null, // Clear pending
                repayment_receipts: updatedReceipts
            };

            const loanResponse = await fetch(`${API_URL}/loans/${loan.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loanUpdatePayload)
            });

            if (!loanResponse.ok) throw new Error("Failed to update loan status.");

            // 4. POST Transaction: Record Income for Creditor
            const transactionData = {
                user_id: user.uid, // Income for YOU (Creditor)
                family_id: null,   // Personal balance
                type: 'income',
                amount: repaymentAmount,
                description: `Repayment received from ${debtorDisplayName} for: ${loan.description}`,
                attachment_url: loan.pending_repayment.receipt_url || null
            };

            const txResponse = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData)
            });

            if (!txResponse.ok) throw new Error("Loan updated, but failed to record income transaction.");

            Alert.alert("Success", `Repayment of ₱${repaymentAmount.toFixed(2)} confirmed and recorded.`);
            onSuccess();

        } catch (err: any) {
            console.error("Failed to confirm repayment:", err);
            setError("Could not confirm repayment. Please try again.");
            Alert.alert("Error", "Could not confirm repayment. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleViewReceipt = () => {
        if (loan.pending_repayment?.receipt_url) {
            Linking.openURL(loan.pending_repayment.receipt_url).catch(err => 
                Alert.alert("Error", "Failed to open receipt link: " + err.message)
            );
        }
    };

    return (
        <View style={styles.container}>
            <View>
                <Text style={styles.promptText}>Please confirm you have received the following repayment:</Text>
                <View style={styles.loanDetailsBox}>
                    <Text style={styles.loanDescription}>{loan.description}</Text>
                    <Text style={styles.loanDebtor}>From: <Text style={styles.loanDebtorName}>{debtorDisplayName}</Text></Text>
                    <Text style={styles.loanAmount}>
                        Amount: ₱{Number(pendingAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                    
                    {loan.pending_repayment?.receipt_url && (
                        <View style={styles.receiptLinkWrapper}>
                            <TouchableOpacity 
                                onPress={handleViewReceipt}
                            >
                                <Text style={styles.receiptLinkText}>
                                    View Attached Receipt
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
            <View style={styles.divider} />
            {error && <Text style={styles.errorText}>{error}</Text>}
            <TouchableOpacity 
                onPress={handleConfirmRepayment} 
                style={[styles.primaryBtn, loading && styles.btnDisabled]} 
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryBtnText}>Confirm Repayment Received</Text>}
            </TouchableOpacity>
            <Text style={styles.infoText}>This will add the repayment amount to your personal balance as income.</Text>
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
        backgroundColor: '#EFF6FF', // bg-blue-50
        borderRadius: 6, // rounded-md
        borderWidth: 1,
        borderColor: '#BFDBFE', // border-blue-200
    },
    loanDescription: {
        fontWeight: '600', // font-semibold
        color: '#1F2937', // text-gray-800
    },
    loanDebtor: {
        fontSize: 14, // text-sm
        color: '#6B7280', // text-gray-500
        marginTop: 4, // mt-1
    },
    loanDebtorName: {
        fontWeight: '500', // font-medium
    },
    loanAmount: {
        fontSize: 18, // text-lg
        fontWeight: 'bold',
        color: '#059669', // text-green-600
        marginTop: 8, // mt-2
    },
    receiptLinkWrapper: {
        marginTop: 8, // mt-2
        paddingTop: 8, // pt-2
        borderTopWidth: 1,
        borderColor: '#BFDBFE', // border-blue-200
    },
    receiptLinkText: {
        fontSize: 12, // text-xs
        color: '#2563EB', // text-blue-600
        textDecorationLine: 'underline',
        fontWeight: 'bold',
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