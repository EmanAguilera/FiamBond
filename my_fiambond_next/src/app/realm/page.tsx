"use client";

import React, { useEffect, useState, useContext } from "react";
// NOTE: Use "next/navigation" for Web/Next.js or "expo-router" for Mobile
import { useRouter } from "next/navigation"; 
import { AppContext } from "@/src/context/AppContext";

// 🏎️ Simplex UI: Import the unified loader
import UnifiedLoadingWidget from "@/src/components/ui/UnifiedLoadingWidget";

// Bridge to your Pages folder components
import UserDashboard from "@/src/pages/realm/UserRealm";
import FamilyRealm from "@/src/pages/realm/FamilyRealm";
import CompanyRealm from "@/src/pages/realm/CompanyRealm";
import AdminDashboard from "@/src/pages/realm/AdminRealm";

export default function RealmPage() {
  const router = useRouter();
  
  // ⭐️ CRITICAL FIX: Safe context access
  const context = useContext(AppContext) || {}; 
  const { user, loading, refreshUserData } = context;
  
  const [currentView, setCurrentView] = useState<'personal' | 'family' | 'company' | 'admin'>('personal');
  const [activeData, setActiveData] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  // Prevention of hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // 🛡️ AUTH REDIRECT EFFECT
  // This replaces the "if(mounted) router.push" inside the render body
  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push("/login");
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

  const handleRefresh = () => {
    if (refreshUserData) {
        refreshUserData();
    }
  };

  // 1. 🛡️ Loading State: While mounting or fetching user data
  if (!mounted || loading) {
    return (
      <UnifiedLoadingWidget 
        type="fullscreen" 
        message="Authenticating..." 
        variant="indigo" 
      />
    );
  }

  // 2. 🛡️ Unauthenticated State: Show redirecting message while the useEffect triggers
  if (!user) {
    return (
        <UnifiedLoadingWidget 
          type="fullscreen" 
          message="Redirecting to Login..." 
          variant="slate" 
        />
      );
  }

  // 3. ✅ Authenticated State: The "Heart Line" of your dashboard
  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {currentView === 'personal' && (
          <UserDashboard 
            onEnterFamily={enterFamily} 
            onEnterCompany={enterCompany} 
            onEnterAdmin={enterAdmin} 
          />
        )}

        {currentView === 'family' && activeData && (
          <FamilyRealm 
            family={activeData} 
            onBack={handleBack} 
            onDataChange={handleRefresh}
            onFamilyUpdate={handleRefresh}
          />
        )}

        {currentView === 'company' && activeData && (
          <CompanyRealm 
            company={activeData} 
            onBack={handleBack} 
            onDataChange={handleRefresh} 
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard 
            onBack={handleBack} 
          />
        )}

      </div>
    </main>
  );
}