// PayrollHistoryWidget.jsx
import React, { useState, useMemo } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ScrollView, 
    Platform, 
    Alert,
    Share
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import DateTimePicker from '@react-native-community/datetimepicker';
import { 
    FileText, 
    Table as TableIcon, 
    Calendar as CalendarIcon
} from 'lucide-react-native';

export default function PayrollHistoryWidget({ transactions, companyName }) {
    // --- STATE: DATE RANGE ---
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const [endDate, setEndDate] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    // --- FILTER LOGIC ---
    const payrollData = useMemo(() => {
        const startObj = new Date(startDate);
        startObj.setHours(0, 0, 0, 0);
        const endObj = new Date(endDate);
        endObj.setHours(23, 59, 59, 999);

        return transactions
            .filter((tx) => 
                (tx.category === 'Payroll' || tx.category === 'Cash Advance') || 
                (tx.description && (
                    tx.description.toLowerCase().includes('salary') || 
                    tx.description.toLowerCase().includes('advance')
                ))
            )
            .filter((tx) => {
                const txDate = tx.created_at.toDate();
                return txDate >= startObj && txDate <= endObj;
            })
            .sort((a, b) => b.created_at.toDate() - a.created_at.toDate());
    }, [transactions, startDate, endDate]);

    const totalPaid = payrollData.reduce((acc, curr) => acc + curr.amount, 0);
    
    const getPeriodLabel = () => {
        return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    };

    // --- 1. PDF GENERATION ---
    const handleGeneratePDF = async () => {
        if (payrollData.length === 0) return;

        const htmlContent = `
            <html>
            <body style="font-family: sans-serif; padding: 20px;">
                <h1 style="color: #4F46E5;">${companyName}</h1>
                <h3>Payroll Report: ${getPeriodLabel()}</h3>
                <div style="background: #EEF2FF; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                    <p style="margin: 0; font-size: 12px; color: #4338CA;">TOTAL DISBURSED</p>
                    <h2 style="margin: 0; color: #4F46E5;">₱${totalPaid.toLocaleString()}</h2>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="background: #4F46E5; color: white;">
                        <th style="padding: 10px; text-align: left;">Date</th>
                        <th style="padding: 10px; text-align: left;">Description</th>
                        <th style="padding: 10px; text-align: right;">Amount</th>
                    </tr>
                    ${payrollData.map((tx) => `
                        <tr style="border-bottom: 1px solid #ddd;">
                            <td style="padding: 10px;">${tx.created_at.toDate().toLocaleDateString()}</td>
                            <td style="padding: 10px;">${tx.description}</td>
                            <td style="padding: 10px; text-align: right;">₱${tx.amount.toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </table>
            </body>
            </html>
        `;

        try {
            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            Alert.alert("Error", "Failed to generate PDF");
        }
    };

    // --- 2. CSV GENERATION ---
    const handleExportCSV = async () => {
        const headers = "Date,Description,Category,Amount\n";
        const rows = payrollData.map((tx) => 
            `${tx.created_at.toDate().toLocaleDateString()},"${tx.description.replace(/"/g, '""')}",${tx.category || 'General'},${tx.amount}`
        ).join("\n");
        
        const csvContent = headers + rows;
        const fileName = `${FileSystem.documentDirectory}Payroll_${getPeriodLabel().replace(/\//g, '-')}.csv`;
        
        try {
            await FileSystem.writeAsStringAsync(fileName, csvContent);
            await Sharing.shareAsync(fileName);
        } catch (error) {
            Alert.alert("Error", "Failed to export CSV");
        }
    };

    return (
        <View className="flex-1 space-y-4">
            
            {/* DATE RANGE SELECTORS */}
            <View className="bg-slate-50 p-5 rounded-[32px] border border-slate-200">
                <View className="flex-row justify-between mb-4">
                    <TouchableOpacity 
                        onPress={() => setShowStartPicker(true)}
                        className="flex-1 mr-2 bg-white p-3 rounded-2xl border border-slate-200"
                    >
                        <Text className="text-[10px] font-black text-slate-400 uppercase mb-1">Start Date</Text>
                        <View className="flex-row items-center">
                            <CalendarIcon size={14} color="#6366f1" />
                            <Text className="ml-2 text-slate-700 font-bold">{startDate.toLocaleDateString()}</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => setShowEndPicker(true)}
                        className="flex-1 ml-2 bg-white p-3 rounded-2xl border border-slate-200"
                    >
                        <Text className="text-[10px] font-black text-slate-400 uppercase mb-1">End Date</Text>
                        <View className="flex-row items-center">
                            <CalendarIcon size={14} color="#6366f1" />
                            <Text className="ml-2 text-slate-700 font-bold">{endDate.toLocaleDateString()}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View className="items-center border-t border-slate-100 pt-4">
                    <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Disbursed</Text>
                    <Text className="text-3xl font-black text-emerald-600">₱{totalPaid.toLocaleString()}</Text>
                </View>
            </View>

            {/* DATE PICKER MODALS */}
            {showStartPicker && (
                <DateTimePicker
                    value={startDate}
                    mode="date"
                    onChange={(e, date) => { 
                        setShowStartPicker(false); 
                        if (date) setStartDate(date); 
                    }}
                />
            )}
            {showEndPicker && (
                <DateTimePicker
                    value={endDate}
                    mode="date"
                    onChange={(e, date) => { 
                        setShowEndPicker(false); 
                        if (date) setEndDate(date); 
                    }}
                />
            )}

            {/* PREVIEW LIST */}
            <View className="flex-1">
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                    Records in range ({payrollData.length})
                </Text>
                
                <ScrollView className="max-h-[300px]" showsVerticalScrollIndicator={false}>
                    {payrollData.length === 0 ? (
                        <View className="p-10 bg-white rounded-3xl border border-slate-100 items-center">
                            <Text className="text-slate-400 italic">No records found.</Text>
                        </View>
                    ) : (
                        payrollData.map((tx) => (
                            <View 
                                key={tx.id} 
                                className="bg-white p-4 rounded-2xl mb-2 border border-slate-100 flex-row justify-between items-center shadow-sm"
                            >
                                <View className="flex-1 pr-4">
                                    <Text className="text-slate-800 font-bold text-sm" numberOfLines={1}>
                                        {tx.description}
                                    </Text>
                                    <View className="flex-row items-center mt-1">
                                        <Text className="text-[10px] text-slate-400 font-bold uppercase mr-2">
                                            {tx.created_at.toDate().toLocaleDateString()}
                                        </Text>
                                        <View className="bg-indigo-50 px-2 py-0.5 rounded-full">
                                            <Text className="text-[8px] font-black text-indigo-600 uppercase">
                                                {tx.category || 'Payroll'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <Text className="text-slate-700 font-black text-sm">
                                    ₱{tx.amount.toLocaleString()}
                                </Text>
                            </View>
                        ))
                    )}
                </ScrollView>
            </View>

            {/* EXPORT ACTIONS */}
            <View className="pt-4 border-t border-slate-100 pb-10">
                <Text className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-4">
                    Export Reports
                </Text>
                <View className="flex-row gap-2">
                    <TouchableOpacity 
                        onPress={handleExportCSV}
                        disabled={payrollData.length === 0}
                        className="flex-1 bg-white border border-slate-200 p-4 rounded-2xl items-center flex-row justify-center gap-2"
                    >
                        <TableIcon size={16} color="#64748b" />
                        <Text className="text-slate-600 font-bold text-xs uppercase">CSV</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={handleGeneratePDF}
                        disabled={payrollData.length === 0}
                        className="flex-1 bg-indigo-600 p-4 rounded-2xl items-center flex-row justify-center gap-2 shadow-lg shadow-indigo-200"
                    >
                        <FileText size={16} color="white" />
                        <Text className="text-white font-bold text-xs uppercase">PDF Report</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}