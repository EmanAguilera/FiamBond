import React, { memo } from 'react';
import { View, Text, Dimensions } from 'react-native';
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

// --- FINANCIAL ANALYSIS SUB-COMPONENT ---
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
        <View className="mt-8">
            <Text className="text-lg font-bold text-gray-800">Analyst's Summary</Text>
            <View className="mt-2 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <Text className="font-bold text-gray-800 text-sm">{title}</Text>
                <Text className="mt-1 text-xs text-gray-600 leading-4">{narrative}</Text>
                <Text className="mt-3 text-xs font-bold text-gray-800">Next Steps:</Text>
                <Text className="mt-1 text-xs text-gray-600 leading-4">{recommendation}</Text>
            </View>
        </View>
    );
};

// --- DATA TRANSFORMER FOR GIFTED CHARTS ---
const transformData = (chartData) => {
    if (!chartData || !chartData.labels) return [];
    
    const barData = [];
    const labels = chartData.labels;
    const inflowData = chartData.datasets[0]?.data || [];
    const outflowData = chartData.datasets[1]?.data || [];

    labels.forEach((label, index) => {
        // Inflow Bar
        barData.push({
            value: inflowData[index] || 0,
            label: label,
            spacing: 2,
            labelWidth: 30,
            labelTextStyle: { color: 'gray', fontSize: 10 },
            frontColor: '#10b981', // green-500
        });
        // Outflow Bar
        barData.push({
            value: outflowData[index] || 0,
            frontColor: '#f43f5e', // rose-500
        });
    });
    
    return barData;
};

function PersonalReportChartWidget({ report }) {
    if (!report) {
        return (
            <View className="bg-white rounded-3xl p-10 items-center justify-center border border-gray-100">
                <Text className="text-gray-400 italic text-sm">No report data available.</Text>
            </View>
        );
    }

    const hasChartData = report.chartData?.datasets?.length > 0 && report.chartData?.labels?.length > 0;
    const barData = transformData(report.chartData);

    return (
        <View className="bg-white rounded-3xl p-5 border border-gray-100">
            <View className="mb-6">
                <Text className="text-xl font-bold text-gray-800">Financial Summary</Text>
                <Text className="text-xs text-gray-400 mt-1">{report.reportTitle}</Text>
            </View>

            {/* --- STAT CARDS --- */}
            <View className="gap-3 mb-8">
                {/* Inflow Card */}
                <View className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex-row items-center">
                    <View className="bg-emerald-100 p-2 rounded-xl">
                        <ArrowUpIcon />
                    </View>
                    <View className="ml-3">
                        <Text className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Total Inflow</Text>
                        <Text className="text-lg font-bold text-emerald-600">
                            ₱{Number(report.totalInflow).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Text>
                    </View>
                </View>

                {/* Outflow Card */}
                <View className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 flex-row items-center">
                    <View className="bg-rose-100 p-2 rounded-xl">
                        <ArrowDownIcon />
                    </View>
                    <View className="ml-3">
                        <Text className="text-[10px] text-rose-800 font-bold uppercase tracking-wider">Total Outflow</Text>
                        <Text className="text-lg font-bold text-rose-600">
                            ₱{Number(report.totalOutflow).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Text>
                    </View>
                </View>

                {/* Net Position Card */}
                <View className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex-row items-center">
                    <View className="bg-blue-100 p-2 rounded-xl">
                        <ScaleIcon />
                    </View>
                    <View className="ml-3">
                        <Text className="text-[10px] text-blue-800 font-bold uppercase tracking-wider">Net Position</Text>
                        <Text className={`text-lg font-bold ${report.netPosition >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                            ₱{Number(report.netPosition).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Text>
                    </View>
                </View>
            </View>

            {/* --- CHART SECTION --- */}
            <View className="mt-4">
                <Text className="text-sm font-bold text-gray-800 mb-6">Inflow vs. Outflow Breakdown</Text>
                
                {hasChartData ? (
                    <View className="items-center">
                        <BarChart
                            data={barData}
                            barWidth={18}
                            initialSpacing={10}
                            spacing={15}
                            hideRules
                            noOfSections={4}
                            yAxisThickness={0}
                            xAxisThickness={0}
                            yAxisTextStyle={{ color: 'gray', fontSize: 10 }}
                            isAnimated
                            animationDuration={400}
                        />
                        {/* Legend */}
                        <View className="flex-row justify-center mt-6 gap-6">
                            <View className="flex-row items-center">
                                <View className="w-3 h-3 rounded-full bg-emerald-500 mr-2" />
                                <Text className="text-[10px] text-gray-500 font-bold">Inflow</Text>
                            </View>
                            <View className="flex-row items-center">
                                <View className="w-3 h-3 rounded-full bg-rose-500 mr-2" />
                                <Text className="text-[10px] text-gray-500 font-bold">Outflow</Text>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View className="h-48 items-center justify-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <ChartIcon />
                        <Text className="text-gray-500 font-bold mt-3 text-xs">Not enough data</Text>
                        <Text className="text-[10px] text-gray-400">Add more transactions to see trends.</Text>
                    </View>
                )}
            </View>

            {/* --- AI ADVISOR SECTION --- */}
            <FinancialAnalysis report={report} />
        </View>
    );
};

export default memo(PersonalReportChartWidget);