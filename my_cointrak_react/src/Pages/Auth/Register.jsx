import { useContext, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { AppContext } from "../../Context/AppContext.jsx";

export default function Register() {
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

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/register`, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(formData),
    });

    // --- IMPROVED ERROR HANDLING ---
    // First, check if the response status is a server error (like 500)
    if (!res.ok) {
        // Try to get a specific error message from the server if possible
        const errorData = await res.json().catch(() => null); // Use .catch in case the error page is not JSON
        const message = errorData?.message || 'Registration failed. Please check your details and try again.';
        setGeneralError(message);
        return; // Stop execution
    }
    // --- END OF IMPROVEMENT ---

    const data = await res.json();

    // This part remains the same
    if (data.errors) {
      setErrors(data.errors);
    } else if (data.token && data.user) {
      handleLogin(data.user, data.token);
      navigate("/");
    } else {
      setGeneralError('An unknown error occurred during registration.');
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