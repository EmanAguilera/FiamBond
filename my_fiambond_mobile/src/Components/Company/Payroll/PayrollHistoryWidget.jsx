import React, { useState, useMemo } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    TextInput, 
    StyleSheet, 
    ScrollView, 
    Alert,
    Platform // For date input placeholder, and export logic placeholder
} from 'react-native';

// NOTE: ExcelJS and file-saver are web-only. Export functions are replaced with native placeholders.

// TypeScript interfaces are removed here

// --- ICON PLACEHOLDERS ---
const Icon = ({ name, style, size = 24 }) => {
    let iconText = '';
    switch (name) {
        case 'CSV': iconText = '📝'; break;
        case 'Excel': iconText = '📊'; break;
        case 'PDF': iconText = '📄'; break;
        default: iconText = '?';
    }
    return <Text style={[{ fontSize: size, lineHeight: size }, style]}>{iconText}</Text>;
};
const CSVIcons = (style) => <Icon name="CSV" style={style} size={20} />;
const ExcelIcons = (style) => <Icon name="Excel" style={style} size={20} />;
const PDFIcons = (style) => <Icon name="PDF" style={style} size={20} />;


// TypeScript type annotation removed from function signature
export default function PayrollHistoryWidget({ transactions, companyName }) {
    // --- STATE: DATE RANGE DEFAULTS ---
    const defaultStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const defaultEnd = new Date().toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);

    // --- FILTER LOGIC ---
    const payrollData = useMemo(() => {
        // Range Setup
        const startObj = new Date(startDate);
        startObj.setHours(0, 0, 0, 0);
        const endObj = new Date(endDate);
        endObj.setHours(23, 59, 59, 999);

        return transactions
            .filter(tx => 
                // Checks for category or description keywords
                (tx.category === 'Payroll' || tx.category === 'Cash Advance') || 
                (tx.description && (tx.description.toLowerCase().includes('salary') || tx.description.toLowerCase().includes('advance')))
            )
            .filter(tx => {
                // Ensure tx.created_at has toDate() method (Firebase Timestamp check)
                const txDate = tx.created_at && tx.created_at.toDate ? tx.created_at.toDate() : new Date(tx.created_at);
                // Check Range
                return txDate >= startObj && txDate <= endObj;
            })
            .sort((a, b) => {
                // Safely compare dates
                const dateA = a.created_at && a.created_at.toDate ? a.created_at.toDate().getTime() : new Date(a.created_at).getTime();
                const dateB = b.created_at && b.created_at.toDate ? b.created_at.toDate().getTime() : new Date(b.created_at).getTime();
                return dateB - dateA; // Newest first
            });
    }, [transactions, startDate, endDate]);

    const totalPaid = payrollData.reduce((acc, curr) => acc + curr.amount, 0);
    
    // Helper label
    const getPeriodLabel = () => {
        // Fallback to toLocaleDateString() on RN, assuming Intl is available.
        return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
    };

    // --- 1. PDF GENERATION (Native Placeholder) ---
    const handleGeneratePDF = () => {
        Alert.alert(
            "Export to PDF", 
            "Native PDF generation requires a library (e.g., react-native-html-to-pdf) and will be implemented natively.",
            [{ text: "OK" }]
        );
    };

    // --- 2. EXCEL GENERATION (Native Placeholder) ---
    const handleExportExcel = () => {
        Alert.alert(
            "Export to Excel", 
            "Native Excel export requires specialized libraries (e.g., using 'exceljs' inside a file module and saving via 'rn-fetch-blob').",
            [{ text: "OK" }]
        );
    };

    // --- 3. CSV GENERATION (Native Placeholder) ---
    const handleExportCSV = () => {
        Alert.alert(
            "Export to CSV", 
            "Native CSV export requires building the string and saving/sharing the file via native modules.",
            [{ text: "OK" }]
        );
    };

    return (
        <View style={styles.container}>
            {/* DATE RANGE PICKER & SUMMARY */}
            <View style={styles.dateRangeSummaryBox}>
                <View style={styles.dateRangePickers}>
                    <View>
                        <Text style={styles.dateLabel}>Start Date</Text>
                        <TextInput 
                            style={styles.dateInput}
                            placeholder="YYYY-MM-DD"
                            keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
                            value={startDate} 
                            onChangeText={setStartDate} 
                        />
                    </View>
                    <View>
                        <Text style={styles.dateLabel}>End Date</Text>
                        <TextInput 
                            style={styles.dateInput}
                            placeholder="YYYY-MM-DD"
                            keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
                            value={endDate} 
                            onChangeText={setEndDate} 
                        />
                    </View>
                </View>
                <View style={styles.summaryAmountArea}>
                    <Text style={styles.summaryLabel}>Total Disbursed in Range</Text>
                    <Text style={styles.summaryAmount}>₱{totalPaid.toLocaleString()}</Text>
                </View>
            </View>

            {/* PREVIEW TABLE (Using ScrollView) */}
            <View style={styles.tableWrapper}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.headerCell, styles.headerCellDate]}>Date</Text>
                    <Text style={[styles.headerCell, styles.headerCellDescription]}>Description</Text>
                    <Text style={[styles.headerCell, styles.headerCellAmount]}>Amount</Text>
                </View>
                
                <ScrollView style={styles.tableBody}>
                    {payrollData.length === 0 ? (
                        <View style={styles.tableEmptyRow}>
                            <Text style={styles.tableEmptyText}>No records found in this date range.</Text>
                        </View>
                    ) : (
                        payrollData.map((tx) => (
                            <View key={tx.id} style={styles.tableRow}>
                                <Text style={[styles.dataCell, styles.dataCellDate]}>{tx.created_at && tx.created_at.toDate ? tx.created_at.toDate().toLocaleDateString() : new Date(tx.created_at).toLocaleDateString()}</Text>
                                <View style={[styles.dataCell, styles.dataCellDescription]}>
                                    <Text style={styles.dataCellDescriptionMain}>{tx.description}</Text>
                                    <Text style={styles.dataCellDescriptionSub}>{tx.category || 'General Payroll'}</Text>
                                </View>
                                <Text style={[styles.dataCell, styles.dataCellAmount]}>
                                    ₱{tx.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}
                                </Text>
                            </View>
                        ))
                    )}
                </ScrollView>
            </View>

            {/* ACTION BUTTONS */}
            <View style={styles.exportSection}>
                <Text style={styles.exportHeader}>Export Data</Text>
                <View style={styles.exportButtonGrid}>
                    <TouchableOpacity 
                        onPress={handleExportCSV} 
                        disabled={payrollData.length === 0} 
                        style={[styles.exportButtonBase, styles.exportButtonSecondary, payrollData.length === 0 && styles.disabledButton]}
                    >
                        {CSVIcons(styles.iconSecondary)}
                        <Text style={styles.exportButtonTextSecondary}>CSV</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        onPress={handleExportExcel} 
                        disabled={payrollData.length === 0} 
                        style={[styles.exportButtonBase, styles.exportButtonExcel, payrollData.length === 0 && styles.disabledButton]}
                    >
                        {ExcelIcons(styles.iconExcel)}
                        <Text style={styles.exportButtonTextExcel}>Excel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        onPress={handleGeneratePDF} 
                        disabled={payrollData.length === 0} 
                        style={[styles.exportButtonBase, styles.exportButtonPrimary, payrollData.length === 0 && styles.disabledButton]}
                    >
                        {PDFIcons(styles.iconPrimary)}
                        <Text style={styles.exportButtonTextPrimary}>PDF</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

// --- REACT NATIVE STYLESHEET ---
const styles = StyleSheet.create({
    container: {
        gap: 16, // space-y-4
        padding: 16,
    },
    
    // --- Date Range Picker & Summary ---
    dateRangeSummaryBox: {
        backgroundColor: '#F8FAFC', // bg-slate-50
        padding: 16, // p-4
        borderRadius: 12, // rounded-xl
        borderWidth: 1,
        borderColor: '#E2E8F0', // border-slate-200
        flexDirection: 'column',
        gap: 16, // gap-4 for picker and summary
    },
    dateRangePickers: {
        flexDirection: 'row',
        gap: 16, // gap-4
        alignItems: 'flex-end',
        flexWrap: 'wrap',
    },
    dateLabel: {
        fontSize: 12, // text-xs
        fontWeight: 'bold',
        color: '#64748B', // text-slate-500
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4, // mb-1
    },
    dateInput: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#CBD5E1', // border-slate-300
        color: '#374151', // text-gray-700
        fontSize: 14, // text-sm
        borderRadius: 8, // rounded-lg
        padding: 8, // p-2
        width: 130, // Fixed width for date input
    },
    summaryAmountArea: {
        alignItems: 'flex-end', // text-right
        paddingTop: 8,
    },
    summaryLabel: {
        fontSize: 12, // text-xs
        color: '#64748B',
    },
    summaryAmount: {
        fontSize: 24, // text-2xl
        fontWeight: 'bold',
        color: '#059669', // text-emerald-600
    },

    // --- Preview Table ---
    tableWrapper: {
        // max-h-80 overflow-y-auto
        maxHeight: 320,
        borderWidth: 1,
        borderColor: '#E2E8F0', // border-slate-200
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: 'white',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F9FAFB', // bg-gray-50
        borderBottomWidth: 1,
        borderColor: '#E5E7EB',
        zIndex: 10,
    },
    headerCell: {
        paddingHorizontal: 16, // px-6
        paddingVertical: 12, // py-3
        fontSize: 12, // text-xs
        fontWeight: '500', // font-medium
        color: '#6B7280', // text-gray-500
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    headerCellDate: { width: '25%', textAlign: 'left' },
    headerCellDescription: { width: '50%', textAlign: 'left' },
    headerCellAmount: { width: '25%', textAlign: 'right' },

    tableBody: {
        // bg-white divide-y divide-gray-200
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#E5E7EB',
    },
    dataCell: {
        paddingHorizontal: 16,
        paddingVertical: 16, // py-4
        fontSize: 14, // text-sm
        color: '#6B7280', // text-gray-600
        textAlign: 'left',
    },
    dataCellDate: { width: '25%' },
    dataCellDescription: { width: '50%' },
    dataCellDescriptionMain: { color: '#1F2937', fontWeight: '500' }, // text-gray-900 font-medium
    dataCellDescriptionSub: { fontSize: 12, color: '#9CA3AF' }, // text-xs text-gray-400
    dataCellAmount: {
        width: '25%',
        textAlign: 'right',
        fontWeight: 'bold',
        color: '#334155', // text-slate-700
    },
    tableEmptyRow: {
        paddingHorizontal: 16,
        paddingVertical: 32, // py-8
        alignItems: 'center',
    },
    tableEmptyText: {
        fontSize: 14,
        color: '#6B7280',
        fontStyle: 'italic',
    },

    // --- Action Buttons (Export) ---
    exportSection: {
        paddingTop: 8, // pt-2
    },
    exportHeader: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94A3AF', // text-slate-400
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8, // mb-2
        textAlign: 'center',
    },
    exportButtonGrid: {
        flexDirection: 'row',
        gap: 12, // gap-3
    },
    exportButtonBase: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8, // gap-2
        paddingVertical: 10, // py-2.5
        borderRadius: 12, // rounded-xl
        fontWeight: 'bold',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2, // shadow-sm or shadow-md
    },
    
    // CSV Button (Secondary)
    exportButtonSecondary: { backgroundColor: 'white', borderWidth: 1, borderColor: '#CBD5E1' },
    exportButtonTextSecondary: { color: '#374151', fontWeight: 'bold' },
    iconSecondary: { color: '#6B7280' },

    // Excel Button
    exportButtonExcel: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#D1FAE5' },
    exportButtonTextExcel: { color: '#047857', fontWeight: 'bold' },
    iconExcel: { color: '#047857' },

    // PDF Button (Primary)
    exportButtonPrimary: { backgroundColor: '#4F46E5', shadowOpacity: 0.2 },
    exportButtonTextPrimary: { color: 'white', fontWeight: 'bold' },
    iconPrimary: { color: 'white' },

    disabledButton: { opacity: 0.5 },
});