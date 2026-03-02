import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView 
} from "react-native";
import { ArrowLeft, Target, TrendingUp, Shield, Layers } from "lucide-react-native";
import UnifiedLoadingWidget from "@/components/ui/UnifiedLoadingWidget";

export default function AboutUs({ onBack }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Simulating the mounting logic from your Next.js file
    const timer = setTimeout(() => setMounted(true), 800);
    return () => clearTimeout(timer);
  }, []);

  // 🛡️ Loader Guard
  if (!mounted) {
    return (
      <UnifiedLoadingWidget 
        type="fullscreen" 
        message="Loading the Archive..." 
        variant="indigo" 
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView 
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 24, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="max-w-4xl mx-auto w-full">
          
          {/* Back Button - Styled like a Web Link */}
          <TouchableOpacity 
            onPress={onBack}
            className="flex-row items-center mb-8"
          >
            <ArrowLeft size={20} color="#4f46e5" />
            <Text className="ml-2 text-indigo-600 font-bold text-base">Back to Home</Text>
          </TouchableOpacity>

          {/* Main Content Card (The "Next.js" Paper Look) */}
          <View className="bg-white rounded-[40px] shadow-2xl shadow-slate-200 p-8 border border-slate-100">
            
            {/* Header Section */}
            <View className="border-b border-slate-100 pb-8 mb-8">
              <View className="flex-row items-center gap-3 mb-2">
                <View className="bg-indigo-600 p-2 rounded-xl">
                  <Shield size={20} color="white" />
                </View>
                <Text className="text-3xl font-black text-slate-900 tracking-tighter">About Us</Text>
              </View>
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px]">
                The Story of the Ledger of Truth
              </Text>
            </View>

            <View className="gap-y-8">
              {/* 1. WHY SECTION */}
              <View>
                <View className="flex-row items-center gap-2 mb-3">
                  <Target size={18} color="#1e293b" />
                  <Text className="text-xl font-black text-slate-900">1. Why FiamBond?</Text>
                </View>
                <Text className="text-slate-600 leading-6 text-base">
                  FiamBond was created to solve a fundamental problem: <Text className="font-bold text-slate-900">Financial Fragmentation.</Text> 
                  Most people track their personal money in one place, their family expenses in another, 
                  and their business records in a third. 
                </Text>
                <Text className="text-slate-600 leading-6 text-base mt-3 italic">
                  "Why not have one 'Ledger of Truth' that handles everything?"
                </Text>
              </View>

              {/* 2. PROGRESS SECTION */}
              <View>
                <View className="flex-row items-center gap-2 mb-3">
                  <TrendingUp size={18} color="#1e293b" />
                  <Text className="text-xl font-black text-slate-900">2. Our Progress</Text>
                </View>
                <Text className="text-slate-600 leading-6 text-base mb-4">
                  We have evolved from a simple transaction tracker into a comprehensive financial engine:
                </Text>
                
                <View className="gap-y-3">
                  {[
                    { label: "The Realm System", desc: "Specialized Personal, Family, and Corporate environments." },
                    { label: "Automated Insights", desc: "Real-time analytics and growth visualization." },
                    { label: "Strategic Goals", desc: "Tools to achieve specific financial targets." },
                    { label: "Corporate Integrity", desc: "Full-scale payroll and disbursement systems." }
                  ].map((item, idx) => (
                    <View key={idx} className="flex-row gap-3">
                      <View className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-2" />
                      <Text className="flex-1 text-slate-600 leading-5">
                        <Text className="font-bold text-slate-900">{item.label}:</Text> {item.desc}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 3. THREE REALMS (Converted from Grid to List for Mobile) */}
              <View>
                <View className="flex-row items-center gap-2 mb-4">
                  <Layers size={18} color="#1e293b" />
                  <Text className="text-xl font-black text-slate-900">3. The Three Realms</Text>
                </View>
                
                <View className="gap-y-3">
                  <View className="p-5 bg-slate-50 rounded-[24px] border border-slate-100">
                    <Text className="font-black text-indigo-600 text-sm mb-1 uppercase tracking-widest">Personal</Text>
                    <Text className="text-slate-600 text-sm leading-5">Your private daily financial habits and security.</Text>
                  </View>
                  
                  <View className="p-5 bg-slate-50 rounded-[24px] border border-slate-100">
                    <Text className="font-black text-indigo-600 text-sm mb-1 uppercase tracking-widest">Family</Text>
                    <Text className="text-slate-600 text-sm leading-5">Shared accountability and collective growth.</Text>
                  </View>

                  <View className="p-5 bg-slate-50 rounded-[24px] border border-slate-100">
                    <Text className="font-black text-indigo-600 text-sm mb-1 uppercase tracking-widest">Corporate</Text>
                    <Text className="text-slate-600 text-sm leading-5">Professional payroll and business transparency.</Text>
                  </View>
                </View>
              </View>

              {/* 4. LOOKING AHEAD */}
              <View className="bg-indigo-50 p-6 rounded-[32px] border border-indigo-100">
                <Text className="text-lg font-black text-indigo-900 mb-2">4. Looking Ahead</Text>
                <Text className="text-indigo-800/80 leading-6 text-base">
                  Our journey is far from over. We are expanding automated reporting, 
                  enhancing loan tracking algorithms, and ensuring the "Ledger of Truth" 
                  remains your most reliable tool.
                </Text>
              </View>
            </View>
          </View>

          {/* Footer Quote */}
          <View className="mt-12 items-center">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[4px]">
              Precision • Transparency • Growth
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}