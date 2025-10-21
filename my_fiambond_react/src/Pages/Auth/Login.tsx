// Pages/Login.tsx

import { useState, FormEvent, ChangeEvent } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { auth, googleProvider } from "../../config/firebase-config"; // Adjust path
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";

// --- Type definitions ---
interface LoginFormData {
  email: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [generalError, setGeneralError] = useState<string | null>(null);
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  async function handleLoginSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneralError(null);

    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      // On success, onAuthStateChanged will trigger and AppContext will update.
      navigate("/");
    } catch (error) {
      setGeneralError("Failed to sign in. Please check your credentials.");
      console.error('Login error:', error);
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      // On success, onAuthStateChanged will trigger.
      navigate("/");
    } catch (error) {
      setGeneralError("Failed to sign in with Google.");
      console.error('Google sign-in error:', error);
    }
  };

  return (
    <main className="login-wrapper">
      <div className="login-card">
        <h1 className="title">Sign in to your account</h1>
        <form onSubmit={handleLoginSubmit} className="space-y-6">
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="john.doe@example.com"
              value={formData.email}
              onChange={handleInputChange}
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
          </div>

          {generalError && <p className="error">{generalError}</p>}

          <button className="primary-btn" type="submit"> Sign In </button>
        </form>
        
        {/* Google Sign-In Button */}
        <div className="mt-6">
            <button onClick={handleGoogleSignIn} className="secondary-btn w-full"> 
                Sign In With Google
            </button>
        </div>

        <p className="text-center text-sm text-gray-600 mt-4">
          Don't have an account? {' '}
          <NavLink to="/register" className="text-link">Register here</NavLink>
        </p>
      </div>
    </main>
  );
}