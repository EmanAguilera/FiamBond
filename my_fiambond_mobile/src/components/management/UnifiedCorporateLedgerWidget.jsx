'use client';

import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import UnifiedLoadingWidget from '@/components/ui/UnifiedLoadingWidget';
import { Calendar, FileText, Download, Printer } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker'; // Standard for mobile dates

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
    const periodLabel = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

    // --- PDF GENERATION (Native Expo Print) ---
    const handleGeneratePDF = async () => {
        setIsProcessing(true);
        try {
            const htmlContent = `
                <html>
                <body style="font-family: sans-serif; padding: 20px;">
                    <h1 style="color: #4F46E5;">${brandName}</h1>
                    <h3>${reportType}</h3>
                    <p>Range: ${periodLabel}</p>
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <span style="font-size: 12px; color: #6b7280;">TOTAL DISBURSED</span><br/>
                        <span style="font-size: 24px; font-weight: bold;">₱${totalAmount.toLocaleString()}</span>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="background: #4F46E5; color: white;">
                            <th style="padding: 10px; text-align: left;">Date</th>
                            <th style="padding: 10px; text-align: left;">Description</th>
                            <th style="padding: 10px; text-align: right;">Amount</th>
                        </tr>
                        ${reportData.map(tx => `
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 10px;">${(tx.created_at.toDate ? tx.created_at.toDate() : new Date(tx.created_at)).toLocaleDateString()}</td>
                                <td style="padding: 10px;">${config.getMainLabel(tx)}</td>
                                <td style="padding: 10px; text-align: right;">₱${tx.amount.toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </table>
                </body>
                </html>
            `;
            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (e) {
            Alert.alert("Error", "Failed to generate PDF.");
        } finally {
            setIsProcessing(false);
        }
    };

    // --- CSV EXPORT (Native File System) ---
    const handleExportCSV = async () => {
        setIsProcessing(true);
        try {
            const headers = ["Date", config.columnLabels[0], config.columnLabels[1], "Amount"];
            const rows = reportData.map(tx => [
                (tx.created_at.toDate ? tx.created_at.toDate() : new Date(tx.created_at)).toLocaleDateString(),
                `"${config.getMainLabel(tx)}"`,
                `"${config.getSubLabel(tx)}"`,
                tx.amount.toFixed(2)
            ]);
            const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
            
            const fileUri = FileSystem.cacheDirectory + `${filenamePrefix}.csv`;
            await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
            await Sharing.shareAsync(fileUri);
        } catch (e) {
            Alert.alert("Error", "Failed to export CSV.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <View className="flex-1 space-y-4">
            {isProcessing && (
                <View className="absolute inset-0 z-50 flex items-center justify-center bg-white/80">
                    <UnifiedLoadingWidget type="full" message="Processing Ledger..." />
                </View>
            )}

            {/* DATE FILTERS */}
            <View className="bg-slate-50 p-5 rounded-[24px] border border-slate-200">
                <View className="flex-row justify-between items-center mb-4">
                    <TouchableOpacity onPress={() => setShowStartPicker(true)} className="flex-1">
                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Start Date</Text>
                        <View className="flex-row items-center bg-white p-3 rounded-xl border border-slate-200">
                            <Calendar size={14} color="#64748b" />
                            <Text className="ml-2 text-slate-700 font-bold">{startDate.toLocaleDateString()}</Text>
                        </View>
                    </TouchableOpacity>
                    <View className="mx-2 mt-4"><Text className="text-slate-300">→</Text></View>
                    <TouchableOpacity onPress={() => setShowEndPicker(true)} className="flex-1">
                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">End Date</Text>
                        <View className="flex-row items-center bg-white p-3 rounded-xl border border-slate-200">
                            <Calendar size={14} color="#64748b" />
                            <Text className="ml-2 text-slate-700 font-bold">{endDate.toLocaleDateString()}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View className="items-end border-t border-slate-200 pt-3">
                    <Text className="text-[10px] text-slate-400 font-bold">Total in Range</Text>
                    <Text className={`text-2xl font-black ${themeColor === 'emerald' ? 'text-emerald-600' : 'text-indigo-600'}`}>
                        ₱{totalAmount.toLocaleString()}
                    </Text>
                </View>
            </View>

            {/* TRANSACTION TABLE */}
            <View className="flex-1 bg-white rounded-3xl border border-slate-200 overflow-hidden min-h-[300px]">
                <ScrollView stickyHeaderIndices={[0]}>
                    <View className="flex-row bg-slate-50 border-b border-slate-100 px-4 py-3">
                        <Text className="flex-[1] text-[10px] font-black text-slate-400 uppercase">Date</Text>
                        <Text className="flex-[2] text-[10px] font-black text-slate-400 uppercase">{config.columnLabels[0]}</Text>
                        <Text className="flex-[1] text-right text-[10px] font-black text-slate-400 uppercase">Amount</Text>
                    </View>
                    
                    {reportData.length === 0 ? (
                        <View className="p-10 items-center"><Text className="text-slate-400 italic">No records found.</Text></View>
                    ) : (
                        reportData.map((tx, idx) => (
                            <View key={idx} className="flex-row border-b border-slate-50 px-4 py-4 items-center">
                                <Text className="flex-[1] text-[11px] text-slate-500 font-mono">
                                    {(tx.created_at.toDate ? tx.created_at.toDate() : new Date(tx.created_at)).toLocaleDateString(undefined, {month: 'numeric', day: 'numeric'})}
                                </Text>
                                <View className="flex-[2]">
                                    <Text className="text-xs font-black text-slate-800">{config.getMainLabel(tx)}</Text>
                                    <Text className="text-[9px] text-slate-400 uppercase">{config.getSubLabel(tx)}</Text>
                                </View>
                                <Text className={`flex-[1] text-right text-xs font-black ${themeColor === 'emerald' ? 'text-emerald-600' : 'text-indigo-600'}`}>
                                    ₱{tx.amount.toLocaleString()}
                                </Text>
                            </View>
                        ))
                    )}
                </ScrollView>
            </View>

            {/* EXPORT ACTIONS */}
            <View className="flex-row space-x-3 pb-6">
                <TouchableOpacity onPress={handleExportCSV} className="flex-1 flex-row items-center justify-center bg-slate-100 p-4 rounded-2xl">
                    <Download size={16} color="#475569" />
                    <Text className="ml-2 font-black text-slate-700 uppercase text-[10px]">CSV</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleGeneratePDF} className={`flex-[1.5] flex-row items-center justify-center p-4 rounded-2xl shadow-lg ${themeColor === 'emerald' ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                    <Printer size={16} color="white" />
                    <Text className="ml-2 font-black text-white uppercase text-[10px]">Print PDF</Text>
                </TouchableOpacity>
            </View>

            {/* HIDDEN MODALS FOR NATIVE DATE PICKERS */}
            {showStartPicker && (
                <DateTimePicker
                    value={startDate}
                    mode="date"
                    onChange={(e, date) => { setShowStartPicker(false); if(date) setStartDate(date); }}
                />
            )}
            {showEndPicker && (
                <DateTimePicker
                    value={endDate}
                    mode="date"
                    onChange={(e, date) => { setShowEndPicker(false); if(date) setEndDate(date); }}
                />
            )}
        </View>
    );
}