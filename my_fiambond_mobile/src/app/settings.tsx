"use client";

import React from 'react';
import { View, ScrollView } from 'react-native';
// Bridge to your Settings component
import Settings from "@/pages/realm/Settings";

/**
 * WEB/MOBILE CONVERSION: Settings Page
 * Logic: Removed 'onBack' dependency to treat Settings as a top-level Realm view.
 */
export default function Page() {
    return (
        <View className="flex-1 bg-white">
            {/* If your 'Settings' component has an internal back button 
                that triggers based on the 'onBack' prop, passing nothing 
                (or an empty fragment) will effectively disable/hide it.
            */}
            <Settings onBack={null} />
        </View>
    );
}