"use client";

import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  useWindowDimensions,
  Platform
} from "react-native";
import { ArrowLeft } from "lucide-react-native";
import UnifiedLoadingWidget from "@/components/ui/UnifiedLoadingWidget";

export default function TermsOfService({ onBack }) {
  const [mounted, setMounted] = useState(false);
  const { width } = useWindowDimensions();

  // Desktop/Tablet breakpoints (Matching Next.js 'md' breakpoint)
  const isDesktop = width >= 768;

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 600);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <UnifiedLoadingWidget 
        type="fullscreen" 
        message="Loading Service Terms..." 
        variant="indigo" 
      />
    );
  }

  // Helper for 1:1 Bullet Point replication (matching Next.js list-disc)
  const BulletItem = ({ children }) => (
    <View className="flex-row items-start mb-2 pl-4">
      <Text className="text-gray-400 mr-3 text-lg">•</Text>
      <Text className="flex-1 text-gray-600 leading-7 text-base">
        {children}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ 
          paddingVertical: isDesktop ? 60 : 24, 
          paddingHorizontal: isDesktop ? 40 : 16,
          alignItems: 'center' 
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Max-width container to replicate 'max-w-4xl' desktop look */}
        <View style={{ width: '100%', maxWidth: 896 }}>
          
          {/* Back Button */}
          <TouchableOpacity 
            onPress={onBack}
            className="flex-row items-center mb-6 self-start"
          >
            <ArrowLeft size={18} color="#4f46e5" strokeWidth={3} />
            <Text className="ml-2 text-indigo-600 font-bold text-sm">Back to Home</Text>
          </TouchableOpacity>

          {/* Main Card - 1:1 Replication of the Next.js Shadow/Border/Padding */}
          <View 
            className="bg-white border border-gray-100 shadow-xl"
            style={{ 
              borderRadius: 24, // rounded-3xl
              padding: isDesktop ? 48 : 32, // p-8 md:p-12
              ...Platform.select({
                ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20 },
                android: { elevation: 10 }
              })
            }}
          >
            
            {/* Header Section */}
            <View className="border-b border-gray-100 pb-8 mb-8">
              <Text className="text-gray-900 font-extrabold tracking-tight" style={{ fontSize: isDesktop ? 36 : 30 }}>
                Terms of Service
              </Text>
              <Text className="text-gray-500 text-sm font-medium uppercase tracking-wider mt-1">
                Last Updated: November 27, 2025
              </Text>
            </View>

            {/* Body Sections - space-y-8 */}
            <View className="gap-y-8">
              
              {/* 1. ACCEPTANCE */}
              <View>
                <Text className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</Text>
                <Text className="text-gray-600 leading-7 text-base">
                  By creating an account or accessing FiamBond ("The Service"), you agree to be bound by these Terms. If you do not agree, you may not use the Service. FiamBond is a digital ledger application designed for tracking financial records; it is <Text className="font-bold text-gray-900">not</Text> a bank, wallet, or financial institution.
                </Text>
              </View>

              {/* 2. DESCRIPTION */}
              <View>
                <Text className="text-xl font-bold text-gray-900 mb-3">2. Description of Service</Text>
                <Text className="text-gray-600 leading-7 text-base mb-3">
                  FiamBond provides a platform for tracking loans, debts, and payroll through three distinct "Realms":
                </Text>
                <BulletItem>
                  <Text className="font-bold text-gray-800">Personal Realm: </Text>
                  For individual tracking and smart loans between friends.
                </BulletItem>
                <BulletItem>
                  <Text className="font-bold text-gray-800">Family Realm: </Text>
                  Shared tracking for household expenses and budgets.
                </BulletItem>
                <BulletItem>
                  <Text className="font-bold text-gray-800">Company Realm: </Text>
                  Professional suite for employee cash advances and payroll generation.
                </BulletItem>
              </View>

              {/* 3. RESPONSIBILITIES */}
              <View>
                <Text className="text-xl font-bold text-gray-900 mb-3">3. User Responsibilities</Text>
                <Text className="text-gray-600 leading-7 text-base">
                  You are solely responsible for the accuracy of the data you input. FiamBond acts as a calculator and storage system for the data you provide ("The Ledger of Truth"). We do not verify the legality or reality of the debts recorded.
                </Text>
              </View>

              {/* 4. SUBSCRIPTIONS */}
              <View>
                <Text className="text-xl font-bold text-gray-900 mb-3">4. Subscriptions & Payments</Text>
                <Text className="text-gray-600 leading-7 text-base mb-3">
                  Access to "Company Realm" features requires a paid subscription.
                </Text>
                <BulletItem>
                  <Text className="font-bold text-gray-800">Billing Cycle: </Text>
                  Fees are billed in advance on a recurring basis.
                </BulletItem>
                <BulletItem>
                  <Text className="font-bold text-gray-800">Cancellations: </Text>
                  You may cancel at any time.
                </BulletItem>
              </View>

              {/* 5. DISCLAIMER */}
              <View>
                <Text className="text-xl font-bold text-gray-900 mb-3">5. Disclaimer of Liability</Text>
                <Text className="text-gray-600 leading-7 text-base">
                  FiamBond is provided <Text className="italic">"AS IS"</Text>. We are not liable for any disputes arising between users regarding debts recorded on the platform.
                </Text>
              </View>

            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}