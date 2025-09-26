import { useContext, useState, FormEvent, ChangeEvent } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { AppContext } from "../../Context/AppContext.jsx";

// --- Type definitions remain the same ---
interface LoginFormData {
  email: string;
  password: string;
}

interface ErrorState {
  [key: string]: string[];
}

interface AppContextType {
  handleLogin: (user: any, token: string) => void;
}

export default function Login() {
  const { handleLogin } = useContext(AppContext) as AppContextType;
  const navigate = useNavigate();

  // --- FORM STATE ---
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  // --- NEW STATE FOR 2FA FLOW ---
  // Tracks whether we should show the OTP form
  const [showOtpForm, setShowOtpForm] = useState<boolean>(false);
  // Stores the user ID received after the first step
  const [userId, setUserId] = useState<number | null>(null);
  // Stores the OTP code the user types
  const [otpCode, setOtpCode] = useState<string>("");

  // --- ERROR STATE ---
  const [errors, setErrors] = useState<ErrorState>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  
  // --- HANDLERS ---
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  // STEP 1: Handle the initial email/password submission
  async function handleLoginSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
        method: "post",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 422) {
          setErrors(data.errors);
        } else {
          setGeneralError(data.message || 'Login failed.');
        }
        return;
      }
      
      // SUCCESS: The password was correct. Now show the OTP form.
      setUserId(data.user_id); // Store the user_id for the next step
      setShowOtpForm(true); // Switch to the OTP view

    } catch (error) {
      console.error('Login network error:', error);
      setGeneralError('A network error occurred.');
    }
  }

  // STEP 2: Handle the OTP code submission
  async function handleOtpSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneralError(null);

    if (!userId) {
      setGeneralError("User ID not found. Please try logging in again.");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/verify-2fa`, {
        method: "post",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ user_id: userId, otp_code: otpCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        setGeneralError(data.message || 'Verification failed.');
        return;
      }

      // FINAL SUCCESS: The OTP was correct. Log the user in.
      if (data.token && data.user) {
        handleLogin(data.user, data.token);
        navigate("/");
      }

    } catch (error) {
      console.error('2FA verification network error:', error);
      setGeneralError('A network error occurred during verification.');
    }
  }

  return (
    <main className="login-wrapper">
      <div className="login-card">
        {/* CONDITIONALLY RENDER THE CORRECT FORM */}
        {!showOtpForm ? (
          // --- VIEW 1: EMAIL & PASSWORD FORM ---
          <>
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
                {errors.email && <p className="error">{errors.email[0]}</p>}
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
                {errors.password && <p className="error">{errors.password[0]}</p>}
              </div>

              {generalError && <p className="error">{generalError}</p>}

              <button className="primary-btn" type="submit"> Continue </button>

              <p className="text-center text-sm text-gray-600 mt-4">
                Don't have an account? {' '}
                <NavLink to="/register" className="text-link">Register here</NavLink>
              </p>
            </form>
          </>
        ) : (
          // --- VIEW 2: OTP VERIFICATION FORM ---
          <>
            <h1 className="title">Enter Verification Code</h1>
            <p className="text-center text-sm text-gray-600 mb-4">
              A 6-digit code has been sent to your email address.
            </p>
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="form-group">
                <label htmlFor="otpCode">Verification Code</label>
                <input
                  id="otpCode"
                  type="text"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                />
              </div>

              {generalError && <p className="error">{generalError}</p>}

              <button className="primary-btn" type="submit"> Verify & Sign In </button>

              <p className="text-center text-sm text-gray-600 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpForm(false);
                    setGeneralError(null);
                    setFormData(prev => ({...prev, password: ""}));
                  }}
                  className="text-link"
                >
                  Back to login
                </button>
              </p>
            </form>
          </>
        )}
      </div>
    </main>
  );
}