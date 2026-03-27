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

export default function PrivacyPolicy({ onBack }) {
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
        message="Retrieving Security Protocols..." 
        variant="indigo" 
      />
    );
  }

  // Helper for 1:1 Bullet Point replication
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
                Privacy Policy
              </Text>
              <Text className="text-gray-500 text-sm font-medium uppercase tracking-wider mt-1">
                Effective Date: November 27, 2025
              </Text>
            </View>

            {/* Body Sections - space-y-8 */}
            <View className="gap-y-8">
              
              {/* 1. COLLECTION SECTION */}
              <View>
                <Text className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</Text>
                <Text className="text-gray-600 leading-7 text-base mb-3">
                  To operate the Ledger of Truth, we collect the following types of information:
                </Text>
                <BulletItem>
                  <Text className="font-bold text-gray-800">Account Information: </Text>
                  Name, email address, and encrypted password.
                </BulletItem>
                <BulletItem>
                  <Text className="font-bold text-gray-800">Financial Data: </Text>
                  Transaction amounts, dates, notes, and loan statuses inputted by you.
                </BulletItem>
                <BulletItem>
                  <Text className="font-bold text-gray-800">Realm Associations: </Text>
                  Connections to Family or Company realms (employee lists, payroll records).
                </BulletItem>
              </View>

              {/* 2. USAGE SECTION */}
              <View>
                <Text className="text-xl font-bold text-gray-900 mb-3">2. How We Use Your Data</Text>
                <Text className="text-gray-600 leading-7 text-base">
                  We use your data solely to provide the Service functionality:
                </Text>
                <View className="mt-2">
                  <BulletItem>Calculating balances and debt totals.</BulletItem>
                  <BulletItem>Generating PDF payslips and invoices.</BulletItem>
                  <BulletItem>Sending notifications for loan requests or updates.</BulletItem>
                  <BulletItem>
                    We <Text className="font-bold text-gray-900">never</Text> sell your personal financial data to third-party advertisers.
                  </BulletItem>
                </View>
              </View>

              {/* 3. SECURITY SECTION */}
              <View>
                <Text className="text-xl font-bold text-gray-900 mb-3">3. Data Security</Text>
                <Text className="text-gray-600 leading-7 text-base">
                  Security is our top priority. We use industry-standard <Text className="font-bold text-gray-900">AES-256 encryption</Text> for sensitive data stored in our database. While we strive to protect your personal information, no method of transmission over the Internet is 100% secure.
                </Text>
              </View>

              {/* 4. DATA SHARING SECTION */}
              <View>
                <Text className="text-xl font-bold text-gray-900 mb-3">4. Data Sharing</Text>
                <Text className="text-gray-600 leading-7 text-base">
                  Data entered into a <Text className="font-bold text-gray-900">Shared Realm</Text> (Family or Company) is visible to other members of that Realm based on their permission levels (Admin, Member, Viewer). You accept that invited members can view the transactions associated with that Realm.
                </Text>
              </View>

              {/* 5. YOUR RIGHTS SECTION */}
              <View>
                <Text className="text-xl font-bold text-gray-900 mb-3">5. Your Rights</Text>
                <Text className="text-gray-600 leading-7 text-base">
                  You have the right to request an export of your data or the deletion of your account. Deleting your account will permanently remove your personal access to the ledger, though transaction records involving other users may persist in their history to maintain ledger integrity.
                </Text>
              </View>

            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}