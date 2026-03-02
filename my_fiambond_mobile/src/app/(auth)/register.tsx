"use client";

import React from 'react';
import { Stack } from 'expo-router';
// Import the converted mobile version of your Register component
import RegisterPage from '@/pages/auth/Register'; 

/**
 * MOBILE CONVERSION: Register Page
 * Replaces 'app/register/page.tsx' logic.
 * * DESIGN PRESERVATION:
 * 1. Title is preserved via Stack.Screen options.
 * 2. Functionality is maintained by importing the core RegisterPage UI.
 * 3. Layout is handled by Expo Router's file-based system.
 */
export default function Page() {
  return (
    <>
      {/* WEB-TO-MOBILE BRIDGE:
          This replaces your 'metadata = { title: "Register" }' 
          It tells the phone what to display in the top header.
      */}
      <Stack.Screen 
        options={{ 
          title: 'Register | Fiambond',
          headerShown: false, // Set to true if you want a back button visible
          headerTitleStyle: {
            fontWeight: '600',
          },
        }} 
      />
      
      {/* UI PRESERVATION:
          The actual Registration UI logic.
      */}
      <RegisterPage />
    </>
  );
}