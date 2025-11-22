import { useContext, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { AppContext } from "../Context/AppContext.jsx";
import {
    HomeIcon,
    ArrowLeftOnRectangleIcon,
    Cog6ToothIcon,
    Bars3Icon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

export default function Layout() {
    const { user, handleLogout } = useContext(AppContext);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    const authLayoutPaths = ['/login', '/register', '/verify-email'];
    const isAuthPage = authLayoutPaths.includes(location.pathname) || location.pathname === '/welcome';

    const navItems = user ? [
        { name: "Dashboard", href: "/", icon: HomeIcon },
        { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
    ] : [];

    // --- 1. PUBLIC / AUTH LAYOUT (No Sidebar) ---
    if (isAuthPage) {
        return (
            <div className="min-h-screen bg-slate-50">
                <header className="app-header">
                    <nav className="top-nav">
                        {/* FIX #1: If user is logged in, go to Dashboard. If not, go to Welcome. */}
                        <Link to={user ? "/" : "/welcome"} className="logo">Fiambond</Link>
                        
                        {location.pathname !== '/verify-email' && !user && (
                            <div className="flex items-center space-x-2">
                                <NavLink to="/register" className="nav-link"> Register </NavLink>
                                <NavLink to="/login" className="nav-link"> Login </NavLink>
                            </div>
                        )}
                    </nav>
                </header>
                <main>
                    <Outlet />
                </main>
            </div>
        );
    }

    // --- 2. DASHBOARD LAYOUT (With Sidebar) ---
    return (
        <>
            <header className="app-header">
                <nav className="top-nav">
                    {/* FIX #2: When inside the dashboard, Logo always points to root "/" */}
                    <Link to="/" className="logo">Fiambond</Link>
                    
                    {user && (
                        <div className="flex items-center space-x-4">
                            <div className="hidden md:flex items-center space-x-4">
                                <p className="text-slate-500 text-sm whitespace-nowrap">
                                    Welcome, <strong>{user.full_name || user.email}</strong>
                                </p>
                                <button onClick={handleLogout} className="nav-link logout-link" title="Logout">
                                    <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                                </button>
                            </div>
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none"
                                aria-label="Toggle menu"
                            >
                                {isMobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                            </button>
                        </div>
                    )}
                </nav>

                {isMobileMenuOpen && user && (
                    <div className="md:hidden bg-white border-b border-gray-100">
                        <ul className="px-4 pt-2 pb-4 space-y-1">
                            {navItems.map((item) => (
                                <li key={item.name}>
                                    <NavLink
                                        to={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
                                    >
                                        {item.icon && <item.icon className="h-5 w-5" />}
                                        <span className="ml-3">{item.name}</span>
                                    </NavLink>
                                </li>
                            ))}
                            <li><hr className="my-2 border-gray-200" /></li>
                            <li>
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="sidebar-nav-link w-full text-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                    <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                                    <span className="ml-3">Logout</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </header>

            <div className="flex">
                <aside className="sidebar">
                    <nav className="sidebar-nav">
                        <ul>
                            {navItems.map((item) => (
                                <li key={item.name}>
                                    <NavLink
                                        to={item.href}
                                        className={({ isActive }) => `sidebar-nav-link group ${isActive ? 'active' : ''}`}
                                    >
                                        {item.icon && <item.icon className="h-5 w-5 text-gray-400 group-hover:text-indigo-600" />}
                                        <span className="ml-3">{item.name}</span>
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </aside>

                <main className="w-full main-content-with-sidebar">
                    <Outlet />
                </main>
            </div>
        </>
    );
}