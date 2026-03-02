'use client';

import React, { useState, useContext } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert } from "react-native";
import * as ImagePicker from 'expo-image-picker'; 
import { AppContext } from "@/context/AppContext"; 
import UnifiedLoadingWidget from "@/components/ui/UnifiedLoadingWidget";
import { CheckCircle2, Scan, ChevronLeft } from 'lucide-react-native';

// --- CONFIGURATION ---
const PAYMENT_PROVIDERS = {
    gcash: {
        id: 'gcash',
        label: 'GCash',
        color: 'bg-blue-600',
        hex: '#2563eb',
        bgLight: 'bg-blue-50',
        number: '0917-123-4567',
        accountName: 'Eman Ryan L. Aguilera'
    }
};

const prices: any = {
    monthly: { 
        family: { amount: 500, label: "₱500" },
        company: { amount: 1500, label: "₱1,500" }
    },
    yearly:  { 
        family: { amount: 5000, label: "₱5,000" },
        company: { amount: 15000, label: "₱15,000" }
    }
};

export default function ApplyPremiumWidget({ onClose, onUpgradeSuccess, targetAccess = 'company' }: any) {
    // ⭐️ Fixed Context Type
    const context = useContext(AppContext as any) as any || {};
    const user = context.user;
    
    const [step, setStep] = useState(1);
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [isScanning, setIsScanning] = useState(false);
    const [refNumber, setRefNumber] = useState('');

    const activeProvider = PAYMENT_PROVIDERS.gcash;
    const selectedPlan = prices[billingCycle][targetAccess]; 
    const accessHeader = targetAccess === 'family' ? 'Premium Family Access' : 'Full Company Access';

    // --- AI SCANNING ---
    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission Denied", "We need access to your gallery to scan the receipt.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            performOCR(result.assets[0].uri);
        }
    };

    const performOCR = async (uri: string) => {
        setIsScanning(true);
        try {
            // Simulated OCR Logic (Replace with native OCR call when ready)
            setTimeout(() => {
                const simulatedText = "GCash Reference No. 9876543210123 Successful"; 
                processScannedText(simulatedText);
                setIsScanning(false);
                Alert.alert("Scan Complete", "Reference number detected.");
            }, 2000);
        } catch (err) {
            setIsScanning(false);
            Alert.alert("Scan Failed", "Could not read image. Please type the number manually.");
        }
    };

    const processScannedText = (text: string) => {
        const cleanText = text.toUpperCase();
        const refMatch = cleanText.match(/(\d{10,13})/); 
        if (refMatch) {
            setRefNumber(refMatch[1]);
        } else {
            const fallbackMatch = cleanText.match(/(\d{8,9})/);
            if (fallbackMatch) setRefNumber(fallbackMatch[1]);
        }
    };

    const handleSubmit = () => {
        if(!refNumber) return Alert.alert("Missing Info", "Please enter the Reference Number.");
        const userIdToUse = user?.uid || user?.id; 

        if (!userIdToUse) return Alert.alert("Error", "User session expired. Please re-login.");

        onUpgradeSuccess({
            amountPaid: selectedPlan.amount,
            plan: billingCycle,
            paymentRef: refNumber,
            userId: userIdToUse, 
            method: activeProvider.label,
            targetAccess: targetAccess
        });
    };

    return (
        <ScrollView 
            contentContainerStyle={{ paddingBottom: 40 }} 
            className="bg-white rounded-3xl p-6"
            showsVerticalScrollIndicator={false}
        >
            {/* ICON & HEADER */}
            <View className={`w-16 h-16 rounded-full items-center justify-center self-center mb-4 shadow-xl ${activeProvider.color}`}>
                <CheckCircle2 size={32} color="white" />
            </View>
            
            <Text className="text-xl font-black text-slate-800 text-center">{accessHeader}</Text>
            <View className="flex-row items-center justify-center gap-x-2 mt-2 mb-6">
                <View className="w-2 h-2 bg-green-500 rounded-full" />
                <Text className="text-[10px] text-slate-400 font-black uppercase tracking-widest">AI Receipt Scanner Active</Text>
            </View>

            {/* STEP 1: PLAN SELECTION */}
            {step === 1 && (
                <View>
                    <View className="bg-slate-100 p-1 rounded-2xl flex-row mb-6">
                        <TouchableOpacity 
                            onPress={() => setBillingCycle('monthly')} 
                            className={`flex-1 py-3 rounded-xl ${billingCycle === 'monthly' ? 'bg-white shadow-sm' : ''}`}
                        >
                            <Text className={`text-center font-bold text-sm ${billingCycle === 'monthly' ? 'text-slate-800' : 'text-slate-500'}`}>Monthly</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => setBillingCycle('yearly')} 
                            className={`flex-1 py-3 rounded-xl ${billingCycle === 'yearly' ? 'bg-white shadow-sm' : ''}`}
                        >
                            <Text className={`text-center font-bold text-sm ${billingCycle === 'yearly' ? 'text-slate-800' : 'text-slate-500'}`}>
                                Yearly ({targetAccess === 'company' ? '-20%' : '-16%'})
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View className={`${activeProvider.bgLight} border-2 border-dashed border-blue-200 p-6 rounded-[32px] mb-6 items-center`}>
                        <Text className="text-xs text-slate-500 mb-1 font-bold">Send <Text className="text-slate-900">{selectedPlan.label}</Text> to:</Text>
                        <Text className="text-2xl font-black tracking-tighter text-blue-600">{activeProvider.number}</Text>
                        <Text className="text-[10px] text-slate-400 mt-1 uppercase font-black">{activeProvider.accountName}</Text>
                    </View>

                    <TouchableOpacity 
                        onPress={() => setStep(2)} 
                        className={`w-full py-5 rounded-[24px] shadow-lg ${activeProvider.color}`}
                    >
                        <Text className="text-white text-center font-black uppercase text-xs tracking-widest">
                            I have sent {selectedPlan.label}
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={onClose} className="mt-4 self-center">
                        <Text className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Cancel</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* STEP 2: SCANNING */}
            {step === 2 && (
                <View>
                    {isScanning ? (
                        <View className="py-10">
                            <UnifiedLoadingWidget type="section" message="AI is reading your GCash receipt..." />
                        </View>
                    ) : (
                        <TouchableOpacity 
                            onPress={handlePickImage}
                            className={`border-2 border-dashed rounded-[32px] p-10 mb-6 items-center bg-blue-50 border-blue-200`}
                        >
                            <Scan size={40} color={activeProvider.hex} />
                            <Text className="mt-4 text-sm font-black text-slate-700">Tap to Scan Screenshot</Text>
                        </TouchableOpacity>
                    )}

                    <View className="mb-6">
                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Reference Number</Text>
                        <TextInput 
                            value={refNumber}
                            onChangeText={setRefNumber}
                            placeholder={isScanning ? "Scanning..." : "Enter manually"}
                            keyboardType="numeric"
                            className={`w-full p-5 border-2 rounded-2xl font-black text-xl tracking-[4px] text-center ${refNumber ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-100 bg-white'}`}
                        />
                    </View>

                    <TouchableOpacity 
                        onPress={handleSubmit} 
                        disabled={isScanning || !refNumber}
                        className={`w-full py-5 rounded-[24px] ${isScanning || !refNumber ? 'bg-slate-200' : activeProvider.color}`}
                    >
                        <Text className="text-white text-center font-black uppercase text-xs tracking-widest">Submit Verification</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={() => { setStep(1); setRefNumber(''); }} className="mt-4 self-center">
                        <View className="flex-row items-center">
                            <ChevronLeft size={14} color="#94a3b8" />
                            <Text className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Back to Info</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
}