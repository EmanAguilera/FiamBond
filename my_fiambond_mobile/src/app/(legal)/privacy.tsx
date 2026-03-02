"use client";

import React from 'react';
import { useRouter } from 'expo-router'; // 1. Import useRouter
// Import the converted mobile version of your PrivacyPolicy component
import PrivacyPolicyPage from '@/pages/site/PrivacyPolicy'; 

export default function Page() {
  const router = useRouter(); // 2. Initialize the router

  return (
    <>
      {/* 3. Pass the required onBack prop */}
      <PrivacyPolicyPage onBack={() => router.back()} />
    </>
  );
}