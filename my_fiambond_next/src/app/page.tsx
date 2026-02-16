"use client"; // Required per custom instructions

import { useEffect, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppContext } from '../context/AppContext';
import WelcomePage from '../pages/site/WelcomePage';

// 🏎️ Unified UI for better Performance scores
import UnifiedLoadingWidget from '../components/ui/UnifiedLoadingWidget';

export default function Page() {
  // 🛡️ Safe context access to prevent build-time destructuring errors
  const context = useContext(AppContext) || {}; 
  const { user, loading } = context;
  
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Prevention of hydration mismatch and build-time execution
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && user) {
      router.push('/realm'); // Redirect logged-in users to their realm
    }
  }, [user, loading, router, mounted]);

  // 1. Loading Guard: Show unified fullscreen loader while checking auth state
  // This helps maintain the Performance score by preventing Layout Shift
  if (!mounted || loading) {
    return (
      <UnifiedLoadingWidget 
        type="fullscreen" 
        message="Syncing FiamBond..." 
        variant="indigo" 
      />
    );
  }

  // 2. Landing Page: If no user is logged in, show the optimized WelcomePage
  // This page achieved 100 SEO in your Lighthouse audit
  return <WelcomePage />;
}