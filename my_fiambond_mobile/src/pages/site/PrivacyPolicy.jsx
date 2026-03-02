import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView 
} from "react-native";
import { ArrowLeft, ShieldCheck, Database, Eye, Lock, UserCheck } from "lucide-react-native";
import UnifiedLoadingWidget from "@/components/ui/UnifiedLoadingWidget";

export default function PrivacyPolicy({ onBack }) {
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
        message="Retrieving Ledger Protocols..." 
        variant="indigo" 
      />
    );
  }

  // Helper for custom Bullet Points (since RN doesn't have <ul>)
  const BulletItem = ({ children }) => (
    <View className="flex-row mb-2 pr-4">
      <Text className="text-indigo-600 mr-2 font-bold">•</Text>
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
          
          {/* Back Button - Styled like the Home Link */}
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
                <View className="bg-emerald-500 p-2 rounded-xl">
                  <ShieldCheck size={20} color="white" />
                </View>
                <Text className="text-3xl font-black text-slate-900 tracking-tighter">Privacy Policy</Text>
              </View>
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[2px]">
                Effective Date: November 27, 2025
              </Text>
            </View>

            <View className="gap-y-10">
              
              {/* 1. COLLECTION SECTION */}
              <View>
                <View className="flex-row items-center gap-2 mb-3">
                  <Database size={18} color="#1e293b" />
                  <Text className="text-xl font-black text-slate-900">1. Information We Collect</Text>
                </View>
                <Text className="text-slate-600 leading-6 text-base mb-4">
                  To operate the Ledger of Truth, we collect the following types of information:
                </Text>
                <View className="pl-2">
                  <BulletItem><Text className="font-bold text-slate-900">Account Info:</Text> Name, email address, and encrypted password.</BulletItem>
                  <BulletItem><Text className="font-bold text-slate-900">Financial Data:</Text> Transaction amounts, notes, and loan statuses.</BulletItem>
                  <BulletItem><Text className="font-bold text-slate-900">Realm Context:</Text> Connections to Family or Company realms.</BulletItem>
                </View>
              </View>

              {/* 2. USAGE SECTION */}
              <View>
                <View className="flex-row items-center gap-2 mb-3">
                  <Eye size={18} color="#1e293b" />
                  <Text className="text-xl font-black text-slate-900">2. How We Use Your Data</Text>
                </View>
                <Text className="text-slate-600 leading-6 text-base mb-4">
                  We use your data solely to provide the Service functionality:
                </Text>
                <View className="pl-2">
                  <BulletItem>Calculating balances and debt totals.</BulletItem>
                  <BulletItem>Generating PDF payslips and invoices.</BulletItem>
                  <BulletItem>Sending notifications for loan requests.</BulletItem>
                  <BulletItem><Text className="font-bold text-indigo-600">No Data Selling:</Text> We never sell financial data to third parties.</BulletItem>
                </View>
              </View>

              {/* 3. SECURITY SECTION */}
              <View className="bg-slate-900 p-6 rounded-[32px]">
                <View className="flex-row items-center gap-2 mb-3">
                  <Lock size={18} color="#f8fafc" />
                  <Text className="text-xl font-black text-white">3. Data Security</Text>
                </View>
                <Text className="text-slate-400 leading-6 text-sm">
                  Security is our top priority. We use industry-standard <Text className="text-white font-bold">AES-256 encryption</Text> for 
                  sensitive data. No method of transmission over the Internet is 100% secure, but we enforce root-level protocols to protect your ledger.
                </Text>
              </View>

              {/* 4. DATA SHARING SECTION */}
              <View>
                <View className="flex-row items-center gap-2 mb-3">
                  <UserCheck size={18} color="#1e293b" />
                  <Text className="text-xl font-black text-slate-900">4. Data Sharing</Text>
                </View>
                <Text className="text-slate-600 leading-6 text-base">
                  Data entered into a <Text className="font-bold text-slate-900">Shared Realm</Text> is visible to other members of that Realm 
                  based on permission levels. You accept that invited members can view the transaction history of the specific realm they join.
                </Text>
              </View>

              {/* 5. YOUR RIGHTS SECTION */}
              <View>
                <View className="flex-row items-center gap-2 mb-3">
                  <UserCheck size={18} color="#1e293b" />
                  <Text className="text-xl font-black text-slate-900">5. Your Rights</Text>
                </View>
                <Text className="text-slate-600 leading-6 text-base">
                  You have the right to request an export of your data or account deletion. Deleting your account 
                  will remove personal access, though group transaction records may persist to maintain ledger integrity for other users.
                </Text>
              </View>

            </View>
          </View>

          {/* Footer Branding */}
          <View className="mt-12 items-center">
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[4px]">
              Secure • Encrypted • Private
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}