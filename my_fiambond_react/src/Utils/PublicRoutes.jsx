// src/Utils/PublicRoute.jsx

import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AppContext } from '../Context/AppContext';

export default function PublicRoute() {
    const { user, loading } = useContext(AppContext);

    if (loading) {
        // While checking auth state, it's best to show nothing or a loader
        return <div>Loading...</div>;
    }

    // If a user IS logged in, redirect them away from public pages to the dashboard.
    if (user) {
        return <Navigate to="/" replace />;
    }

    // If no user is logged in, show the public page (e.g., Login, Register).
    return <Outlet />;
}