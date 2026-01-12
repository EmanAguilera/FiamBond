import React, { memo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { AdminUserRow } from '../Users/AdminUserRow'; 

// Removed TypeScript interfaces and type annotations to make this a valid JavaScript file.
// If you want type checking, consider renaming the file to .tsx and ensuring your project supports TypeScript.

const EntityManagementWidget = ({ users = [], onTogglePremium }) => {
    return (
        <View className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
            {/* --- HEADER (STICKY-LIKE) --- */}
            <View className="px-5 py-4 bg-indigo-50 border-b border-indigo-100">
                <Text className="text-indigo-800 text-xs font-bold leading-4">
                    Manage "Company Dashboard" access for users.
                </Text>
            </View>

            {/* --- SCROLLABLE LIST --- */}
            <ScrollView 
                className="max-h-[500px]" 
                showsVerticalScrollIndicator={false}
            >
                {users.map(u => (
                    <AdminUserRow 
                        key={u.id} 
                        user={u}
                        badge={
                            <View className="flex-row items-center gap-x-2">
                                {u.role === 'admin' ? (
                                    <View className="bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                                        <Text className="text-purple-700 text-[8px] font-black uppercase">Admin</Text>
                                    </View>
                                ) : u.is_premium ? (
                                    <View className="bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                                        <Text className="text-amber-700 text-[8px] font-black uppercase">Company</Text>
                                    </View>
                                ) : null}
                            </View>
                        }
                        rightContent={
                            <TouchableOpacity 
                                // --- PRESERVED LOGIC ---
                                onPress={() => onTogglePremium(u.id, u.is_premium)}
                                // -----------------------
                                disabled={u.role === 'admin'} 
                                activeOpacity={0.7}
                                className={`px-4 py-2 rounded-xl border shadow-sm ${
                                    u.is_premium 
                                    ? 'bg-white border-rose-200' 
                                    : 'bg-indigo-600 border-indigo-600'
                                } ${u.role === 'admin' ? 'opacity-30' : ''}`}
                            >
                                <Text className={`text-[10px] font-black uppercase ${
                                    u.is_premium ? 'text-rose-600' : 'text-white'
                                }`}>
                                    {u.role === 'admin' ? 'Super User' : (u.is_premium ? 'Revoke Company' : 'Grant Company')}
                                </Text>
                            </TouchableOpacity>
                        }
                    />
                ))}
                
                {/* Footer Padding */}
                <View className="h-10" />
            </ScrollView>
        </View>
    );
};

export default memo(EntityManagementWidget);