"use client";

import React from 'react';
import { Stack, useRouter } from 'expo-router';
// Bridge to your converted Mobile Settings component
import Settings from "@/pages/realm/Settings";

/**
 * MOBILE CONVERSION: Settings Page
 * FIX: Added the 'onBack' prop required by the Settings component.
 */
export default function Page() {
    const router = useRouter();

    return (
        <>
            <Stack.Screen 
                options={{ 
                    title: 'Settings',
                    headerShown: true,
                    headerTitleStyle: {
                        fontWeight: '600',
                    },
                }} 
            />
            
            {/* FIX: We pass router.back() to the onBack prop.
               This satisfies the TypeScript error 'Property onBack is missing'.
            */}
            <Settings onBack={() => router.back()} />
        </>
    );
}