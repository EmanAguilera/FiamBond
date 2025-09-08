import { useContext, useState, useEffect } from "react";
import { AppContext } from "../Context/AppContext.jsx";

export default function Settings() {
  const { user, token, setUser } = useContext(AppContext);

  // State to manage the form's input fields
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    new_password: '',
    new_password_confirmation: '',
  });

  // States for handling UI feedback (messages, errors, and loading)
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // This crucial effect synchronizes the form's local state with the global user object.
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  // Generic handler to update the formData state when a user types in an input.
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handler for submitting the profile information form.
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/user", {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data.user);
        setMessage(data.message);
        setTimeout(() => setMessage(''), 5000);
      } else {
        setError(data.message || 'Failed to update profile.');
      }
    } catch { // FIX: Removed the unused 'err' variable here
      setError('A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for submitting the password change form.
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (formData.new_password !== formData.new_password_confirmation) {
        setError("The new passwords do not match.");
        return;
    }
    
    setIsSubmitting(true);

    try {
        const res = await fetch("/api/user", {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                new_password: formData.new_password,
                new_password_confirmation: formData.new_password_confirmation,
            }),
        });

        const data = await res.json();

        if (res.ok) {
            setMessage(data.message);
            setFormData(prev => ({...prev, new_password: '', new_password_confirmation: ''}));
            setTimeout(() => setMessage(''), 5000);
        } else {
            setError(data.message || 'Failed to update password.');
        }
    } catch { // FIX: Removed the unused 'err' variable here as well
        setError('A network error occurred. Please try again.');
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!user) {
    return <p className="p-10 text-center">Loading user settings...</p>;
  }

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h2 className="dashboard-title mb-8">Account Settings</h2>

      {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{message}</div>}
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

      {/* Profile Information Form */}
      <div className="dashboard-card mb-10">
        <h3 className="font-bold text-xl mb-6">Profile Information</h3>
        <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="first_name" className="form-label">First Name</label>
                    <input type="text" id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} className="form-input" required />
                </div>
                <div>
                    <label htmlFor="last_name" className="form-label">Last Name</label>
                    <input type="text" id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} className="form-input" required />
                </div>
            </div>
          <div>
            <label htmlFor="email" className="form-label">Email Address</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="form-input" required />
          </div>
          <div className="text-right">
            <button type="submit" className="primary-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="dashboard-card">
        <h3 className="font-bold text-xl mb-6">Change Password</h3>
        <form onSubmit={handlePasswordUpdate} className="space-y-6">
          <div>
            <label htmlFor="new_password" className="form-label">New Password</label>
            <input type="password" id="new_password" name="new_password" value={formData.new_password} onChange={handleChange} className="form-input" required />
          </div>
          <div>
            <label htmlFor="new_password_confirmation" className="form-label">Confirm New Password</label>
            <input type="password" id="new_password_confirmation" name="new_password_confirmation" value={formData.new_password_confirmation} onChange={handleChange} className="form-input" required />
          </div>
          <div className="text-right">
            <button type="submit" className="primary-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}