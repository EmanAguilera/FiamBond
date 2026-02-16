"use client";

import React, { useEffect, useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { AppContext } from "../../context/AppContext";

// 🏎️ Simplex UI: Import the unified loader
import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";

// Bridge to your Pages folder components
import UserDashboard from "../../pages/realm/UserRealm";
import FamilyRealm from "../../pages/realm/FamilyRealm";
import CompanyRealm from "../../pages/realm/CompanyRealm";
import AdminDashboard from "../../pages/realm/AdminRealm";

export default function RealmPage() {
  const router = useRouter();
  
  // ⭐️ CRITICAL FIX: Safe context access to prevent build-time crashes
  const context = useContext(AppContext) || {}; 
  const { user, loading, refreshUserData } = context;
  
  const [currentView, setCurrentView] = useState<'personal' | 'family' | 'company' | 'admin'>('personal');
  const [activeData, setActiveData] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  // Prevention of hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // 1. 🛡️ Unified Loading Guard
  // Ipinapakita ang fullscreen loader habang nagve-verify ng auth o naglo-load ang context
  if (!mounted || loading || !context) {
    return (
      <UnifiedLoadingWidget 
        type="fullscreen" 
        message="Authenticating..." 
        variant="indigo" 
      />
    );
  }

  // 2. 🛡️ Auth Guard
  if (!user) {
    if (mounted) router.push("/auth/login");
    // Habang naghihintay ng redirect, ipakita ang fullscreen loader
    return (
        <UnifiedLoadingWidget 
          type="fullscreen" 
          message="Redirecting to Login..." 
          variant="slate" 
        />
      );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Dito pumapasok ang 'Simplex' logic:
          Ang bawat dashboard ay tinatawag lang kapag ready na ang data.
        */}

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