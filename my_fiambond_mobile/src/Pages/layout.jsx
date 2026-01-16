import React, { useContext, useState } from "react";
import { 
    View, 
    Text, 
    TouchableOpacity, 
    SafeAreaView, 
    Image, 
    ScrollView, 
    Pressable 
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { AppContext } from "../Context/AppContext.jsx";
import { 
    LogOut, 
    Settings, 
    Menu as MenuIcon, 
    X, 
    Clock, 
    BadgeCheck 
} from "lucide-react-native";

export default function Layout({ children }) {
    const { user, handleLogout, premiumDetails } = useContext(AppContext);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const navigation = useNavigation();
    const route = useRoute();

    const isPublicLayout = !user;

    const formatExpirationDate = (grantedAt, planCycle) => {
        if (!grantedAt) return 'N/A';
        const startDate = grantedAt.seconds ? new Date(grantedAt.seconds * 1000) : new Date(grantedAt);
        const endDate = new Date(startDate);
        planCycle === 'yearly' ? endDate.setFullYear(endDate.getFullYear() + 1) : endDate.setMonth(endDate.getMonth() + 1);
        return endDate.toLocaleDateString();
    };

    if (isPublicLayout) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="h-20 border-b border-gray-100 px-5 flex-row items-center justify-between bg-white">
                    <TouchableOpacity 
                        onPress={() => navigation.navigate("Welcome")} 
                        className="flex-row items-center gap-2"
                    >
                        {/* ICON: Fixed size so it doesn't get "big" */}
                        <Image 
                            source={require("../../assets/FiamBond_Logo.png")} 
                            style={{ width: 40, height: 40 }} 
                            resizeMode="contain" 
                        />
                        {/* TEXT: Explicitly kept here */}
                        <Text className="text-2xl font-bold text-indigo-600">FiamBond</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? <X size={24} color="#4b5563" /> : <MenuIcon size={24} color="#4b5563" />}
                    </TouchableOpacity>
                </View>

                {isMobileMenuOpen && (
                    <View className="absolute top-20 left-0 w-full bg-white z-50 border-b border-gray-200 p-5">
                        <TouchableOpacity onPress={() => { setIsMobileMenuOpen(false); navigation.navigate("Login"); }} className="py-4 border-b border-gray-50">
                            <Text className="text-center font-bold text-gray-700">Log In</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setIsMobileMenuOpen(false); navigation.navigate("Register"); }} className="py-4 bg-indigo-600 rounded-xl mt-4">
                            <Text className="text-center font-bold text-white">Get Started</Text>
                        </TouchableOpacity>
                    </View>
                )}
                <View className="flex-1">{children}</View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="h-20 border-b border-gray-200 bg-white px-5 flex-row items-center justify-between">
                <TouchableOpacity 
                    onPress={() => navigation.navigate("Home")} 
                    className="flex-row items-center gap-2"
                >
                    {/* ICON: Fixed size for authenticated view */}
                    <Image 
                        source={require("../../assets/FiamBond_Logo.png")} 
                        style={{ width: 35, height: 35 }} 
                        resizeMode="contain" 
                    />
                    <Text className="text-xl font-bold text-indigo-600">FiamBond</Text>
                </TouchableOpacity>

                <View className="flex-row items-center gap-3">
                    <TouchableOpacity 
                        onPress={() => setIsProfileMenuOpen(!isProfileMenuOpen)} 
                        className="h-10 w-10 bg-indigo-100 rounded-full items-center justify-center border border-indigo-200"
                    >
                        <Text className="text-indigo-700 font-bold">
                            {(user?.full_name || 'U')[0].toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        <MenuIcon size={24} color="#9ca3af" />
                    </TouchableOpacity>
                </View>
            </View>

            {isProfileMenuOpen && (
                <>
                    <Pressable className="absolute inset-0 z-40" onPress={() => setIsProfileMenuOpen(false)} />
                    <View className="absolute right-5 top-20 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50">
                        <TouchableOpacity onPress={() => { setIsProfileMenuOpen(false); navigation.navigate("Settings"); }} className="flex-row items-center px-4 py-3">
                            <Settings size={18} color="#4b5563" />
                            <Text className="ml-3 text-gray-700 font-medium">Settings</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setIsProfileMenuOpen(false); handleLogout(); }} className="flex-row items-center px-4 py-3 border-t border-gray-50">
                            <LogOut size={18} color="#e11d48" />
                            <Text className="ml-3 text-rose-600 font-bold">Sign Out</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}

            {isMobileMenuOpen && (
                <>
                    <Pressable className="absolute inset-0 bg-black/20 z-40" onPress={() => setIsMobileMenuOpen(false)} />
                    <View className="absolute right-0 top-0 h-full w-3/4 bg-white z-50 p-6">
                        <Text className="text-xs font-bold text-gray-400 uppercase mb-4">Subscriptions</Text>
                        {(premiumDetails && (premiumDetails.company || premiumDetails.family)) ? (
                            <View>
                                {premiumDetails.company && (
                                    <View className="bg-emerald-50 p-4 rounded-2xl mb-3">
                                        <Text className="font-bold text-emerald-800 text-sm">Company Premium</Text>
                                        <Text className="text-[10px] text-emerald-600">
                                            Expires: {formatExpirationDate(premiumDetails.company.granted_at, premiumDetails.company.plan_cycle)}
                                        </Text>
                                    </View>
                                )}
                                {premiumDetails.family && (
                                    <View className="bg-blue-50 p-4 rounded-2xl">
                                        <Text className="font-bold text-blue-800 text-sm">Family Premium</Text>
                                        <Text className="text-[10px] text-blue-600">
                                            Expires: {formatExpirationDate(premiumDetails.family.granted_at, premiumDetails.family.plan_cycle)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ) : (
                            <View className="flex-row items-center gap-3 bg-gray-50 p-4 rounded-2xl">
                                <Clock size={16} color="#9ca3af" />
                                <Text className="text-gray-500 text-sm italic">No active subscriptions</Text>
                            </View>
                        )}
                        <TouchableOpacity onPress={handleLogout} className="mt-auto bg-rose-50 py-4 rounded-2xl items-center flex-row justify-center gap-2">
                            <LogOut size={18} color="#e11d48" />
                            <Text className="text-rose-600 font-bold">Log Out</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
            <ScrollView className="flex-1 px-4 py-6">{children}</ScrollView>
        </SafeAreaView>
    );
}