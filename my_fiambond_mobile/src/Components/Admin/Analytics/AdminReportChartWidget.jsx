import React, { memo } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Dimensions, 
    ScrollView, 
    ActivityIndicator 
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { BarChart } from 'react-native-chart-kit';

// Get screen width for responsive chart sizing
const screenWidth = Dimensions.get('window').width;

// --- ICONS (Converted to react-native-svg) ---

const IconBase = ({ children, style }) => (
    <Svg style={[styles.iconBase, style]} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        {children}
    </Svg>
);

const ArrowUpIcon = ({ style }) => (
    <IconBase style={style}>
        <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </IconBase>
);
const ArrowDownIcon = ({ style }) => (
    <IconBase style={style}>
        <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </IconBase>
);
const ScaleIcon = ({ style }) => (
    <IconBase style={style}>
        <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </IconBase>
);
const ChartIcon = () => (
    <Svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={styles.chartIcon}>
        <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></Path>
        <Path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></Path>
    </Svg>
);


// --- ANALYST SECTION (Converted to React Native) ---
const AdminFinancialAnalysis = ({ report }) => {
    const { totalInflow, transactionCount } = report; 
    const revenueFormatted = `₱${totalInflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    let title, narrative, recommendation;

    if (totalInflow > 0) {
        title = "Healthy Platform Growth";
        narrative = `The system generated ${revenueFormatted} in subscription revenue from ${transactionCount} active transactions. This indicates consistent value delivery.`;
        recommendation = "Focus on user retention strategies to maintain this MRR, and consider marketing campaigns to attract more companies.";
    } else {
        title = "Revenue Stagnation Detected";
        narrative = `No subscription revenue was recorded for this specific period.`;
        recommendation = "Review your premium value proposition. Consider offering limited-time trials to standard users.";
    }

    return (
        <View style={styles.mt8}>
            <Text style={styles.analystTitle}>System Analyst's Summary</Text>
            <View style={styles.analystCard}>
                <Text style={styles.analystCardTitle}>{title}</Text>
                <Text style={styles.analystCardText}>{narrative}</Text>
                <Text style={styles.analystCardRecommendationTitle}>Strategic Recommendation:</Text>
                <Text style={styles.analystCardText}>{recommendation}</Text>
            </View>
        </View>
    );
};

// --- MAIN WIDGET (Converted to React Native) ---
function AdminReportChartWidget({ report, period, setPeriod }) {
    
    // Configuration for react-native-chart-kit BarChart
    const chartConfig = {
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: 0, 
        color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`, // Default bar color
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        barPercentage: 0.5,
        fillShadowGradient: '#4f46e5',
        fillShadowGradientOpacity: 0.8,
    };
    
    // Loading State
    if (!report) return (
        <View style={styles.dashboardSection}>
             <View style={styles.loadingTitle}></View>
             <View style={styles.loadingChart}></View>
             <ActivityIndicator style={styles.loadingIndicator} size="large" color="#475569" />
        </View>
    );

    // NOTE: report.chartData must be in the { labels: [...], datasets: [{ data: [...] }] } format 
    // expected by react-native-chart-kit.
    const hasData = report.chartData?.labels?.length > 0;
    
    // Width calculation: screenWidth - (2 * 24 padding from dashboardCard)
    const chartWidth = screenWidth - (styles.dashboardCard.padding * 2);

    return (
        // Use ScrollView for safety on smaller screens
        <ScrollView contentContainerStyle={styles.dashboardSection}>
            
            {/* 1. PERIOD BUTTONS */}
            <View style={styles.periodButtonContainer}>
                {['weekly', 'monthly', 'yearly'].map((p) => (
                    <TouchableOpacity
                        key={p}
                        onPress={() => setPeriod(p)}
                        style={[
                            styles.periodButtonBase,
                            period === p ? styles.periodButtonActive : styles.periodButtonInactive
                        ]}
                    >
                        <Text style={[
                            styles.periodButtonText,
                            period === p ? styles.periodButtonTextActive : styles.periodButtonTextInactive
                        ]}>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* 2. MAIN CARD CONTAINER */}
            <View style={styles.dashboardCard}>
                
                {/* Header */}
                <View>
                    <Text style={styles.headerTitle}>System Financial Summary</Text>
                    <Text style={styles.headerSubtitle}>{report.reportTitle}</Text>
                </View>
                
                {/* 3. STAT CARDS GRID */}
                <View style={styles.statCardsGrid}>
                    
                    {/* Revenue Card (Green) */}
                    <View style={[styles.statCardBase, styles.statCardGreen]}>
                        <View style={styles.statIconContainerGreen}><ArrowUpIcon style={styles.statIconGreen} /></View>
                        <View style={styles.ml3}>
                            <Text style={styles.statLabelGreen}>Total Revenue</Text>
                            <Text style={styles.statValueGreen}>₱{parseFloat(report.totalInflow).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                        </View>
                    </View>

                    {/* Operational Costs (Red) */}
                    <View style={[styles.statCardBase, styles.statCardRed]}>
                        <View style={styles.statIconContainerRed}><ArrowDownIcon style={styles.statIconRed} /></View>
                        <View style={styles.ml3}>
                            <Text style={styles.statLabelRed}>Operational Costs</Text>
                            <Text style={styles.statValueRed}>₱{parseFloat(report.totalOutflow).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                        </View>
                    </View>

                    {/* Net Income (Blue) */}
                    <View style={[styles.statCardBase, styles.statCardBlue]}>
                        <View style={styles.statIconContainerBlue}><ScaleIcon style={styles.statIconBlue} /></View>
                        <View style={styles.ml3}>
                            <Text style={styles.statLabelBlue}>Net Income</Text>
                            <Text style={[
                                styles.statValueBlue, 
                                report.netPosition < 0 && styles.textRed600 
                            ]}>
                                ₱{parseFloat(report.netPosition).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* 4. CHART SECTION */}
                <View style={styles.mt8}>
                    <Text style={styles.breakdownTitle}>Breakdown of Revenue</Text>
                    <View style={styles.chartWrapper}>
                        {hasData ? (
                            <BarChart
                                data={report.chartData}
                                width={chartWidth}
                                height={300}
                                chartConfig={chartConfig}
                                style={styles.barChartStyle}
                                fromZero={true}
                                showValuesOnTopOfBars={true}
                                segments={1}
                            />
                        ) : (
                            <View style={styles.noDataContainer}>
                                <ChartIcon />
                                <Text style={styles.noDataText}>No revenue data for this period</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* 5. ANALYST SUMMARY */}
                <AdminFinancialAnalysis report={report} />

            </View>
        </ScrollView>
    );
};

export default memo(AdminReportChartWidget);


// --- STYLESHEET (Mapping Tailwind to React Native) ---
const styles = StyleSheet.create({
    // General Spacing/Utility
    mt8: { marginTop: 32 },
    mt6: { marginTop: 24 },
    mt3: { marginTop: 12 },
    mt2: { marginTop: 8 },
    ml3: { marginLeft: 12 },
    mb6: { marginBottom: 24 },
    iconBase: { width: 20, height: 20 },

    // Layout
    dashboardSection: { padding: 16 }, 
    dashboardCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 24, // p-6
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },

    // Loading State
    loadingTitle: { width: '80%', height: 28, backgroundColor: '#e2e8f0', borderRadius: 8, marginBottom: 24, alignSelf: 'center' },
    loadingChart: { height: 384, backgroundColor: '#e2e8f0', borderRadius: 12 },
    loadingIndicator: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -20 }, { translateY: -20 }] },


    // 1. Period Buttons
    periodButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8, 
        marginBottom: 24,
        backgroundColor: '#f1f5f9', 
        padding: 4,
        borderRadius: 12, 
        alignSelf: 'center', 
    },
    periodButtonBase: {
        paddingHorizontal: 16, 
        paddingVertical: 4,    
        borderRadius: 8,       
    },
    periodButtonActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    periodButtonText: {
        fontSize: 14, 
        textTransform: 'capitalize',
    },
    periodButtonTextActive: {
        fontWeight: '600', 
        color: '#1e293b', 
    },
    periodButtonTextInactive: {
        color: '#64748b', 
    },
    
    // Header
    headerTitle: {
        fontSize: 20, 
        fontWeight: 'bold',
        color: '#1f2937', 
    },
    headerSubtitle: {
        fontSize: 12, 
        color: '#6b7280', 
    },

    // 3. Stat Cards Grid
    statCardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16, 
        marginTop: 24, 
    },
    statCardBase: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16, 
        borderRadius: 8, 
        flex: 1, 
        minWidth: '30%', // Approx. 3 cards per row on wider screens
    },

    // Green Card (Revenue)
    statCardGreen: { backgroundColor: 'rgba(239, 247, 239, 0.5)', borderColor: 'rgba(187, 247, 208, 0.8)', borderWidth: 1 },
    statIconContainerGreen: { backgroundColor: '#dcfce7', color: '#16a34a', padding: 8, borderRadius: 8 },
    statIconGreen: { color: '#16a34a' },
    statLabelGreen: { fontSize: 14, color: '#065f46', fontWeight: '600' },
    statValueGreen: { fontSize: 20, fontWeight: 'bold', color: '#16a34a' },

    // Red Card (Outflow)
    statCardRed: { backgroundColor: 'rgba(254, 243, 242, 0.5)', borderColor: 'rgba(254, 202, 202, 0.8)', borderWidth: 1 },
    statIconContainerRed: { backgroundColor: '#fee2e2', color: '#dc2626', padding: 8, borderRadius: 8 },
    statIconRed: { color: '#dc2626' },
    statLabelRed: { fontSize: 14, color: '#991b1b', fontWeight: '600' },
    statValueRed: { fontSize: 20, fontWeight: 'bold', color: '#dc2626' },

    // Blue Card (Net Income)
    statCardBlue: { backgroundColor: 'rgba(239, 246, 255, 0.5)', borderColor: 'rgba(191, 219, 254, 0.8)', borderWidth: 1 },
    statIconContainerBlue: { backgroundColor: '#dbeafe', color: '#2563eb', padding: 8, borderRadius: 8 },
    statIconBlue: { color: '#2563eb' },
    statLabelBlue: { fontSize: 14, color: '#1e40af', fontWeight: '600' },
    statValueBlue: { fontSize: 20, fontWeight: 'bold', color: '#2563eb' },

    textRed600: { color: '#dc2626' }, 

    // 4. Chart Section
    breakdownTitle: {
        fontSize: 18, 
        fontWeight: 'bold',
        color: '#1f2937', 
        marginBottom: 8,
    },
    chartWrapper: {
        borderRadius: 8,
        overflow: 'hidden',
        // The BarChart component handles its own background/padding
    },
    barChartStyle: {
        marginVertical: 8,
        borderRadius: 8,
        // Small right padding to ensure axis labels are visible on the edge
        paddingRight: 20, 
    },
    noDataContainer: {
        height: 300,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb', 
        borderRadius: 8,
    },
    chartIcon: { color: '#d1d5db' }, 
    noDataText: {
        color: '#6b7280', 
        fontWeight: '600',
        marginTop: 8,
    },

    // Analyst Section
    analystTitle: {
        fontSize: 18, 
        fontWeight: 'bold',
        color: '#1f2937', 
    },
    analystCard: {
        marginTop: 8, 
        padding: 16, 
        backgroundColor: '#f9fafb', 
        borderRadius: 8, 
        borderWidth: 1,
        borderColor: '#e5e7eb', 
    },
    analystCardTitle: {
        fontWeight: '600', 
        color: '#1f2937', 
    },
    analystCardText: {
        marginTop: 4, 
        fontSize: 14, 
        color: '#4b5563', 
    },
    analystCardRecommendationTitle: {
        marginTop: 12, 
        fontSize: 14, 
        fontWeight: '600', 
        color: '#1f2937', 
    },
});