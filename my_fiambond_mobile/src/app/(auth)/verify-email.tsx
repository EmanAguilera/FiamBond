"use client";

import React from 'react';
import { Stack } from 'expo-router';
// Inalis na ang Stack import dahil hindi na kailangan
import VerifyEmailPage from '@/pages/auth/VerifyEmail'; 

/**
 * MOBILE CONVERSION: Verify Email Page
 * REMOVED: Stack.Screen to hide/remove the navigation header.
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
          title: 'Verify Email | Fiambond',
          headerShown: false, // Set to true if you want a back button visible
          headerTitleStyle: {
            fontWeight: '600',
          },
        }} 
      />
      
      {/* UI PRESERVATION:
          The actual Registration UI logic.
      */}
      <VerifyEmailPage />
    </>
  );
}