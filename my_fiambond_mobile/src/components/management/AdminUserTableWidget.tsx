'use client';

import React, { memo, useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import UnifiedLoadingWidget from "@/components/ui/UnifiedLoadingWidget";

// --- CONFIGURATION ---
const TEST_MODE = false; 

// --- 1. LIGHTWEIGHT HELPERS ---
const parseDate = (d: any) => d?.seconds ? new Date(d.seconds * 1000) : (d ? new Date(d) : null);

const getExpiry = (startRaw: any, plan: string) => {
    const start = parseDate(startRaw);
    if (!start || isNaN(start.getTime())) return null;
    const end = new Date(start);
    if (TEST_MODE) {
        plan === 'yearly' ? end.setMinutes(end.getMinutes() + 5) : end.setMinutes(end.getMinutes() + 1);
    } else {
        plan === 'yearly' ? end.setFullYear(end.getFullYear() + 1) : end.setMonth(end.getMonth() + 1);
    }
    return end;
};

// --- 2. SUBSCRIPTION TICKER ---
const SubscriptionTicker = ({ label, type, user, onRevoke }: any) => {
    const isPremium = type === 'company' ? user.is_premium : user.is_family_premium;
    const grantedAt = type === 'company' ? user.premium_granted_at : user.family_premium_granted_at;
    const plan = type === 'company' ? user.premium_plan : user.family_premium_plan;
    
    const endDate = getExpiry(grantedAt, plan || 'monthly');
    const startDate = parseDate(grantedAt);
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (!isPremium || !endDate) return;
        const interval = setInterval(() => {
            const diff = endDate.getTime() - new Date().getTime();
            if (diff <= 0) {
                setTimeLeft("EXPIRED");
                onRevoke(user.id, 'revoke', type);
                clearInterval(interval);
            } else {
                const mins = Math.floor((diff % 3600000) / 60000);
                const secs = Math.floor((diff % 60000) / 1000);
                const days = Math.floor(diff / 86400000);
                setTimeLeft(days > 0 ? `${days}d left` : `${mins}m ${secs}s`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [endDate, isPremium, user.id, type]);

    if (!isPremium || !startDate) return null;

    return (
        <View className={`mt-2 p-2 rounded-xl border flex-col ${type === 'company' ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100'}`}>
            <View className="flex-row justify-between items-center border-b border-black/5 pb-1 mb-1">
                <Text className={`text-[9px] font-black uppercase tracking-widest ${type === 'company' ? 'text-emerald-700' : 'text-blue-700'}`}>{label}</Text>
                <Text className={`font-mono text-[10px] ${timeLeft === 'EXPIRED' ? 'text-red-600 font-bold' : 'text-slate-700'}`}>{timeLeft}</Text>
            </View>
            <View className="flex-row justify-between">
                <View>
                    <Text className="text-slate-400 text-[8px] uppercase font-black">Start</Text>
                    <Text className="font-mono text-[10px] text-slate-600">{startDate.toLocaleDateString()}</Text>
                </View>
                <View className="items-end">
                    <Text className="text-slate-400 text-[8px] uppercase font-black">Expiry</Text>
                    <Text className="font-mono text-[10px] text-slate-600">{endDate?.toLocaleDateString()}</Text>
                </View>
            </View>
        </View>
    );
};

// --- 3. ROW COMPONENT ---
const AdminUserRow = memo(({ user, onTogglePremium }: any) => {
    const initials = (user.full_name || user.first_name || "?").substring(0, 2).toUpperCase();
    const isAdmin = user.role === 'admin';
    const isCoPre = user.is_premium;
    const isFaPre = user.is_family_premium;
    const isPending = user.subscription_status === 'pending_approval' || user.family_subscription_status === 'pending_approval';

    const borderClass = isAdmin ? "border-purple-500 bg-purple-50" : 
                        isPending ? "border-amber-500 bg-amber-50" : 
                        (isCoPre || isFaPre) ? "border-emerald-500 bg-white" : "border-transparent bg-white";

    return (
        <View className={`flex-col p-4 border-b border-gray-100 border-l-[4px] ${borderClass}`}>
            <View className="flex-row items-start justify-between">
                <View className="flex-row flex-1">
                    <View className={`w-12 h-12 rounded-2xl items-center justify-center shadow-sm 
                        ${isAdmin ? 'bg-purple-100' : isPending ? 'bg-amber-100' : (isCoPre || isFaPre) ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                        <Text className={`font-black text-lg ${isAdmin ? 'text-purple-700' : isPending ? 'text-amber-600' : (isCoPre || isFaPre) ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {initials}
                        </Text>
                    </View>
                    <View className="ml-4 flex-1">
                        <View className="flex-row items-center">
                            <Text className="font-black text-slate-800 text-sm mr-2">{user.full_name || "Unknown"}</Text>
                            {isAdmin && <View className="bg-purple-100 px-2 py-0.5 rounded-full"><Text className="text-purple-700 text-[8px] font-black uppercase">Admin</Text></View>}
                        </View>
                        <Text className="text-xs text-slate-500 font-medium">{user.email}</Text>
                    </View>
                </View>

                {/* Mobile Action Buttons Column */}
                <View className="ml-2 gap-y-2">
                    {isPending ? (
                        <TouchableOpacity 
                            onPress={() => onTogglePremium(user.id, 'approve', user.subscription_status === 'pending_approval' ? 'company' : 'family')}
                            className="bg-emerald-600 px-3 py-2 rounded-lg shadow-sm"
                        >
                            <Text className="text-white text-[9px] font-black uppercase">Approve</Text>
                        </TouchableOpacity>
                    ) : !isAdmin && (
                        <>
                            <TouchableOpacity 
                                onPress={() => onTogglePremium(user.id, isCoPre ? 'revoke' : 'grant', 'company')}
                                className={`px-2 py-1.5 rounded-lg border items-center w-20 ${isCoPre ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'}`}
                            >
                                <Text className={`text-[8px] font-black uppercase ${isCoPre ? 'text-rose-500' : 'text-slate-400'}`}>
                                    {isCoPre ? 'Revoke Co.' : '+ Grant Co.'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => onTogglePremium(user.id, isFaPre ? 'revoke' : 'grant', 'family')}
                                className={`px-2 py-1.5 rounded-lg border items-center w-20 ${isFaPre ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'}`}
                            >
                                <Text className={`text-[8px] font-black uppercase ${isFaPre ? 'text-blue-500' : 'text-slate-400'}`}>
                                    {isFaPre ? 'Revoke Fam.' : '+ Grant Fam.'}
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>

            {/* Tickers span full width below info on mobile */}
            <View className="mt-2">
                <SubscriptionTicker label="Company Access" type="company" user={user} onRevoke={onTogglePremium} />
                <SubscriptionTicker label="Family Access" type="family" user={user} onRevoke={onTogglePremium} />
                {isPending && (
                    <View className="mt-2 bg-amber-100 p-2 rounded-lg border border-amber-200 items-center">
                        <Text className="text-[9px] font-black uppercase text-amber-600 tracking-widest">Pending Review</Text>
                    </View>
                )}
            </View>
        </View>
    );
});

// --- 4. MAIN WIDGET ---
const AdminUserTableWidget = ({ users = [], onTogglePremium, headerText, loading = false }: any) => {
    const sorted = useMemo(() => {
        return [...users].sort((a: any, b: any) => {
            const aP = a.subscription_status === 'pending_approval' || a.family_subscription_status === 'pending_approval' ? 1 : 0;
            const bP = b.subscription_status === 'pending_approval' || b.family_subscription_status === 'pending_approval' ? 1 : 0;
            return bP - aP;
        });
    }, [users]);

    if (loading) return <UnifiedLoadingWidget type="section" message="Fetching user data..." />;

    return (
        <View className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex-1 mb-6">
            <View className="px-5 py-4 bg-slate-50 border-b border-slate-100">
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    {headerText || "Entity Access Management"}
                </Text>
            </View>
            
            <FlatList 
                data={sorted}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <AdminUserRow user={item} onTogglePremium={onTogglePremium} />}
                ListEmptyComponent={
                    <View className="p-12 items-center">
                        <Text className="text-slate-400 text-xs italic">No users available for review.</Text>
                    </View>
                }
                contentContainerStyle={{ paddingBottom: 20 }}
            />
        </View>
    );
};

export default memo(AdminUserTableWidget);