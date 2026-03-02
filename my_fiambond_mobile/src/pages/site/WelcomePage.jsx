"use client";

import React, { useState, useEffect } from "react";
import { 
    View, 
    Text, 
    TouchableOpacity, 
} from "react-native";
import { useRouter } from "expo-router"; 
import { 
    Shield, 
    Users, 
    Building2, 
    Check, 
    X,
    ArrowRight,
    ShieldCheck
} from "lucide-react-native";

import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";

// Helper components that are scoped to this screen
const RealmCard = ({ icon, title, desc }) => (
    <View className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-4 flex-row items-start">
        <View className="bg-white w-12 h-12 rounded-xl items-center justify-center shadow-sm border border-gray-100">
            {icon}
        </View>
        <View className="ml-4 flex-1">
            <Text className="text-lg font-bold text-gray-900">{title}</Text>
            <Text className="text-gray-500 text-sm mt-1">{desc}</Text>
        </View>
    </View>
);

const PricingCard = ({ title, price, period, features, featured = false, buttonText, subText }) => (
    <View className={`rounded-3xl p-8 mb-6 border ${featured ? 'bg-white border-indigo-600 border-4' : 'bg-slate-800/50 border-slate-700'}`}>
        {featured && (
            <View className="absolute -top-4 self-center bg-indigo-600 px-4 py-1 rounded-full">
                <Text className="text-white text-[10px] font-bold uppercase tracking-tighter">Recommended</Text>
            </View>
        )}
        <Text className={`text-xl font-bold ${featured ? 'text-indigo-900' : 'text-white'}`}>{title}</Text>
        <View className="flex-row items-baseline my-4">
            <Text className={`text-4xl font-black ${featured ? 'text-gray-900' : 'text-white'}`}>{price}</Text>
            <Text className={`text-sm ml-1 ${featured ? 'text-gray-400' : 'text-slate-500'}`}>{period}</Text>
        </View>

        <TouchableOpacity className={`py-4 rounded-xl items-center mb-3 ${featured ? 'bg-indigo-600' : 'bg-slate-700'}`}>
            <Text className="text-white font-bold">{buttonText}</Text>
        </TouchableOpacity>
        
        {subText && <Text className="text-[9px] text-center text-gray-400 mb-6 font-medium uppercase">{subText}</Text>}

        <View className="space-y-3">
            {features.map((item, index) => (
                <View key={index} className="flex-row items-center">
                    {item.included ? (
                        <Check size={14} color="#10b981" strokeWidth={4} />
                    ) : (
                        <X size={14} color="#64748b" strokeWidth={2} />
                    )}
                    <Text className={`ml-3 text-xs ${item.included ? (featured ? 'text-gray-600' : 'text-slate-300') : 'text-slate-500'}`}>
                        {item.text}
                    </Text>
                </View>
            ))}
        </View>
    </View>
);


export default function WelcomeScreen() {
    const router = useRouter(); 
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Logic Helpers
    const getPrice = (monthly, annual) => billingCycle === 'monthly' ? monthly : annual;
    const getPeriod = () => billingCycle === 'monthly' ? '/mo' : '/yr';

    // PRICING CONSTANTS
    const FAMILY_MONTHLY = '₱500';
    const FAMILY_ANNUAL = '₱5,000'; 
    const COMPANY_MONTHLY = '₱1,500';
    const COMPANY_ANNUAL = '₱15,000';

    if (!mounted) {
        return (
            <UnifiedLoadingWidget 
                type="fullscreen" 
                message="Initializing FiamBond Realms..." 
                variant="indigo" 
            />
        );
    }

    return (
        <View>
            {/* --- HERO SECTION --- */}
            <View className="px-6 pt-8 pb-12 bg-indigo-50/30">
                <View className="bg-white self-start px-3 py-1.5 rounded-full border border-indigo-100 mb-6 flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-green-400 mr-2" />
                    <Text className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest">v1.0 Public Release</Text>
                </View>

                <Text className="text-4xl font-extrabold text-slate-900 leading-[48px] tracking-tight">
                    Take Control of{"\n"}
                    <Text className="text-indigo-600">Your Finances</Text>
                </Text>

                <Text className="text-gray-600 text-lg mt-6 leading-7">
                    FiamBond is the ledger of truth for personal loans, family budgets, and company payroll. Stop relying on memory. Start tracking today.
                </Text>

                <View className="mt-10 space-y-3">
                    <TouchableOpacity 
                        onPress={() => router.push("/(auth)/register")}
                        className="bg-indigo-600 py-5 rounded-2xl flex-row justify-center items-center shadow-lg shadow-indigo-100"
                    >
                        <Text className="text-white font-bold text-lg mr-2">Start Free Account</Text>
                        <ArrowRight size={20} color="white" strokeWidth={3} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        onPress={() => router.push("/(auth)/login")}
                        className="bg-white border border-gray-200 py-4 rounded-2xl items-center"
                    >
                        <Text className="text-gray-700 font-bold text-base">View Features</Text>
                    </TouchableOpacity>
                </View>

                {/* Disclaimer Box */}
                <View className="mt-8 bg-white p-4 rounded-xl border-l-4 border-blue-500 shadow-sm">
                    <Text className="text-sm text-gray-600 leading-5">
                        <Text className="font-bold text-blue-700">Disclaimer:</Text> This is a demo application. No real money or bank connections involved.
                    </Text>
                </View>

                {/* Simple Security Badge */}
                <View className="mt-8 flex-row items-center">
                    <ShieldCheck size={20} color="#4f46e5" />
                    <Text className="ml-2 text-indigo-600 font-bold text-xs uppercase tracking-tight">AES-256 Bit Encryption Secured</Text>
                </View>
            </View>

            {/* --- REALMS SECTION --- */}
            <View className="px-6 py-16 bg-white">
                <View className="mb-10">
                    <Text className="text-3xl font-extrabold text-gray-900 mb-4">One App. Three Realms.</Text>
                    <Text className="text-gray-500 leading-6 text-base">
                        FiamBond adapts to your context. Choose the workspace that fits your needs.
                    </Text>
                </View>

                <RealmCard 
                    icon={<Shield color="#4f46e5" size={24} />}
                    title="Personal Realm (Free)"
                    desc="Your private financial dashboard for transactions, goals, and loans."
                />
                <RealmCard 
                    icon={<Users color="#4f46e5" size={24} />}
                    title="Family Realm"
                    desc="Collaborative budgeting and shared loans with family members."
                />
                <RealmCard 
                    icon={<Building2 color="#4f46e5" size={24} />}
                    title="Company Realm"
                    desc="Professional suite for payroll, employees, and company fund reports."
                />
            </View>

            {/* --- PRICING SECTION --- */}
            <View className="bg-slate-900 px-6 py-16">
                <View className="items-center mb-10">
                    <Text className="text-white text-3xl font-extrabold text-center">Flexible Pricing</Text>
                    
                    {/* Toggle */}
                    <View className="flex-row bg-slate-800 p-1 rounded-xl mt-8 border border-slate-700">
                        <TouchableOpacity 
                            onPress={() => setBillingCycle('monthly')}
                            className={`px-8 py-2.5 rounded-lg ${billingCycle === 'monthly' ? 'bg-indigo-600' : ''}`}
                        >
                            <Text className={`font-bold text-sm ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}`}>Monthly</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => setBillingCycle('annual')}
                            className={`px-8 py-2.5 rounded-lg ${billingCycle === 'annual' ? 'bg-indigo-600' : ''}`}
                        >
                            <Text className={`font-bold text-sm ${billingCycle === 'annual' ? 'text-white' : 'text-slate-400'}`}>Annual</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <PricingCard 
                    title="Personal Realm"
                    price="₱0"
                    period="/mo"
                    buttonText="Get Started - Free"
                    features={[
                        { text: "Unlimited Transactions", included: true },
                        { text: "Full History & Graphs", included: true },
                        { text: "Cloudinary Receipt Upload", included: true },
                        { text: "Family/Company Access", included: false },
                    ]}
                />

                <PricingCard 
                    title="Family Realm"
                    price={getPrice(FAMILY_MONTHLY, FAMILY_ANNUAL)}
                    period={getPeriod()}
                    featured={true}
                    buttonText="Request Realm Access"
                    subText="Registration & GCash payment required."
                    features={[
                        { text: "All Personal Features", included: true },
                        { text: "Shared Family Ledger", included: true },
                        { text: "Invite Members via Email", included: true },
                        { text: "Company Realm Access", included: false },
                    ]}
                />

                <PricingCard 
                    title="Company Realm"
                    price={getPrice(COMPANY_MONTHLY, COMPANY_ANNUAL)}
                    period={getPeriod()}
                    buttonText="Request Realm Access"
                    subText="Registration & GCash payment required."
                    features={[
                        { text: "All Personal Features", included: true },
                        { text: "Employee Management", included: true },
                        { text: "Payroll Reports (PDF)", included: true },
                        { text: "Family Realm Access", included: false },
                    ]}
                />
            </View>
        </View>
    );
}
