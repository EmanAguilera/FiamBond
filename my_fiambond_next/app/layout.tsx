"use client";

import React from "react";
import "./globals.css";
import AppProvider from "../src/Context/AppContext"; 
import MainShell from "../src/Components/MainShell";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppProvider>
          <MainShell>
            {children}
          </MainShell>
        </AppProvider>
      </body>
    </html>
  );
}