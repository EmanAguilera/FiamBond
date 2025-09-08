import { useContext, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { AppContext } from "../../Context/AppContext.jsx";

export default function Login() {
  // CORRECT: Destructure the handleLogin function from the context
  const { handleLogin } = useContext(AppContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});

  async function handleLoginSubmit(e) { // Renamed to avoid confusion
    e.preventDefault();

    const res = await fetch("/api/login", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (data.errors) {
      setErrors(data.errors);
    } else if (data.token && data.user) {
      // CORRECT: Call handleLogin with the user and token data from the API
      handleLogin(data.user, data.token);
      navigate("/");
    } else {
      setErrors({ general: ['The provided credentials are incorrect.'] });
    }
  }

  return (
    <main className="login-wrapper">
      <div className="login-card">
        <h1 className="title">Sign in to your account</h1>
        <form onSubmit={handleLoginSubmit} className="space-y-6">
          {/* ... rest of your form ... */}
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