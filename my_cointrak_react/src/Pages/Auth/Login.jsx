import { useContext, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom"; // Import NavLink
import { AppContext } from "../../Context/AppContext.jsx";

export default function Login() {
  const { setToken } = useContext(AppContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});

  async function handleLogin(e) {
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
    } else if (data.token) {
      localStorage.setItem("token", data.token);
      setToken(data.token);
      navigate("/");
    } else {
      setErrors({ general: ['Invalid email or password.'] });
    }
  }

  return (
    <>
      {/* --- End Simulated Header Component --- */}

      <main className="login-wrapper"> {/* New wrapper for vertical centering */}
        <div className="login-card"> {/* Changed from login-container to login-card for clarity */}
          <h1 className="title">Sign in to your account</h1> {/* Slightly rephrased title */}
          <form onSubmit={handleLogin} className="space-y-6">
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

            <button className="primary-btn" type="submit"> Sign In </button> {/* Changed button text */}

            <p className="text-center text-sm text-gray-600 mt-4">
              Don't have an account? {' '}
              <NavLink to="/register" className="text-link">Register here</NavLink>
            </p>
          </form>
        </div>
      </main>
    </>
  );
}