import { useContext } from "react";
import { Link, Outlet } from "react-router-dom";
import { AppContext } from "../Context/AppContext.jsx";
import {
    HomeIcon,
    BookOpenIcon,
    ArrowLeftOnRectangleIcon,
    UserGroupIcon,
    CalendarDaysIcon,
    Cog6ToothIcon // --- ADDED: Import the settings icon ---
} from '@heroicons/react/24/outline';

export default function Layout() {
    const { user, handleLogout } = useContext(AppContext);

    // --- UPDATED: Add the "Settings" link to the navigation for logged-in users ---
    const navItems = user ? [
        { name: "Dashboard", href: "/", icon: HomeIcon },
        { name: "Families", href: "/families", icon: UserGroupIcon },
        { name: "Goals", href: "/goals", icon: CalendarDaysIcon },
        { name: "Ledger", href: "/reports", icon: BookOpenIcon },
        { name: "Settings", href: "/settings", icon: Cog6ToothIcon }, // Added settings link
    ] : [
        { name: "Register", href: "/register" },
        { name: "Login", href: "/login" },
    ];

    return (
        <>
            <header className="app-header">
                <nav className="top-nav">
                    <Link to="/" className="logo">Cointrak</Link>
                    {user ? (
                        <div className="user-info">
                            <p className="text-slate-500 text-sm"> Welcome back, <strong>{user.first_name} {user.last_name}</strong> </p>
                            
                            <button onClick={handleLogout} className="nav-link logout-link">
                                <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-1" />
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <Link to="/register" className="nav-link">
                                Register
                            </Link>
                            <Link to="/login" className="nav-link">
                                Login
                            </Link>
                        </div>
                    )}
                </nav>
            </header>

            <div className="flex">
                {user && (
                    <aside className="sidebar">
                        <nav className="sidebar-nav">
                            <ul>
                                {navItems.map((item) => (
                                    <li key={item.name}>
                                        <Link
                                            to={item.href}
                                            className="sidebar-nav-link group"
                                        >
                                            {item.icon && <item.icon className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition duration-200 ease-in-out" />}
                                            <span className="ml-3">{item.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </aside>
                )}

                <main className={`flex-1 ${user ? 'main-content-with-sidebar' : ''}`}>
                    <Outlet />
                </main>
            </div>
        </>
    );
}