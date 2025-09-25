import { useContext, useState, FormEvent, ChangeEvent } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { AppContext } from "../../Context/AppContext.jsx";

// TS FIX: Define the shape of the form data
interface RegisterFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

// TS FIX: Define the shape of the validation errors object
interface ErrorState {
  [key: string]: string[];
}

// TS FIX: Define a basic type for the context
interface AppContextType {
  handleLogin: (user: any, token: string) => void;
}

export default function Register() {
  // TS FIX: Add the type assertion to useContext
  const { handleLogin } = useContext(AppContext) as AppContextType;
  const navigate = useNavigate();

  // TS FIX: Provide types to the useState hooks
  const [formData, setFormData] = useState<RegisterFormData>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const [errors, setErrors] = useState<ErrorState>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // TS FIX: Add the event type for the form submission
  async function handleRegisterSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/register`, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 422) {
          setErrors(data.errors);
        } else {
          const message = data.message || 'Registration failed. Please try again later.';
          setGeneralError(message);
        }
        return;
      }

      if (data.token && data.user) {
        handleLogin(data.user, data.token);
        navigate("/");
      } else {
        setGeneralError('An unknown error occurred during registration.');
      }
    } catch (error) {
      console.error('Registration network error:', error);
      setGeneralError('A network error occurred. Please check your connection and try again.');
    }
  }

  // TS FIX: A helper function to handle input changes with proper event typing
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  return (
    <main className="login-wrapper">
      <div className="login-card">
        <h1 className="title">Create a new account</h1>
        <form onSubmit={handleRegisterSubmit} className="space-y-6">

          <div className="form-group">
            <label htmlFor="first_name">First Name</label>
            <input
              id="first_name"
              type="text"
              placeholder="John"
              value={formData.first_name}
              onChange={handleInputChange}
            />
            {errors.first_name && <p className="error">{errors.first_name[0]}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="last_name">Last Name</label>
            <input
              id="last_name"
              type="text"
              placeholder="Doe"
              value={formData.last_name}
              onChange={handleInputChange}
            />
            {errors.last_name && <p className="error">{errors.last_name[0]}</p>}
          </div>

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

          <div className="form-group">
            <label htmlFor="password_confirmation">Confirm Password</label>
            <input
              id="password_confirmation"
              type="password"
              placeholder="••••••••"
              value={formData.password_confirmation}
              onChange={handleInputChange}
            />
            {errors.password_confirmation && <p className="error">{errors.password_confirmation[0]}</p>}
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