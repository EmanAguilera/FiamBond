'use client';

import React, { useContext, useState, useMemo } from "react";
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Dimensions,
  Pressable,
  StyleSheet
} from "react-native";
import { useRouter } from "expo-router";
import { AppContext } from "../../context/AppContext";
import { 
  LogOut, 
  Settings as CogIcon, 
  Menu, 
  X, 
  ChevronDown 
} from "lucide-react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = 70;

const AdminBadge = () => (
  <View className="bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full ml-2">
    <Text className="text-[10px] font-extrabold text-purple-700 uppercase tracking-wider">Admin</Text>
  </View>
);

export default function MainShell({ children }: { children: React.ReactNode }) {
  const { user, handleLogout }: any = useContext(AppContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopDropdownOpen, setIsDesktopDropdownOpen] = useState(false);
  const router = useRouter();

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const displayName = useMemo(() => {
    if (!user) return "Guest";
    return user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email?.split('@')[0] || "User";
  }, [user]);

  const navigateTo = (path: string) => {
    setIsMobileMenuOpen(false);
    setIsDesktopDropdownOpen(false);
    router.push(path as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      
      {/* HEADER */}
      <View 
        style={{ height: HEADER_HEIGHT }}
        className="bg-white border-b border-slate-100 px-4 flex-row items-center justify-between z-[60]"
      >
        {/* LOGO SECTION */}
        <TouchableOpacity 
          onPress={() => navigateTo(user ? "/realm" : "/")} 
          className="flex-row items-center gap-3"
        >
          <Image 
            source={require("../../../assets/images/FiamBond_Logo.png")} 
            style={{ width: 36, height: 36 }}
            resizeMode="contain" 
          />
          <View className="flex-row items-center">
            <Text className="text-2xl font-bold text-indigo-600 tracking-tight">FiamBond</Text>
            
            {/* UPDATED: "Realm" is now hidden on mobile and only flex (visible) on md screens */}
            {user && (
              <View className="hidden md:flex flex-row items-center">
                <View className="h-5 w-[1px] bg-gray-300 mx-3" />
                <Text className="text-lg text-gray-500 font-medium">Realm</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* RIGHT SIDE */}
        <View className="flex-row items-center">
          {user ? (
            <>
              {/* DESKTOP PROFILE TRIGGER */}
              <View className="hidden md:flex">
                <TouchableOpacity 
                  onPress={() => setIsDesktopDropdownOpen(!isDesktopDropdownOpen)}
                  className="flex-row items-center gap-3 p-1 rounded-lg"
                >
                  <View className="items-end mr-1">
                    <View className="flex-row items-center justify-end">
                      <Text className="text-sm font-bold text-gray-800 capitalize tracking-wide">{displayName}</Text>
                      {isAdmin && <AdminBadge />}
                    </View>
                  </View>
                  <View className="h-9 w-9 bg-indigo-100 rounded-full flex items-center justify-center border border-indigo-200 shadow-sm">
                    <Text className="text-indigo-700 font-bold">{displayName.charAt(0).toUpperCase()}</Text>
                  </View>
                  <ChevronDown size={14} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              {/* MOBILE HAMBURGER */}
              <TouchableOpacity 
                onPress={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 bg-gray-50 rounded-lg border border-gray-100"
              >
                {isMobileMenuOpen ? <X size={22} color="#475569" /> : <Menu size={22} color="#475569" />}
              </TouchableOpacity>
            </>
          ) : (
            <View className="flex-row items-center gap-4">
              <TouchableOpacity
                onPress={() => navigateTo("/login")}
                className="hidden sm:flex px-4 py-2"
              >
                <Text className="text-gray-700 font-semibold">
                  Log In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigateTo("/register")}
                className="bg-indigo-600 px-6 py-2.5 rounded-lg"
              >
                <Text className="text-white font-bold text-sm">
                  Get Started
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* DESKTOP DROPDOWN */}
      {isDesktopDropdownOpen && (
        <>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsDesktopDropdownOpen(false)} />
          <View 
            style={{ top: HEADER_HEIGHT - 5, right: 16 }}
            className="absolute w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-[100]"
          >
            <TouchableOpacity onPress={() => navigateTo("/settings")} className="flex-row items-center px-4 py-2">
              <CogIcon size={16} color="#374151" className="mr-2" />
              <Text className="text-sm text-gray-700 font-medium">Settings</Text>
            </TouchableOpacity>
            <View className="border-t border-gray-100 my-1" />
            <TouchableOpacity onPress={() => { setIsDesktopDropdownOpen(false); handleLogout(); }} className="flex-row items-center px-4 py-2">
              <LogOut size={16} color="#ef4444" className="mr-2" />
              <Text className="text-sm text-red-600 font-medium">Sign Out</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
        <View className="md:hidden border-t border-gray-200 bg-white shadow-lg absolute left-0 right-0 z-[100]" style={{ top: HEADER_HEIGHT }}>
          <View className="px-4 py-6 space-y-6">
            <View className="flex-row items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <View className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <Text className="text-indigo-700 font-bold">{displayName.charAt(0).toUpperCase()}</Text>
              </View>
              <View>
                <View className="flex-row items-center">
                  <Text className="font-bold text-gray-900">{displayName}</Text>
                  {isAdmin && <AdminBadge />}
                </View>
                <Text className="text-xs text-gray-500">{user?.email}</Text>
              </View>
            </View>

            <nav className="flex flex-col gap-2">
              <TouchableOpacity 
                onPress={() => navigateTo("/settings")}
                className="flex-row items-center gap-3 p-3 rounded-lg"
              >
                <CogIcon size={20} color="#374151" />
                <Text className="font-medium text-gray-700">Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                className="flex-row items-center gap-3 p-3 rounded-lg"
              >
                <LogOut size={20} color="#ef4444" />
                <Text className="font-medium text-red-600">Sign Out</Text>
              </TouchableOpacity>
            </nav>
          </View>
        </View>
      )}

      {/* CONTENT */}
      <ScrollView 
        className="flex-1 bg-slate-50"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ minHeight: SCREEN_HEIGHT - HEADER_HEIGHT }}>
          {children}
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}