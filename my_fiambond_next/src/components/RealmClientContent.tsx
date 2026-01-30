"use client"; // Your instruction remembered!

import { useState } from 'react';
import UserDashboard from '@/src/pages/realm/UserRealm';
import FamilyRealm from '@/src/pages/realm/FamilyRealm';
import CompanyRealm from '@/src/pages/realm/CompanyRealm';
import AdminDashboard from '@/src/pages/realm/AdminRealm';

export default function RealmClientContent() {
    const [currentView, setCurrentView] = useState<'personal' | 'family' | 'company' | 'admin'>('personal');
    const [activeData, setActiveData] = useState<any>(null);

    const enterFamily = (familyData: any) => { setActiveData(familyData); setCurrentView('family'); };
    const enterCompany = (companyData: any) => { setActiveData(companyData); setCurrentView('company'); };
    const enterAdmin = () => { setActiveData(null); setCurrentView('admin'); };
    const handleBack = () => { setActiveData(null); setCurrentView('personal'); };
    const handleRefresh = () => console.log("Global Realm Refresh Triggered");

    return (
        <main className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {currentView === 'personal' && <UserDashboard onEnterFamily={enterFamily} onEnterCompany={enterCompany} onEnterAdmin={enterAdmin} />}
                {currentView === 'family' && <FamilyRealm family={activeData} onBack={handleBack} onDataChange={handleRefresh} onFamilyUpdate={handleRefresh} />}
                {currentView === 'company' && <CompanyRealm company={activeData} onBack={handleBack} onDataChange={handleRefresh} />}
                {currentView === 'admin' && <AdminDashboard onBack={handleBack} />}
            </div>
        </main>
    );
}