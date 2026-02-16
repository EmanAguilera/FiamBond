"use client";

import React, { useState, FormEvent, ChangeEvent, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { auth, db, googleProvider } from "../../config/firebase-config";
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import toast from 'react-hot-toast';

// ⭐️ Use your new type-based widget
import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";

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

  async function handleLoginSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneralError(null);
    setIsSubmitting(true);
    
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      toast.success("Login successful!");
      router.push("/realm"); 
    } catch (error: any) {
      setGeneralError("Incorrect email or password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleGoogleSignIn = async () => {
    if (!auth || !db) return;
    setIsSubmitting(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          full_name: user.displayName,
          email: user.email,
          created_at: serverTimestamp(),
          role: 'user'
        });
      }
      router.push("/realm");
    } catch (error) {
      toast.error("Google Auth Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      {/* ⭐️ FIX: Using type="fullscreen" instead of fullScreen={true} */}
      {isSubmitting && (
        <UnifiedLoadingWidget type="fullscreen" message="Authenticating..." variant="indigo" />
      )}

      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <h1 className="text-center text-2xl font-bold mb-8">Sign in to FiamBond</h1>
        
        <button 
          onClick={handleGoogleSignIn} 
          className="w-full mb-6 flex items-center justify-center gap-2 border py-3 rounded-lg font-semibold"
        > 
           Sign In With Google
        </button>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <input id="email" type="email" placeholder="Email" value={formData.email} onChange={handleInputChange} required className="w-full p-3 border rounded-lg" />
          <input id="password" type="password" placeholder="Password" value={formData.password} onChange={handleInputChange} required className="w-full p-3 border rounded-lg" />
          
          {generalError && <p className="text-red-500 text-sm font-bold text-center">{generalError}</p>}

          <button className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold">
            Sign In
          </button>
        </form>
      </div>
    </main>
  );
}

export default function Login() {
  return (
    // ⭐️ FIX: Match the type system here too
    <Suspense fallback={<UnifiedLoadingWidget type="fullscreen" message="Loading..." />}>
      <LoginFormContent />
    </Suspense>
  );
}