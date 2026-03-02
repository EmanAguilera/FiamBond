"use client";

import React, { useState, useEffect, useContext } from "react";
import { View, Text, ScrollView, SafeAreaView, ActivityIndicator } from "react-native";
import { Stack, useRouter } from "expo-router";
import { AppContext } from "@/context/AppContext";

// Import components and cast to 'any' to stop the Prop-mismatch errors
import UserDashboardViewRaw from "@/pages/realm/UserRealm";
import FamilyRealmViewRaw from "@/pages/realm/FamilyRealm";
import CompanyRealmViewRaw from "@/pages/realm/CompanyRealm";
import AdminRealmViewRaw from "@/pages/realm/AdminRealm";

const UserDashboardView = UserDashboardViewRaw as any;
const FamilyRealmView = FamilyRealmViewRaw as any;
const CompanyRealmView = CompanyRealmViewRaw as any;
const AdminRealmView = AdminRealmViewRaw as any;

// 1. Define the interface
interface AppContextType {
  user: any;
  loading: boolean;
  refreshUserData: () => void;
}

export default function RealmPage() {
  const router = useRouter();
  
  // 2. Fix the "null to AppContextType" error using 'unknown' as a bridge
  const contextValue = useContext(AppContext);
  const context = (contextValue as unknown) as AppContextType; 
  
  // 3. Provide safety fallbacks
  const user = context?.user;
  const loading = context?.loading;
  const refreshUserData = context?.refreshUserData || (() => {});
  
  const [currentView, setCurrentView] = useState<'personal' | 'family' | 'company' | 'admin'>('personal');
  const [activeData, setActiveData] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.replace("/login");
    }
  }, [mounted, loading, user, router]);

  const enterFamily = (familyData: any) => {
    setActiveData(familyData);
    setCurrentView('family');
  };

  const enterCompany = (companyData: any) => {
    setActiveData(companyData);
    setCurrentView('company');
  };

  const enterAdmin = () => {
    setActiveData(null);
    setCurrentView('admin');
  };

  const handleBack = () => {
    setActiveData(null);
    setCurrentView('personal');
  };

  if (!mounted || loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-4 text-slate-500 font-semibold">Authenticating...</Text>
      </View>
    );
  }

  if (!user) return null;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <Stack.Screen 
        options={{ 
          headerShown: currentView !== 'personal',
          title: activeData?.name || 'Manage Realm',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#f8fafc' }
        }} 
      />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4 md:p-8">
        <View className="max-w-xl mx-auto w-full">
          
          {currentView === 'personal' && (
            <UserDashboardView 
              onEnterFamily={enterFamily} 
              onEnterCompany={enterCompany} 
              onEnterAdmin={enterAdmin} 
            />
          )}

          {currentView === 'family' && activeData && (
            <FamilyRealmView 
              family={activeData} 
              onBack={handleBack} 
              onDataChange={refreshUserData}
              onFamilyUpdate={refreshUserData} 
            />
          )}

          {currentView === 'company' && activeData && (
            <CompanyRealmView 
              company={activeData} 
              onBack={handleBack} 
              onDataChange={refreshUserData} 
            />
          )}

          {currentView === 'admin' && (
            <AdminRealmView 
              onBack={handleBack} 
            />
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}