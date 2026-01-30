"use client"; // ⭐️ This handles all your React Context & Hooks

import React from "react";
import AppProvider from "../context/AppContext"; 
import MainShell from "../components/layout/MainShell";

export default function ClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <MainShell>
        {children}
      </MainShell>
    </AppProvider>
  );
}