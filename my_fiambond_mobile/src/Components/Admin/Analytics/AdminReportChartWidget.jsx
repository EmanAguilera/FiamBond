import React, { memo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { BarChart } from "react-native-gifted-charts";
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

// --- ICONS (Converted to React Native Svg) ---
const ArrowUpIcon = () => (
    <Svg className="w-5 h-5" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24">
        <Path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </Svg>
);

const ArrowDownIcon = () => (
    <Svg className="w-5 h-5" fill="none" stroke="#dc2626" strokeWidth="2.5" viewBox="0 0 24 24">
        <Path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </Svg>
);

const ScaleIcon = () => (
    <Svg className="w-5 h-5" fill="none" stroke="#2563eb" strokeWidth="2" viewBox="0 0 24 24">
        <Path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </Svg>
);

const ChartIcon = () => (
    <Svg className="w-12 h-12" fill="none" stroke="#d1d5db" strokeWidth="2" viewBox="0 0 24 24">
        <Path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <Path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
    </Svg>
);

// --- ANALYST SECTION ---
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
        <View className="mt-8">
            <Text className="text-lg font-bold text-gray-800">System Analyst's Summary</Text>
            <View className="mt-2 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <Text className="font-bold text-gray-800 text-sm">{title}</Text>
                <Text className="mt-1 text-xs text-gray-600 leading-4">{narrative}</Text>
                <Text className="mt-3 text-xs font-bold text-gray-800 uppercase tracking-widest">Strategic Recommendation:</Text>
                <Text className="mt-1 text-xs text-gray-600 leading-4 font-medium">{recommendation}</Text>
            </View>
        </View>
    );
};

// --- DATA TRANSFORMER ---
const transformData = (chartData) => {
    if (!chartData || !chartData.labels) return [];
    
    // Admin Chart usually has one dataset (Revenue)
    const labels = chartData.labels;
    const revenueData = chartData.datasets[0]?.data || [];

    return labels.map((label, index) => ({
        value: revenueData[index] || 0,
        label: label,
        labelTextStyle: { color: '#94a3b8', fontSize: 9 },
        frontColor: '#9333ea', // purple-600
    }));
};

// --- MAIN WIDGET ---
function AdminReportChartWidget({ report, period, setPeriod }) {
    
    // Loading State
    if (!report) return (
        <View className="p-4 animate-pulse">
             <View className="w-full h-10 bg-slate-100 rounded-2xl mb-6 self-center max-w-xs" />
             <View className="h-64 bg-slate-50 rounded-[40px]" />
        </View>
    );

    const hasData = report.chartData?.labels?.length > 0;
    const barData = transformData(report.chartData);

    return (
        <View>
            {/* 1. PERIOD SELECTOR (Pill Style) */}
            <View className="flex-row justify-center bg-slate-100 p-1 rounded-2xl mb-6 self-center">
                {['weekly', 'monthly', 'yearly'].map((p) => (
                    <TouchableOpacity
                        key={p}
                        onPress={() => setPeriod(p)}
                        className={`px-5 py-2 rounded-xl ${
                            period === p ? 'bg-white shadow-sm' : ''
                        }`}
                    >
                        <Text className={`capitalize text-xs font-bold ${
                            period === p ? 'text-purple-600' : 'text-slate-400'
                        }`}>
                            {p}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* 2. MAIN CARD CONTAINER */}
            <View className="bg-white rounded-[40px] p-5 border border-slate-100 shadow-sm">
                
                {/* Header */}
                <View>
                    <Text className="text-xl font-bold text-gray-800">System Financial Summary</Text>
                    <Text className="text-xs text-gray-400 mt-1">{report.reportTitle}</Text>
                </View>
                
                {/* 3. STAT CARDS (Vertical on Mobile) */}
                <View className="gap-3 mt-6">
                    
                    {/* Revenue Card (Green) */}
                    <View className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100 flex-row items-center">
                        <View className="bg-emerald-100 p-2 rounded-xl"><ArrowUpIcon /></View>
                        <View className="ml-3">
                            <Text className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Total Revenue</Text>
                            <Text className="text-lg font-black text-emerald-600">₱{parseFloat(report.totalInflow).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                        </View>
                    </View>

                    {/* Operational Costs (Red) */}
                    <View className="bg-rose-50/50 p-4 rounded-3xl border border-rose-100 flex-row items-center">
                        <View className="bg-rose-100 p-2 rounded-xl"><ArrowDownIcon /></View>
                        <View className="ml-3">
                            <Text className="text-[10px] text-rose-800 font-bold uppercase tracking-wider">Operational Costs</Text>
                            <Text className="text-lg font-black text-rose-600">₱{parseFloat(report.totalOutflow).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                        </View>
                    </View>

                    {/* Net Income (Blue) */}
                    <View className="bg-indigo-50/50 p-4 rounded-3xl border border-indigo-100 flex-row items-center">
                        <View className="bg-indigo-100 p-2 rounded-xl"><ScaleIcon /></View>
                        <View className="ml-3">
                            <Text className="text-[10px] text-indigo-800 font-bold uppercase tracking-wider">Net Income</Text>
                            <Text className={`text-lg font-black ${report.netPosition >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                                ₱{parseFloat(report.netPosition).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* 4. CHART SECTION */}
                <View className="mt-10">
                    <Text className="text-sm font-bold text-gray-800 mb-6">Breakdown of Revenue</Text>
                    
                    {hasData ? (
                        <View className="items-center">
                            <BarChart
                                data={barData}
                                barWidth={22}
                                initialSpacing={10}
                                spacing={20}
                                hideRules
                                noOfSections={4}
                                yAxisThickness={0}
                                xAxisThickness={0}
                                yAxisTextStyle={{ color: '#94a3b8', fontSize: 10 }}
                                isAnimated
                                animationDuration={600}
                                frontColor="#9333ea"
                            />
                        </View>
                    ) : (
                        <View className="h-48 items-center justify-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                            <ChartIcon />
                            <Text className="text-gray-400 font-bold mt-3 text-xs">No revenue data for this period</Text>
                        </View>
                    )}
                </View>

                {/* 5. ANALYST SUMMARY */}
                <AdminFinancialAnalysis report={report} />

            </View>
        </View>
    );
};

export default memo(AdminReportChartWidget);