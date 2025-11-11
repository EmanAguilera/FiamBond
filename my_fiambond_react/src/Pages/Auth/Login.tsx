import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import { auth, db, googleProvider } from "../../config/firebase-config";
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import toast from 'react-hot-toast';

interface LoginFormData {
  email: string;
  password: string;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState<LoginFormData>({ email: "", password: "" });
  const [generalError, setGeneralError] = useState<string | null>(null);
  
  // This effect checks for a message passed from the registration page
  const registrationMessage = location.state?.message;

  useEffect(() => {
    if (registrationMessage) {
      // Display the registration success message as a toast
      toast.success(registrationMessage);
      // Clear the message from location state to prevent it from re-appearing
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [registrationMessage, navigate, location.pathname]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    // Clear the main form error whenever the user types
    setGeneralError(null);
  };

  async function handleLoginSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneralError(null);
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      navigate("/"); // Navigate to home/dashboard on successful login
    } catch (error: any) {
      // For the main login error, an inline message is often better UX
      setGeneralError("Incorrect email or password. Please try again.");
      console.error('Login error:', error);
    }
  }

  const handleGoogleSignIn = async () => {
    setGeneralError(null);
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
          last_name: nameParts.slice(1).join(" ") || "",
          full_name: user.displayName,
          email: user.email,
          created_at: serverTimestamp(),
        });
      }
      
      navigate("/"); // Navigate to home/dashboard on success
    } catch (error) {
      // Use a toast for less critical errors like this
      toast.error("Failed to sign in with Google. Please try again.");
      console.error('Google sign-in error:', error);
    }
  };

  const handlePasswordReset = async () => {
    // First, validate that the email field is not empty
    if (!formData.email) {
      setGeneralError("Please enter your email address to reset your password.");
      return;
    }
    setGeneralError(null);
    
    // Show a loading toast while the email is being sent
    const toastId = toast.loading('Sending password reset email...');

    try {
      await sendPasswordResetEmail(auth, formData.email);
      // On success, update the toast to a success message
      toast.success("Password reset email sent! Please check your inbox.", { id: toastId });
    } catch (error: any) {
      // On failure, update the toast to an error message
      if (error.code === 'auth/user-not-found') {
        // For this specific error, an inline message is better
        toast.dismiss(toastId); // Dismiss the loading toast
        setGeneralError("No account found with this email address.");
      } else {
        toast.error("Failed to send password reset email. Please try again.", { id: toastId });
      }
      console.error('Password reset error:', error);
    }
  };

  return (
    <>
      <main className="login-wrapper">
        <div className="login-card">
          <h1 className="title">Sign in to your account</h1>
          
          <div className="space-y-4">
            <button onClick={handleGoogleSignIn} className="secondary-btn w-full"> 
              Sign In With Google
            </button>
          </div>

          <div className="relative flex items-center py-5">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-sm text-gray-400">OR CONTINUE WITH</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

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
            
            {/* Inline error for primary form actions */}
            {generalError && <p className="error">{generalError}</p>}

            <button className="primary-btn w-full" type="submit"> Sign In </button>
          </form>
          
          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account? {' '}
            <NavLink to="/register" className="text-link">Register here</NavLink>
          </p>
        </div>
      </main>
    </>
  );
}