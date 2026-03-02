"use client";

import React, { useState, FormEvent, ChangeEvent, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db, googleProvider } from "@/src/config/firebase-config"; 
import { createUserWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import toast from 'react-hot-toast';

// Custom components
import UnifiedLoadingWidget from "@/src/components/ui/UnifiedLoadingWidget";

interface RegisterFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

function RegisterContent() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterFormData>({
    first_name: "", 
    last_name: "", 
    email: "", 
    password: "", 
    password_confirmation: "",
  });
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    setGeneralError(null);
  };

  // --- LOGIC: Email/Password Registration ---
  async function handleRegisterSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneralError(null);
    
    if (formData.password !== formData.password_confirmation) {
      setGeneralError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Save user profile to Firestore
      await setDoc(doc(db, "users", user.uid), {
        first_name: formData.first_name,
        last_name: formData.last_name,
        full_name: `${formData.first_name} ${formData.last_name}`,
        email: user.email,
        created_at: serverTimestamp(),
        role: 'user'
      });
      
      // Optional: Sign out so they have to log in once to verify
      await signOut(auth);
      
      toast.success("Account created successfully!");
      router.push('/login?message=Registration successful! Please log in to continue.');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setGeneralError('This email is already registered.');
      } else {
        setGeneralError('Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- LOGIC: Google Registration ---
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      // Create doc if it's their first time
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
      toast.success("Welcome to FiamBond!");
      router.push("/realm");
    } catch (error) {
      setGeneralError("Google sign-up failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4 py-12">
      {isSubmitting && (
        <UnifiedLoadingWidget type="fullscreen" message="Creating your account..." variant="indigo" />
      )}

      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-100">
        {/* Header */}
        <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create Account</h1>
            <p className="text-gray-500 mt-2 font-medium">Join the FiamBond Realm</p>
        </div>

        {/* Google Sign Up */}
        <button 
          onClick={handleGoogleSignIn} 
          type="button"
          className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all active:scale-[0.98]"
        > 
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5" />
          Sign Up With Google
        </button>

        {/* Separator */}
        <div className="relative flex items-center py-6">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Or use email</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleRegisterSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <label htmlFor="first_name" className="text-sm font-bold text-gray-700 ml-1">First Name</label>
                <input 
                    id="first_name" 
                    type="text" 
                    placeholder="John" 
                    value={formData.first_name} 
                    onChange={handleInputChange} 
                    required 
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm" 
                />
            </div>
            <div className="space-y-1">
                <label htmlFor="last_name" className="text-sm font-bold text-gray-700 ml-1">Last Name</label>
                <input 
                    id="last_name" 
                    type="text" 
                    placeholder="Doe" 
                    value={formData.last_name} 
                    onChange={handleInputChange} 
                    required 
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm" 
                />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-bold text-gray-700 ml-1">Email address</label>
            <input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                value={formData.email} 
                onChange={handleInputChange} 
                required 
                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm" 
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-bold text-gray-700 ml-1">Password</label>
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

          <div className="space-y-1">
            <label htmlFor="password_confirmation" className="text-sm font-bold text-gray-700 ml-1">Confirm Password</label>
            <input 
                id="password_confirmation" 
                type="password" 
                placeholder="••••••••" 
                value={formData.password_confirmation} 
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
            Create Account
          </button>
        </form>

        {/* Footer Link */}
        <p className="text-center text-sm text-gray-500 mt-8 font-medium">
          Already have an account? {' '}
          <Link href="/login" className="text-indigo-600 font-bold hover:underline underline-offset-4">
            Sign in here
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function Register() {
  return (
    <Suspense fallback={<UnifiedLoadingWidget type="fullscreen" message="Preparing Registration..." />}>
      <RegisterContent />
    </Suspense>
  );
}