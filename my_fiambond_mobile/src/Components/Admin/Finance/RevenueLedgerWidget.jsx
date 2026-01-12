import React, { memo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { AdminUserRow } from '../Users/AdminUserRow.tsx'; 

// Removed TypeScript interface to make this a valid JavaScript file.
// If you want type checking, consider renaming the file to .tsx and ensuring your project supports TypeScript.

const RevenueLedgerWidget = ({ premiums = [], users = [], currentAdminId }) => {

    const getAllTransactions = () => {
        // Build the ledger from the premiums collection (History)
        return premiums
            .filter(p => p.user_id !== currentAdminId) // Exclude admin's own tests
            .map(p => {
                // Find the user object associated with this premium record
                const userData = users.find(u => u.id === p.user_id) || { 
                    full_name: "Unknown User", 
                    email: "deleted@user.com" 
                };

                const dateVal = p.granted_at;
                const dateStr = dateVal?.seconds 
                    ? new Date(dateVal.seconds * 1000).toLocaleDateString() 
                    : 'Unknown Date';

                return {
                    uniqueId: p.id,
                    user: userData,
                    type: (p.access_type || 'COMPANY').toUpperCase(),
                    plan: (p.plan_cycle || 'MONTHLY').toUpperCase(),
                    price: p.amount || 0,
                    date: dateStr,
                    // Colors and Themes
                    color: p.access_type === 'family' ? 'text-indigo-600' : 'text-emerald-600',
                    badgeTheme: p.access_type === 'family' ? 'blue' : 'emerald',
                    timestamp: dateVal?.seconds || 0
                };
            })
            // Sort by most recent transaction first
            .sort((a, b) => b.timestamp - a.timestamp);
    };

    const transactions = getAllTransactions();

    return (
        <View className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
            <ScrollView 
                className="max-h-[500px]" 
                showsVerticalScrollIndicator={false}
            >
                {transactions.length > 0 ? (
                    <View>
                        {transactions.map(item => (
                            <AdminUserRow 
                                key={item.uniqueId} 
                                user={item.user}
                                // Overriding rightContent to show price and meta
                                rightContent={
                                    <View className="items-end min-w-[110px]">
                                        <Text className={`font-black text-lg tracking-tighter ${item.color}`}>
                                            + ₱{item.price.toLocaleString()}
                                        </Text>
                                        <View className="flex-row items-center gap-x-2 mt-1">
                                            <View className={`px-2 py-0.5 rounded-full border ${
                                                item.badgeTheme === 'emerald' 
                                                ? 'bg-emerald-50 border-emerald-100' 
                                                : 'bg-indigo-50 border-indigo-100'
                                            }`}>
                                                <Text className={`text-[8px] font-black uppercase ${
                                                    item.badgeTheme === 'emerald' ? 'text-emerald-700' : 'text-indigo-700'
                                                }`}>
                                                    {item.type} • {item.plan}
                                                </Text>
                                            </View>
                                            <Text className="text-[9px] text-slate-400 font-bold uppercase">
                                                {item.date}
                                            </Text>
                                        </View>
                                    </View>
                                }
                            />
                        ))}
                    </View>
                ) : (
                    <View className="p-20 items-center justify-center">
                        <Text className="text-slate-400 italic text-sm text-center">
                            No revenue transactions recorded yet.
                        </Text>
                    </View>
                )}
                
                {/* Scroll Bottom Padding */}
                <View className="h-10" />
            </ScrollView>
        </View>
    );
};

export default memo(RevenueLedgerWidget);