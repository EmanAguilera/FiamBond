// src/Components/VerifiedUserRoute.jsx

import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AppContext } from '../Context/AppContext';

export default function VerifiedUserRoute({ children }) {
    const { user, loading } = useContext(AppContext);
    const location = useLocation();

    if (loading) {
        // You can replace this with a more sophisticated loading spinner component
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Loading session...</p>
            </div>
        );
    }

    if (!user) {
        // If the user is not logged in at all, redirect them to the login page.
        // We pass the current location so they can be redirected back after logging in.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!user.emailVerified) {
        // If the user IS logged in BUT their email is NOT verified,
        // redirect them to the verification page.
        return <Navigate to="/verify-email" state={{ from: location }} replace />;
    }

    // If we reach here, the user is logged in AND their email is verified.
    // We can safely render the child components (e.g., the dashboard).
    return children;
}