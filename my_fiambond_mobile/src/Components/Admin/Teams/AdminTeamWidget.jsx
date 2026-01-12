import React, { memo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { AdminUserRow } from '../Users/AdminUserRow.tsx';

// Removed TypeScript interfaces to make this a valid JavaScript file.
// If you want type checking, consider renaming the file to .tsx and ensuring your project supports TypeScript.

const AdminTeamWidget = ({ users = [] }) => {
    return (
        <View className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
            {/* --- STICKY HEADER --- */}
            <View className="px-5 py-4 bg-purple-50 border-b border-purple-100">
                <Text className="text-purple-800 text-xs font-bold uppercase tracking-widest">
                    Current System Administrators
                </Text>
            </View>
            
            {/* --- SCROLLABLE LIST --- */}
            <ScrollView 
                className="max-h-[500px]" 
                showsVerticalScrollIndicator={false}
            >
                {users.length > 0 ? (
                    users.map(u => (
                        <AdminUserRow 
                            key={u.id} 
                            user={u}
                            badge={
                                <View className="bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                                    <Text className="text-purple-700 text-[8px] font-black uppercase">
                                        Admin
                                    </Text>
                                </View>
                            }
                            rightContent={
                                <View className="bg-purple-50 px-3 py-1 rounded-lg border border-purple-100">
                                    <Text className="text-[10px] font-black text-purple-600 uppercase">
                                        Active
                                    </Text>
                                </View>
                            }
                        />
                    ))
                ) : (
                    <View className="p-20 items-center justify-center">
                        <Text className="text-slate-400 italic text-sm text-center">
                            No administrators found in the team.
                        </Text>
                    </View>
                )}

                {/* Footer Padding */}
                <View className="h-10" />
            </ScrollView>
        </View>
    );
};

export default memo(AdminTeamWidget);