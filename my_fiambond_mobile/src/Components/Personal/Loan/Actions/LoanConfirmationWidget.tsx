import React, { useState, useContext } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ActivityIndicator, 
    Alert 
} from 'react-native';
import { AppContext } from '../../../../Context/AppContext.jsx';

interface LoanConfirmationWidgetProps {
    loan: any; 
    onSuccess: () => void;
}

export default function LoanConfirmationWidget({ loan, onSuccess }: LoanConfirmationWidgetProps) {
    const { user } = useContext(AppContext) as any;
    
    // Replace with your actual mobile-accessible IP or production URL
    const API_URL = 'http://localhost:3000'; 
    
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirmReceipt = async () => {
        if (!user || !loan || !loan.id) {
            setError("Cannot process confirmation. Critical data is missing.");
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
                    confirmed_at: new Date().toISOString() 
                })
            });

            if (!loanResponse.ok) throw new Error("Failed to update loan status.");

            // 2. Create Income Transaction for Debtor (POST)
            const creditorName = loan.creditor?.full_name || 'the lender';
            
            const transactionData = {
                user_id: user.uid, 
                family_id: null, // Personal income
                type: 'income',
                amount: Number(loan.amount),
                description: `Loan received from ${creditorName}: ${loan.description}`,
                created_at: new Date().toISOString()
            };

            const txResponse = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData)
            });

            if (!txResponse.ok) throw new Error("Loan confirmed, but failed to record income transaction.");

            Alert.alert("Success", "Funds confirmed and balance updated.");
            if (onSuccess) onSuccess();

        } catch (err: any) {
            console.error("Failed to confirm loan receipt:", err);
            setError("Could not confirm receipt. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="p-1 gap-y-4">
            <View>
                <Text className="text-sm text-slate-600 leading-5">
                    Please confirm you have received the funds for the following loan:
                </Text>
                
                <View className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <Text className="font-bold text-slate-800 text-base">{loan.description}</Text>
                    <Text className="text-xs text-slate-500 mt-1">
                        From: <Text className="font-bold text-slate-700">{loan.creditor?.full_name || 'Lender'}</Text>
                    </Text>
                    <Text className="text-xl font-bold text-emerald-600 mt-3">
                        ₱{Number(loan.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                </View>
            </View>

            {/* Horizontal Rule */}
            <View className="h-[1px] bg-slate-100 w-full my-2" />

            {error && (
                <View className="bg-rose-50 p-3 rounded-xl">
                    <Text className="text-rose-600 text-xs text-center font-medium">{error}</Text>
                </View>
            )}

            <TouchableOpacity 
                onPress={handleConfirmReceipt} 
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
                    <Text className="text-white font-bold text-base">Confirm Funds Received</Text>
                )}
            </TouchableOpacity>

            <View className="px-4">
                <Text className="text-[10px] text-center text-slate-400 leading-4 italic">
                    This will add the loan amount to your personal balance as income.
                </Text>
            </View>
        </View>
    );
}