import { initializeApp, FirebaseOptions } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
// Import Platform from react-native to check the environment
import { Platform } from "react-native"; 

// --- CONDITIONAL IMPORTS FOR NATIVE PERSISTENCE ---
let getAuth, GoogleAuthProvider, initializeAuth, getReactNativePersistence, ReactNativeAsyncStorage;

if (Platform.OS !== 'web') {
  // Only import these packages on native (mobile) environments
  ({ getAuth, GoogleAuthProvider, initializeAuth, getReactNativePersistence } = require("firebase/auth"));
  ReactNativeAsyncStorage = require("@react-native-async-storage/async-storage").default;
} else {
  // Use standard web imports for Firebase/Auth on web
  ({ getAuth, GoogleAuthProvider } = require("firebase/auth"));
}
// --- END CONDITIONAL IMPORTS ---

// Your configuration is the same
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyCxEaw9NxHWDCFEACZoZXIURvjTqLLZ7cc",
  authDomain: "fiambond.firebaseapp.com",
  projectId: "fiambond",
  storageBucket: "fiambond.firebasestorage.app",
  messagingSenderId: "818608486797",
  appId: "1:818608486797:web:6cc95c9bb5493958ca65c4",
  measurementId: "G-B003MQ68XE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// --- CONDITIONAL AUTH INITIALIZATION ---
let authInstance;

if (Platform.OS !== 'web' && initializeAuth) {
    // Mobile/Native Logic (Fixes WARN on mobile)
    authInstance = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
} else if (getAuth) {
    // Web Logic (Ensures web keeps working)
    authInstance = getAuth(app);
}

// Export services
export const auth = authInstance;
export const googleProvider = new GoogleAuthProvider();
export const db: Firestore = getFirestore(app);