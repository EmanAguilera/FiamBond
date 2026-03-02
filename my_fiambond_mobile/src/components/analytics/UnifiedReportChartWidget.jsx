"use client";

import React, { memo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { BarChart } from "react-native-chart-kit"; // Standard for Expo
import { ArrowUp, ArrowDown, Scale, PieChart } from 'lucide-react-native';
import UnifiedLoadingWidget from '@/components/ui/UnifiedLoadingWidget';

const screenWidth = Dimensions.get("window").width;

// --- REUSABLE STAT CARD (Native Version) ---
const StatCard = ({ label, value, colorClass, icon: Icon, iconColor }) => (
    <View className={`${colorClass} p-4 rounded-2xl border flex-row items-center mb-3 sm:mb-0 sm:flex-1 sm:mx-1`}>
        <View className="p-2 rounded-xl bg-white/20">
            <Icon size={20} color={iconColor} strokeWidth={2.5} />
        </View>
        <View className="ml-3">
            <Text className="text-xs font-semibold opacity-70 uppercase tracking-wider">{label}</Text>
            <Text className="text-lg font-bold">
                ₱{parseFloat(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
        </View>
    </View>
);

// --- DYNAMIC ANALYST SUMMARY (Native Version) ---
const UnifiedAnalysis = ({ report, realm }) => {
    const { totalInflow, netPosition, transactionCount } = report;
    const netFormatted = `₱${Math.abs(netPosition || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    
    let config = { title: "", narrative: "", recommendation: "" };

    switch (realm) {
        case 'admin':
            config.title = totalInflow > 0 ? "Healthy Platform Growth" : "Revenue Stagnation Detected";
            config.narrative = `The system generated ₱${totalInflow.toLocaleString()} in subscription revenue.`;
            config.recommendation = "Focus on user retention and marketing campaigns.";
            break;
        case 'company':
            config.title = netPosition > 0 ? "Profitable Operations" : "Operational Deficit Detected";
            config.narrative = `The company generated a net position of ${netFormatted}.`;
            config.recommendation = "Conduct a thorough audit of expense entries.";
            break;
        case 'family':
            config.title = netPosition > 0 ? "Positive Family Cash Flow" : "Family Spending Review Needed";
            config.narrative = `Collective family expenses resulted in a net position of ${netFormatted}.`;
            config.recommendation = "Review transactions together to identify savings.";
            break;
        default: 
            config.title = netPosition > 0 ? "Good Financial Management" : "Spending Review Recommended";
            config.narrative = `Your net position is ${netFormatted} across ${transactionCount} transactions.`;
            config.recommendation = "Identify the cause of high outflow to stay within income.";
    }

    return (
        <View className="mt-6 pt-6 border-t border-slate-100">
            <Text className="text-lg font-bold text-slate-800">Financial Analysis Summary</Text>
            <View className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <Text className="font-bold text-slate-800">{config.title}</Text>
                <Text className="mt-1 text-sm text-slate-600 leading-5">{config.narrative}</Text>
                <Text className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategic Advice</Text>
                <Text className="mt-1 text-sm text-slate-700 font-medium italic">"{config.recommendation}"</Text>
            </View>
        </View>
    );
};

// --- MAIN WIDGET ---
function UnifiedReportChartWidget({ report, realm, period, setPeriod }) {
    
    if (!report) return (
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
             <UnifiedLoadingWidget 
                type="section" 
                message={`Calculating ${realm} insights...`} 
                variant="indigo" 
             />
        </View>
    );

    // Prepare data for react-native-chart-kit
    const chartData = {
        labels: report.chartData?.labels || ["Jan", "Feb", "Mar"],
        datasets: [
            {
                data: report.chartData?.datasets[0]?.data || [0, 0, 0],
                color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`, // Indigo
            },
            {
                data: report.chartData?.datasets[1]?.data || [0, 0, 0],
                color: (opacity = 1) => `rgba(244, 63, 94, ${opacity})`, // Rose
            }
        ],
        legend: [realm === 'admin' ? "Revenue" : "Inflow", realm === 'admin' ? "Costs" : "Outflow"]
    };

    const labels = {
        inflow: realm === 'admin' ? "Total Revenue" : (realm === 'company' ? "Total Revenue" : "Total Inflow"),
        outflow: realm === 'admin' ? "Operational Costs" : (realm === 'company' ? "Total Expenses" : "Total Outflow")
    };

    return (
        <View className="w-full">
            {/* Period Selector */}
            {setPeriod && (
                <View className="flex-row justify-center bg-slate-100 p-1 rounded-2xl mb-6 self-center">
                    {['weekly', 'monthly', 'yearly'].map((p) => (
                        <TouchableOpacity
                            key={p}
                            onPress={() => setPeriod(p)}
                            className={`px-5 py-2 rounded-xl ${
                                period === p ? 'bg-white shadow-sm' : ''
                            }`}
                        >
                            <Text className={`text-xs capitalize font-bold ${
                                period === p ? 'text-slate-800' : 'text-slate-500'
                            }`}>
                                {p}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <View className="bg-white rounded-[32px] p-5 shadow-xl shadow-slate-200 border border-slate-50">
                <View className="mb-6">
                    <Text className="text-xl font-black text-slate-900 capitalize tracking-tight">
                        {realm} Overview
                    </Text>
                    <Text className="text-xs font-medium text-slate-400">{report.reportTitle}</Text>
                </View>

                {/* Stats Grid */}
                <View className="flex-col sm:flex-row mb-6">
                    <StatCard label={labels.inflow} value={report.totalInflow} icon={ArrowUp} iconColor="#10b981" colorClass="bg-emerald-50 text-emerald-600 border-emerald-100" />
                    <StatCard label={labels.outflow} value={report.totalOutflow} icon={ArrowDown} iconColor="#f43f5e" colorClass="bg-rose-50 text-rose-600 border-rose-100" />
                    <StatCard label="Net Position" value={report.netPosition} icon={Scale} iconColor="#6366f1" colorClass="bg-slate-50 border-slate-100" />
                </View>

                {/* Chart Section */}
                <View>
                    <Text className="text-sm font-bold text-slate-800 mb-4">Visual Performance</Text>
                    <View className="items-center justify-center bg-slate-50 rounded-3xl py-4 overflow-hidden">
                        <BarChart
                            data={chartData}
                            width={screenWidth - 80}
                            height={220}
                            yAxisLabel="₱"
                            yAxisSuffix=""
                            chartConfig={{
                                backgroundColor: "#f8fafc",
                                backgroundGradientFrom: "#f8fafc",
                                backgroundGradientTo: "#f8fafc",
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                                style: { borderRadius: 16 },
                                barPercentage: 0.6,
                            }}
                            verticalLabelRotation={0}
                            fromZero
                            showValuesOnTopOfBars
                        />
                    </View>
                </View>

                <UnifiedAnalysis report={report} realm={realm} />
            </View>
        </View>
    );
}

export default memo(UnifiedReportChartWidget);