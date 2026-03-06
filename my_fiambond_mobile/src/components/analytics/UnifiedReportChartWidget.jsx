'use client';

import React, { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { BarChart } from "react-native-gifted-charts"; 
import { ArrowUp, ArrowDown, Scale } from 'lucide-react-native';

// 🏎️ Import your unified loader
import UnifiedLoadingWidget from '../../components/ui/UnifiedLoadingWidget';

// --- REUSABLE STAT CARD (MATCHES NEXT.JS FACE VALUE) ---
const StatCard = ({ label, value, colorClass, icon: Icon, iconColor, textColor }) => (
    <View className={`p-4 rounded-xl border flex-row items-center mb-3 ${colorClass}`}>
        <View className="p-2 rounded-lg bg-white/50">
            <Icon size={20} color={iconColor} />
        </View>
        <View className="ml-3 flex-1">
            <p className={`text-[10px] font-bold opacity-70 uppercase tracking-wider ${textColor}`}>{label}</p>
            <p className={`text-xl font-black ${textColor}`}>
                ₱{parseFloat(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
        </View>
    </View>
);

// --- DYNAMIC ANALYST SUMMARY (RESTORED FULL LOGIC) ---
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
        <View className="mt-8 border-t border-slate-100 pt-6">
            <Text className="text-lg font-bold text-slate-800">Financial Analysis Summary</Text>
            <View className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <Text className="font-bold text-slate-800 text-sm">{config.title}</Text>
                <Text className="mt-1 text-xs text-slate-600 leading-4">{config.narrative}</Text>
                
                <View className="mt-3 pt-3 border-t border-slate-200/50">
                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Strategic Advice:</Text>
                    <Text className="mt-1 text-xs text-slate-700 font-medium italic">{config.recommendation}</Text>
                </View>
            </View>
        </View>
    );
};

// --- CHART LEGEND ---
const ChartLegend = () => (
    <View className="flex-row justify-center gap-4 mb-4">
        <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-sm bg-[#99f6e4] mr-2" />
            <Text className="text-[10px] text-slate-500 font-bold">Inflow (₱)</Text>
        </View>
        <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-sm bg-[#fecdd3] mr-2" />
            <Text className="text-[10px] text-slate-500 font-bold">Outflow (₱)</Text>
        </View>
    </View>
);

// --- MAIN WIDGET ---
function UnifiedReportChartWidget({ report, realm, period, setPeriod }) {
    
    // ⭐️ DATA CONVERSION: Grouping Inflow and Outflow side-by-side
    const groupedData = useMemo(() => {
        if (!report?.chartData?.labels) return [];
        
        const data = [];
        const labels = report.chartData.labels;
        const inflowData = report.chartData.datasets[0]?.data || [];
        const outflowData = report.chartData.datasets[1]?.data || [];

        labels.forEach((label, index) => {
            // Pair 1: Inflow (Teal)
            data.push({
                value: inflowData[index] || 0,
                label: label.substring(0, 5), // Short date (MM/DD)
                spacing: 2,
                frontColor: '#99f6e4', // Teal-200
            });
            // Pair 2: Outflow (Pink)
            data.push({
                value: outflowData[index] || 0,
                frontColor: '#fecdd3', // Rose-200
            });
        });
        return data;
    }, [report]);

    if (!report) return (
        <View className="bg-white rounded-3xl p-6 min-h-[300px]">
             <UnifiedLoadingWidget 
                type="section" 
                message={`Calculating ${realm} insights...`} 
                variant="indigo" 
             />
        </View>
    );

    const labels = {
        inflow: realm === 'admin' ? "Total Revenue" : (realm === 'company' ? "Total Revenue" : "Total Inflow"),
        outflow: realm === 'admin' ? "Operational Costs" : (realm === 'company' ? "Total Expenses" : "Total Outflow")
    };

    return (
        <View className="mb-10">
            {/* Period Selector */}
            {setPeriod && (
                <View className="flex-row self-center bg-slate-100 p-1 rounded-xl mb-6">
                    {['weekly', 'monthly', 'yearly'].map((p) => (
                        <TouchableOpacity
                            key={p}
                            onPress={() => setPeriod(p)}
                            className={`px-4 py-1.5 rounded-lg ${period === p ? 'bg-white shadow-sm' : ''}`}
                        >
                            <Text className={`text-xs font-bold capitalize ${period === p ? 'text-slate-800' : 'text-slate-400'}`}>
                                {p}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Dashboard Container (Visual Match to Next.js) */}
            <View className="bg-white rounded-[32px] p-5 shadow-sm border border-slate-100">
                <View className="mb-6">
                    <Text className="text-xl font-bold text-slate-800 capitalize">{realm} Financial Overview</Text>
                    <Text className="text-xs text-slate-400">{report.reportTitle}</Text>
                </View>

                {/* Stat Cards Grid (Matching the Background Tints) */}
                <View className="flex-col">
                    <StatCard 
                        label={labels.inflow} 
                        value={report.totalInflow} 
                        icon={ArrowUp} 
                        iconColor="#059669" 
                        colorClass="bg-emerald-50 border-emerald-100" 
                        textColor="text-emerald-700"
                    />
                    <StatCard 
                        label={labels.outflow} 
                        value={report.totalOutflow} 
                        icon={ArrowDown} 
                        iconColor="#e11d48" 
                        colorClass="bg-rose-50 border-rose-100" 
                        textColor="text-rose-700"
                    />
                    <StatCard 
                        label="Net Position" 
                        value={report.netPosition} 
                        icon={Scale} 
                        iconColor="#4f46e5" 
                        colorClass="bg-indigo-50 border-indigo-100" 
                        textColor="text-indigo-700"
                    />
                </View>

                {/* Chart Section */}
                <View className="mt-8">
                    <Text className="text-base font-bold text-slate-800 mb-4">Visual Performance</Text>
                    <ChartLegend />
                    
                    <View className="items-center ml-[-20]">
                        <BarChart
                            data={groupedData}
                            barWidth={14}
                            initialSpacing={10}
                            spacing={18}
                            hideRules
                            xAxisThickness={1}
                            xAxisColor={'#e2e8f0'}
                            yAxisThickness={0}
                            yAxisTextStyle={{color: '#94a3b8', fontSize: 9}}
                            xAxisLabelTextStyle={{color: '#64748b', fontSize: 9, width: 40}}
                            noOfSections={4}
                            height={200}
                            width={Dimensions.get('window').width - 80}
                            isAnimated
                        />
                    </View>
                </View>

                {/* Restored Analysis Summary */}
                <UnifiedAnalysis report={report} realm={realm} />
            </View>
        </View>
    );
}

export default memo(UnifiedReportChartWidget);