"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
    View, 
    Text, 
    TouchableOpacity, 
    ScrollView,
    Image,
    useWindowDimensions,
    Animated,
    Platform
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
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";

// --- HELPER: GRADIENT TEXT (Desktop Only Feature) ---
const GradientText = ({ children, style }) => {
    return (
        <MaskedView maskElement={<Text style={style}>{children}</Text>}>
            <LinearGradient
                colors={['#4f46e5', '#6366f1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                <Text style={[style, { opacity: 0 }]}>{children}</Text>
            </LinearGradient>
        </MaskedView>
    );
};

// --- HELPER components (Unchanged for Mobile) ---
const RealmCard = ({ icon, title, desc, isDesktop }) => (
    <View 
        style={isDesktop ? { flex: 1, marginHorizontal: 10 } : {}}
        className={`bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-4 ${isDesktop ? 'items-start min-h-[180px]' : 'flex-row items-start'}`}
    >
        <View className="bg-white w-12 h-12 rounded-xl items-center justify-center shadow-sm border border-gray-100">
            {icon}
        </View>
        <View className={isDesktop ? "mt-4" : "ml-4 flex-1"}>
            <Text className="text-lg font-bold text-gray-900">{title}</Text>
            <Text className="text-gray-500 text-sm mt-1">{desc}</Text>
        </View>
    </View>
);

const PricingCard = ({ title, price, period, features, featured = false, buttonText, subText, isDesktop }) => (
    <View 
        style={isDesktop ? { flex: 1, marginHorizontal: 10, height: '100%' } : {}}
        className={`rounded-3xl p-8 mb-6 border ${featured ? 'bg-white border-indigo-600 border-4 shadow-xl' : 'bg-slate-800/50 border-slate-700'}`}
    >
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
                <View key={index} className="flex-row items-center mb-2">
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
    const { width } = useWindowDimensions();
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [mounted, setMounted] = useState(false);
    
    // Animation for the pulsing dot
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const isDesktop = width >= 1024;

    useEffect(() => {
        setMounted(true);
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const getPrice = (monthly, annual) => billingCycle === 'monthly' ? monthly : annual;
    const getPeriod = () => billingCycle === 'monthly' ? '/mo' : '/yr';

    const FAMILY_MONTHLY = '₱500';
    const FAMILY_ANNUAL = '₱5,000'; 
    const COMPANY_MONTHLY = '₱1,500';
    const COMPANY_ANNUAL = '₱15,000';

    if (!mounted) {
        return <UnifiedLoadingWidget type="fullscreen" message="Initializing FiamBond Realms..." variant="indigo" />;
    }

    return (
        <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
            {/* --- HERO SECTION (1:1 Layout) --- */}
            <View className={`relative overflow-hidden ${isDesktop ? 'pt-36 pb-32' : 'pt-8 pb-12'}`}>
                {/* Background Decorators (Desktop Only) */}
                {isDesktop && (
                    <>
                        <LinearGradient 
                            colors={['#eef2ff', '#ffffff', '#ffffff']} 
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -2 }}
                        />
                        {/* Blob Top Right */}
                        <View 
                            style={{ 
                                position: 'absolute', top: -80, right: -80, width: 384, height: 384, 
                                borderRadius: 192, backgroundColor: '#e0e7ff', opacity: 0.6, 
                                ...Platform.select({ web: { filter: 'blur(60px)' } }) 
                            }} 
                        />
                        {/* Blob Center Left */}
                        <View 
                            style={{ 
                                position: 'absolute', top: '40%', left: -80, width: 288, height: 288, 
                                borderRadius: 144, backgroundColor: '#dbeafe', opacity: 0.6, 
                                ...Platform.select({ web: { filter: 'blur(60px)' } }) 
                            }} 
                        />
                    </>
                )}

                <View style={isDesktop ? { width: '100%', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 50 } : { paddingHorizontal: 20 }}>
                    
                    {/* Hero Left Content */}
                    <View style={isDesktop ? { flex: 1.1, paddingRight: 80 } : {}}>
                        {/* Pulse Badge */}
                        <View className="bg-white self-start px-3 py-1.5 rounded-full border border-indigo-100 mb-6 flex-row items-center shadow-sm">
                            <Animated.View style={{ opacity: pulseAnim }} className="w-2 h-2 rounded-full bg-green-400 mr-2" />
                            <Text className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest">v1.0 Public Release</Text>
                        </View>

                        {isDesktop ? (
                            <View>
                                <Text style={{ fontSize: 72, lineHeight: 80, fontWeight: '900', color: '#111827', letterSpacing: -2.5 }}>
                                    Take Control of
                                </Text>
                                <GradientText style={{ fontSize: 72, lineHeight: 80, fontWeight: '900', letterSpacing: -2.5 }}>
                                    Your Finances
                                </GradientText>
                            </View>
                        ) : (
                            <Text className="text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                                Take Control of{"\n"}
                                <Text className="text-indigo-600">Your Finances</Text>
                            </Text>
                        )}

                        <Text className={`text-gray-600 mt-6 leading-relaxed ${isDesktop ? 'text-xl max-w-lg' : 'text-lg'}`}>
                            FiamBond is the ledger of truth for personal loans, family budgets, and company payroll. Stop relying on memory. Start tracking today.
                        </Text>

                        <View className={`mt-10 ${isDesktop ? 'flex-row' : 'flex-col space-y-3'}`}>
                            <TouchableOpacity 
                                onPress={() => router.push("/(auth)/register")}
                                className={`bg-indigo-600 py-5 rounded-2xl flex-row justify-center items-center shadow-lg shadow-indigo-200 ${isDesktop ? 'px-10 mr-4' : ''}`}
                            >
                                <Text className="text-white font-bold text-lg mr-2">Start Free Account</Text>
                                <ArrowRight size={20} color="white" strokeWidth={3} />
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                onPress={() => router.push("/(auth)/login")}
                                className={`bg-white border border-gray-200 py-5 rounded-2xl items-center ${isDesktop ? 'px-10' : ''}`}
                            >
                                <Text className="text-gray-700 font-bold text-lg">View Features</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Disclaimer Box */}
                        <View className="mt-10 bg-white/80 p-5 rounded-r-2xl border-l-4 border-blue-500 shadow-sm max-w-lg overflow-hidden">
                           <Text className="text-sm text-gray-600 leading-5">
                                <Text className="font-bold text-blue-700">Disclaimer:</Text> This is a demo application. No real money or bank connections involved.
                            </Text>
                        </View>
                    </View>

                    {/* Hero Right Visual (1:1 Image and Floating Card) */}
                    {isDesktop && (
                        <View className="flex-[0.9] relative justify-center items-center" style={{ perspective: 1000 }}>
                            {/* Visual Glow */}
                            <View className="absolute w-[120%] h-[120%] -z-10">
                                <LinearGradient
                                    colors={['rgba(199, 210, 254, 0.4)', 'rgba(255, 255, 255, 0)']}
                                    start={{ x: 0, y: 1 }} // to-tr
                                    end={{ x: 1, y: 0 }}   // to-tr
                                    className="w-full h-full rounded-full"
                                    style={{ ...Platform.select({ web: { filter: 'blur(64px)' } }) }}
                                />
                            </View>

                            {/* Main Image */}
                            <Image
                                alt="FiamBond Dashboard Preview"
                                source={require("../../../assets/images/FiamBond_Image.png")}
                                className="rounded-2xl shadow-2xl border border-gray-200/50"
                                style={{
                                    width: 550,
                                    height: 400,
                                    transform: [{ rotate: '1deg' }]
                                }}
                                resizeMode="cover"
                            />

                            {/* Bouncing Security Card */}
                            <View
                                className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-gray-100 animate-bounce"
                                style={Platform.OS === 'web' ? { animationDuration: '3.5s' } : {}}
                            >
                                <View className="flex-row items-center gap-3">
                                    <View className="p-2 bg-green-100 rounded-full">
                                        <ShieldCheck size={32} color="#4f46e5" />
                                    </View>
                                    <View>
                                        <Text className="text-xs text-gray-500 uppercase font-semibold">Security</Text>
                                        <Text className="text-sm font-bold text-gray-800">AES-256 Encrypted</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            </View>

            {/* --- REALMS SECTION (Consistent with Mobile) --- */}
            <View className={`py-16 bg-white ${isDesktop ? 'items-center' : 'px-6'}`}>
                <View style={isDesktop ? { maxWidth: 1200, width: '100%' } : {}}>
                    <View className={`mb-10 ${isDesktop ? 'items-center' : ''}`}>
                        <Text className="text-3xl font-extrabold text-gray-900 mb-4">One App. Three Realms.</Text>
                        <Text className={`text-gray-500 leading-6 text-base ${isDesktop ? 'text-center max-w-2xl' : ''}`}>
                            FiamBond adapts to your context. Choose the workspace that fits your needs.
                        </Text>
                    </View>

                    <View className={isDesktop ? 'flex-row justify-between' : ''}>
                        <RealmCard 
                            isDesktop={isDesktop}
                            icon={<Shield color="#4f46e5" size={24} />}
                            title="Personal Realm (Free)"
                            desc="Your private financial dashboard for transactions, goals, and loans."
                        />
                        <RealmCard 
                            isDesktop={isDesktop}
                            icon={<Users color="#4f46e5" size={24} />}
                            title="Family Realm"
                            desc="Collaborative budgeting and shared loans with family members."
                        />
                        <RealmCard 
                            isDesktop={isDesktop}
                            icon={<Building2 color="#4f46e5" size={24} />}
                            title="Company Realm"
                            desc="Professional suite for payroll, employees, and company fund reports."
                        />
                    </View>
                </View>
            </View>

            {/* --- PRICING SECTION (Consistent with Mobile) --- */}
            <View className={`bg-slate-900 py-16 ${isDesktop ? 'items-center' : 'px-6'}`}>
                <View style={isDesktop ? { maxWidth: 1200, width: '100%' } : {}}>
                    <View className="items-center mb-10">
                        <Text className="text-white text-3xl font-extrabold text-center">Flexible Pricing</Text>
                        <View className="flex-row bg-slate-800 p-1 rounded-xl mt-8 border border-slate-700">
                            <TouchableOpacity onPress={() => setBillingCycle('monthly')} className={`px-8 py-2.5 rounded-lg ${billingCycle === 'monthly' ? 'bg-indigo-600' : ''}`}>
                                <Text className={`font-bold text-sm ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}`}>Monthly</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setBillingCycle('annual')} className={`px-8 py-2.5 rounded-lg ${billingCycle === 'annual' ? 'bg-indigo-600' : ''}`}>
                                <Text className={`font-bold text-sm ${billingCycle === 'annual' ? 'text-white' : 'text-slate-400'}`}>Annual</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className={isDesktop ? 'flex-row items-stretch' : ''}>
                        <PricingCard 
                            isDesktop={isDesktop}
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
                            isDesktop={isDesktop}
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
                            isDesktop={isDesktop}
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
            </View>
        </ScrollView>
    );
}
