import { useContext, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
// Import the centralized context functions
import { AppContext } from "../../Context/AppContext.jsx";

export default function Register() {
  // CORRECT: Destructure handleLogin from the context.
  // setToken is not available here, so we remove it.
  const { handleLogin } = useContext(AppContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);

  async function handleRegisterSubmit(e) { // Renamed function for clarity
    e.preventDefault();
    setErrors({});
    setGeneralError(null);

    const res = await fetch("/api/register", {
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
      // --- FIX IS HERE ---
      // Instead of manually setting localStorage and state, call the centralized handleLogin function.
      // This function will set the user, set the token, store it in localStorage,
      // and trigger any necessary re-renders throughout the app.
      handleLogin(data.user, data.token);
      navigate("/"); // Redirect to the dashboard or home page.
      // --- END OF FIX ---
    } else {
      setGeneralError('Registration failed. Please try again.');
    }
  }

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
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
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

          <div className="form-group">
            <label htmlFor="password_confirmation">Confirm Password</label>
            <input
              id="password_confirmation"
              type="password"
              placeholder="••••••••"
              value={formData.password_confirmation}
              onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
            />
            {/* The error key from Laravel might be 'password' for a confirmation mismatch */}
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