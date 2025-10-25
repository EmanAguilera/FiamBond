import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import { auth, db, googleProvider } from "../../config/firebase-config";
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

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
  
  // State and logic for the success toast notification
  const registrationMessage = location.state?.message;
  const [showToast, setShowToast] = useState(false);

  // This effect runs when the component loads. If it finds a registration message,
  // it shows the toast for 5 seconds and then hides it.
  useEffect(() => {
    if (registrationMessage) {
      setShowToast(true);
      const timer = setTimeout(() => {
        setShowToast(false);
        // This clears the message from the route state so it doesn't reappear
        // if the user navigates back to this page.
        navigate(location.pathname, { replace: true, state: {} });
      }, 5000); // Toast is visible for 5 seconds

      // Cleanup function to clear the timer if the component unmounts early
      return () => clearTimeout(timer);
    }
  }, [registrationMessage, navigate, location.pathname]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    setGeneralError(null); // Clear errors when user starts typing
    setResetMessage(null);
  };

  async function handleLoginSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneralError(null);
    setResetMessage(null);
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      navigate("/"); // Navigate to home/dashboard on success
    } catch (error: any) {
      setGeneralError("Incorrect email or password. Please try again.");
      console.error('Login error:', error);
    }
  }

  const handleGoogleSignIn = async () => {
    setGeneralError(null);
    setResetMessage(null);
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
      setGeneralError("Failed to sign in with Google. Please check your configuration.");
      console.error('Google sign-in error:', error);
    }
  };

  const handlePasswordReset = async () => {
    if (!formData.email) {
      setGeneralError("Please enter your email address to reset your password.");
      return;
    }
    setGeneralError(null);
    setResetMessage(null);
    try {
      await sendPasswordResetEmail(auth, formData.email);
      setResetMessage("Password reset email sent! Please check your inbox.");
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        setGeneralError("No account found with this email address.");
      } else {
        setGeneralError("Failed to send password reset email. Please try again.");
      }
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

      {/* Toast Notification JSX */}
      {showToast && (
        <div className="toast-notification">
          <div className="toast-content">
            <svg className="toast-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <p className="toast-message">{registrationMessage}</p>
          </div>
        </div>
      )}
    </>
  );
}