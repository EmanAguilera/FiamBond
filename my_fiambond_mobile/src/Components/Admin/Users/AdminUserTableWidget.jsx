import React, { memo, useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ScrollView, 
    Alert, 
    ActivityIndicator 
} from 'react-native';
import { Check, Clock, ShieldAlert, UserCheck, XCircle } from "lucide-react-native";

// --- CONFIGURATION ---
const TEST_MODE = false; 

// --- HELPER: ROBUST DATE PARSER ---
const parseDate = (dateVal) => {
    if (!dateVal) return null;
    if (dateVal.seconds) return new Date(dateVal.seconds * 1000);
    return new Date(dateVal);
};

// --- HELPER: CALCULATE EXPIRY ---
const getExpirationDetails = (rawDate, plan) => {
    const start = parseDate(rawDate);
    if (!start || isNaN(start.getTime())) return null;
    const end = new Date(start);

    if (TEST_MODE) {
        if (plan === 'yearly') end.setMinutes(end.getMinutes() + 5);
        else end.setMinutes(end.getMinutes() + 1);
    } else {
        if (plan === 'yearly') end.setFullYear(end.getFullYear() + 1);
        else end.setMonth(end.getMonth() + 1);
    }
    return end;
};

// --- COMPONENT: REAL-TIME SUBSCRIPTION TICKER ---
const SubscriptionTicker = ({ label, type, user, onRevoke }) => {
    const isPremium = type === 'company' ? user.is_premium : user.is_family_premium;
    const grantedAt = type === 'company' ? user.premium_granted_at : user.family_premium_granted_at;
    const plan = type === 'company' ? user.premium_plan : user.family_premium_plan;
    
    const startDate = parseDate(grantedAt);
    const endDate = getExpirationDetails(grantedAt, plan || 'monthly');
    
    const [timeLeft, setTimeLeft] = useState('...');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!isPremium || !endDate) return;

        const interval = setInterval(() => {
            const now = new Date();
            const diff = endDate.getTime() - now.getTime();

            if (diff <= 0) {
                setIsExpired(true);
                setTimeLeft("EXPIRED");
                clearInterval(interval);
                // Trigger auto-revoke
                onRevoke(user.id, 'revoke', type);
            } else {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                if (TEST_MODE) setTimeLeft(`${minutes}m ${seconds}s`);
                else if (days > 1) setTimeLeft(`${days}d left`);
                else setTimeLeft(`${hours}h ${minutes}m`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [endDate, isPremium, user.id, type]);

    if (!isPremium || !startDate || !endDate) return null;

    const theme = type === 'company' ? 'border-emerald-100 bg-emerald-50' : 'border-blue-100 bg-blue-50';
    const textTheme = type === 'company' ? 'text-emerald-700' : 'text-blue-700';

    return (
        <View className={`mt-2 p-3 rounded-2xl border ${theme}`}>
            <View className="flex-row justify-between items-center mb-2 border-b border-black/5 pb-1">
                <Text className={`text-[9px] font-black uppercase tracking-widest ${textTheme}`}>{label}</Text>
                <View className="flex-row items-center">
                    <Clock size={10} color={isExpired ? "#e11d48" : "#64748b"} />
                    <Text className={`ml-1 text-[10px] font-mono font-bold ${isExpired ? 'text-rose-600' : 'text-slate-500'}`}>
                        {timeLeft}
                    </Text>
                </View>
            </View>
            <View className="flex-row justify-between">
                <View>
                    <Text className="text-[8px] text-slate-400 uppercase font-bold">Start</Text>
                    <Text className="text-[10px] font-bold text-slate-700">{startDate.toLocaleDateString()}</Text>
                </View>
                <View className="items-end">
                    <Text className="text-[8px] text-slate-400 uppercase font-bold">End</Text>
                    <Text className="text-[10px] font-bold text-slate-700">
                        {endDate.toLocaleDateString()} {endDate.getHours()}:{endDate.getMinutes()}
                    </Text>
                </View>
            </View>
        </View>
    );
};

// --- COMPONENT: ADMIN USER ROW ---
export const AdminUserRow = memo(({ user, rightContent, onTogglePremium }) => {
    const initials = (user.full_name || user.first_name || "?").substring(0, 2).toUpperCase();
    const isAdmin = user.role === 'admin';
    
    const isCompanyPremium = user.is_premium;
    const isCompanyPending = user.subscription_status === 'pending_approval';
    const isFamilyPremium = user.is_family_premium;
    const isFamilyPending = user.family_subscription_status === 'pending_approval';

    const accentColor = isAdmin ? 'bg-purple-500' : (isCompanyPending || isFamilyPending) ? 'bg-amber-500' : (isCompanyPremium || isFamilyPremium) ? 'bg-emerald-500' : 'bg-transparent';

    const approvalButtons = (type, label) => (
        <View className="items-end gap-y-2">
            <TouchableOpacity 
                onPress={() => onTogglePremium(user.id, 'approve', type)}
                className="flex-row items-center bg-emerald-600 px-4 py-2 rounded-xl shadow-sm"
            >
                <Check size={14} color="white" />
                <Text className="text-white font-bold text-[10px] ml-1 uppercase">{label}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                onPress={() => {
                    Alert.alert("Reject?", "Deny this premium request?", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Reject", style: "destructive", onPress: () => onTogglePremium(user.id, 'reject', type) }
                    ]);
                }}
            >
                <Text className="text-[10px] text-rose-500 font-bold uppercase tracking-tighter">Reject Request</Text>
            </TouchableOpacity>
        </View>
    );

    const renderAction = () => {
        if (rightContent) return rightContent;
        if (isCompanyPending) return approvalButtons('company', 'Approve Co.');
        if (isFamilyPending) return approvalButtons('family', 'Approve Fam.');
        if (isAdmin) return (
            <View className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
                <Text className="text-[8px] font-black text-slate-400 uppercase tracking-widest">System Admin</Text>
            </View>
        );

        return (
            <View className="items-end gap-y-2">
                <TouchableOpacity 
                    onPress={() => onTogglePremium(user.id, isCompanyPremium ? 'revoke' : 'grant', 'company')}
                    className={`w-24 py-2 rounded-lg border items-center ${isCompanyPremium ? 'bg-white border-rose-100' : 'bg-white border-slate-200'}`}
                >
                    <Text className={`text-[10px] font-bold uppercase ${isCompanyPremium ? 'text-rose-500' : 'text-slate-400'}`}>
                        {isCompanyPremium ? 'Revoke Co.' : '+ Grant Co.'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => onTogglePremium(user.id, isFamilyPremium ? 'revoke' : 'grant', 'family')}
                    className={`w-24 py-2 rounded-lg border items-center ${isFamilyPremium ? 'bg-white border-rose-100' : 'bg-white border-slate-200'}`}
                >
                    <Text className={`text-[10px] font-bold uppercase ${isFamilyPremium ? 'text-rose-500' : 'text-slate-400'}`}>
                        {isFamilyPremium ? 'Revoke Fam.' : '+ Grant Fam.'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View className="flex-row items-center p-4 border-b border-slate-100 bg-white">
            {/* Colored Accent Strip */}
            <View className={`absolute left-0 top-0 bottom-0 w-1 ${accentColor}`} />
            
            <View className="flex-row items-start flex-1">
                {/* Avatar */}
                <View className={`w-12 h-12 rounded-2xl items-center justify-center shadow-sm ${
                    isAdmin ? 'bg-purple-100' : 
                    (isCompanyPremium || isFamilyPremium) ? 'bg-emerald-100' : 
                    (isCompanyPending || isFamilyPending) ? 'bg-amber-100' : 'bg-slate-100'
                }`}>
                    <Text className={`text-lg font-black ${
                        isAdmin ? 'text-purple-700' : 
                        (isCompanyPremium || isFamilyPremium) ? 'text-emerald-600' : 
                        (isCompanyPending || isFamilyPending) ? 'text-amber-600' : 'text-slate-400'
                    }`}>
                        {initials}
                    </Text>
                </View>

                {/* User Info */}
                <View className="ml-4 flex-1">
                    <View className="flex-row items-center flex-wrap gap-2">
                        <Text className="font-black text-slate-800 text-sm" numberOfLines={1}>
                            {user.full_name || user.first_name || "Unknown"}
                        </Text>
                        {isAdmin && (
                            <View className="bg-purple-600 px-1.5 py-0.5 rounded">
                                <Text className="text-[7px] font-black text-white uppercase">Admin</Text>
                            </View>
                        )}
                    </View>
                    <Text className="text-[10px] text-slate-400 font-bold" numberOfLines={1}>{user.email}</Text>

                    {/* Subscriptions / Tickers */}
                    {isCompanyPremium && !rightContent && <SubscriptionTicker label="Company Access" type="company" user={user} onRevoke={onTogglePremium} />}
                    {isFamilyPremium && !rightContent && <SubscriptionTicker label="Family Access" type="family" user={user} onRevoke={onTogglePremium} />}
                    
                    {isCompanyPending && !rightContent && <Text className="mt-2 text-[9px] text-amber-600 font-black uppercase italic bg-amber-50 self-start px-2 py-1 rounded">Pending Company</Text>}
                    {isFamilyPending && !rightContent && <Text className="mt-2 text-[9px] text-amber-600 font-black uppercase italic bg-amber-50 self-start px-2 py-1 rounded">Pending Family</Text>}
                </View>
            </View>

            {/* Right Action Area */}
            <View className="ml-2">
                {renderAction()}
            </View>
        </View>
    );
});

// --- MAIN TABLE WIDGET ---
const AdminUserTableWidget = ({ users = [], type, onTogglePremium, headerText }) => {
    return (
        <View className="bg-white rounded-3xl border border-slate-200 overflow-hidden h-full max-h-[500px]">
            {headerText && (
                <View className={`px-5 py-3 border-b flex-row justify-between items-center ${
                    type === 'revenue' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'
                }`}>
                    <Text className={`text-[10px] font-black uppercase tracking-widest ${
                        type === 'revenue' ? 'text-emerald-800' : 'text-slate-500'
                    }`}>
                        {headerText}
                    </Text>
                </View>
            )}
            
            <ScrollView showsVerticalScrollIndicator={false}>
                {users.length > 0 ? (
                    users.map((u) => {
                        let customRight = null;
                        if (type === 'revenue') {
                            const plan = u.premium_plan || 'monthly';
                            const amount = plan === 'yearly' ? 15000 : 1500;
                            const dateObj = parseDate(u.premium_granted_at);
                            customRight = (
                                <View className="items-end">
                                    <Text className="font-black text-emerald-600 text-sm">+ ₱{amount.toLocaleString()}</Text>
                                    <Text className="text-[9px] font-bold text-slate-400 uppercase">{dateObj ? dateObj.toLocaleDateString() : '-'}</Text>
                                </View>
                            );
                        }
                        return <AdminUserRow key={u.id} user={u} rightContent={customRight} onTogglePremium={onTogglePremium} />;
                    })
                ) : (
                    <View className="p-20 items-center">
                        <Text className="text-slate-400 italic text-sm">No records found.</Text>
                    </View>
                )}
                <View className="h-10" />
            </ScrollView>
        </View>
    );
};

export default memo(AdminUserTableWidget);