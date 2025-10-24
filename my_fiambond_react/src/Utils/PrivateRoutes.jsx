// src/Utils/PrivateRoutes.jsx

import { useContext } from 'react';
// THE FIX IS HERE: Import the Outlet component
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { AppContext } from '../Context/AppContext';

// THE FIX IS HERE: Remove the 'children' prop from the function signature
export default function PrivateRoutes() {
    const { user, loading } = useContext(AppContext);
    const location = useLocation();

    // While the context is loading the user's auth state, show a loading message.
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Loading session...</p>
            </div>
        );
    }

    // If there is no user, redirect to the login page.
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If there is a user, but their email is not verified, redirect to the verify page.
    if (!user.emailVerified) {
        return <Navigate to="/verify-email" state={{ from: location }} replace />;
    }

    // THE FIX IS HERE: If the user is authenticated and verified,
    // render the <Outlet />. This tells React Router to render the
    // nested child route (e.g., <Home /> or <Settings />).
    return <Outlet />;
}