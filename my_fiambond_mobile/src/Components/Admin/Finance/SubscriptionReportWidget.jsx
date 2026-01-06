import React, { useState, useMemo } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator,
    Alert 
} from 'react-native';

// --- PLACEHOLDER ICONS (Converted to basic RN View/Text for simplicity) ---
// You would replace these with Svg components (like in the first request) 
// or font icons (e.g., react-native-vector-icons)
const Icon = ({ text, color = '#64748b' }) => (
    <Text style={{ fontSize: 18, color, marginRight: 8 }}>{text}</Text>
);
const CSVIcon = (props) => <Icon text="📄" {...props} />;
const ExcelIcon = (props) => <Icon text="📊" {...props} />;
const PDFIcon = (props) => <Icon text="⎙" {...props} />;


// --- COMPONENT ---
export default function SubscriptionReportWidget({ transactions }) {
    // --- STATE: DATE RANGE DEFAULTS ---
    const defaultStart = useMemo(() => {
        return new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    }, []);
    const defaultEnd = useMemo(() => {
        return new Date().toISOString().split('T')[0];
    }, []);

    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);
    const [isExporting, setIsExporting] = useState(false); // For loading state

    // --- FILTER LOGIC ---
    const reportData = useMemo(() => {
        // Convert input strings to Date objects for comparison
        const startObj = new Date(startDate);
        startObj.setHours(0, 0, 0, 0);

        const endObj = new Date(endDate);
        endObj.setHours(23, 59, 59, 999);

        return transactions
            .filter(tx => {
                if (!tx.created_at) return false;
                // Handle Firebase Timestamp vs JS Date
                const txDate = tx.created_at.toDate ? tx.created_at.toDate() : new Date(tx.created_at);
                
                // Check Range
                return txDate >= startObj && txDate <= endObj;
            })
            .sort((a, b) => {
                const dateA = a.created_at.toDate ? a.created_at.toDate() : new Date(a.created_at);
                const dateB = b.created_at.toDate ? b.created_at.toDate() : new Date(b.created_at);
                return dateB - dateA; // Newest first
            });
    }, [transactions, startDate, endDate]);

    const totalRevenue = reportData.reduce((acc, curr) => acc + curr.amount, 0);
    
    // Helper label for Exports (Not used in RN export functions, but kept for consistency)
    const getPeriodLabel = () => {
        // NOTE: In RN, toLocaleDateString might not be available or fully supported on all platforms.
        // It's safer to build the string manually: 
        const formatRN = (dateString) => new Date(dateString).toLocaleDateString();
        return `${formatRN(startDate)} - ${formatRN(endDate)}`;
    };

    // --- RN EXPORT PLACEHOLDERS ---
    const handleExport = async (format) => {
        if (reportData.length === 0) return;

        setIsExporting(true);
        // Simulate file creation/download
        await new Promise(resolve => setTimeout(resolve, 1500)); 
        setIsExporting(false);

        // ------------------------------------------------------------------------------------------------
        // 🚨 RN IMPLEMENTATION NOTES:
        // You MUST replace the following placeholder with native-compatible logic.
        // 
        // 1. Generate Content: 
        //    - CSV: Simple string generation.
        //    - PDF/Excel: Use RN-compatible libraries to generate the binary data/file path.
        // 2. Save File: Use `react-native-fs` or `expo-file-system` to write the content to device storage.
        // 3. Share/Open: Use `react-native-share` or `Expo.Sharing` to allow the user to view/share the file.
        // ------------------------------------------------------------------------------------------------
        
        let message = '';
        if (format === 'CSV') {
            // Placeholder: Replace with CSV generation and save/share
            message = `CSV report for ${getPeriodLabel()} is ready to be shared/saved.`;
        } else if (format === 'Excel') {
            // Placeholder: Replace with Excel generation (e.g., using a JSON-to-XLSX library or a backend service)
            message = `Excel report for ${getPeriodLabel()} is ready to be shared/saved.`;
        } else if (format === 'PDF') {
            // Placeholder: Replace with PDF generation (e.g., react-native-html-to-pdf)
            message = `PDF report for ${getPeriodLabel()} is ready to be shared/saved.`;
        }

        Alert.alert("Export Complete", message);
    };

    return (
        <ScrollView style={styles.outerContainer}>
            {/* DATE RANGE PICKER */}
            <View style={styles.datePickerContainer}>
                <View style={styles.dateInputsGroup}>
                    {/* START DATE (Placeholder for RN DatePicker) */}
                    <View>
                        <Text style={styles.dateLabel}>START DATE</Text>
                        <TextInput 
                            style={styles.dateInput}
                            value={startDate} 
                            onChangeText={setStartDate} 
                            placeholder="YYYY-MM-DD"
                            // NOTE: In a real RN app, you would use a dedicated DatePicker component here
                        />
                    </View>
                    {/* END DATE (Placeholder for RN DatePicker) */}
                    <View>
                        <Text style={styles.dateLabel}>END DATE</Text>
                        <TextInput 
                            style={styles.dateInput}
                            value={endDate} 
                            onChangeText={setEndDate} 
                            placeholder="YYYY-MM-DD"
                            // NOTE: In a real RN app, you would use a dedicated DatePicker component here
                        />
                    </View>
                </View>
                <View style={styles.revenueSummary}>
                    <Text style={styles.summaryLabel}>Total Revenue in Range</Text>
                    <Text style={styles.summaryAmount}>₱{totalRevenue.toLocaleString('en-US')}</Text>
                </View>
            </View>

            {/* PREVIEW TABLE (Implemented as a flat list of Views/Texts) */}
            <View style={styles.tableWrapper}>
                <ScrollView style={styles.tableScrollView}>
                    {/* Table Header (Sticky header is hard in RN, so we use a regular View) */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerText, { width: '25%' }]}>Date</Text>
                        <Text style={[styles.headerText, { width: '50%' }]}>Subscriber</Text>
                        <Text style={[styles.headerText, { width: '25%', textAlign: 'right' }]}>Amount</Text>
                    </View>
                    
                    {/* Table Body */}
                    {reportData.length === 0 ? (
                        <View style={styles.noDataRow}>
                            <Text style={styles.noDataText}>No subscriptions found in this date range.</Text>
                        </View>
                    ) : (
                        reportData.map((tx, idx) => {
                            const dateObj = tx.created_at.toDate ? tx.created_at.toDate() : new Date(tx.created_at);
                            return (
                                <View key={idx} style={styles.tableRow}>
                                    <Text style={[styles.cellText, styles.dateCell]}>{dateObj.toLocaleDateString()}</Text>
                                    <View style={styles.subscriberCell}>
                                        <Text style={styles.subscriberName}>{tx.subscriber}</Text>
                                        <Text style={styles.subscriberMeta}>{tx.plan.toUpperCase()} • {tx.method}</Text>
                                    </View>
                                    <Text style={styles.amountCell}>
                                        ₱{tx.amount.toLocaleString('en-US')}
                                    </Text>
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            </View>

            {/* EXPORT BUTTONS */}
            <View style={styles.exportSection}>
                <Text style={styles.exportLabel}>Export Revenue Report</Text>
                <View style={styles.exportButtonsGrid}>
                    <TouchableOpacity 
                        onPress={() => handleExport('CSV')} 
                        disabled={reportData.length === 0 || isExporting} 
                        style={[styles.exportButtonBase, styles.buttonCSV]}
                    >
                        {isExporting ? <ActivityIndicator color="#64748b" /> : <CSVIcon />}
                        <Text style={styles.buttonTextCSV}>CSV</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => handleExport('Excel')} 
                        disabled={reportData.length === 0 || isExporting} 
                        style={[styles.exportButtonBase, styles.buttonExcel]}
                    >
                        {isExporting ? <ActivityIndicator color="#047857" /> : <ExcelIcon color="#047857" />}
                        <Text style={styles.buttonTextExcel}>Excel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        onPress={() => handleExport('PDF')} 
                        disabled={reportData.length === 0 || isExporting} 
                        style={[styles.exportButtonBase, styles.buttonPDF]}
                    >
                         {isExporting ? <ActivityIndicator color="#ffffff" /> : <PDFIcon color="#ffffff" />}
                        <Text style={styles.buttonTextPDF}>PDF</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}


// --- STYLESHEET ---
const styles = StyleSheet.create({
    outerContainer: {
        padding: 16,
    },
    // DATE RANGE PICKER (bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4)
    datePickerContainer: {
        backgroundColor: '#f8fafc', // slate-50
        padding: 16,
        borderRadius: 12, // rounded-xl
        borderWidth: 1,
        borderColor: '#e2e8f0', // slate-200
        marginBottom: 16,
    },
    dateInputsGroup: {
        flexDirection: 'row',
        gap: 16, // gap-4
        alignItems: 'flex-end',
        marginBottom: 16, // Added for mobile stacking
    },
    dateLabel: {
        fontSize: 10, // text-xs
        fontWeight: 'bold',
        color: '#64748b', // slate-500
        textTransform: 'uppercase',
        letterSpacing: 0.5, // tracking-wide
        marginBottom: 4, // mb-1
    },
    dateInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#cbd5e1', // slate-300
        color: '#374151', // gray-700
        fontSize: 14, // text-sm
        borderRadius: 8, // rounded-lg
        padding: 8, // p-2
        width: 130, // Fixed width for date input clarity
    },
    revenueSummary: {
        alignItems: 'flex-end',
    },
    summaryLabel: {
        fontSize: 12, // text-xs
        color: '#64748b', // slate-500
    },
    summaryAmount: {
        fontSize: 24, // text-2xl
        fontWeight: 'bold',
        color: '#059669', // emerald-600
        marginTop: 4,
    },

    // PREVIEW TABLE (max-h-80 overflow-y-auto border border-slate-200 rounded-xl)
    tableWrapper: {
        maxHeight: 320, // max-h-80
        borderWidth: 1,
        borderColor: '#e2e8f0', // slate-200
        borderRadius: 12, // rounded-xl
        overflow: 'hidden',
    },
    tableScrollView: {
        // custom-scrollbar is a web thing, let RN handle scrolling
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f9fafb', // gray-50
        paddingHorizontal: 16, // px-6
        paddingVertical: 12, // py-3
        // Sticky is hard in RN ScrollView, treat as a regular row
    },
    headerText: {
        fontSize: 12, // text-xs
        fontWeight: '500', // font-medium
        color: '#6b7280', // gray-500
        textTransform: 'uppercase',
        letterSpacing: 0.5, // tracking-wider
    },
    tableRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6', // divide-gray-200
        paddingHorizontal: 16,
        paddingVertical: 16, // py-4
    },
    // Cell Styles
    cellText: {
        fontSize: 14, // text-sm
        color: '#4b5563', // gray-600
    },
    dateCell: {
        width: '25%',
    },
    subscriberCell: {
        width: '50%',
    },
    subscriberName: {
        fontSize: 14,
        color: '#1f2937', // gray-900
        fontWeight: '500', // font-medium
    },
    subscriberMeta: {
        fontSize: 12, // text-xs
        color: '#9ca3af', // gray-400
        fontWeight: 'normal',
        marginTop: 2,
    },
    amountCell: {
        width: '25%',
        textAlign: 'right',
        fontSize: 14,
        fontWeight: 'bold',
        color: '#059669', // emerald-600
    },
    noDataRow: {
        paddingHorizontal: 16,
        paddingVertical: 32, // py-8
        alignItems: 'center',
    },
    noDataText: {
        fontSize: 14,
        color: '#6b7280', // gray-500
    },

    // EXPORT BUTTONS (pt-2)
    exportSection: {
        paddingTop: 8,
    },
    exportLabel: {
        fontSize: 12, // text-xs
        fontWeight: 'bold',
        color: '#94a3b8', // slate-400
        textTransform: 'uppercase',
        letterSpacing: 0.5, // tracking-wider
        marginBottom: 8, // mb-2
        textAlign: 'center',
    },
    exportButtonsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12, // gap-3 (approx)
    },
    exportButtonBase: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10, // py-2.5
        borderRadius: 12, // rounded-xl
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2, // shadow-sm / shadow-md
    },
    // CSV Button
    buttonCSV: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#cbd5e1', // slate-300
    },
    buttonTextCSV: {
        color: '#475569', // slate-700
        fontWeight: 'bold',
    },
    // Excel Button
    buttonExcel: {
        backgroundColor: '#ecfdf5', // emerald-50
        borderWidth: 1,
        borderColor: '#a7f3d0', // emerald-200
    },
    buttonTextExcel: {
        color: '#047857', // emerald-700
        fontWeight: 'bold',
    },
    // PDF Button
    buttonPDF: {
        backgroundColor: '#4f46e5', // indigo-600
    },
    buttonTextPDF: {
        color: '#fff', // text-white
        fontWeight: 'bold',
    },
});