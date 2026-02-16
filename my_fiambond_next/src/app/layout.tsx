import { Metadata } from "next";
import "./globals.css";
import AppProvider from "../context/AppContext"; 
import MainShell from "../components/ui/MainShell";

// This is the "Foundation" - it applies to ALL pages automatically
export const metadata: Metadata = {
  title: {
    template: "%s | Fiambond", // %s is the dynamic part (Login, Register, etc.)
    default: "Fiambond | Unified Financial Realm", 
  },
  description: "Unified financial management for individuals, families, and companies.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppProvider>
          <MainShell>{children}</MainShell>
        </AppProvider>
      </body>
    </html>
  );
}