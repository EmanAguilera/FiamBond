// Pages/Register.tsx

import { useState, FormEvent, ChangeEvent } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { auth } from "../../config/firebase-config"; // Adjust path
import { createUserWithEmailAndPassword } from "firebase/auth";

// --- Type definitions remain the same ---
interface RegisterFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

interface ErrorState {
  [key: string]: string[];
}

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<RegisterFormData>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const [errors, setErrors] = useState<ErrorState>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  async function handleRegisterSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneralError(null);

    if (formData.password !== formData.password_confirmation) {
      setGeneralError("Passwords do not match.");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      // On successful registration, Firebase automatically signs the user in.
      // The onAuthStateChanged listener in AppContext will handle the user state.
      navigate("/"); // Navigate to the main page after registration
    } catch (error: any) {
      // Handle Firebase-specific errors
      if (error.code === 'auth/email-already-in-use') {
        setGeneralError('This email is already registered.');
      } else if (error.code === 'auth/weak-password') {
        setGeneralError('Password should be at least 6 characters.');
      } else {
        setGeneralError('Failed to register. Please try again.');
        console.error('Registration error:', error);
      }
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  // The rest of your JSX remains the same
  return (
      <main className="login-wrapper">
      <div className="login-card">
        <h1 className="title">Create a new account</h1>
        <form onSubmit={handleRegisterSubmit} className="space-y-6">
          {/* Your form inputs for first_name, last_name, email, password, etc. */}
          {/* Make sure they call handleInputChange */}

          <div className="form-group">
            <label htmlFor="first_name">First Name</label>
            <input id="first_name" type="text" placeholder="John" value={formData.first_name} onChange={handleInputChange}/>
          </div>
          <div className="form-group">
            <label htmlFor="last_name">Last Name</label>
            <input id="last_name" type="text" placeholder="Doe" value={formData.last_name} onChange={handleInputChange}/>
          </div>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" placeholder="john.doe@example.com" value={formData.email} onChange={handleInputChange}/>
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange}/>
          </div>
          <div className="form-group">
            <label htmlFor="password_confirmation">Confirm Password</label>
            <input id="password_confirmation" type="password" placeholder="••••••••" value={formData.password_confirmation} onChange={handleInputChange}/>
          </div>

          {generalError && <p className="error">{generalError}</p>}

          <button className="primary-btn" type="submit"> Register </button>

          <p className="text-center text-sm text-gray-600 mt-4">
            Already have an account? {' '}
            <NavLink to="/login" className="text-link">Sign in here</NavLink>
          </p>
        </form>
      </div>
    </main>
  );
}