import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface RecordLoanChoiceWidgetProps {
    onSelectFamilyLoan: () => void;
    onSelectPersonalLoan: () => void;
}

export default function RecordLoanChoiceWidget({ onSelectFamilyLoan, onSelectPersonalLoan }: RecordLoanChoiceWidgetProps) {
    return (
        <View className="p-4 space-y-6">
            {/* --- HEADER --- */}
            <View className="items-center">
                <Text className="text-2xl font-bold text-center text-slate-900">Record a New Loan</Text>
                <Text className="text-center text-slate-500 mt-4 leading-6 px-2">
                    Is this loan for a member of an existing family in Fiambond, or is it a personal loan to an individual?
                </Text>
            </View>

            {/* --- CHOICE BUTTONS --- */}
            <View className="gap-y-4 pt-4">
                <TouchableOpacity 
                    onPress={onSelectFamilyLoan}
                    activeOpacity={0.7}
                    className="w-full bg-indigo-600 py-5 rounded-2xl shadow-lg shadow-indigo-100 items-center"
                >
                    <Text className="text-white font-bold text-base">For a Family Member</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={onSelectPersonalLoan}
                    activeOpacity={0.7}
                    className="w-full bg-white border border-slate-200 py-5 rounded-2xl items-center"
                >
                    <Text className="text-slate-700 font-bold text-base">To an Individual (Personal)</Text>
                </TouchableOpacity>
            </View>

            {/* --- FOOTER INFO --- */}
            <View className="mt-2">
                <Text className="text-[10px] text-center text-slate-400 italic leading-4">
                    Family loans require confirmation from the debtor, while personal loans are recorded immediately.
                </Text>
            </View>
        </View>
    );
}