import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  initializeAuth, 
  getReactNativePersistence, 
  GoogleAuthProvider 
} from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// 1. Initialize App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 2. Initialize Firestore
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// 3. Initialize Auth (Platform Sensitive)
// We use a ternary operator here so the variable is assigned immediately.
// This prevents the "implicitly has type any" error in VS Code.
const auth = Platform.OS === 'web' 
  ? getAuth(app) 
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });

export const googleProvider = new GoogleAuthProvider();
export { auth };