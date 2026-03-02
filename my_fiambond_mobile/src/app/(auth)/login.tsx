"use client";

import React from 'react';
import { Stack } from 'expo-router';
// Import your Mobile version of the Login component
import LoginPage from '@/pages/auth/Login'; 

/**
 * MOBILE CONVERSION
 * This replaces 'app/login/page.tsx'
 * React Native does not use 'metadata'. We use Stack.Screen for the title.
 */
export default function Page() {
  return (
    <>
      {/* This replaces your 'metadata' title for the mobile header */}
      <Stack.Screen 
        options={{ 
          title: 'Login | FiamBond',
          headerShown: false // Usually hidden for login screens
        }} 
      />
      
      {/* The actual UI component */}
      <LoginPage />
    </>
  );
}