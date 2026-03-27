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

export default function AboutUs({ onBack }) {
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
        message="Initializing Archive..." 
        variant="indigo" 
      />
    );
  }

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
        {/* Max-width container to replicate the 'max-w-4xl' desktop look */}
        <View style={{ width: '100%', maxWidth: 896 }}>
          
          {/* Back Button */}
          <TouchableOpacity 
            onPress={onBack}
            className="flex-row items-center mb-6 self-start"
          >
            <ArrowLeft size={18} color="#4f46e5" strokeWidth={3} />
            <Text className="ml-2 text-indigo-600 font-bold text-sm">Back to Home</Text>
          </TouchableOpacity>

          {/* Main Content Card - Replicating Next.js 1:1 Shadow/Border/Padding */}
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
                About Us
              </Text>
              <Text className="text-gray-500 text-sm font-medium uppercase tracking-wider mt-1">
                The Story of the Ledger of Truth
              </Text>
            </View>

            {/* Body Sections - space-y-8 */}
            <View className="gap-y-8">
              
              {/* 1. WHY SECTION */}
              <View>
                <Text className="text-xl font-bold text-gray-900 mb-3">1. Why FiamBond?</Text>
                <Text className="text-gray-600 leading-7 text-base">
                  FiamBond was created to solve a fundamental problem: <Text className="font-bold text-gray-900">Financial Fragmentation.</Text> Most people track their personal money in one place, their family expenses in another, and their business records in a third.
                </Text>
                <Text className="text-gray-600 leading-7 text-base mt-3">
                  We asked, <Text className="italic">"Why not have one 'Ledger of Truth' that handles everything?"</Text> FiamBond provides a unified ecosystem where different financial "Realms" co-exist securely.
                </Text>
              </View>

              {/* 2. PROGRESS SECTION */}
              <View>
                <Text className="text-xl font-bold text-gray-900 mb-3">2. Our Progress</Text>
                <Text className="text-gray-600 leading-7 text-base">
                  This platform is a result of constant iteration and development. We have evolved from a simple transaction tracker into a comprehensive financial engine. Our current progress includes:
                </Text>
                
                {/* Custom List Items (list-disc replication) */}
                <View className="mt-4 gap-y-3 pl-2">
                  {[
                    { label: "The Realm System", desc: "Specialized environments for Personal, Family, and Corporate accounting." },
                    { label: "Automated Insights", desc: "Real-time analytics that visualize growth and spending habits." },
                    { label: "Strategic Goals", desc: "Tools that help users achieve specific financial targets." },
                    { label: "Corporate Integrity", desc: "A full-scale payroll and disbursement system for small businesses." }
                  ].map((item, idx) => (
                    <View key={idx} className="flex-row items-start">
                      <Text className="text-gray-400 mr-3 text-lg">•</Text>
                      <Text className="flex-1 text-gray-600 leading-6 text-base">
                        <Text className="font-bold text-gray-800">{item.label}: </Text>
                        {item.desc}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 3. THREE REALMS (Responsive Grid - Columns on Mobile, Row on Desktop) */}
              <View>
                <Text className="text-xl font-bold text-gray-900 mb-3">3. The Three Realms</Text>
                <Text className="text-gray-600 leading-7 text-base mb-4">
                  We believe financial management happens at three distinct levels:
                </Text>
                
                <View 
                  style={{ 
                    flexDirection: isDesktop ? 'row' : 'column', 
                    gap: 16 
                  }}
                >
                  {[
                    { title: "Personal", desc: "Your private daily financial habits and security." },
                    { title: "Family", desc: "Shared accountability and collective growth." },
                    { title: "Corporate", desc: "Professional payroll and business-grade transparency." }
                  ].map((realm, idx) => (
                    <View 
                      key={idx} 
                      className="p-4 bg-slate-50 border border-slate-100 rounded-2xl"
                      style={{ flex: isDesktop ? 1 : 0 }}
                    >
                      <Text className="font-bold text-indigo-600 text-sm mb-1">{realm.title}</Text>
                      <Text className="text-gray-500 text-xs leading-5">{realm.desc}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 4. LOOKING AHEAD */}
              <View>
                <Text className="text-xl font-bold text-gray-900 mb-3">4. Looking Ahead</Text>
                <Text className="text-gray-600 leading-7 text-base">
                  Our journey is far from over. We are currently working on expanding our automated reporting features, enhancing loan tracking algorithms, and streamlining the user experience to ensure that the "Ledger of Truth" remains the most reliable financial tool in your arsenal.
                </Text>
              </View>

            </View>
          </View>

          {/* Footer Decoration */}
          <View className="py-12 items-center">
            <View className="h-[1px] w-12 bg-gray-200 mb-4" />
            <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-[4px]">
              Transparency • Integrity • Growth
            </Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}