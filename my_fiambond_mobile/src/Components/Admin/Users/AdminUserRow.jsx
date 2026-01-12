import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

// Removed TypeScript interfaces to make this a valid JavaScript file.
// If you want type checking, consider renaming the file to .tsx and ensuring your project supports TypeScript.

export const AdminUserRow = memo(({ user, badge, rightContent, onTogglePremium }) => { 
    const initials = (user.full_name || user.first_name || "?").substring(0, 2).toUpperCase();
    const isAdmin = user.role === 'admin';
    const isPremium = user.is_premium;
    
    // CHECK PENDING STATUS
    const isPending = user.subscription_status === 'pending_approval';

    const renderAction = () => {
        if (rightContent) return rightContent; // For Revenue View
        if (isAdmin) return <Text className="text-[10px] font-black text-slate-400 uppercase">Super User</Text>;

        // --- APPROVE BUTTON ---
        if (isPending) {
            return (
                <View className="items-end gap-y-1">
                    <View className="bg-slate-100 px-1.5 py-0.5 border border-slate-200 rounded">
                        <Text className="text-[8px] font-mono text-slate-500">Ref: {user.payment_ref || 'N/A'}</Text>
                    </View>
                    <TouchableOpacity 
                        // Call togglePremium with isApproval = true (3rd argument)
                        onPress={() => onTogglePremium && onTogglePremium(user.id, false, true)}
                        activeOpacity={0.7}
                        className="px-3 py-2 rounded-xl bg-emerald-600 shadow-sm"
                    >
                        <Text className="text-[10px] font-black text-white uppercase">Approve Payment</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        // Standard Grant/Revoke Button
        return (
            <TouchableOpacity 
                onPress={() => onTogglePremium && onTogglePremium(user.id, user.is_premium, false)}
                activeOpacity={0.7}
                className={`px-3 py-2 rounded-xl border shadow-sm ${
                    isPremium 
                    ? 'bg-white border-rose-200' 
                    : 'bg-indigo-600 border-indigo-600'
                }`}
            >
                <Text className={`text-[10px] font-black uppercase ${isPremium ? 'text-rose-600' : 'text-white'}`}>
                    {isPremium ? 'Revoke Company' : 'Grant Company'}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View className={`flex-row items-center p-4 border-b border-slate-100 bg-white ${isPending ? 'bg-amber-50/50' : ''}`}>
            
            {/* Avatar */}
            <View className={`w-10 h-10 rounded-full items-center justify-center border-2 ${
                isAdmin ? 'bg-purple-100 border-purple-200' : 
                isPremium ? 'bg-amber-100 border-amber-200' : 
                isPending ? 'bg-yellow-100 border-yellow-300' : 
                'bg-slate-100 border-slate-200'
            }`}>
                <Text className={`text-xs font-bold ${
                    isAdmin ? 'text-purple-700' : 
                    isPremium ? 'text-amber-600' : 
                    isPending ? 'text-yellow-700' : 
                    'text-slate-600'
                }`}>
                    {initials}
                </Text>
            </View>

            {/* User Info */}
            <View className="ml-4 flex-1">
                <Text className="font-bold text-slate-800 text-sm" numberOfLines={1}>
                    {user.full_name || user.first_name}
                </Text>
                <View className="flex-row items-center flex-wrap gap-2 mt-0.5">
                    <Text className="text-xs text-slate-400" numberOfLines={1}>
                        {user.email}
                    </Text>
                    
                    {/* Role Badges */}
                    {isAdmin && (
                        <View className="bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                            <Text className="text-purple-700 text-[8px] font-black uppercase">Admin</Text>
                        </View>
                    )}
                    {isPremium && (
                        <View className="bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                            <Text className="text-amber-700 text-[8px] font-black uppercase">Company</Text>
                        </View>
                    )}
                    {isPending && (
                        <View className="bg-yellow-100 px-2 py-0.5 rounded-full border border-yellow-200">
                            <Text className="text-yellow-700 text-[8px] font-black uppercase italic">Pending Review</Text>
                        </View>
                    )}
                    {badge}
                </View>
            </View>

            {/* Right Side Action Area */}
            <View className="ml-2 items-end">
                {renderAction()}
            </View>
        </View>
    );
});