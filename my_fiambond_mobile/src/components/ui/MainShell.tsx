"use client";

import React, { useContext, useState, useMemo } from "react";
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Dimensions,
  Platform
} from "react-native";
import { useRouter } from "expo-router";
import { AppContext } from "@/context/AppContext";
import { 
  LogOut, 
  Settings as CogIcon, 
  Menu, 
  X, 
  Clock, 
  BadgeCheck 
} from "lucide-react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = 80;

// --- HELPER FUNCTIONS ---
const formatExpirationDate = (grantedAt: any, planCycle: string | null) => {
  if (!grantedAt) return 'N/A';
  const startDate = grantedAt.seconds ? new Date(grantedAt.seconds * 1000) : new Date(grantedAt);
  if (isNaN(startDate.getTime())) return 'Invalid date';
  
  const endDate = new Date(startDate);
  if (planCycle === 'yearly') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }
  return endDate.toLocaleDateString();
};

// --- REUSABLE FOOTER ---
export const AppFooter = () => {
  const router = useRouter();
  return (
    <View className="bg-white py-12 border-t border-slate-100 px-6 items-center w-full">
      <Image 
        source={require("../../../assets/images/FiamBond_Logo.png")} 
        style={{ width: 60, height: 60, marginBottom: 16 }}
        resizeMode="contain" 
      />
      
      <View className="flex-row items-center gap-2 mb-8">
        <Text className="text-xl font-black text-indigo-600 tracking-tighter">FiamBond</Text>
      </View>
      
      <View className="flex-row gap-8 mb-8">
        <TouchableOpacity onPress={() => router.push("/about-us")}>
          <Text className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">About Us</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/privacy")}>
          <Text className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Privacy</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/terms")}>
          <Text className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Terms</Text>
        </TouchableOpacity>
      </View>
      
      <Text className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">
        &copy; {new Date().getFullYear()} FiamBond Realm.
      </Text>
    </View>
  );
};

const AdminBadge = () => (
  <View className="bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full ml-2">
    <Text className="text-[9px] font-black text-purple-700 uppercase tracking-widest">Admin</Text>
  </View>
);

// --- MAIN SHELL COMPONENT ---
export default function MainShell({ children }: { children: React.ReactNode }) {
  const { user, handleLogout }: any = useContext(AppContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const currentPremiumDetails = useMemo(() => {
    if (!user) return null;
    const details: any = {};
    if (user.is_premium) details.company = { granted_at: user.premium_granted_at, plan_cycle: user.premium_plan_cycle || 'monthly' };
    if (user.is_family_premium) details.family = { granted_at: user.family_premium_granted_at, plan_cycle: user.family_premium_plan_cycle || 'monthly' };
    return Object.keys(details).length > 0 ? details : null;
  }, [user]);

  const isAdmin = user?.role === 'admin';

  const navigateTo = (path: string) => {
    setIsMobileMenuOpen(false);
    router.push(path as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      
      {/* FIXED HEADER */}
      <View 
        style={{ height: HEADER_HEIGHT }}
        className="bg-white border-b border-slate-200 px-4 flex-row items-center justify-between z-[60]"
      >
        <TouchableOpacity 
          onPress={() => navigateTo(user ? "/realm" : "/")} 
          className="flex-row items-center gap-2"
        >
          <Image 
            source={require("../../../assets/images/FiamBond_Logo.png")} 
            style={{ width: 38, height: 38 }}
            resizeMode="contain" 
          />
          <View className="flex-row items-center">
            <Text className="text-xl font-black text-indigo-600 tracking-tighter">FiamBond</Text>
            {user && (
              <>
                <View className="h-4 w-[1px] bg-slate-300 mx-2" />
                <Text className="text-slate-500 font-bold">Realm</Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-slate-50 rounded-xl border border-slate-100"
        >
          {isMobileMenuOpen ? <X size={24} color="#64748b" /> : <Menu size={24} color="#64748b" />}
        </TouchableOpacity>
      </View>

      {/* MAIN SCROLLABLE CONTENT AREA */}
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[]}
        bounces={true}
      >
        {/* DYNAMIC CONTENT WRAPPER:
            By setting minHeight, we ensure that the content area ALWAYS 
            fills the screen (minus the header). This forces the Footer to stay 
            "below the fold" so it only appears when the user actually scrolls.
        */}
        <View style={{ minHeight: SCREEN_HEIGHT - HEADER_HEIGHT }}>
          {children}
        </View>
        
        {/* THE GLOBAL FOOTER: Now sits properly after the minHeight block */}
        <AppFooter />
      </ScrollView>

      {/* MOBILE OVERLAY MENU */}
      {isMobileMenuOpen && (
        <View 
          className="absolute left-0 right-0 bottom-0 bg-white z-[100] p-6"
          style={{ top: HEADER_HEIGHT }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {user ? (
              <View className="gap-y-6">
                 {/* User Profile Card */}
                 <View className="flex-row items-center gap-4 p-5 bg-slate-50 rounded-[32px] border border-slate-100">
                    <View className="h-14 w-14 bg-indigo-600 rounded-full items-center justify-center">
                      <Text className="text-white font-black text-xl">
                        {(user.full_name || 'U')[0].toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-lg font-black text-slate-900" numberOfLines={1}>{user.full_name}</Text>
                        {isAdmin && <AdminBadge />}
                      </View>
                      <Text className="text-slate-500 text-xs font-medium" numberOfLines={1}>{user.email}</Text>
                    </View>
                 </View>

                 {/* Subscription status logic remains same... */}
                 <View className="gap-y-3">
                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-1">Subscribed Plans</Text>
                    {isAdmin ? (
                      <View className="bg-slate-900 p-4 rounded-2xl flex-row justify-between items-center">
                        <Text className="text-white font-bold text-sm">Root Administrator</Text>
                        <BadgeCheck size={16} color="#10b981" />
                      </View>
                    ) : (
                      <>
                        {currentPremiumDetails?.company && (
                          <View className="bg-emerald-500 p-4 rounded-2xl flex-row justify-between items-center">
                            <Text className="text-white font-bold text-sm">Company Plan</Text>
                            <Text className="text-white text-[9px] font-black">Ends: {formatExpirationDate(currentPremiumDetails.company.granted_at, currentPremiumDetails.company.plan_cycle)}</Text>
                          </View>
                        )}
                        {currentPremiumDetails?.family && (
                          <View className="bg-blue-500 p-4 rounded-2xl flex-row justify-between items-center">
                            <Text className="text-white font-bold text-sm">Family Plan</Text>
                            <Text className="text-white text-[9px] font-black">Ends: {formatExpirationDate(currentPremiumDetails.family.granted_at, currentPremiumDetails.family.plan_cycle)}</Text>
                          </View>
                        )}
                        {!currentPremiumDetails && (
                           <View className="bg-white p-4 rounded-2xl flex-row justify-between items-center border border-slate-200">
                              <Text className="text-slate-600 font-bold text-sm">Free Tier User</Text>
                              <Clock size={16} color="#94a3b8" />
                           </View>
                        )}
                      </>
                    )}
                 </View>

                 <View className="h-[1px] bg-slate-100 w-full my-2" />

                 <TouchableOpacity onPress={() => navigateTo("/settings")} className="flex-row items-center p-3 bg-slate-50 rounded-2xl">
                   <CogIcon size={22} color="#64748b" />
                   <Text className="ml-4 text-slate-700 font-bold text-base">Account Settings</Text>
                 </TouchableOpacity>

                 <TouchableOpacity onPress={() => { setIsMobileMenuOpen(false); handleLogout(); }} className="flex-row items-center p-3 bg-red-50 rounded-2xl">
                   <LogOut size={22} color="#ef4444" />
                   <Text className="ml-4 text-red-600 font-bold text-base">Sign Out</Text>
                 </TouchableOpacity>
              </View>
            ) : (
              <View className="gap-y-4 pt-4">
                 <TouchableOpacity onPress={() => navigateTo("/login")} className="w-full bg-slate-100 p-5 rounded-[24px] items-center border border-slate-200">
                   <Text className="text-slate-900 font-black text-base">Log In</Text>
                 </TouchableOpacity>
                 <TouchableOpacity onPress={() => navigateTo("/register")} className="w-full bg-indigo-600 p-5 rounded-[24px] items-center">
                   <Text className="text-white font-black text-base">Get Started</Text>
                 </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      )}

    </SafeAreaView>
  );
}