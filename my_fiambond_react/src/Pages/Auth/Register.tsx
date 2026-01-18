// Pages/Auth/Register.tsx

import { useState, FormEvent, ChangeEvent } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { auth, db, googleProvider } from "../../config/firebase-config";
import { createUserWithEmailAndPassword, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

interface RegisterFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export default function Register() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<RegisterFormData>({
    first_name: "", last_name: "", email: "", password: "", password_confirmation: "",
  });

  const [generalError, setGeneralError] = useState<string | null>(null);

  // --- MANUAL REGISTRATION ---
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

      // Wait for auth state to propagate
      await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          if (currentUser && currentUser.uid === user.uid) {
            unsubscribe();
            resolve(null);
          }
        });
      });

      await setDoc(doc(db, "users", user.uid), {
        first_name: formData.first_name,
        last_name: formData.last_name,
        full_name: `${formData.first_name} ${formData.last_name}`,
        email: user.email,
        created_at: serverTimestamp(),
      });
      
      // CRITICAL FIX: Sign the user out immediately to enforce the login -> verify-email flow
      await signOut(auth);

      navigate('/login', { 
        state: { 
          message: 'Registration successful! Please log in to verify your email.' 
        } 
      });

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setGeneralError('This email is already registered.');
      } else {
        setGeneralError('Failed to register. Please try again.');
        console.error("Registration Error:", error);
      }
    }
  }

  // --- GOOGLE SIGN-UP / SIGN-IN ---
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if a user document already exists in Firestore.
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      // If the user document does NOT exist, create it.
      if (!userDocSnap.exists()) {
        const nameParts = user.displayName?.split(" ") || ["", ""];
        await setDoc(userDocRef, {
          first_name: nameParts[0],
          last_name: nameParts.slice(1).join(" ") || "", // Handle names with multiple parts
          full_name: user.displayName,
          email: user.email,
          created_at: serverTimestamp(),
        });
      }
      
      // Navigate to the dashboard. The user is now logged in.
      navigate("/");

    } catch (error) {
      setGeneralError("Failed to sign up with Google. Please try again.");
      console.error('Google sign-up error:', error);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  return (
    <main className="login-wrapper h-screen w-screen overflow-hidden flex items-center justify-center bg-gray-50">
        <div className="login-card w-full max-w-md">
        <h1 className="title">Create an account</h1>

        {/* --- GOOGLE SIGN-UP --- */}
        <div className="space-y-4">
          <button onClick={handleGoogleSignIn} className="secondary-btn w-full"> 
            Sign Up With Google
          </button>
        </div>

        {/* --- "OR" DIVIDER --- */}
        <div className="relative flex items-center py-5">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-sm text-gray-400">OR SIGN UP WITH EMAIL</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* --- MANUAL EMAIL FORM --- */}
        <form onSubmit={handleRegisterSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="first_name">First Name</label>
              <input id="first_name" type="text" value={formData.first_name} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="last_name">Last Name</label>
              <input id="last_name" type="text" value={formData.last_name} onChange={handleInputChange} required />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" value={formData.email} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={formData.password} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="password_confirmation">Confirm Password</label>
            <input id="password_confirmation" type="password" value={formData.password_confirmation} onChange={handleInputChange} required />
          </div>
          
          {generalError && <p className="error">{generalError}</p>}
          
          <button className="primary-btn" type="submit"> Create Account </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account? {' '}
          <NavLink to="/login" className="text-link">Sign in here</NavLink>
        </p>
      </div>
    </main>
  );
}