import React, { memo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
// NOTE: react-chartjs-2 is a Web library. For React Native, you would need
// a library like 'react-native-svg-charts' or 'victory-native'.
// The Bar component is replaced with a placeholder/note.

// --- ICON PLACEHOLDER ---
// In a real app, replace these with icons from 'react-native-vector-icons' or 'react-native-svg'
const Icon = ({ name, style }) => {
    let iconText = '';
    switch (name) {
        case 'ArrowUp': iconText = '⬆️'; break;
        case 'ArrowDown': iconText = '⬇️'; break;
        case 'Scale': iconText = '⚖️'; break;
        case 'Chart': iconText = '📊'; break;
        default: iconText = '?';
    }
    return <Text style={[{ fontSize: 20, lineHeight: 20 }, style]}>{iconText}</Text>;
};
const ArrowUpIcon = (colorStyle) => <Icon name="ArrowUp" style={colorStyle} />;
const ArrowDownIcon = (colorStyle) => <Icon name="ArrowDown" style={colorStyle} />;
const ScaleIcon = (colorStyle) => <Icon name="Scale" style={colorStyle} />;
const ChartIcon = (colorStyle) => <Icon name="Chart" style={colorStyle} />;


// --- "AI ADVISOR" COMPONENT ---
const FinancialAnalysis = ({ report }) => {
    const { totalInflow, totalOutflow, netPosition, transactionCount } = report;
    const netFormatted = `₱${Math.abs(netPosition).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    let title, narrative, recommendation;

    if (netPosition > 0 && totalInflow > totalOutflow * 1.2) { 
        title = "Excellent Financial Discipline"; 
        narrative = `You demonstrated outstanding control over your finances, generating a strong positive cash flow of ${netFormatted}.`; 
        recommendation = "Consider allocating this surplus towards your goals. Maintain this great momentum!";
    } else if (netPosition >= 0) { 
        title = "Good Financial Management"; 
        narrative = `You successfully kept your spending in check, resulting in a positive net position of ${netFormatted}.`; 
        recommendation = "Challenge yourself to find small areas to reduce spending and further increase your savings rate next period.";
    } else { 
        title = "Spending Review Recommended"; 
        narrative = `Your expenses exceeded your income, resulting in a net outflow of ${netFormatted}. It's important to understand why.`; 
        recommendation = `Review your ${transactionCount} transactions from this period to identify the cause. Focus on tracking your outflow to stay within your income going forward.`; 
    }

    return (
        <View style={styles.analysisContainer}>
            <Text style={styles.analysisHeader}>Analyst's Summary</Text>
            <View style={styles.analysisContentBox}>
                <Text style={styles.analysisTitle}>{title}</Text>
                <Text style={styles.analysisNarrative}>{narrative}</Text>
                <Text style={styles.analysisStepsHeader}>Next Steps:</Text>
                <Text style={styles.analysisRecommendation}>{recommendation}</Text>
            </View>
        </View>
    );
};


function PersonalReportChartWidget({ report }) {
    
    // ChartJS options are now irrelevant, but we keep the data check
    if (!report) { 
        return (
            <View style={styles.noReportContainer}>
                <Text style={styles.noReportText}>No report data available.</Text>
            </View>
        ); 
    }
    const hasChartData = report.chartData?.datasets?.length > 0 && report.chartData?.labels?.length > 0;

    return (
        <View style={styles.widgetContainer}>
            <View>
                <Text style={styles.widgetTitle}>Financial Summary</Text>
                <Text style={styles.widgetSubtitle}>{report.reportTitle}</Text>
            </View>
            
            {/* --- STAT CARDS --- */}
            <View style={styles.statCardsGrid}>
                {/* Inflow Card - Light Green Theme */}
                <View style={[styles.statCardBase, styles.inflowCard]}>
                    <View style={styles.inflowIconWrapper}>
                        {ArrowUpIcon(styles.inflowIconColor)}
                    </View>
                    <View style={styles.statCardTextWrapper}>
                        <Text style={styles.inflowTextSubtitle}>Total Inflow</Text>
                        <Text style={styles.inflowTextTitle}>
                            ₱{parseFloat(report.totalInflow).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Text>
                    </View>
                </View>
                
                {/* Outflow Card - Light Red Theme */}
                <View style={[styles.statCardBase, styles.outflowCard]}>
                    <View style={styles.outflowIconWrapper}>
                        {ArrowDownIcon(styles.outflowIconColor)}
                    </View>
                    <View style={styles.statCardTextWrapper}>
                        <Text style={styles.outflowTextSubtitle}>Total Outflow</Text>
                        <Text style={styles.outflowTextTitle}>
                            ₱{parseFloat(report.totalOutflow).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Text>
                    </View>
                </View>
                
                {/* Net Position Card - Light Blue Theme */}
                <View style={[styles.statCardBase, styles.netCard]}>
                    <View style={styles.netIconWrapper}>
                        {ScaleIcon(styles.netIconColor)}
                    </View>
                    <View style={styles.statCardTextWrapper}>
                        <Text style={styles.netTextSubtitle}>Net Position</Text>
                        <Text style={[styles.netTextTitle, report.netPosition >= 0 ? styles.netTextPositive : styles.netTextNegative]}>
                            ₱{parseFloat(report.netPosition).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Text>
                    </View>
                </View>
            </View>

            {/* --- CHART SECTION --- */}
            <View style={styles.chartSectionContainer}>
                <Text style={styles.chartHeader}>Inflow vs. Outflow Breakdown</Text>
                <View style={styles.chartWrapper}>
                    {hasChartData ? (
                        <View style={styles.chartPlaceholder}>
                            <Text style={styles.chartPlaceholderText}>Chart Implementation (Requires Native Library)</Text>
                            {/* In a real app: <BarChart data={report.chartData} options={nativeChartOptions} /> */}
                        </View>
                    ) : (
                        <View style={styles.noChartDataBox}>
                            {ChartIcon(styles.noChartIconColor)}
                            <Text style={styles.noChartDataText}>Not enough data to generate a chart</Text>
                            <Text style={styles.noChartDataSubtext}>Add more transactions to see a breakdown.</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* --- GENERATED ESSAY --- */}
            <FinancialAnalysis report={report} />

        </View>
    );
};

export default memo(PersonalReportChartWidget);


// --- REACT NATIVE STYLESHEET ---
const styles = StyleSheet.create({
    // General Utilities
    fontBold: { fontWeight: 'bold' },
    fontSemibold: { fontWeight: '600' },
    textSm: { fontSize: 14 },
    textXs: { fontSize: 12 },
    textLg: { fontSize: 18 },
    textXl: { fontSize: 20 },
    textGray300: { color: '#D1D5DB' },
    textGray400: { color: '#9CA3AF' },
    textGray500: { color: '#6B7280' },
    textGray600: { color: '#4B5563' },
    textGray800: { color: '#1F2937' },
    mt2: { marginTop: 8 },
    mt3: { marginTop: 12 },
    mt6: { marginTop: 24 },
    mt8: { marginTop: 32 },
    mb2: { marginBottom: 8 },
    p4: { padding: 16 },
    // Shadow (simulating web's shadow-lg for the overall card)
    shadowLg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },

    // Widget Container (dashboard-card p-4 sm:p-6)
    widgetContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)', // bg-white/60 + backdrop-blur-xl simulation
        borderRadius: 16,
        padding: 24, // Assuming p-6 is preferred over p-4
    },
    widgetTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    widgetSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    noReportContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    noReportText: {
        color: '#6B7280',
        fontStyle: 'italic',
    },

    // Stat Cards (grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6)
    statCardsGrid: {
        marginTop: 24,
        flexDirection: 'column', // Stack vertically for mobile-first
        gap: 16,
        // For tablet/desktop, use: flexDirection: 'row', flexWrap: 'wrap',
    },
    statCardBase: {
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statCardTextWrapper: {
        marginLeft: 12,
    },

    // Inflow Card (Green)
    inflowCard: { backgroundColor: 'rgba(236, 253, 245, 0.5)', borderColor: 'rgba(110, 231, 183, 0.8)' }, // bg-green-50/50, border-green-200/80
    inflowIconWrapper: { backgroundColor: '#D1FAE5', color: '#059669', padding: 8, borderRadius: 8 }, // bg-green-100, text-green-600
    inflowIconColor: { color: '#059669' },
    inflowTextSubtitle: { fontSize: 14, color: '#065F46', fontWeight: '600' }, // text-green-800
    inflowTextTitle: { fontSize: 20, fontWeight: 'bold', color: '#059669' }, // text-green-600

    // Outflow Card (Red)
    outflowCard: { backgroundColor: 'rgba(254, 242, 242, 0.5)', borderColor: 'rgba(252, 165, 165, 0.8)' }, // bg-red-50/50, border-red-200/80
    outflowIconWrapper: { backgroundColor: '#FEE2E2', color: '#DC2626', padding: 8, borderRadius: 8 }, // bg-red-100, text-red-600
    outflowIconColor: { color: '#DC2626' },
    outflowTextSubtitle: { fontSize: 14, color: '#991B1B', fontWeight: '600' }, // text-red-800
    outflowTextTitle: { fontSize: 20, fontWeight: 'bold', color: '#DC2626' }, // text-red-600

    // Net Position Card (Blue/Red)
    netCard: { backgroundColor: 'rgba(239, 246, 255, 0.5)', borderColor: 'rgba(147, 197, 253, 0.8)' }, // bg-blue-50/50, border-blue-200/80
    netIconWrapper: { backgroundColor: '#DBEAFE', color: '#2563EB', padding: 8, borderRadius: 8 }, // bg-blue-100, text-blue-600
    netIconColor: { color: '#2563EB' },
    netTextSubtitle: { fontSize: 14, color: '#1E40AF', fontWeight: '600' }, // text-blue-800
    netTextTitle: { fontSize: 20, fontWeight: 'bold' },
    netTextPositive: { color: '#2563EB' }, // text-blue-600
    netTextNegative: { color: '#DC2626' }, // text-red-600

    // Chart Section
    chartSectionContainer: {
        marginTop: 32,
    },
    chartHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    chartWrapper: {
        position: 'relative',
        height: 300, // style={{ height: '300px' }}
    },
    chartPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6', // bg-gray-100
        borderRadius: 8,
    },
    chartPlaceholderText: {
        color: '#6B7280',
        fontSize: 16,
        fontStyle: 'italic',
    },
    noChartDataBox: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB', // bg-gray-50
        borderRadius: 8,
        padding: 20,
    },
    noChartIconColor: { color: '#D1D5DB' },
    noChartDataText: {
        color: '#6B7280',
        fontWeight: '600',
        marginTop: 8,
    },
    noChartDataSubtext: {
        color: '#9CA3AF',
        fontSize: 12,
    },

    // Financial Analysis
    analysisContainer: {
        marginTop: 32,
    },
    analysisHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    analysisContentBox: {
        marginTop: 8,
        padding: 16,
        backgroundColor: '#F9FAFB', // bg-gray-50
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    analysisTitle: {
        fontWeight: '600',
        color: '#1F2937',
    },
    analysisNarrative: {
        marginTop: 4,
        fontSize: 14,
        color: '#4B5563',
    },
    analysisStepsHeader: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    analysisRecommendation: {
        marginTop: 4,
        fontSize: 14,
        color: '#4B5563',
    },
});