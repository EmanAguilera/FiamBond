"use client";

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
        /* 1:1 Match: p-6 overflow-y-auto text-gray-700 */
        <View className="p-6 space-y-6">
            
            {/* Header Section: text-center space-y-2 */}
            <View className="items-center space-y-2">
                <Text className="text-2xl font-black text-slate-800 uppercase tracking-tight text-center">
                    Record a New Loan
                </Text>
                <Text className="text-sm text-slate-500 font-medium px-4 text-center">
                    Choose how you want to track this lending activity in your FiamBond ledger.
                </Text>
            </View>

            {/* Selection Grid: grid grid-cols-1 sm:grid-cols-2 gap-4 */}
            <View className="flex-row gap-4">
                
                {/* Family Member Option */}
                <TouchableOpacity 
                    onPress={onSelectFamilyLoan}
                    activeOpacity={0.7}
                    className="flex-1 items-center justify-center p-6 bg-indigo-50 border-2 border-indigo-100 rounded-3xl"
                >
                    {/* Icon Container: p-3 bg-white rounded-2xl shadow-sm text-indigo-600 */}
                    <View className="p-3 bg-white rounded-2xl shadow-sm mb-1">
                        <Users size={24} color="#4f46e5" strokeWidth={2.5} />
                    </View>
                    
                    {/* mt-3 font-bold text-indigo-900 */}
                    <Text className="mt-3 font-bold text-indigo-900 text-center">
                        Family Member
                    </Text>
                    
                    {/* text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-1 */}
                    <Text className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-1 text-center">
                        In-App Tracking
                    </Text>
                </TouchableOpacity>

                {/* External Individual Option */}
                <TouchableOpacity 
                    onPress={onSelectPersonalLoan}
                    activeOpacity={0.7}
                    className="flex-1 items-center justify-center p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl"
                >
                    {/* Icon Container: p-3 bg-white rounded-2xl shadow-sm text-slate-600 */}
                    <View className="p-3 bg-white rounded-2xl shadow-sm mb-1">
                        <User size={24} color="#475569" strokeWidth={2.5} />
                    </View>
                    
                    {/* mt-3 font-bold text-slate-900 */}
                    <Text className="mt-3 font-bold text-slate-900 text-center">
                        External Individual
                    </Text>
                    
                    {/* text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 */}
                    <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 text-center">
                        Manual Tracking
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Note Box: bg-amber-50 p-4 rounded-2xl border border-amber-100 */}
            <View className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                <Text className="text-[11px] text-amber-700 font-semibold leading-relaxed text-center italic">
                    Note: Family loans require confirmation from the recipient, while personal loans are managed solely by you.
                </Text>
            </View>
        </View>
    );
}