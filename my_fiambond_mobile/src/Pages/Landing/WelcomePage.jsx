import React, { useState, useRef } from "react";
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    SafeAreaView, 
    Image, 
    Dimensions,
    Platform
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Svg, { Path, Circle } from "react-native-svg";

const { width } = Dimensions.get("window");

// --- ICON COMPONENTS ---
const CheckIcon = () => (
    <Svg className="w-5 h-5" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24">
        <Path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </Svg>
);
const CrossIcon = () => (
    <Svg className="w-5 h-5" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24">
        <Path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </Svg>
);
const ShieldIcon = () => (
    <Svg className="w-10 h-10" fill="none" stroke="#4f46e5" strokeWidth="1.5" viewBox="0 0 24 24">
        <Path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </Svg>
);
const UsersIcon = () => (
    <Svg className="w-10 h-10" fill="none" stroke="#4f46e5" strokeWidth="1.5" viewBox="0 0 24 24">
        <Path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </Svg>
);
const BuildingIcon = () => (
    <Svg className="w-10 h-10" fill="none" stroke="#4f46e5" strokeWidth="1.5" viewBox="0 0 24 24">
        <Path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </Svg>
);
const CloudIcon = () => (
    <Svg className="w-5 h-5" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24">
        <Path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096c.13.151.248.305.356.464M21 21l-6-6" />
    </Svg>
);

export default function WelcomePage() {
    const navigation = useNavigation();
    const scrollRef = useRef(null);
    const [billingCycle, setBillingCycle] = useState('monthly');

    const FAMILY_MONTHLY = '₱500';
    const FAMILY_ANNUAL = '₱5,000';
    const COMPANY_MONTHLY = '₱1,500';
    const COMPANY_ANNUAL = '₱15,000';

    const getPrice = (monthly, annual) => billingCycle === 'monthly' ? monthly : annual;
    const getPeriod = () => billingCycle === 'monthly' ? '/mo' : '/yr';

    const handleFeatureScroll = () => {
        // Simple scroll to y position (approximation of features section)
        scrollRef.current?.scrollTo({ y: 700, animated: true });
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView ref={scrollRef} className="flex-1" showsVerticalScrollIndicator={false}>
                
                {/* --- HERO SECTION --- */}
                <View className="relative px-6 pt-16 pb-12 bg-slate-50 overflow-hidden">
                    {/* Decorative Blobs (Simulated with absolute views) */}
                    <View className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-100 rounded-full opacity-40" />
                    <View className="absolute top-1/2 -left-20 w-48 h-48 bg-blue-100 rounded-full opacity-40" />

                    <View className="items-center md:items-start">
                        <View className="flex-row items-center bg-white border border-indigo-100 px-3 py-1.5 rounded-full mb-6">
                            <View className="w-2 h-2 rounded-full bg-green-400 mr-2" />
                            <Text className="text-indigo-600 text-[10px] font-bold uppercase tracking-wider">v1.0 Public Release</Text>
                        </View>

                        <Text className="text-4xl font-extrabold text-gray-900 leading-tight text-center md:text-left">
                            Take Control of {"\n"}
                            <Text className="text-indigo-600">Your Finances</Text>
                        </Text>

                        <Text className="text-base text-gray-600 mt-6 leading-6 text-center md:text-left">
                            FiamBond is the ledger of truth for personal loans, family budgets, and company payroll.
                        </Text>

                        <View className="w-full mt-8 flex-col gap-4">
                            <TouchableOpacity 
                                onPress={() => navigation.navigate("Register")}
                                className="bg-indigo-600 py-4 rounded-2xl shadow-lg shadow-indigo-300 items-center"
                            >
                                <Text className="text-white font-bold text-lg">Start Free Account</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={handleFeatureScroll}
                                className="bg-white border border-gray-200 py-4 rounded-2xl items-center"
                            >
                                <Text className="text-gray-700 font-bold text-lg">View Features</Text>
                            </TouchableOpacity>
                        </View>

                        <View className="mt-10 bg-blue-50/80 border-l-4 border-l-blue-500 p-4 rounded-r-xl">
                            <Text className="text-xs text-gray-600">
                                <Text className="font-bold text-blue-700">Disclaimer: </Text>
                                This is a demo application. No real money involved.
                            </Text>
                        </View>
                    </View>
                </View>

                {/* --- FEATURES SECTION --- */}
                <View className="px-6 py-16 bg-white">
                    <View className="items-center mb-12">
                        <Text className="text-3xl font-extrabold text-gray-900 text-center">One App. Three Realms.</Text>
                        <Text className="text-gray-500 text-center mt-4 leading-6">
                            FiamBond adapts to your context. Whether management is personal, household, or corporate.
                        </Text>
                    </View>

                    {/* Feature Cards */}
                    <View className="gap-6">
                        {[
                            { title: "Personal Realm (Free)", desc: "Private financial dashboard for transactions, goals, and loans.", icon: <ShieldIcon /> },
                            { title: "Family Realm", desc: "Shared financial space. Manage collaborative budgets with transparency.", icon: <UsersIcon /> },
                            { title: "Company Realm", desc: "Professional suite to manage employees, funds, and payroll reports.", icon: <BuildingIcon /> }
                        ].map((feature, idx) => (
                            <View key={idx} className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                <View className="w-16 h-16 bg-white rounded-2xl items-center justify-center mb-4 border border-gray-100 shadow-sm">
                                    {feature.icon}
                                </View>
                                <Text className="text-xl font-bold text-gray-900 mb-2">{feature.title}</Text>
                                <Text className="text-gray-600 leading-5">{feature.desc}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* --- PRICING SECTION --- */}
                <View className="px-6 py-20 bg-slate-900">
                    <View className="items-center mb-10">
                        <Text className="text-3xl font-extrabold text-white text-center">Flexible Pricing</Text>
                        <Text className="text-slate-400 text-center mt-2">Start for free. Upgrade to collaborate.</Text>

                        {/* Toggle */}
                        <View className="mt-8 flex-row bg-slate-800 p-1 rounded-2xl border border-slate-700">
                            <TouchableOpacity 
                                onPress={() => setBillingCycle('monthly')}
                                className={`px-6 py-2.5 rounded-xl ${billingCycle === 'monthly' ? 'bg-indigo-600' : ''}`}
                            >
                                <Text className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}`}>Monthly</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={() => setBillingCycle('annual')}
                                className={`px-6 py-2.5 rounded-xl ${billingCycle === 'annual' ? 'bg-indigo-600' : ''}`}
                            >
                                <Text className={`text-sm font-bold ${billingCycle === 'annual' ? 'text-white' : 'text-slate-400'}`}>Annual</Text>
                            </TouchableOpacity>
                        </View>
                        {billingCycle === 'annual' && (
                            <Text className="text-green-400 text-[10px] mt-2 font-bold uppercase tracking-tighter">Save up to 20%</Text>
                        )}
                    </View>

                    {/* Pricing Cards (Vertical Stack for Mobile) */}
                    <View className="gap-8">
                        
                        {/* PERSONAL */}
                        <View className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
                            <Text className="text-xl font-bold text-white">Personal Realm</Text>
                            <Text className="text-4xl font-bold text-white my-4">₱0<Text className="text-sm font-normal text-slate-500">/mo</Text></Text>
                            <TouchableOpacity onPress={() => navigation.navigate("Register")} className="bg-slate-700 py-3 rounded-xl items-center mb-6">
                                <Text className="text-white font-bold">Get Started - Free</Text>
                            </TouchableOpacity>
                            <View className="gap-y-3">
                                <View className="flex-row items-center gap-2"><CheckIcon /><Text className="text-slate-300 text-xs">Unlimited Tx, Goals, Loans</Text></View>
                                <View className="flex-row items-center gap-2"><CheckIcon /><Text className="text-slate-300 text-xs">Full History & Graphs</Text></View>
                                <View className="flex-row items-center gap-2"><CrossIcon /><Text className="text-slate-600 text-xs">No Family Access</Text></View>
                            </View>
                        </View>

                        {/* FAMILY (Highlighted) */}
                        <View className="bg-white p-6 rounded-3xl border-4 border-indigo-600">
                            <View className="bg-indigo-600 self-start px-3 py-1 rounded-full -mt-10 mb-6">
                                <Text className="text-white text-[10px] font-bold">MOST POPULAR</Text>
                            </View>
                            <Text className="text-xl font-bold text-indigo-900">Family Realm</Text>
                            <Text className="text-4xl font-bold text-gray-900 my-4">{getPrice(FAMILY_MONTHLY, FAMILY_ANNUAL)}<Text className="text-sm font-normal text-gray-400">{getPeriod()}</Text></Text>
                            <TouchableOpacity 
                                onPress={() => navigation.navigate("Register", { realm: 'family' })}
                                className="bg-indigo-600 py-4 rounded-xl items-center mb-2"
                            >
                                <Text className="text-white font-bold">Request Family Access</Text>
                            </TouchableOpacity>
                            <Text className="text-[10px] text-gray-400 text-center mb-6 italic">GCash payment & Admin check required</Text>
                            <View className="gap-y-3">
                                <View className="flex-row items-center gap-2"><CheckIcon /><Text className="text-gray-600 text-xs">All Personal Features</Text></View>
                                <View className="flex-row items-center gap-2"><CheckIcon /><Text className="text-gray-600 text-xs">Shared collaborative space</Text></View>
                                <View className="flex-row items-center gap-2"><CheckIcon /><Text className="text-gray-600 text-xs">Invite Members via Email</Text></View>
                            </View>
                        </View>

                        {/* COMPANY */}
                        <View className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
                            <Text className="text-xl font-bold text-white">Company Realm</Text>
                            <Text className="text-4xl font-bold text-white my-4">{getPrice(COMPANY_MONTHLY, COMPANY_ANNUAL)}<Text className="text-sm font-normal text-slate-500">{getPeriod()}</Text></Text>
                            <TouchableOpacity onPress={() => navigation.navigate("Register", { realm: 'company' })} className="bg-slate-700 py-3 rounded-xl items-center mb-6">
                                <Text className="text-white font-bold">Request Company Access</Text>
                            </TouchableOpacity>
                            <View className="gap-y-3">
                                <View className="flex-row items-center gap-2"><CheckIcon /><Text className="text-slate-300 text-xs">Manage Employees & Funds</Text></View>
                                <View className="flex-row items-center gap-2"><CheckIcon /><Text className="text-slate-300 text-xs">Payroll Reports (CSV/PDF)</Text></View>
                            </View>
                        </View>

                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}