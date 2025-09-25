import { useContext, useState, FormEvent, ChangeEvent } from "react";
import { useNavigate, NavLink } from "react-router-dom";
// Assuming AppContext is still a .jsx file. If it were .tsx, this import would be simpler.
import { AppContext } from "../../Context/AppContext.jsx";

// TS FIX: Define the shape of the form data
interface LoginFormData {
  email: string;
  password: string;
}

// TS FIX: Define the shape of the validation errors object from the API
interface ErrorState {
  // This means an object with any string key, where the value is an array of strings
  [key: string]: string[];
}

// TS FIX: Define a basic type for the context to avoid 'any' type.
// You would ideally define this more completely in your AppContext file.
interface AppContextType {
  handleLogin: (user: any, token: string) => void;
}

export default function Login() {
  // TS FIX: Add the type assertion to useContext
  const { handleLogin } = useContext(AppContext) as AppContextType;
  const navigate = useNavigate();

  // TS FIX: Provide types to the useState hooks
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<ErrorState>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // TS FIX: Add the event type for the form submission
  async function handleLoginSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });

      const errorData = await res.json();
      if (!res.ok) {
        if (res.status === 422) {
          setErrors(errorData.errors);
        } else {
          const message = errorData.message || 'Login failed. Please check your credentials and try again.';
          setGeneralError(message);
        }
        return;
      }

      if (errorData.token && errorData.user) {
        handleLogin(errorData.user, errorData.token);
        navigate("/");
      } else {
        setGeneralError('An unexpected error occurred during login.');
      }

    } catch (error) {
      console.error('Login network error:', error);
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

          <button className="primary-btn" type="submit"> Sign In </button>

          <p className="text-center text-sm text-gray-600 mt-4">
            Don't have an account? {' '}
            <NavLink to="/register" className="text-link">Register here</NavLink>
          </p>
        </form>
      </div>
    </main>
  );
}