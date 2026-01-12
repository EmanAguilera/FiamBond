import React, { memo } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { BarChart } from "react-native-gifted-charts";
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

// --- ICONS (Converted to React Native Svg) ---
const ArrowUpIcon = () => (
    <Svg className="w-5 h-5" fill="none" stroke="#10b981" strokeWidth="2.5" viewBox="0 0 24 24">
        <Path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </Svg>
);

const ArrowDownIcon = () => (
    <Svg className="w-5 h-5" fill="none" stroke="#f43f5e" strokeWidth="2.5" viewBox="0 0 24 24">
        <Path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </Svg>
);

const ScaleIcon = () => (
    <Svg className="w-5 h-5" fill="none" stroke="#475569" strokeWidth="2" viewBox="0 0 24 24">
        <Path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </Svg>
);

const ChartIcon = () => (
    <Svg className="w-12 h-12" fill="none" stroke="#d1d5db" strokeWidth="2" viewBox="0 0 24 24">
        <Path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <Path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
    </Svg>
);

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
        <View className="mt-8 border-t border-slate-100 pt-6">
            <Text className="text-lg font-bold text-gray-800">Financial Analysis</Text>
            <View className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <Text className="font-bold text-slate-800 text-sm">{title}</Text>
                <Text className="mt-1 text-xs text-gray-600 leading-4">{narrative}</Text>
                <Text className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Strategic Advice:</Text>
                <Text className="mt-1 text-xs text-gray-700 leading-4 font-medium">{recommendation}</Text>
            </View>
        </View>
    );
};

// --- DATA TRANSFORMER FOR GIFTED CHARTS ---
const transformCompanyData = (chartData) => {
    if (!chartData || !chartData.labels) return [];
    
    const barData = [];
    const labels = chartData.labels;
    const revenueData = chartData.datasets[0]?.data || [];
    const expenseData = chartData.datasets[1]?.data || [];

    labels.forEach((label, index) => {
        // Revenue Bar (Indigo)
        barData.push({
            value: revenueData[index] || 0,
            label: label,
            spacing: 2,
            labelWidth: 30,
            labelTextStyle: { color: '#94a3b8', fontSize: 9 },
            frontColor: '#6366f1', // indigo-500
        });
        // Expense Bar (Rose)
        barData.push({
            value: expenseData[index] || 0,
            frontColor: '#f43f5e', // rose-500
        });
    });
    
    return barData;
};

// --- MAIN CHART WIDGET ---
function CompanyReportChartWidget({ report }) {
    if (!report) {
        return (
            <View className="bg-white rounded-3xl p-10 items-center justify-center border border-slate-200 shadow-sm">
                <Text className="text-gray-500 italic text-sm">No financial data available.</Text>
            </View>
        );
    }

    const hasChartData = report.chartData?.datasets?.length > 0 && report.chartData?.labels?.length > 0;
    const barData = transformCompanyData(report.chartData);

    return (
        <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <View>
                <Text className="text-xl font-bold text-gray-800">Company Financial Overview</Text>
                <Text className="text-xs text-gray-400 mt-1">{report.reportTitle}</Text>
            </View>
            
            {/* --- STAT CARDS --- */}
            <View className="gap-3 mt-6">
                {/* Revenue Card */}
                <View className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex-row items-center">
                    <View className="bg-emerald-100 p-2 rounded-xl">
                        <ArrowUpIcon />
                    </View>
                    <View className="ml-3">
                        <Text className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Total Revenue</Text>
                        <Text className="text-lg font-bold text-emerald-600">
                            ₱{parseFloat(report.totalInflow).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Text>
                    </View>
                </View>

                {/* Expenses Card */}
                <View className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 flex-row items-center">
                    <View className="bg-rose-100 p-2 rounded-xl">
                        <ArrowDownIcon />
                    </View>
                    <View className="ml-3">
                        <Text className="text-[10px] text-rose-800 font-bold uppercase tracking-wider">Total Expenses</Text>
                        <Text className="text-lg font-bold text-rose-600">
                            ₱{parseFloat(report.totalOutflow).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Text>
                    </View>
                </View>

                {/* Profit/Loss Card */}
                <View className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 flex-row items-center">
                    <View className="bg-slate-100 p-2 rounded-xl">
                        <ScaleIcon />
                    </View>
                    <View className="ml-3">
                        <Text className="text-[10px] text-slate-800 font-bold uppercase tracking-wider">Net Profit/Loss</Text>
                        <Text className={`text-lg font-bold ${report.netPosition >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                            ₱{parseFloat(report.netPosition).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Text>
                    </View>
                </View>
            </View>

            {/* --- CHART SECTION --- */}
            <View className="mt-8">
                <Text className="text-sm font-bold text-gray-800 mb-6">Revenue vs. Expenses Breakdown</Text>
                
                {hasChartData ? (
                    <View className="items-center">
                        <BarChart
                            data={barData}
                            barWidth={16}
                            initialSpacing={10}
                            spacing={14}
                            hideRules
                            noOfSections={4}
                            yAxisThickness={0}
                            xAxisThickness={0}
                            yAxisTextStyle={{ color: '#94a3b8', fontSize: 10 }}
                            isAnimated
                            animationDuration={600}
                        />
                        {/* Legend */}
                        <View className="flex-row justify-center mt-6 gap-6">
                            <View className="flex-row items-center">
                                <View className="w-3 h-3 rounded-full bg-indigo-500 mr-2" />
                                <Text className="text-[10px] text-gray-500 font-bold uppercase">Revenue</Text>
                            </View>
                            <View className="flex-row items-center">
                                <View className="w-3 h-3 rounded-full bg-rose-500 mr-2" />
                                <Text className="text-[10px] text-gray-500 font-bold uppercase">Expenses</Text>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View className="h-48 items-center justify-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <ChartIcon />
                        <Text className="text-gray-500 font-bold mt-3 text-xs">Insufficient Data</Text>
                        <Text className="text-[10px] text-gray-400">Record transactions to visualize performance.</Text>
                    </View>
                )}
            </View>

            {/* --- ANALYSIS --- */}
            <CompanyFinancialAnalysis report={report} />
        </View>
    );
};

export default memo(CompanyReportChartWidget);