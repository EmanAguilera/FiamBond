"use client";

import React from "react";
import { useRouter } from 'expo-router';
import AboutUsPage from '@/pages/site/AboutUs';

export default function Page() {
  const router = useRouter();

  return (
    <AboutUsPage onBack={() => router.back()} />
  );
}