'use client';

import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import UnifiedLoadingWidget from '@/components/ui/UnifiedLoadingWidget';
import DateTimePicker from '@react-native-community/datetimepicker';
import { 
    Calendar, 
    FileBarChart, 
    FileDown, 
    Printer 
} from 'lucide-react-native';

export default function UnifiedCorporateLedgerWidget({ 
    transactions = [], 
    config, 
    brandName, 
    reportType, 
    filenamePrefix,
    themeColor = "indigo" 
}) {
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const [endDate, setEndDate] = useState(new Date());
    const [isProcessing, setIsProcessing] = useState(false);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const isWeb = Platform.OS === 'web';

    // Logic for Emerald differentiation (Specific to Amounts only)
    const amountTextColor = themeColor === 'emerald' ? 'text-emerald-600' : 'text-indigo-600';

    const reportData = useMemo(() => {
        if (!config?.filterFn || !Array.isArray(transactions)) return [];
        const startObj = new Date(startDate).setHours(0, 0, 0, 0);
        const endObj = new Date(endDate).setHours(23, 59, 59, 999);
    
        return transactions
            .filter(tx => config.filterFn(tx)) 
            .filter(tx => {
                if (!tx.created_at) return false;
                const txDate = tx.created_at.toDate ? tx.created_at.toDate() : new Date(tx.created_at);
                return txDate >= startObj && txDate <= endObj;
            })
            .sort((a, b) => {
                const dateA = a.created_at.toDate ? a.created_at.toDate() : new Date(a.created_at);
                const dateB = b.created_at.toDate ? b.created_at.toDate() : new Date(b.created_at);
                return dateB.getTime() - dateA.getTime();
            });
    }, [transactions, startDate, endDate, config]);

    const totalAmount = reportData.reduce((acc, curr) => acc + curr.amount, 0);
    const isEmpty = reportData.length === 0;

    return (
        <View className="flex-1 space-y-4">
            {isWeb && (
                <style dangerouslySetInnerHTML={{ __html: `
                    input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; width: 25px; }
                    input[type="date"] { appearance: none; -webkit-appearance: none; }
                `}} />
            )}

            {isProcessing && <UnifiedLoadingWidget type="full" message="Processing..." />}

            {/* 1:1 FILTERS */}
            <View className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex-col md:flex-row justify-between md:items-center gap-4">
                <View className="flex-row items-end gap-4">
                    <View>
                        <Text className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Start Date</Text>
                        {isWeb ? (
                            <input 
                                type="date"
                                className="bg-white border border-slate-300 text-gray-700 text-sm rounded-lg block p-2 outline-none"
                                value={startDate.toISOString().split('T')[0]}
                                onChange={(e) => setStartDate(new Date(e.target.value))}
                            />
                        ) : (
                            <TouchableOpacity onPress={() => setShowStartPicker(true)} className="bg-white border border-slate-300 rounded-lg p-2 flex-row items-center gap-2">
                                <Calendar size={18} color="#64748b" />
                                <Text className="text-gray-700 text-sm">{startDate.toLocaleDateString()}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View>
                        <Text className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">End Date</Text>
                        {isWeb ? (
                            <input 
                                type="date"
                                className="bg-white border border-slate-300 text-gray-700 text-sm rounded-lg block p-2 outline-none"
                                value={endDate.toISOString().split('T')[0]}
                                onChange={(e) => setEndDate(new Date(e.target.value))}
                            />
                        ) : (
                            <TouchableOpacity onPress={() => setShowEndPicker(true)} className="bg-white border border-slate-300 rounded-lg p-2 flex-row items-center gap-2">
                                <Calendar size={18} color="#64748b" />
                                <Text className="text-gray-700 text-sm">{endDate.toLocaleDateString()}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                <View className="text-right">
                    <Text className="text-xs text-slate-500">Total in Range</Text>
                    {/* UPDATED: Only this text turns emerald */}
                    <Text className={`text-2xl font-bold ${amountTextColor}`}>₱{totalAmount.toLocaleString()}</Text>
                </View>
            </View>

            {/* 1:1 TABLE */}
            <View className="flex-1 border border-slate-200 rounded-xl overflow-hidden">
                <ScrollView stickyHeaderIndices={[0]}>
                    <View className="flex-row bg-gray-50 border-b border-gray-200 px-6 py-3">
                        <Text className="flex-1 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</Text>
                        <Text className="flex-[2] text-xs font-medium text-gray-500 uppercase tracking-wider">Employee / Description</Text>
                        <Text className="flex-1 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</Text>
                    </View>

                    {isEmpty ? (
                        <View className="p-10 items-center"><Text className="text-slate-400 italic">No records found.</Text></View>
                    ) : (
                        reportData.map((tx, idx) => (
                            <View key={idx} className="flex-row border-b border-gray-200 px-6 py-4 items-center bg-white">
                                <Text className="flex-1 text-sm text-gray-600">
                                    {(tx.created_at.toDate ? tx.created_at.toDate() : new Date(tx.created_at)).toLocaleDateString()}
                                </Text>
                                <View className="flex-[2]">
                                    <Text className="text-sm text-gray-900 font-medium">{config.getMainLabel(tx)}</Text>
                                    <Text className="text-xs text-gray-400 font-normal">{config.getSubLabel(tx)}</Text>
                                </View>
                                {/* UPDATED: Only the row amount turns emerald */}
                                <Text className={`flex-1 text-right text-sm font-bold ${amountTextColor}`}>
                                    ₱{tx.amount.toLocaleString()}
                                </Text>
                            </View>
                        ))
                    )}
                </ScrollView>
            </View>

            {/* 1:1 REPLICATED EXPORT SECTION */}
            <View className="pt-2">
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
                    Export {reportType}
                </Text>
                
                <View className="flex-row gap-3">
                    {/* CSV */}
                    <TouchableOpacity 
                        disabled={isEmpty}
                        activeOpacity={0.7}
                        className={`flex-1 flex-row items-center justify-center gap-2 py-[10px] rounded-xl bg-white border border-slate-300 shadow-sm ${isEmpty ? 'opacity-50' : ''}`}
                    >
                        <FileBarChart size={20} color="#64748b" />
                        <Text className="text-slate-700 font-bold">CSV</Text>
                    </TouchableOpacity>

                    {/* EXCEL */}
                    <TouchableOpacity 
                        disabled={isEmpty}
                        activeOpacity={0.7}
                        className={`flex-1 flex-row items-center justify-center gap-2 py-[10px] rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm ${isEmpty ? 'opacity-50' : ''}`}
                    >
                        <FileDown size={20} color="#047857" />
                        <Text className="text-emerald-700 font-bold">Excel</Text>
                    </TouchableOpacity>

                    {/* PDF - Kept as Indigo (Original Request) */}
                    <TouchableOpacity 
                        disabled={isEmpty}
                        activeOpacity={0.7}
                        className={`flex-1 flex-row items-center justify-center gap-2 py-[10px] rounded-xl bg-indigo-600 shadow-md ${isEmpty ? 'opacity-50' : ''}`}
                    >
                        <Printer size={20} color="white" />
                        <Text className="text-white font-bold">PDF</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* MOBILE PICKERS */}
            {!isWeb && showStartPicker && (
                <DateTimePicker
                    value={startDate}
                    mode="date"
                    onChange={(e, d) => { setShowStartPicker(false); if(d) setStartDate(d); }}
                />
            )}
            {!isWeb && showEndPicker && (
                <DateTimePicker
                    value={endDate}
                    mode="date"
                    onChange={(e, d) => { setShowEndPicker(false); if(d) setEndDate(d); }}
                />
            )}
        </View>
    );
}