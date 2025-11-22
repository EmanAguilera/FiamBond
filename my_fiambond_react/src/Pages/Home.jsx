import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../Context/AppContext.jsx";

// Import the two new views
import UserDashboard from "./Dashboard/UserDashboard.jsx";
import WelcomePage from "./Landing/WelcomePage.jsx";

export default function Home() {
    const { user, loading } = useContext(AppContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (user && !user.emailVerified) {
            navigate('/verify-email');
        }
    }, [user, navigate]);

    if (loading) {
        return <div className="min-h-screen flex justify-center items-center text-slate-500">Loading...</div>;
    }

    // The Traffic Cop Logic
    if (user && user.emailVerified) {
        return <UserDashboard />;
    } else {
        return <WelcomePage />;
    }
}