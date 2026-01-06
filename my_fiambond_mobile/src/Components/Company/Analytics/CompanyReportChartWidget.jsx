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


// --- BUSINESS ANALYST COMPONENT ---
const CompanyFinancialAnalysis = ({ report }) => {
    const { netPosition, transactionCount } = report;
    const netFormatted = `₱${Math.abs(netPosition).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    let title, narrative, recommendation;

    if (netPosition > 0) {
        title = "Profitable Operations";
        narrative = `The company generated a net profit of ${netFormatted}, indicating strong operational efficiency and healthy revenue streams against current expenses.`;
        recommendation = "Consider reinvesting surplus capital into growth strategies, employee bonuses, or reserve funds for future expansion.";
    } else {
        title = "Operational Deficit Detected";
        narrative = `The company's expenses exceeded revenue, resulting in a net operating loss of ${netFormatted} across ${transactionCount} transactions.`;
        recommendation = `Conduct a thorough audit of the ${transactionCount} expense entries to identify cost-cutting opportunities or strategies to boost short-term revenue.`;
    }

    return (
        <View style={styles.analysisContainer}>
            <Text style={styles.analysisHeader}>Financial Analysis</Text>
            <View style={styles.analysisContentBox}>
                <Text style={styles.analysisTitle}>{title}</Text>
                <Text style={styles.analysisNarrative}>{narrative}</Text>
                <Text style={styles.analysisStepsHeader}>Strategic Advice:</Text>
                <Text style={styles.analysisRecommendation}>{recommendation}</Text>
            </View>
        </View>
    );
};

// --- MAIN CHART WIDGET ---
function CompanyReportChartWidget({ report }) {
    
    if (!report) { 
        return (
            <View style={styles.noReportContainer}>
                <Text style={styles.noReportText}>No financial data available.</Text>
            </View>
        ); 
    }

    const hasChartData = report.chartData?.datasets?.length > 0 && report.chartData?.labels?.length > 0;

    return (
        <View style={styles.widgetContainer}>
            <View>
                <Text style={styles.widgetTitle}>Company Financial Overview</Text>
                <Text style={styles.widgetSubtitle}>{report.reportTitle}</Text>
            </View>
            
            {/* --- STAT CARDS --- */}
            <View style={styles.statCardsGrid}>
                
                {/* Revenue - Green */}
                <View style={[styles.statCardBase, styles.inflowCard]}>
                    <View style={styles.inflowIconWrapper}>
                        {ArrowUpIcon(styles.inflowIconColor)}
                    </View>
                    <View style={styles.statCardTextWrapper}>
                        <Text style={styles.inflowTextSubtitle}>Total Revenue</Text>
                        <Text style={styles.inflowTextTitle}>
                            ₱{parseFloat(report.totalInflow).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Text>
                    </View>
                </View>
                
                {/* Expenses - Red */}
                <View style={[styles.statCardBase, styles.outflowCard]}>
                    <View style={styles.outflowIconWrapper}>
                        {ArrowDownIcon(styles.outflowIconColor)}
                    </View>
                    <View style={styles.statCardTextWrapper}>
                        <Text style={styles.outflowTextSubtitle}>Total Expenses</Text>
                        <Text style={styles.outflowTextTitle}>
                            ₱{parseFloat(report.totalOutflow).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Text>
                    </View>
                </View>
                
                {/* Profit/Loss - Blue/Red */}
                <View style={[styles.statCardBase, styles.netCard]}>
                    <View style={styles.netIconWrapper}>
                        {ScaleIcon(styles.netIconColor)}
                    </View>
                    <View style={styles.statCardTextWrapper}>
                        <Text style={styles.netTextSubtitle}>Net Profit/Loss</Text>
                        <Text style={[styles.netTextTitle, report.netPosition >= 0 ? styles.netTextPositive : styles.netTextNegative]}>
                            ₱{parseFloat(report.netPosition).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Text>
                    </View>
                </View>
            </View>

            {/* --- CHART SECTION --- */}
            <View style={styles.chartSectionContainer}>
                <Text style={styles.chartHeader}>Revenue vs. Expenses</Text>
                <View style={styles.chartWrapper}>
                    {hasChartData ? (
                        <View style={styles.chartPlaceholder}>
                            <Text style={styles.chartPlaceholderText}>Chart Implementation (Requires Native Library)</Text>
                        </View>
                    ) : (
                        <View style={styles.noChartDataBox}>
                            {ChartIcon(styles.noChartIconColor)}
                            <Text style={styles.noChartDataText}>Insufficient Data</Text>
                            <Text style={styles.noChartDataSubtext}>Record transactions to visualize performance.</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* --- ANALYSIS --- */}
            <CompanyFinancialAnalysis report={report} />

        </View>
    );
};

export default CompanyReportChartWidget;


// --- REACT NATIVE STYLESHEET ---
const styles = StyleSheet.create({
    // General Utilities
    fontBold: { fontWeight: 'bold' },
    fontSemibold: { fontWeight: '600' },
    textSm: { fontSize: 14 },
    textXs: { fontSize: 12 },

    // Widget Container (Simulating Tailwind's card styles)
    widgetContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)', // bg-white/60
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.5)', // border-slate-200/50
        borderRadius: 16, // rounded-2xl
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5, // shadow-lg
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
    noReportContainer: {
        paddingVertical: 40,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
        padding: 24,
    },
    noReportText: {
        color: '#6B7280',
        fontStyle: 'italic',
    },

    // Stat Cards (grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6)
    statCardsGrid: {
        marginTop: 24, // mt-6
        flexDirection: 'column',
        gap: 16, // gap-4
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

    // Revenue Card (Green)
    inflowCard: { backgroundColor: 'rgba(236, 253, 245, 0.5)', borderColor: 'rgba(110, 231, 183, 0.8)' }, // bg-emerald-50/50, border-emerald-200/80
    inflowIconWrapper: { backgroundColor: '#D1FAE5', color: '#059669', padding: 8, borderRadius: 8 }, // bg-emerald-100, text-emerald-600
    inflowIconColor: { color: '#059669' },
    inflowTextSubtitle: { fontSize: 14, color: '#065F46', fontWeight: '600' }, // text-emerald-800
    inflowTextTitle: { fontSize: 20, fontWeight: 'bold', color: '#059669' }, // text-xl font-bold text-emerald-600

    // Expenses Card (Red)
    outflowCard: { backgroundColor: 'rgba(254, 242, 242, 0.5)', borderColor: 'rgba(252, 165, 165, 0.8)' }, // bg-rose-50/50, border-rose-200/80
    outflowIconWrapper: { backgroundColor: '#FEE2E2', color: '#DC2626', padding: 8, borderRadius: 8 }, // bg-rose-100, text-rose-600
    outflowIconColor: { color: '#DC2626' },
    outflowTextSubtitle: { fontSize: 14, color: '#991B1B', fontWeight: '600' }, // text-rose-800
    outflowTextTitle: { fontSize: 20, fontWeight: 'bold', color: '#DC2626' }, // text-xl font-bold text-rose-600

    // Profit/Loss Card (Slate/Blue/Red)
    netCard: { backgroundColor: 'rgba(248, 250, 252, 0.5)', borderColor: 'rgba(226, 232, 240, 0.8)' }, // bg-slate-50/50, border-slate-200/80
    netIconWrapper: { backgroundColor: '#F1F5F9', color: '#475569', padding: 8, borderRadius: 8 }, // bg-slate-100, text-slate-600
    netIconColor: { color: '#475569' },
    netTextSubtitle: { fontSize: 14, color: '#1E293B', fontWeight: '600' }, // text-slate-800
    netTextTitle: { fontSize: 20, fontWeight: 'bold' }, // text-xl font-bold
    netTextPositive: { color: '#4F46E5' }, // text-indigo-600
    netTextNegative: { color: '#DC2626' }, // text-rose-600

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
        borderTopWidth: 1,
        borderColor: '#F1F5F9', // border-t border-slate-100
        paddingTop: 24, // pt-6
    },
    analysisHeader: {
        fontSize: 18, // text-lg
        fontWeight: 'bold',
        color: '#1F2937', // text-gray-800
    },
    analysisContentBox: {
        marginTop: 12, // mt-3
        padding: 16, // p-4
        backgroundColor: '#F8FAFC', // bg-slate-50
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0', // border border-slate-200
    },
    analysisTitle: {
        fontWeight: '600', // font-semibold
        color: '#1E293B', // text-slate-800
    },
    analysisNarrative: {
        marginTop: 4, // mt-1
        fontSize: 14, // text-sm
        color: '#475569', // text-slate-600
    },
    analysisStepsHeader: {
        marginTop: 12, // mt-3
        fontSize: 12, // text-xs
        fontWeight: 'bold',
        color: '#9CA3AF', // text-slate-400
        textTransform: 'uppercase',
        letterSpacing: 0.5, // tracking-wide
    },
    analysisRecommendation: {
        marginTop: 4, // mt-1
        fontSize: 14, // text-sm
        color: '#334155', // text-slate-700
    },
});