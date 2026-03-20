"use client";

import "./globals.css"; 
import React from "react";
import { Stack } from "expo-router";
import Head from "expo-router/head"; 
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppProvider from "@/context/AppContext";
// 1. Import MainShell
import MainShell from "@/components/ui/MainShell"; 

export default function RootLayout() {
  return (
    <AppProvider>
      <Head>
        <title>FiamBond | Unified Financial Realm</title>
        <meta name="description" content="Secure financial tracking for individuals, families, and companies." />
      </Head>
      
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {/* 2. Wrap the Stack in MainShell */}
        <MainShell>
            <Stack
            screenOptions={{
                headerShown: false, // Keep this false because MainShell provides the header
                contentStyle: { backgroundColor: '#f9fafb' },
                animation: 'slide_from_right',
            }}
            >
            <Stack.Screen name="index" />
            <Stack.Screen name="realm" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="(auth)/login" />
            <Stack.Screen name="(auth)/register" />
            <Stack.Screen name="(auth)/verify-email" />
            <Stack.Screen name="(legal)/about-us" />
            <Stack.Screen name="(legal)/privacy" />
            <Stack.Screen name="(legal)/terms" />
            </Stack>
        </MainShell>
      </SafeAreaProvider>
    </AppProvider>
  );
}