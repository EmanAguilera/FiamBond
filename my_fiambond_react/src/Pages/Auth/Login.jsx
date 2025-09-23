import { useContext, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { AppContext } from "../../Context/AppContext.jsx";

export default function Login() {
  const { handleLogin } = useContext(AppContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);

  async function handleLoginSubmit(e) {
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

      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 422) {
          setErrors(errorData.errors);
        } else {
          const message = errorData.message || 'Login failed. Please check your credentials and try again.';
          setGeneralError(message);
        }
        return;
      }

      const data = await res.json();
      if (data.token && data.user) {
        handleLogin(data.user, data.token);
        navigate("/");
      } else {
        setGeneralError('An unexpected error occurred during login.');
      }

    } catch (error) {
      // --- THIS IS THE FIX ---
      // Log the actual error to the console for debugging.
      console.error('Login network error:', error);
      // --- END OF FIX ---
      setGeneralError('A network error occurred. Please check your connection and try again.');
    }
  }

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
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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