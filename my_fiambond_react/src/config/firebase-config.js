import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  // Your real config keys
  apiKey: "AIzaSyCxEaw9NxHWDCFEACZoZXIURvjTqLLZ7cc",
  authDomain: "fiambond.firebaseapp.com",
  projectId: "fiambond",
  storageBucket: "fiambond.appspot.com",
  messagingSenderId: "818608486797",
  appId: "1:818608486797:web:6cc95c9bb5493958ca65c4",
  measurementId: "G-B003MQ68XE"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);
const googleProvider = new GoogleAuthProvider();

// --- THIS IS THE SMART SWITCH ---
// It reads the variable from your .env.local file.
// import.meta.env is how Vite exposes environment variables.
const FIREBASE_MODE = import.meta.env.VITE_FIREBASE_MODE;

// Connect to the emulators ONLY if the switch is set to 'local'
if (FIREBASE_MODE === 'local') {
  console.warn("🔥🔥🔥 CONNECTING TO LOCAL FIREBASE EMULATORS 🔥🔥🔥");
  
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
} else {
  // If the switch is 'live' or not set, connect to the real Firebase.
  console.log("✅✅✅ CONNECTING TO LIVE PRODUCTION FIREBASE ✅✅✅");
}

export { auth, googleProvider, db, functions };