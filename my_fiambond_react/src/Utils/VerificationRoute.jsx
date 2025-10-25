import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AppContext } from '../Context/AppContext';

export default function VerificationRoute() {
    const { user, loading } = useContext(AppContext);

    if (loading) {
        // While checking the auth state, show a loading indicator.
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Loading...</p>
            </div>
        );
    }

    // THE FIX IS HERE: Rule #1
    // If there is NO user, they are not logged in. Redirect them to the login page.
    // This secures the /verify-email page.
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // THE FIX IS HERE: Rule #2
    // If the user is logged in AND their email is already verified,
    // they don't belong here. Redirect them to the main dashboard.
    if (user.emailVerified) {
        return <Navigate to="/" replace />;
    }
    
    // If both checks above pass, it means the user is logged in but not verified.
    // This is the correct state, so we show the page's content.
    return <Outlet />;
}