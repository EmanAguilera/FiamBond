import React, { useState, useMemo } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ScrollView, 
    Platform, 
    Alert,
    ActivityIndicator
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import DateTimePicker from '@react-native-community/datetimepicker';
import { 
    FileText, 
    Table as TableIcon, 
    ArrowLeftRight, 
    Calendar as CalendarIcon,
    Download
} from 'lucide-react-native';

export default function SubscriptionReportWidget({ transactions = [] }) {
    // --- STATE: DATE RANGE ---
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const [endDate, setEndDate] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    // --- FILTER LOGIC (PRESERVED) ---
    const reportData = useMemo(() => {
        const startObj = new Date(startDate);
        startObj.setHours(0, 0, 0, 0);
        const endObj = new Date(endDate);
        endObj.setHours(23, 59, 59, 999);

        return transactions
            .filter((tx) => {
                if (!tx.created_at) return false;
                const txDate = tx.created_at.toDate ? tx.created_at.toDate() : new Date(tx.created_at);
                return txDate >= startObj && txDate <= endObj;
            })
            .sort((a, b) => {
                const dateA = a.created_at.toDate ? a.created_at.toDate() : new Date(a.created_at);
                const dateB = b.created_at.toDate ? b.created_at.toDate() : new Date(b.created_at);
                return dateB.getTime() - dateA.getTime();
            });
    }, [transactions, startDate, endDate]);

    const totalRevenue = reportData.reduce((acc, curr) => acc + curr.amount, 0);
    
    const getPeriodLabel = () => {
        return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    };

    // --- 1. PDF GENERATION (Using your exact HTML Template) ---
    const handleGeneratePDF = async () => {
        if (reportData.length === 0) return;

        const htmlContent = `
            <html>
            <body style="font-family: sans-serif; padding: 40px; color: #1F2937;">
                <h1 style="color: #4F46E5; text-transform: uppercase;">FiamBond Admin</h1>
                <p style="color: #6B7280;">Official Subscription Revenue Report</p>
                <div style="background-color: #EEF2FF; padding: 20px; border-radius: 12px; margin: 20px 0;">
                    <span style="font-size: 14px; color: #4338CA; font-weight: bold;">TOTAL REVENUE</span>
                    <h2 style="font-size: 32px; color: #4F46E5; margin: 5px 0;">₱${totalRevenue.toLocaleString()}</h2>
                    <p style="font-size: 12px; color: #6B7280; margin: 0;">Period: ${getPeriodLabel()}</p>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background-color: #4F46E5; color: white;">
                            <th style="padding: 12px; text-align: left;">Date</th>
                            <th style="padding: 12px; text-align: left;">Subscriber</th>
                            <th style="padding: 12px; text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reportData.map((tx) => {
                            const dateObj = tx.created_at.toDate ? tx.created_at.toDate() : new Date(tx.created_at);
                            return `
                                <tr style="border-bottom: 1px solid #E5E7EB;">
                                    <td style="padding: 12px;">${dateObj.toLocaleDateString()}</td>
                                    <td style="padding: 12px;">
                                        <b>${tx.subscriber}</b><br/>
                                        <small style="color: #666">${tx.plan} via ${tx.method}</small>
                                    </td>
                                    <td style="padding: 12px; text-align: right;">₱${tx.amount.toLocaleString()}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        try {
            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            Alert.alert("Error", "Failed to generate PDF report.");
        }
    };

    // --- 2. CSV EXPORT ---
    const handleExportCSV = async () => {
        const headers = "Date,Subscriber,Plan,Method,Reference,Amount\n";
        const rows = reportData.map((tx) => {
            const dateObj = tx.created_at.toDate ? tx.created_at.toDate() : new Date(tx.created_at);
            return `${dateObj.toLocaleDateString()},"${tx.subscriber}",${tx.plan},${tx.method},${tx.ref},${tx.amount}`;
        }).join("\n");
        
        const csvContent = headers + rows;
        const fileName = `${FileSystem.documentDirectory}Revenue_Report_${getPeriodLabel().replace(/\//g, '-')}.csv`;
        
        try {
            await FileSystem.writeAsStringAsync(fileName, csvContent);
            await Sharing.shareAsync(fileName);
        } catch (error) {
            Alert.alert("Error", "Failed to export CSV.");
        }
    };

    return (
        <View className="flex-1 space-y-6">
            
            {/* DATE RANGE SELECTORS */}
            <View className="bg-slate-50 p-5 rounded-[40px] border border-slate-200">
                <View className="flex-row justify-between mb-4 gap-x-2">
                    <TouchableOpacity 
                        onPress={() => setShowStartPicker(true)}
                        className="flex-1 bg-white p-3 rounded-2xl border border-slate-200 items-center"
                    >
                        <Text className="text-[10px] font-black text-slate-400 uppercase mb-1">From</Text>
                        <Text className="text-slate-700 font-bold">{startDate.toLocaleDateString()}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => setShowEndPicker(true)}
                        className="flex-1 bg-white p-3 rounded-2xl border border-slate-200 items-center"
                    >
                        <Text className="text-[10px] font-black text-slate-400 uppercase mb-1">To</Text>
                        <Text className="text-slate-700 font-bold">{endDate.toLocaleDateString()}</Text>
                    </TouchableOpacity>
                </View>

                <View className="items-center pt-2">
                    <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Revenue</Text>
                    <Text className="text-3xl font-black text-emerald-600">₱{totalRevenue.toLocaleString()}</Text>
                </View>
            </View>

            {/* NATIVE PICKERS */}
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

            {/* PREVIEW LIST */}
            <View className="flex-1">
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">
                    Transactions ({reportData.length})
                </Text>
                
                <ScrollView className="max-h-[350px]" showsVerticalScrollIndicator={false}>
                    {reportData.length === 0 ? (
                        <View className="p-10 bg-white rounded-[32px] border border-slate-100 items-center">
                            <Text className="text-slate-400 italic">No records found.</Text>
                        </View>
                    ) : (
                        reportData.map((tx, idx) => {
                            const dateObj = tx.created_at.toDate ? tx.created_at.toDate() : new Date(tx.created_at);
                            return (
                                <View key={idx} className="bg-white p-5 rounded-3xl mb-3 border border-slate-100 flex-row justify-between items-center shadow-sm">
                                    <View className="flex-1 pr-4">
                                        <Text className="text-slate-800 font-bold text-sm" numberOfLines={1}>{tx.subscriber}</Text>
                                        <View className="flex-row items-center mt-1">
                                            <Text className="text-[10px] text-slate-400 font-bold uppercase mr-2">
                                                {dateObj.toLocaleDateString()}
                                            </Text>
                                            <View className="bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                                <Text className="text-[8px] font-black text-indigo-600 uppercase">
                                                    {tx.plan}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                    <Text className="text-emerald-600 font-black text-sm">₱{tx.amount.toLocaleString()}</Text>
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            </View>

            {/* EXPORT ACTIONS */}
            <View className="pt-4 border-t border-slate-100 pb-10">
                <Text className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[4px] mb-4">Export Ledger</Text>
                <View className="flex-row gap-3">
                    <TouchableOpacity 
                        onPress={handleExportCSV}
                        disabled={reportData.length === 0}
                        className="flex-1 bg-white border border-slate-200 p-4 rounded-2xl items-center flex-row justify-center gap-2"
                    >
                        <TableIcon size={16} color="#64748b" />
                        <Text className="text-slate-600 font-bold text-xs">CSV</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={handleGeneratePDF}
                        disabled={reportData.length === 0}
                        className="flex-2 bg-indigo-600 p-4 rounded-2xl items-center flex-row justify-center gap-2 shadow-lg shadow-indigo-200"
                    >
                        <FileText size={16} color="white" />
                        <Text className="text-white font-bold text-xs uppercase tracking-widest">Generate PDF</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}