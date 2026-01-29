// config/firebase-config.js

"use client";

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider} from "firebase/auth";
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

// --- FIX: Only initialize Firebase if the API Key is present ---
let app;
if (typeof window !== 'undefined' && firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
}

// Export modules with checks to avoid errors if app is not defined, 
// though the component logic should handle the app being unavailable.

// Provide fallbacks if the app didn't initialize
export const auth = app ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();
export const db = app ? getFirestore(app) : null;

// You must be sure your client components handle 'auth' being null! 
// However, the critical issue is solved: the app won't crash the build.
// If the app is correctly deployed, the secrets *will* be in the built file,
// and 'app' will successfully initialize when the client loads.