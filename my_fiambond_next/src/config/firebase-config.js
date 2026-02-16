"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// 1. Improved Initialization Logic
// We use getApps() to check if the app exists already (prevents hot-reload errors)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 2. Initialize Firestore with Connection Fixes
// 'experimentalForceLongPolling' solves the "Could not reach backend" error.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, 
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();