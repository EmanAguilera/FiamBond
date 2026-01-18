import { useContext } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { AppContext } from '../Context/AppContext';

export default function PrivateRoutes() {
    const { user, loading, getRealmAccess } = useContext(AppContext);
    const location = useLocation();

    // Determine the required realm for the current path
    const getRequiredRealm = (pathname) => {
        if (pathname.startsWith('/company')) return 'company';
        if (pathname.startsWith('/family')) return 'family';
        return null;
    };

    const requiredRealm = getRequiredRealm(location.pathname);

    // 1. Loading State
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Loading session...</p>
            </div>
        );
    }

    // 2. Not Logged In
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. Not Verified
    // CRITICAL FIX: Only redirect to /verify-email if the user is unverified AND they are NOT already on the /verify-email path.
    if (!user.emailVerified && location.pathname !== '/verify-email') { 
        return <Navigate to="/verify-email" state={{ from: location }} replace />;
    }

    // 4. Access Check (Verified and Logged In)
    if (user && user.subscription_tier) {
        const hasAccess = getRealmAccess(user.subscription_tier).includes(requiredRealm);

        // Redirect to upgrade page if access is denied to a paid realm
        if (requiredRealm && !hasAccess) {
            return <Navigate to="/upgrade" state={{ from: location }} replace />;
        }
    }
    
    // 5. Render Child Route
    return <Outlet />;
}