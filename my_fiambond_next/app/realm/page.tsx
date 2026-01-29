"use client";

import { useState } from 'react';
import UserDashboard from '@/src/Pages/Personal/UserRealm';
import FamilyRealm from '@/src/Pages/Family/FamilyRealm';
import CompanyRealm from '@/src/Pages/Company/CompanyRealm';
import AdminDashboard from '@/src/Pages/Admin/AdminRealm';

export default function RealmPage() {
  const [currentView, setCurrentView] = useState<'personal' | 'family' | 'company' | 'admin'>('personal');
  const [activeData, setActiveData] = useState<any>(null);

  // Handlers for switching "Realms"
  const enterFamily = (familyData: any) => {
    setActiveData(familyData);
    setCurrentView('family');
  };

  const enterCompany = (companyData: any) => {
    setActiveData(companyData);
    setCurrentView('company');
  };

  // HANDLER ADDED TO SWITCH TO ADMIN VIEW
  const enterAdmin = () => {
    setActiveData(null);
    setCurrentView('admin');
  };

  const handleBack = () => {
    setActiveData(null);
    setCurrentView('personal');
  };

  // Necessary for syncing state between Soul components
  const handleRefresh = () => {
    console.log("Global Realm Refresh Triggered");
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* 1. PERSONAL REALM */}
        {currentView === 'personal' && (
          <UserDashboard 
            onEnterFamily={enterFamily} 
            onEnterCompany={enterCompany} 
            onEnterAdmin={enterAdmin} // <--- Passed to UserDashboard
          />
        )}

        {/* 2. FAMILY REALM */}
        {currentView === 'family' && (
          <FamilyRealm 
            family={activeData} 
            onBack={handleBack} 
            onDataChange={handleRefresh}
            onFamilyUpdate={handleRefresh}
          />
        )}

        {/* 3. COMPANY REALM */}
        {currentView === 'company' && (
          <CompanyRealm 
            company={activeData} 
            onBack={handleBack}
            onDataChange={handleRefresh} 
          />
        )}

        {/* 4. ADMIN REALM */}
        {currentView === 'admin' && (
          <AdminDashboard 
            onBack={handleBack} // AdminDashboard will now use this instead of router.push('/')
          />
        )}

      </div>
    </main>
  );
}