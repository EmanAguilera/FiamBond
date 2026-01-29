'use client'; // Change to client for the auth check

import { useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AppContext } from '@/src/Context/AppContext';
import WelcomePage from '@/src/Pages/Landing/WelcomePage';

export default function Page() {
  const { user, loading } = useContext(AppContext);
  const router = useRouter();

  useEffect(() => {
    // If user is logged in and not loading, send them straight to the realm
    if (!loading && user) {
      router.push('/realm');
    }
  }, [user, loading, router]);

  return <WelcomePage />;
}