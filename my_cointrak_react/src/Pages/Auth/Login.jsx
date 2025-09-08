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

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setErrors({}); // Clear previous errors

    // --- FIX IS HERE ---
    // Use the full API URL from the environment variable.
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(formData),
    });
    // --- END OF FIX ---

    // Check if the request itself failed (e.g., 404, 500 error)
    if (!res.ok) {
        setErrors({ general: ['The server could not be reached. Please try again later.'] });
        return;
    }

    const data = await res.json();

    if (data.errors) {
      setErrors(data.errors);
    } else if (data.token && data.user) {
      handleLogin(data.user, data.token);
      navigate("/");
    } else {
      // Handle incorrect credentials specifically
      setErrors({ general: ['The provided credentials are incorrect.'] });
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

          {errors.general && <p className="error">{errors.general[0]}</p>}

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