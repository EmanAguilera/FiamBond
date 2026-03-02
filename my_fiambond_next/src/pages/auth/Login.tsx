"use client";

import React, { useState, FormEvent, ChangeEvent, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { auth, db, googleProvider } from "@/src/config/firebase-config";
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  sendPasswordResetEmail 
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import toast from 'react-hot-toast';

// Custom components
import UnifiedLoadingWidget from "@/src/components/ui/UnifiedLoadingWidget";

interface LoginFormData {
  email: string;
  password: string;
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<LoginFormData>({ email: "", password: "" });
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check for messages in URL (e.g., after registration)
  useEffect(() => {
    const message = searchParams?.get('message');
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

  // --- LOGIC: Password Reset ---
  const handlePasswordReset = async () => {
    if (!formData.email) {
      setGeneralError("Please enter your email address to reset your password.");
      return;
    }
    setGeneralError(null);
    const toastId = toast.loading('Sending password reset email...');

    try {
      await sendPasswordResetEmail(auth, formData.email);
      toast.success("Password reset email sent! Check your inbox.", { id: toastId });
    } catch (error: any) {
      toast.dismiss(toastId);
      if (error.code === 'auth/user-not-found') {
        setGeneralError("No account found with this email address.");
      } else {
        toast.error("Failed to send reset email.");
      }
    }
  };

  // --- LOGIC: Email/Password Login ---
  async function handleLoginSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneralError(null);
    setIsSubmitting(true);
    
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      toast.success("Login successful!");
      router.push("/realm"); 
    } catch (error: any) {
      setGeneralError("Incorrect email or password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- LOGIC: Google Login ---
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
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
      router.push("/realm");
    } catch (error) {
      toast.error("Google Authentication Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4 py-12">
      {isSubmitting && (
        <UnifiedLoadingWidget type="fullscreen" message="Authenticating..." variant="indigo" />
      )}

      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-100">
        {/* Header */}
        <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Sign in to your account</h1>
            <p className="text-gray-500 mt-2 font-medium">Welcome back to FiamBond</p>
        </div>
        
        {/* Google Sign In */}
        <div className="space-y-4">
          <button 
            onClick={handleGoogleSignIn} 
            className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all active:scale-[0.98]"
          > 
             <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5" />
             Sign In With Google
          </button>
        </div>

        {/* Separator */}
        <div className="relative flex items-center py-6">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Or continue with</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-5">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-bold text-gray-700 ml-1">Email address</label>
            <input 
              id="email" 
              type="email" 
              placeholder="john.doe@example.com" 
              value={formData.email} 
              onChange={handleInputChange} 
              required 
              className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center ml-1">
                <label htmlFor="password" className="text-sm font-bold text-gray-700">Password</label>
                <button 
                    type="button" 
                    onClick={handlePasswordReset}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                    Forgot Password?
                </button>
            </div>
            <input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              value={formData.password} 
              onChange={handleInputChange} 
              required 
              className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
            />
          </div>
          
          {generalError && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold p-3 rounded-lg text-center">
                {generalError}
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all active:scale-[0.98]"
          >
            Sign In
          </button>
        </form>

        {/* Footer Link */}
        <p className="text-center text-sm text-gray-500 mt-8 font-medium">
          Don't have an account? {' '}
          <Link href="/register" className="text-indigo-600 font-bold hover:underline underline-offset-4">
            Register here
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<UnifiedLoadingWidget type="fullscreen" message="Loading..." />}>
      <LoginFormContent />
    </Suspense>
  );
}