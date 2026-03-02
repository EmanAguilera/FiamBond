'use client';

import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { AppContext } from '@/context/AppContext';
import { LoanService } from '@/components/services/LoanService';
import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";
import { CheckCircle2, Upload } from 'lucide-react-native';

// --- 1. LOAN CONFIRMATION WIDGET ---
export function LoanConfirmationWidget({ loan, onSuccess }: any) {
    const context = useContext(AppContext as any) as any || {};
    const user = context.user;
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!user?.uid) return Alert.alert("Error", "User session not found.");
        
        setLoading(true);
        try {
            await LoanService.updateLoan(loan.id, { status: "outstanding", confirmed_at: new Date().toISOString() });
            await LoanService.createTransaction({
                user_id: user.uid, type: 'income', amount: Number(loan.amount),
                description: `Loan received from ${loan.creditor?.full_name || 'the lender'}: ${loan.description}`
            });
            Alert.alert("Success", "Funds confirmed.");
            if (onSuccess) await onSuccess(); 
        } catch (err: any) { 
            Alert.alert("Error", "Failed to confirm."); 
        } finally { 
            setLoading(false); 
        }
    };

    if (loading) return <UnifiedLoadingWidget type="section" message="Confirming funds..." />;

    return (
        <View className="gap-y-6">
            <View className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Loan Details</Text>
                <Text className="font-black text-slate-800 text-lg leading-tight">{loan.description}</Text>
                <View className="mt-4 flex-row justify-between items-baseline">
                    <Text className="text-sm text-slate-500 font-bold">Amount:</Text>
                    <Text className="text-3xl font-black text-emerald-600">₱{Number(loan.amount).toLocaleString()}</Text>
                </View>
            </View>
            <TouchableOpacity 
                onPress={handleConfirm}
                className="w-full py-5 bg-indigo-600 rounded-[24px] flex-row items-center justify-center gap-x-2 shadow-lg shadow-indigo-200"
            >
                <CheckCircle2 size={20} color="white" />
                <Text className="text-white font-black uppercase text-xs tracking-widest">Confirm Funds Received</Text>
            </TouchableOpacity>
        </View>
    );
}

// --- 2. MAKE REPAYMENT WIDGET ---
export function MakeRepaymentWidget({ loan, onSuccess }: any) {
    const context = useContext(AppContext as any) as any || {};
    const user = context.user;
    const outstanding = (loan.total_owed || loan.amount) - (loan.repaid_amount || 0);
    const [amount, setAmount] = useState(outstanding.toFixed(2));
    const [file, setFile] = useState<any>(null); 
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!user?.uid) return Alert.alert("Error", "User session not found.");
        setLoading(true);
        try {
            const url = file ? await LoanService.uploadToCloudinary(file) : null;
            await LoanService.updateLoan(loan.id, {
                pending_repayment: { 
                    amount: parseFloat(amount), 
                    submitted_by: user.uid, 
                    submitted_at: new Date().toISOString(), 
                    receipt_url: url 
                }
            });
            await LoanService.createTransaction({
                user_id: user.uid, type: 'expense', amount: parseFloat(amount),
                description: `Loan repayment: ${loan.description}`, attachment_url: url
            });
            Alert.alert("Success", "Repayment submitted!");
            if (onSuccess) await onSuccess();
        } catch (err) { 
            Alert.alert("Error", "Submission failed."); 
        } finally { 
            setLoading(false); 
        }
    };

    if (loading) return <UnifiedLoadingWidget type="section" message="Submitting repayment..." />;

    return (
        <View className="gap-y-5">
            <View className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                <Text className="font-black text-slate-800 text-lg mb-1">{loan.description}</Text>
                <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-bold text-slate-400 uppercase">Outstanding Owed</Text>
                    <Text className="text-xl font-black text-rose-600">₱{outstanding.toLocaleString()}</Text>
                </View>
            </View>

            <View>
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Repayment Amount</Text>
                <TextInput 
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                    className="w-full p-5 bg-white border-2 border-slate-100 rounded-2xl font-black text-indigo-600 text-xl"
                />
            </View>

            <TouchableOpacity 
                className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-5 flex-row items-center justify-center gap-x-3 bg-slate-50"
                onPress={() => {
                    Alert.alert("Feature", "File picking is next on the roadmap!");
                }}
            >
                <Upload size={18} color="#64748b" />
                <Text className="text-slate-500 font-bold text-xs">{file ? "Receipt Attached" : "Upload Proof of Payment"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSubmit} className="w-full py-5 bg-indigo-600 rounded-[24px]">
                <Text className="text-white font-black text-center uppercase text-xs tracking-widest">Submit for Confirmation</Text>
            </TouchableOpacity>
        </View>
    );
}

// --- 3. RECORD PERSONAL REPAYMENT WIDGET ---
export function RecordPersonalRepaymentWidget({ loan, onSuccess }: any) {
    const context = useContext(AppContext as any) as any || {};
    const user = context.user;
    const outstanding = (loan.total_owed || loan.amount) - (loan.repaid_amount || 0);
    const [amount, setAmount] = useState('');
    const [file, setFile] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleRecord = async () => {
        if (!user?.uid) return Alert.alert("Error", "User session not found.");
        if (!amount || parseFloat(amount) <= 0) return Alert.alert("Invalid Amount", "Please enter a valid repayment value.");
        
        setLoading(true);
        try {
            const val = parseFloat(amount);
            const url = file ? await LoanService.uploadToCloudinary(file) : null;
            const newRepaid = (loan.repaid_amount || 0) + val;
            
            const sanitizedReceipts = LoanService.sanitizeReceipts(loan.repayment_receipts);

            await LoanService.updateLoan(loan.id, {
                repaid_amount: newRepaid,
                status: newRepaid >= (loan.total_owed || loan.amount) - 0.01 ? "repaid" : "outstanding",
                repayment_receipts: [...sanitizedReceipts, { url, amount: val, recorded_at: new Date().toISOString() }]
            });

            await LoanService.createTransaction({ user_id: user.uid, type: 'income', amount: val, description: `Repayment from ${loan.debtor_name}` });
            Alert.alert("Success", "Recorded successfully!");
            if (onSuccess) await onSuccess();
        } catch (err) { 
            Alert.alert("Error", "Error recording repayment."); 
        } finally { 
            setLoading(false); 
        }
    };

    if (loading) return <UnifiedLoadingWidget type="section" message="Recording repayment..." />;

    return (
        <View className="gap-y-6">
            <View className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex-row justify-between items-center">
                <View>
                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Borrower</Text>
                    <Text className="font-black text-slate-800 text-lg">{loan.debtor_name || 'Borrower'}</Text>
                </View>
                <Text className="text-xl font-black text-rose-600">₱{outstanding.toLocaleString()}</Text>
            </View>
            <TextInput 
                placeholder="0.00"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                className="w-full p-5 bg-white border-2 border-slate-100 rounded-2xl font-black text-indigo-600 text-xl text-center"
            />
            <TouchableOpacity onPress={handleRecord} className="w-full py-5 bg-emerald-600 rounded-[24px]">
                <Text className="text-white font-black text-center uppercase text-xs tracking-widest">Confirm & Record Repayment</Text>
            </TouchableOpacity>
        </View>
    );
}

// --- 4. REPAYMENT CONFIRMATION WIDGET ---
export function RepaymentConfirmationWidget({ loan, onSuccess }: any) {
    const context = useContext(AppContext as any) as any || {};
    const user = context.user;
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!user?.uid) return Alert.alert("Error", "User session not found.");
        setLoading(true);
        try {
            const pending = loan.pending_repayment;
            const newRepaid = (loan.repaid_amount || 0) + parseFloat(pending.amount);
            const sanitizedReceipts = LoanService.sanitizeReceipts(loan.repayment_receipts);

            await LoanService.updateLoan(loan.id, {
                repaid_amount: newRepaid,
                status: newRepaid >= (loan.total_owed || loan.amount) - 0.01 ? "repaid" : "outstanding",
                pending_repayment: null,
                repayment_receipts: [...sanitizedReceipts, { url: pending.receipt_url, amount: pending.amount, recorded_at: new Date().toISOString() }]
            });

            await LoanService.createTransaction({ user_id: user.uid, type: 'income', amount: pending.amount, description: `Confirmed repayment: ${loan.description}` });
            Alert.alert("Success", "Repayment confirmed!");
            if (onSuccess) await onSuccess();
        } catch (err) { 
            Alert.alert("Error", "Process failed."); 
        } finally { 
            setLoading(false); 
        }
    };

    if (loading) return <UnifiedLoadingWidget type="section" message="Confirming repayment..." />;

    return (
        <View className="gap-y-6">
            <View className="bg-emerald-50 p-8 rounded-[40px] border border-emerald-100 items-center justify-center">
                <Text className="text-4xl font-black text-emerald-700">₱{Number(loan.pending_repayment?.amount).toLocaleString()}</Text>
                <Text className="text-xs font-bold text-emerald-600 uppercase mt-2">Repayment from {loan.debtor_name}</Text>
            </View>
            <TouchableOpacity onPress={handleConfirm} className="w-full py-5 bg-indigo-600 rounded-[24px]">
                <Text className="text-white font-black text-center uppercase text-xs tracking-widest">Confirm & Add to Balance</Text>
            </TouchableOpacity>
        </View>
    );
}