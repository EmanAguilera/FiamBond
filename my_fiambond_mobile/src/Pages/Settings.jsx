import { useContext, useState, useEffect } from "react";
import { AppContext } from "../Context/AppContext.jsx";
import { auth, db } from "../config/firebase-config"; // Import services
import { updateEmail, updatePassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";

export default function Settings() {
  const { user, setUser } = useContext(AppContext);

  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '',
    new_password: '', new_password_confirmation: '',
  });

  // Separate states for each form for clear feedback
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [passwordErrors, setPasswordErrors] = useState({});

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!user) return;
    setProfileMessage({ type: '', text: '' });
    setProfileErrors({}); // Clear old errors
    setIsSubmitting(true);

    try {
      const currentUser = auth.currentUser;
      const userDocRef = doc(db, "users", user.uid);

      // 1. Update Email in Firebase Authentication (if changed)
      if (formData.email !== user.email) {
        await updateEmail(currentUser, formData.email);
      }
      
      // 2. Update Profile in Firestore
      await updateDoc(userDocRef, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        full_name: `${formData.first_name} ${formData.last_name}`,
        email: formData.email, // Keep email in sync
      });

      // 3. Update local context for immediate feedback
      const updatedUser = { ...user, ...{first_name: formData.first_name, last_name: formData.last_name, email: formData.email} };
      setUser(updatedUser);

      setProfileMessage({ type: 'success', text: "Profile updated successfully!" });
      setTimeout(() => setProfileMessage({ type: '', text: '' }), 5000);

    } catch (err) {
      console.error('Profile update error:', err);
      // Provide a more specific error message if possible
      setProfileMessage({ type: 'error', text: err.message || 'Failed to update profile. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!user) return;
    setPasswordMessage({ type: '', text: '' });
    setPasswordErrors({}); // Clear old errors

    if (formData.new_password !== formData.new_password_confirmation) {
      setPasswordMessage({ type: 'error', text: "The new passwords do not match." });
      return;
    }
    
    setIsSubmitting(true);

    try {
      const currentUser = auth.currentUser;
      await updatePassword(currentUser, formData.new_password);
      
      setPasswordMessage({ type: 'success', text: "Password updated successfully!" });
      setFormData(prev => ({ ...prev, new_password: '', new_password_confirmation: '' }));
      setTimeout(() => setPasswordMessage({ type: '', text: '' }), 5000);

    } catch (err) {
      console.error('Password update error:', err);
      // This error often means the user needs to re-authenticate for security reasons.
      setPasswordMessage({ type: 'error', text: 'Failed to update password. You may need to log out and log back in.' });
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

      <div className="dashboard-card mb-10">
        <h3 className="font-bold text-xl mb-6">Profile Information</h3>
        <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="first_name" className="form-label">First Name</label>
                    <input type="text" id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} className="form-input" required />
                    {profileErrors.first_name && <p className="error text-sm mt-1">{profileErrors.first_name[0]}</p>}
                </div>
                <div>
                    <label htmlFor="last_name" className="form-label">Last Name</label>
                    <input type="text" id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} className="form-input" required />
                    {profileErrors.last_name && <p className="error text-sm mt-1">{profileErrors.last_name[0]}</p>}
                </div>
            </div>
          <div>
            <label htmlFor="email" className="form-label">Email Address</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="form-input" required />
            {profileErrors.email && <p className="error text-sm mt-1">{profileErrors.email[0]}</p>}
          </div>

          {profileMessage.text && <p className={`text-sm ${profileMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{profileMessage.text}</p>}

          <div className="text-right">
            <button type="submit" className="primary-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <div className="dashboard-card">
        <h3 className="font-bold text-xl mb-6">Change Password</h3>
        <form onSubmit={handlePasswordUpdate} className="space-y-6">
          <div>
            <label htmlFor="new_password" className="form-label">New Password</label>
            <input type="password" id="new_password" name="new_password" value={formData.new_password} onChange={handleChange} className="form-input" required />
            {passwordErrors.new_password && <p className="error text-sm mt-1">{passwordErrors.new_password[0]}</p>}
          </div>
          <div>
            <label htmlFor="new_password_confirmation" className="form-label">Confirm New Password</label>
            <input type="password" id="new_password_confirmation" name="new_password_confirmation" value={formData.new_password_confirmation} onChange={handleChange} className="form-input" required />
          </div>

          {passwordMessage.text && <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{passwordMessage.text}</p>}

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