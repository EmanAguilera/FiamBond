// Pages/Auth/Login.tsx

import { useState, FormEvent, ChangeEvent } from "react";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import { auth, googleProvider } from "../../config/firebase-config";
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";

interface LoginFormData {
  email: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState<LoginFormData>({ email: "", password: "" });
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const registrationMessage = location.state?.message;

  // --- All of your handler functions remain the same ---
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  async function handleLoginSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneralError(null);
    setResetMessage(null);
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      navigate("/");
    } catch (error: any) {
      setGeneralError("Incorrect email or password. Please try again.");
      console.error('Login error:', error);
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/");
    } catch (error) {
      setGeneralError("Failed to sign in with Google.");
    }
  };

  const handlePasswordReset = async () => {
    // ... (this function is unchanged)
  };

  // THE FIX IS HERE: We now return a <main> wrapper to match your Register page
  return (
    <main className="login-wrapper">
      <div className="login-card">
        <h1 className="title">Sign in to your account</h1>
        
        {registrationMessage && <p className="success mb-4">{registrationMessage}</p>}
        
        {/* --- THE VISUAL FIX --- */}
        {/* The Google Sign In button is now at the top, presented as the primary, easy option. */}
        <div className="space-y-4">
          <button onClick={handleGoogleSignIn} className="secondary-btn w-full"> 
            Sign In With Google
          </button>
        </div>

        {/* This creates the "OR" divider, a common UX pattern. */}
        <div className="relative flex items-center py-5">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-sm text-gray-400">OR CONTINUE WITH</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* The email/password form is now presented as the secondary, manual option. */}
        <form onSubmit={handleLoginSubmit} className="space-y-6">
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="john.doe@example.com"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleInputChange}
            />
            <div className="text-right mt-2">
                <button 
                    type="button" 
                    onClick={handlePasswordReset}
                    className="text-sm text-link"
                >
                    Forgot Password?
                </button>
            </div>
          </div>
          
          {generalError && <p className="error">{generalError}</p>}
          {resetMessage && <p className="success">{resetMessage}</p>}

          <button className="primary-btn" type="submit"> Sign In </button>
        </form>
        
        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account? {' '}
          <NavLink to="/register" className="text-link">Register here</NavLink>
        </p>
      </div>
    </main>
  );
}