'use client';

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Users, User } from 'lucide-react-native';

interface RecordLoanChoiceWidgetProps {
    onSelectFamilyLoan: () => void;
    onSelectPersonalLoan: () => void;
}

export default function RecordLoanChoiceWidget({ 
    onSelectFamilyLoan, 
    onSelectPersonalLoan 
}: RecordLoanChoiceWidgetProps) {
    return (
        <View className="p-2 space-y-6">
            {/* Header Section */}
            <View className="items-center space-y-2 mb-6">
                <Text className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                    Record a New Loan
                </Text>
                <Text className="text-sm text-slate-500 font-medium px-4 text-center">
                    Choose how you want to track this lending activity in your FiamBond ledger.
                </Text>
            </View>

            {/* Selection Grid (Flex-row for Mobile) */}
            <View className="flex-row gap-4 mb-6">
                {/* Family Loan Option */}
                <TouchableOpacity 
                    onPress={onSelectFamilyLoan}
                    activeOpacity={0.7}
                    className="flex-1 items-center justify-center p-6 bg-indigo-50 border-2 border-indigo-100 rounded-[32px]"
                >
                    <View className="p-4 bg-white rounded-2xl shadow-sm mb-3">
                        <Users size={28} color="#4f46e5" />
                    </View>
                    <Text className="font-black text-indigo-900 text-center">Family Member</Text>
                    <Text className="text-[9px] text-indigo-500 font-black uppercase tracking-widest mt-1 text-center">
                        In-App Tracking
                    </Text>
                </TouchableOpacity>

                {/* Personal Loan Option */}
                <TouchableOpacity 
                    onPress={onSelectPersonalLoan}
                    activeOpacity={0.7}
                    className="flex-1 items-center justify-center p-6 bg-slate-50 border-2 border-slate-100 rounded-[32px]"
                >
                    <View className="p-4 bg-white rounded-2xl shadow-sm mb-3">
                        <User size={28} color="#475569" />
                    </View>
                    <Text className="font-black text-slate-900 text-center">External Individual</Text>
                    <Text className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1 text-center">
                        Manual Tracking
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Warning/Note Box */}
            <View className="bg-amber-50 p-5 rounded-3xl border border-amber-100">
                <Text className="text-[11px] text-amber-700 font-bold leading-5 text-center italic">
                    Note: Family loans require confirmation from the recipient, while personal loans are managed solely by you.
                </Text>
            </View>
        </View>
    );
}