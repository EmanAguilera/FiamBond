import React, { memo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
// NOTE: react-chartjs-2 is a Web library. Use 'react-native-svg-charts' or 'victory-native' in a real app.

// --- ICON PLACEHOLDER ---
const Icon = ({ name, style, size = 20 }) => {
    let iconText = '';
    switch (name) {
        case 'ArrowUp': iconText = '⬆️'; break;
        case 'ArrowDown': iconText = '⬇️'; break;
        case 'Scale': iconText = '⚖️'; break;
        case 'Chart': iconText = '📊'; break;
        default: iconText = '?';
    }
    return <Text style={[{ fontSize: size, lineHeight: size }, style]}>{iconText}</Text>;
};
const ArrowUpIcon = (colorStyle) => <Icon name="ArrowUp" style={colorStyle} />;
const ArrowDownIcon = (colorStyle) => <Icon name="ArrowDown" style={colorStyle} />;
const ScaleIcon = (colorStyle) => <Icon name="Scale" style={colorStyle} />;
const ChartIcon = (colorStyle) => <Icon name="Chart" style={[colorStyle, styles.chartIconLarge]} size={48} />;


// --- "AI ADVISOR" FOR THE FAMILY REPORT ---
const FamilyFinancialAnalysis = ({ report }) => {
    const { netPosition, transactionCount } = report;
    const netFormatted = `₱${Math.abs(netPosition).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    let title, narrative, recommendation;

    if (netPosition > 0) {
        title = "Positive Family Cash Flow";
        narrative = `The family demonstrated strong collective financial management, generating a positive cash flow of ${netFormatted}. This is an excellent result.`;
        recommendation = "Discuss as a group how to best allocate this surplus. It could be a great opportunity to contribute more towards a shared family goal.";
    } else {
        title = "Family Spending Review Needed";
        narrative = `The family's collective expenses exceeded its income, resulting in a net outflow of ${netFormatted}.`;
        recommendation = `It would be beneficial to review the ${transactionCount} family transactions together to understand spending patterns and identify areas for potential savings.`;
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


function FamilyReportChartWidget({ family, report }) {
    
    if (!report || !family) { 
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
                <Text style={styles.widgetTitle}>Family Financial Summary</Text>
                <Text style={styles.widgetSubtitle}>{report.reportTitle} for <Text style={styles.familyText}>{family.family_name}</Text></Text>
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
                
                {/* Net Position Card - Light Blue Theme (Consistent) */}
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
                <Text style={styles.chartHeader}>Breakdown of Family Spending</Text>
                <View style={styles.chartWrapper}>
                    {hasChartData ? (
                        <View style={styles.chartPlaceholder}>
                            <Text style={styles.chartPlaceholderText}>Chart Implementation (Requires Native Library)</Text>
                        </View>
                    ) : (
                        <View style={styles.noChartDataBox}>
                            {ChartIcon(styles.noChartIconColor)}
                            <Text style={styles.noChartDataText}>Not enough data to generate a chart</Text>
                            <Text style={styles.noChartDataSubtext}>Add family transactions to see a breakdown.</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* --- GENERATED ESSAY FOR THE FAMILY --- */}
            <FamilyFinancialAnalysis report={report} />

        </View>
    );
};

export default FamilyReportChartWidget;


// --- REACT NATIVE STYLESHEET ---
const styles = StyleSheet.create({
    // General Utilities
    fontBold: { fontWeight: 'bold' },
    fontSemibold: { fontWeight: '600' },
    textSm: { fontSize: 14 },
    textXs: { fontSize: 12 },

    // Widget Container (dashboard-card p-4 sm:p-6)
    widgetContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)', 
        borderRadius: 16,
        padding: 24, // p-6
    },
    widgetTitle: {
        fontSize: 20, // text-xl
        fontWeight: 'bold',
        color: '#1F2937', // text-gray-800
    },
    widgetSubtitle: {
        fontSize: 14, // text-sm
        color: '#6B7280', // text-gray-500
        marginTop: 4,
    },
    familyText: {
        fontWeight: '600', // font-semibold
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
        marginTop: 24, // mt-6
        flexDirection: 'column', // Stack vertically for mobile-first
        gap: 16, // gap-4
        // For tablet/desktop, use: flexDirection: 'row', flexWrap: 'wrap',
    },
    statCardBase: {
        padding: 16, // p-4
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statCardTextWrapper: {
        marginLeft: 12, // ml-3
    },

    // Inflow Card (Green)
    inflowCard: { backgroundColor: 'rgba(236, 253, 245, 0.5)', borderColor: 'rgba(110, 231, 183, 0.8)' }, // bg-green-50/50, border-green-200/80
    inflowIconWrapper: { backgroundColor: '#D1FAE5', color: '#059669', padding: 8, borderRadius: 8 }, // bg-green-100, text-green-600
    inflowIconColor: { color: '#059669' },
    inflowTextSubtitle: { fontSize: 14, color: '#065F46', fontWeight: '600' }, // text-green-800
    inflowTextTitle: { fontSize: 20, fontWeight: 'bold', color: '#059669' }, // text-xl font-bold text-green-600

    // Outflow Card (Red)
    outflowCard: { backgroundColor: 'rgba(254, 242, 242, 0.5)', borderColor: 'rgba(252, 165, 165, 0.8)' }, // bg-red-50/50, border-red-200/80
    outflowIconWrapper: { backgroundColor: '#FEE2E2', color: '#DC2626', padding: 8, borderRadius: 8 }, // bg-red-100, text-red-600
    outflowIconColor: { color: '#DC2626' },
    outflowTextSubtitle: { fontSize: 14, color: '#991B1B', fontWeight: '600' }, // text-red-800
    outflowTextTitle: { fontSize: 20, fontWeight: 'bold', color: '#DC2626' }, // text-xl font-bold text-red-600

    // Net Position Card (Blue/Red)
    netCard: { backgroundColor: 'rgba(239, 246, 255, 0.5)', borderColor: 'rgba(147, 197, 253, 0.8)' }, // bg-blue-50/50, border-blue-200/80
    netIconWrapper: { backgroundColor: '#DBEAFE', color: '#2563EB', padding: 8, borderRadius: 8 }, // bg-blue-100, text-blue-600
    netIconColor: { color: '#2563EB' },
    netTextSubtitle: { fontSize: 14, color: '#1E40AF', fontWeight: '600' }, // text-blue-800
    netTextTitle: { fontSize: 20, fontWeight: 'bold' }, // text-xl font-bold
    netTextPositive: { color: '#2563EB' }, // text-blue-600
    netTextNegative: { color: '#DC2626' }, // text-red-600

    // Chart Section
    chartSectionContainer: {
        marginTop: 32, // mt-8
    },
    chartHeader: {
        fontSize: 18, // text-lg
        fontWeight: 'bold',
        color: '#1F2937', // text-gray-800
        marginBottom: 8, // mb-2
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
    chartIconLarge: {
        color: '#D1D5DB', // text-gray-300
    },
    noChartIconColor: { color: '#D1D5DB' },
    noChartDataText: {
        color: '#6B7280',
        fontWeight: '600',
        marginTop: 8, // mt-2
    },
    noChartDataSubtext: {
        color: '#9CA3AF',
        fontSize: 12, // text-xs
    },

    // Financial Analysis
    analysisContainer: {
        marginTop: 32, // mt-8
    },
    analysisHeader: {
        fontSize: 18, // text-lg
        fontWeight: 'bold',
        color: '#1F2937', // text-gray-800
    },
    analysisContentBox: {
        marginTop: 8, // mt-2
        padding: 16, // p-4
        backgroundColor: '#F9FAFB', // bg-gray-50
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB', // border
    },
    analysisTitle: {
        fontWeight: '600', // font-semibold
        color: '#1F2937', // text-gray-800
    },
    analysisNarrative: {
        marginTop: 4, // mt-1
        fontSize: 14, // text-sm
        color: '#4B5563', // text-gray-600
    },
    analysisStepsHeader: {
        marginTop: 12, // mt-3
        fontSize: 14, // text-sm
        fontWeight: '600', // font-semibold
        color: '#1F2937', // text-gray-800
    },
    analysisRecommendation: {
        marginTop: 4, // mt-1
        fontSize: 14, // text-sm
        color: '#4B5563', // text-gray-600
    },
});