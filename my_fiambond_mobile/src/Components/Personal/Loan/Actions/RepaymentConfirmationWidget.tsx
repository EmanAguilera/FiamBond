import React, { useState, useContext } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ActivityIndicator, 
    Alert, 
    Linking, 
    ScrollView 
} from 'react-native';
import { AppContext } from '../../../../Context/AppContext.jsx';

interface RepaymentConfirmationWidgetProps {
    loan: any; // using any for flexibility with MongoDB _id
    onSuccess: () => void;
}

export default function RepaymentConfirmationWidget({ loan, onSuccess }: RepaymentConfirmationWidgetProps) {
    const { user } = useContext(AppContext) as any;
    
    // API URL for mobile environment
    const API_URL = 'https://super-duper-engine-57wjxxp4jxq2p64w-3000.app.github.dev/api';

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // The repayment object should exist if this widget is being rendered.
    const pendingAmount = loan.pending_repayment?.amount || 0;

    const handleConfirmRepayment = async () => {
        if (!user || !loan || !loan.id || !loan.pending_repayment) {
            setError("Cannot process confirmation. Critical data is missing.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const repaymentAmount = parseFloat(loan.pending_repayment.amount);
            const currentRepaid = parseFloat(loan.repaid_amount || 0);
            const totalOwed = parseFloat(loan.total_owed || loan.amount);

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
                    recorded_at: new Date().toISOString()
                }];
            }

            // 3. PATCH Loan: Update amounts, status, receipts, and CLEAR pending_repayment
            const loanUpdatePayload = {
                repaid_amount: newRepaidAmount,
                status: newStatus,
                pending_repayment: null, // Setting to null removes it in Mongoose
                repayment_receipts: updatedReceipts
            };

            const loanResponse = await fetch(`${API_URL}/loans/${loan.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loanUpdatePayload)
            });

            if (!loanResponse.ok) throw new Error("Failed to update loan status.");

            // 4. POST Transaction: Record Income for Creditor
            const debtorName = loan.debtor?.full_name || loan.debtor_name || 'the borrower';
            const transactionData = {
                user_id: user.uid, // Income for YOU (Creditor)
                family_id: null,   // Personal balance
                type: 'income',
                amount: repaymentAmount,
                description: `Repayment received from ${debtorName} for: ${loan.description}`,
                attachment_url: loan.pending_repayment.receipt_url || null,
                created_at: new Date().toISOString()
            };

            const txResponse = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData)
            });

            if (!txResponse.ok) throw new Error("Loan updated, but failed to record income transaction.");

            Alert.alert("Success", "Repayment confirmed and added to your balance.");
            if (onSuccess) {
                onSuccess();
            }

        } catch (err: any) {
            console.error("Failed to confirm repayment:", err);
            setError("Could not confirm repayment. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    
    const debtorDisplayName = loan.debtor?.full_name || loan.debtor_name || 'The borrower';

    const handleOpenReceipt = async (url: string) => {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            Alert.alert("Error", "Don't know how to open this URL");
        }
    };

    return (
        <ScrollView className="p-1 space-y-4">
            <View>
                <Text className="text-sm text-slate-600 leading-5">
                    Please confirm you have received the following repayment:
                </Text>
                
                <View className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                    <Text className="font-bold text-slate-800 text-base">{loan.description}</Text>
                    <Text className="text-xs text-slate-500 mt-1">
                        From: <Text className="font-bold text-slate-700">{debtorDisplayName}</Text>
                    </Text>
                    <Text className="text-xl font-bold text-emerald-600 mt-3">
                        ₱{Number(pendingAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                    
                    {loan.pending_repayment?.receipt_url && (
                        <TouchableOpacity 
                            onPress={() => handleOpenReceipt(loan.pending_repayment.receipt_url)}
                            className="mt-3 pt-3 border-t border-blue-200"
                        >
                            <Text className="text-xs text-blue-600 font-bold underline">
                                View Attached Receipt
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Separator Line (HR) */}
            <View className="h-[1px] bg-slate-100 w-full my-2" />

            {error && (
                <View className="bg-rose-50 p-3 rounded-xl">
                    <Text className="text-rose-600 text-xs text-center font-medium">{error}</Text>
                </View>
            )}

            <TouchableOpacity 
                onPress={handleConfirmRepayment} 
                disabled={loading}
                activeOpacity={0.7}
                className={`w-full py-4 rounded-2xl shadow-lg items-center ${
                    loading ? 'bg-indigo-300' : 'bg-indigo-600'
                }`}
                style={!loading && { shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
            >
                {loading ? (
                    <View className="flex-row items-center">
                        <ActivityIndicator color="white" className="mr-2" />
                        <Text className="text-white font-bold text-base">Confirming...</Text>
                    </View>
                ) : (
                    <Text className="text-white font-bold text-base">Confirm Repayment Received</Text>
                )}
            </TouchableOpacity>

            <View className="px-4">
                <Text className="text-[10px] text-center text-slate-400 leading-4 italic">
                    This will add the repayment amount to your personal balance as income.
                </Text>
            </View>
            
            {/* Keyboard spacing padding */}
            <View className="h-10" />
        </ScrollView>
    );
}