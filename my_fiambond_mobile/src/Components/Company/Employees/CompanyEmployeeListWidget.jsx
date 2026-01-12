import React, { memo } from 'react';
import { View, Text, ScrollView } from 'react-native';

// --- INTERNAL COMPONENT: Employee Row ---
const EmployeeRow = ({ member }) => {
    // Preserved initials logic
    const initials = (member.full_name || member.first_name || "U").substring(0, 2).toUpperCase();
    
    return (
        <View className="flex-row items-center justify-between p-4 border-b border-slate-100 bg-white">
            <View className="flex-row items-center gap-x-3 flex-1">
                {/* Avatar / Initials */}
                <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center border border-indigo-200">
                    <Text className="text-xs font-bold text-indigo-600">{initials}</Text>
                </View>

                {/* Details */}
                <View className="flex-1">
                    <Text 
                        className="text-sm font-bold text-slate-700" 
                        numberOfLines={1}
                    >
                        {member.full_name || member.first_name || "Unknown User"}
                    </Text>
                    <Text 
                        className="text-[10px] text-slate-400" 
                        numberOfLines={1}
                    >
                        {member.email}
                    </Text>
                </View>
            </View>

            {/* Status Badge */}
            <View className="bg-indigo-50 px-2 py-1 rounded border border-indigo-100 ml-2">
                <Text className="text-[10px] font-bold text-indigo-600 uppercase">
                    Active
                </Text>
            </View>
        </View>
    );
};

// --- MAIN WIDGET ---
const CompanyEmployeeListWidget = ({ members }) => {
    return (
        <View className="bg-white rounded-3xl overflow-hidden border border-slate-100">
            {/* Sticky-style Header Container */}
            <View className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    Employee Details
                </Text>
            </View>
            
            {/* Scrollable List Area (Limited to roughly 50vh height equivalent) */}
            <ScrollView 
                className="max-h-[400px]" 
                showsVerticalScrollIndicator={false}
            >
                {members && members.length > 0 ? (
                    members.map(member => (
                        <EmployeeRow key={member.id} member={member} />
                    ))
                ) : (
                    <View className="p-12 items-center justify-center">
                        <Text className="text-slate-400 text-sm italic text-center">
                            No employees found in this realm.
                        </Text>
                    </View>
                )}
                
                {/* Bottom padding to ensure last item is fully visible */}
                <View className="h-4" />
            </ScrollView>
        </View>
    );
};

export default memo(CompanyEmployeeListWidget);