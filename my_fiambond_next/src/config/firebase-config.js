// src/config/firebase-config.js (COMPLETE and CORRECTED)

"use client";

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// 1. Conditionally initialize the app if the API Key is present (prevents build crash)
let app = null;
if (typeof window !== 'undefined' && firebaseConfig.apiKey) {
    try {
        // Prevent re-initialization in development hot-reloads (not strictly needed 
        // with Next.js but good practice)
        app = initializeApp(firebaseConfig);
    } catch (e) {
        // If it fails (e.g., app already initialized), console the error and continue
        console.error("Firebase initialization failed:", e);
    }
}

// 2. Export modules using the conditional app object.
// These exports will be null during the problematic build phase, 
// forcing components to use guard clauses (which we fixed previously).
export const auth = app ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();
export const db = app ? getFirestore(app) : null;