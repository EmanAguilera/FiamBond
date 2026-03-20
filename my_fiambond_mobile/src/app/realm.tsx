"use client";

import React, { useEffect, useContext, useState } from "react";
import { View, ScrollView, SafeAreaView, ActivityIndicator, useWindowDimensions } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { AppContext } from "@/context/AppContext";

// 1. Import Raw and cast to 'any' immediately to ignore prop mismatch
import UserDashboardViewRaw from "@/pages/realm/UserRealm";
import FamilyRealmViewRaw from "@/pages/realm/FamilyRealm";
import CompanyRealmViewRaw from "@/pages/realm/CompanyRealm";
import AdminRealmViewRaw from "@/pages/realm/AdminRealm";

const UserDashboard: any = UserDashboardViewRaw;
const FamilyRealm: any = FamilyRealmViewRaw;
const CompanyRealm: any = CompanyRealmViewRaw;
const AdminRealm: any = AdminRealmViewRaw;

export default function RealmPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const isDesktop = width > 1024;

  const context = useContext(AppContext) as any;
  const user = context?.user;
  const loading = context?.loading;
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !loading && !user) router.replace("/login");
  }, [mounted, loading, user]);

  if (!mounted || loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!user) return null;

  const contentWidthClass = isDesktop ? "w-full max-w-[1440px] px-10" : "w-full px-0";

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }} 
        className="flex-1"
        showsVerticalScrollIndicator={isDesktop} 
      >
        <View className={contentWidthClass}>
          
          {/* 2. Passive Pass-through: 
              We send the data. If the component uses it, fine. 
              If not, it doesn't break the bridge. 
          */}
          
          {(!params.view || params.view === 'personal') && (
            <UserDashboard 
              user={user} 
              params={params} 
              router={router} 
              onEnterAdmin={() => router.push('/realm?view=admin')}
            />
          )}

          {params.view === 'family' && (
            <FamilyRealm user={user} params={params} router={router} />
          )}

          {params.view === 'company' && (
            <CompanyRealm user={user} params={params} router={router} />
          )}

          {params.view === 'admin' && (
            <AdminRealm user={user} params={params} router={router} onBack={() => router.replace('/realm')} />
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}