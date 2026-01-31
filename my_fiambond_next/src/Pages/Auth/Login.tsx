"use client";

import React, { useState, FormEvent, ChangeEvent, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
// Paths based on: app/(auth)/login/page.tsx -> src/config
import { auth, db, googleProvider } from "../../../src/config/firebase-config";
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import toast from 'react-hot-toast';

interface LoginFormData {
  email: string;
  password: string;
}

// 1. INTERNAL COMPONENT: Contains all the logic and JSX
function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<LoginFormData>({ email: "", password: "" });
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle messages from URL params (e.g., after registration)
  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      toast.success(message);
      router.replace('/login');
    }
  }, [searchParams, router]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    setGeneralError(null);
  };

  async function handleLoginSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneralError(null);
    setIsSubmitting(true);
    
    if (!auth) {
        setGeneralError("Authentication service is temporarily unavailable.");
        setIsSubmitting(false);
        return;
    }

    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      toast.success("Login successful!");
      router.push("/realm"); 
    } catch (error: any) {
      console.error("Login Error:", error);
      setGeneralError("Incorrect email or password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleGoogleSignIn = async () => {
    setGeneralError(null);
    if (!auth || !db) {
        setGeneralError("Authentication service is temporarily unavailable.");
        return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        const nameParts = user.displayName?.split(" ") || ["", ""];
        await setDoc(userDocRef, {
          first_name: nameParts[0],
          last_name: nameParts.slice(1).join(" ") || "",
          full_name: user.displayName,
          email: user.email,
          created_at: serverTimestamp(),
          role: 'user'
        });
      }
      
      toast.success("Signed in with Google!");
      router.push("/realm");
    } catch (error) {
      console.error("Google Auth Error:", error);
      toast.error("Failed to sign in with Google.");
    }
  };

  const handlePasswordReset = async () => {
    if (!formData.email) {
      setGeneralError("Please enter your email address to reset your password.");
      return;
    }
    if (!auth) {
        setGeneralError("Authentication service is temporarily unavailable.");
        return;
    }

    const toastId = toast.loading('Sending password reset email...');
    try {
      await sendPasswordResetEmail(auth, formData.email);
      toast.success("Check your inbox!", { id: toastId });
    } catch (error: any) {
      toast.dismiss(toastId);
      setGeneralError("Failed to send reset email. Ensure the email is correct.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <h1 className="text-center text-2xl font-bold mb-8 text-gray-800">Sign in to FiamBond</h1>
        
        <button 
          onClick={handleGoogleSignIn} 
          type="button"
          className="w-full mb-6 flex items-center justify-center gap-2 border border-gray-300 py-3 rounded-lg hover:bg-gray-50 font-semibold text-gray-700 transition-colors shadow-sm"
          disabled={!auth}
        > 
           <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
           </svg>
           Sign In With Google
        </button>

        <div className="relative flex items-center py-5">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-xs text-gray-400 font-bold uppercase tracking-wider">Or continue with</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700" htmlFor="email">Email address</label>
            <input 
              id="email" 
              type="email" 
              placeholder="name@example.com" 
              value={formData.email} 
              onChange={handleInputChange} 
              required 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700" htmlFor="password">Password</label>
            <input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              value={formData.password} 
              onChange={handleInputChange} 
              required 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" 
            />
            <div className="text-right mt-2">
                <button type="button" onClick={handlePasswordReset} className="text-sm text-indigo-600 font-bold hover:underline">Forgot Password?</button>
            </div>
          </div>
          
          {generalError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
               <p className="text-red-500 text-sm font-bold text-center">{generalError}</p>
            </div>
          )}

          <button 
            disabled={isSubmitting || !auth} 
            className={`w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-md ${isSubmitting || !auth ? 'opacity-50 cursor-not-allowed' : ''}`} 
            type="submit"
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
        
        <p className="text-center text-sm text-gray-600 mt-8">
          Don't have an account? <Link href="/register" className="text-indigo-600 font-bold hover:underline">Register here</Link>
        </p>
      </div>
    </main>
  );
}

// 2. EXPORTED PAGE: Wraps the content in a Suspense Boundary
export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading Authentication...</p>
        </div>
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}