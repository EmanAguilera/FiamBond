import { useContext, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom"; // Import NavLink
import { AppContext } from "../../Context/AppContext.jsx";

export default function Register() {
  const { setToken } = useContext(AppContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null); // To handle general errors

  async function handleRegister(e) {
    e.preventDefault();
    setErrors({}); // Clear previous errors
    setGeneralError(null); // Clear previous general error

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
    } else if (data.token) {
      localStorage.setItem("token", data.token);
      setToken(data.token);
      navigate("/");
    } else {
      setGeneralError('Registration failed. Please try again.'); // Generic error for unexpected cases
    }
  }

  return (
    <>
      <main className="login-wrapper"> {/* Reusing the wrapper for vertical centering */}
        <div className="login-card"> {/* Reusing the card styling */}
          <h1 className="title">Create a new account</h1> {/* Consistent title styling */}
          <form onSubmit={handleRegister} className="space-y-6"> {/* Consistent spacing */}

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

            {generalError && <p className="error">{generalError}</p>} {/* Display general errors */}

            <button className="primary-btn" type="submit"> Register </button>

            <p className="text-center text-sm text-gray-600 mt-4">
              Already have an account? {' '}
              <NavLink to="/login" className="text-link">Sign in here</NavLink>
            </p>
          </form>
        </div>
      </main>
    </>
  );
}