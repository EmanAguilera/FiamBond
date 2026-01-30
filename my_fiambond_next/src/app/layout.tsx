import React from "react";
import "./globals.css";
import { Metadata } from "next";
import ClientProvider from "./ClientProvider"; 

// ⭐️ THE COMPLETE SEO & BRANDING METADATA
export const metadata: Metadata = {
  title: "FiamBond | Family & Company Finance",
  description: "Securely manage loans, transactions, and financial goals with your family or business.",
  
  // 1. Browser Tab Icons (Pointing to your Public folder)
  icons: {
    icon: "/FiamBond_Logo.png",
    shortcut: "/FiamBond_Logo.png",
    apple: "/FiamBond_Logo.png",
  },

  // 2. OpenGraph (Facebook, WhatsApp, LinkedIn)
  openGraph: {
    title: "FiamBond | Financial Bonds Made Easy",
    description: "The ultimate tool for tracking family loans and company expenses.",
    url: "https://fiambond.web.app", // Replace with your actual domain
    siteName: "FiamBond",
    images: [
      {
        url: "/FiamBond_Image.png", // The big preview image
        width: 1200,
        height: 630,
        alt: "FiamBond Dashboard Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  // 3. Twitter Card Metadata
  twitter: {
    card: "summary_large_image",
    title: "FiamBond | Secure Finance",
    description: "Manage your family and business finances in one secure place.",
    images: ["/FiamBond_Image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ClientProvider>
          {children}
        </ClientProvider>
      </body>
    </html>
  );
}