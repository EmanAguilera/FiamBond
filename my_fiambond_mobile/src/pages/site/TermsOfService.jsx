import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView 
} from "react-native";
import { 
  ArrowLeft, 
  FileCheck, 
  LayoutGrid, 
  UserCheck, 
  CreditCard, 
  AlertCircle 
} from "lucide-react-native";
import UnifiedLoadingWidget from "@/components/ui/UnifiedLoadingWidget";

export default function TermsOfService({ onBack }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Replicating the professional mount delay from your web code
    const timer = setTimeout(() => setMounted(true), 800);
    return () => clearTimeout(timer);
  }, []);

  // 🛡️ Loader Guard
  if (!mounted) {
    return (
      <UnifiedLoadingWidget 
        type="fullscreen" 
        message="Loading Service Terms..." 
        variant="indigo" 
      />
    );
  }

  // Helper for Bullet Points
  const BulletItem = ({ children }) => (
    <View className="flex-row mb-2 pr-4">
      <View className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-2 mr-3" />
      <Text className="text-slate-600 leading-5 text-sm flex-1">{children}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView 
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 24, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="max-w-4xl mx-auto w-full">
          
          {/* Back Button */}
          <TouchableOpacity 
            onPress={onBack}
            className="flex-row items-center mb-8"
          >
            <ArrowLeft size={20} color="#4f46e5" />
            <Text className="ml-2 text-indigo-600 font-bold text-base">Back to Home</Text>
          </TouchableOpacity>

          {/* Main Content Card (Next.js Shadow Style) */}
          <View className="bg-white rounded-[40px] shadow-2xl shadow-slate-200 p-8 border border-slate-100">
            
            {/* Header Section */}
            <View className="border-b border-slate-100 pb-8 mb-8">
              <View className="flex-row items-center gap-3 mb-2">
                <View className="bg-indigo-600 p-2 rounded-xl">
                  <FileCheck size={20} color="white" />
                </View>
                <Text className="text-3xl font-black text-slate-900 tracking-tighter">Terms of Service</Text>
              </View>
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px]">
                Last Updated: November 27, 2025
              </Text>
            </View>

            <View className="gap-y-10">
              
              {/* 1. ACCEPTANCE */}
              <View>
                <View className="flex-row items-center gap-2 mb-3">
                  <FileCheck size={18} color="#1e293b" />
                  <Text className="text-xl font-black text-slate-900">1. Acceptance of Terms</Text>
                </View>
                <Text className="text-slate-600 leading-6 text-base">
                  By creating an account or accessing FiamBond ("The Service"), you agree to be bound by these Terms. 
                  FiamBond is a digital ledger application designed for tracking financial records; it is <Text className="font-bold text-slate-900">not</Text> a bank, wallet, or financial institution.
                </Text>
              </View>

              {/* 2. DESCRIPTION */}
              <View>
                <View className="flex-row items-center gap-2 mb-3">
                  <LayoutGrid size={18} color="#1e293b" />
                  <Text className="text-xl font-black text-slate-900">2. Description of Service</Text>
                </View>
                <Text className="text-slate-600 leading-6 text-base mb-4">
                  FiamBond provides a platform for tracking loans, debts, and payroll through three distinct "Realms":
                </Text>
                <View className="pl-2">
                  <BulletItem><Text className="font-bold text-slate-900">Personal:</Text> For individual tracking and smart loans between friends.</BulletItem>
                  <BulletItem><Text className="font-bold text-slate-900">Family:</Text> Shared tracking for household expenses and budgets.</BulletItem>
                  <BulletItem><Text className="font-bold text-slate-900">Company:</Text> Professional suite for cash advances and payroll generation.</BulletItem>
                </View>
              </View>

              {/* 3. RESPONSIBILITIES */}
              <View>
                <View className="flex-row items-center gap-2 mb-3">
                  <UserCheck size={18} color="#1e293b" />
                  <Text className="text-xl font-black text-slate-900">3. User Responsibilities</Text>
                </View>
                <Text className="text-slate-600 leading-6 text-base">
                  You are solely responsible for the accuracy of the data you input. FiamBond acts as a calculator and storage 
                  system ("The Ledger of Truth"). We do not verify the legality or reality of the debts recorded.
                </Text>
              </View>

              {/* 4. SUBSCRIPTIONS */}
              <View className="bg-indigo-50 p-6 rounded-[32px] border border-indigo-100">
                <View className="flex-row items-center gap-2 mb-3">
                  <CreditCard size={18} color="#4338ca" />
                  <Text className="text-xl font-black text-indigo-900">4. Subscriptions</Text>
                </View>
                <Text className="text-indigo-800/80 leading-6 text-sm mb-4">
                  Access to "Company Realm" features requires a paid subscription.
                </Text>
                <View className="pl-1">
                  <BulletItem>Fees are billed in advance on a recurring basis.</BulletItem>
                  <BulletItem>You may cancel your subscription at any time.</BulletItem>
                </View>
              </View>

              {/* 5. DISCLAIMER */}
              <View>
                <View className="flex-row items-center gap-2 mb-3">
                  <AlertCircle size={18} color="#e11d48" />
                  <Text className="text-xl font-black text-slate-900">5. Disclaimer of Liability</Text>
                </View>
                <Text className="text-slate-600 leading-6 text-base">
                  FiamBond is provided <Text className="italic">"AS IS"</Text>. We are not liable for any disputes arising 
                  between users regarding debts or transaction records documented on the platform.
                </Text>
              </View>

            </View>
          </View>

          {/* Footer Quote */}
          <View className="mt-12 items-center">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[4px]">
              Law • Integrity • Accountability
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}