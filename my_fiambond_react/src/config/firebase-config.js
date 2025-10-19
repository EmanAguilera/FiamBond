
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCxEaw9NxHWDCFEACZoZXIURvjTqLLZ7cc",
  authDomain: "fiambond.firebaseapp.com",
  projectId: "fiambond",
  storageBucket: "fiambond.firebasestorage.app",
  messagingSenderId: "818608486797",
  appId: "1:818608486797:web:6cc95c9bb5493958ca65c4",
  measurementId: "G-B003MQ68XE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const db = getFirestore(app);

