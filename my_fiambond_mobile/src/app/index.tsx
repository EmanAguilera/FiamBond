"use client";

import React, { useEffect, useContext, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router'; 
import { AppContext } from '@/context/AppContext';
import WelcomeScreen from '@/pages/site/WelcomePage';
import UnifiedLoadingWidget from '@/components/ui/UnifiedLoadingWidget';

export default function Page() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  
  const context = useContext(AppContext as any) as any;
  const user = context?.user;
  const loading = context?.loading;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading === false && user) {
      router.replace('/realm'); 
    }
  }, [user, loading, router]);

  if (loading === true && !isReady) {
    return (
      <UnifiedLoadingWidget 
        type="fullscreen" 
        message="Syncing FiamBond..." 
        variant="indigo" 
      />
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-white" 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View className="flex-1">
        <WelcomeScreen />
      </View>
    </ScrollView>
  );
}
