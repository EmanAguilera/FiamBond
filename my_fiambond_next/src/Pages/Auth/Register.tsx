"use client";

import React, { useState, FormEvent, ChangeEvent } from "react"; // ADDED React import to fix UMD global error
import { useRouter } from "next/navigation";
import Link from "next/link";
// Ensure this path matches your folder structure: login/page.tsx is 3 levels deep from root
import { auth, db, googleProvider } from "../../../src/config/firebase-config"; 
import { createUserWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

interface RegisterFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterFormData>({
    first_name: "", last_name: "", email: "", password: "", password_confirmation: "",
  });
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  async function handleRegisterSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneralError(null);

    if (formData.password !== formData.password_confirmation) {
      setGeneralError("Passwords do not match.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Create the user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        first_name: formData.first_name,
        last_name: formData.last_name,
        full_name: `${formData.first_name} ${formData.last_name}`,
        email: user.email,
        created_at: serverTimestamp(),
      });
      
      // Forces user to login again to trigger the verification flow
      await signOut(auth);
      router.push('/login?message=Registration successful! Please log in to verify your email.');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setGeneralError('Email already registered.');
      } else {
        setGeneralError('Registration failed. Please try again.');
      }
    }
  }

  const handleGoogleSignIn = async () => {
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
        });
      }
      router.push("/");
    } catch (error) {
      setGeneralError("Google sign-up failed.");
    }
  };

  return (
    <main className="login-wrapper min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="login-card w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <h1 className="text-center text-2xl font-bold mb-6 text-gray-800">Create Account</h1>

        <button 
          onClick={handleGoogleSignIn} 
          className="w-full mb-6 border border-gray-300 py-3 rounded-lg hover:bg-gray-50 font-semibold text-gray-700 transition-colors"
        > 
          Sign Up With Google
        </button>

        <div className="relative flex items-center py-4">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-xs text-gray-400 font-bold uppercase">Or use email</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input id="first_name" placeholder="First Name" type="text" value={formData.first_name} onChange={handleInputChange} required className="p-3 border border-gray-300 rounded-lg w-full focus:outline-indigo-500" />
            <input id="last_name" placeholder="Last Name" type="text" value={formData.last_name} onChange={handleInputChange} required className="p-3 border border-gray-300 rounded-lg w-full focus:outline-indigo-500" />
          </div>
          <input id="email" placeholder="Email" type="email" value={formData.email} onChange={handleInputChange} required className="p-3 border border-gray-300 rounded-lg w-full focus:outline-indigo-500" />
          <input id="password" placeholder="Password" type="password" value={formData.password} onChange={handleInputChange} required className="p-3 border border-gray-300 rounded-lg w-full focus:outline-indigo-500" />
          <input id="password_confirmation" placeholder="Confirm Password" type="password" value={formData.password_confirmation} onChange={handleInputChange} required className="p-3 border border-gray-300 rounded-lg w-full focus:outline-indigo-500" />
          
          {generalError && <p className="text-red-500 text-sm font-bold text-center">{generalError}</p>}
          
          <button className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold shadow-md hover:bg-indigo-700 transition-colors" type="submit">
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account? <Link href="/login" className="text-indigo-600 font-bold hover:underline">Sign in here</Link>
        </p>
      </div>
    </main>
  );
}