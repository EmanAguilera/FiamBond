import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AppContext } from '../Context/AppContext';

const PrivateRoutes = () => {
    const { token } = useContext(AppContext);

    // If there's a token, render the child route (using <Outlet />).
    // Otherwise, redirect the user to the login page.
    return token ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoutes;