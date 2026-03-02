"use client";

import React from 'react';
import { Stack } from 'expo-router';
// Import the converted mobile version of your VerifyEmail component
import VerifyEmailPage from '@/pages/auth/VerifyEmail'; 

/**
 * MOBILE CONVERSION: Verify Email Page
 * Replaces 'app/verify-email/page.tsx' logic.
 * * DESIGN PRESERVATION:
 * 1. Title "Verify Email | Fiambond" is moved to the Navigation Stack.
 * 2. Functionality is preserved by bridging to the native UI component.
 */
export default function Page() {
  return (
    <>
      {/* In React Native, Stack.Screen handles what the user sees 
          in the header, replacing Next.js Metadata.
      */}
      <Stack.Screen 
        options={{ 
          title: 'Verify Email | Fiambond',
          headerShown: true, // Often true for verification to allow a 'Back' button to Login
          headerBackTitle: 'Login',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
        }} 
      />
      
      {/* UI BRIDGE:
          The actual verification logic and view.
      */}
      <VerifyEmailPage />
    </>
  );
}