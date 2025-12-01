import { useContext, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
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
    const navigate = useNavigate();

    // Define which pages use the "Public Layout"
    const publicLayoutPaths = ['/welcome', '/', '/login', '/register', '/verify-email', '/terms', '/privacy'];
    const isPublicPage = publicLayoutPaths.includes(location.pathname) || location.pathname === '/welcome';
    const isLandingPage = location.pathname === '/welcome';

    const navItems = user ? [
        { name: "Dashboard", href: "/", icon: HomeIcon },
        { name: "Settings", href: "/settings", icon: Cog6ToothIcon },
    ] : [];

    // --- HELPER: Get Public Page Title ---
    const getPageTitle = () => {
        if (location.pathname === '/login') return "Log In";
        if (location.pathname === '/register') return "Get Started";
        if (location.pathname === '/terms') return "Terms";
        if (location.pathname === '/privacy') return "Privacy";
        return "Welcome"; // Default for /welcome
    };

    const scrollToSection = (sectionId) => {
        setIsMobileMenuOpen(false); 
        if (location.pathname !== '/welcome') {
            navigate('/welcome');
            setTimeout(() => {
                const element = document.getElementById(sectionId);
                if (element) element.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            const element = document.getElementById(sectionId);
            if (element) element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // --- 1. PUBLIC LAYOUT (Welcome, Login, Register, Terms, Privacy) ---
    if (isPublicPage && !user) { 
        return (
            <div className="flex flex-col min-h-screen font-sans bg-gray-50 text-gray-900 w-full overflow-x-hidden">
                
                <nav className="fixed w-full z-50 top-0 start-0 border-b border-gray-200 bg-white/80 backdrop-blur-md h-20 transition-all duration-300">
                    <div className="max-w-screen-2xl flex flex-wrap items-center mx-auto p-4 px-6 lg:px-8 h-full">
                        
                        {/* LEFT: Logo + Vertical Line + Page Title */}
                        <Link to="/welcome" className="flex items-center gap-3 group mr-4">
                            <img src="/FiamBond_Logo.png" className="h-9 w-9 object-contain" alt="FiamBond Logo" />
                            
                            <div className="flex items-center">
                                {/* FiamBond Text */}
                                <span className="self-center text-xl sm:text-2xl font-bold whitespace-nowrap text-indigo-600">
                                    FiamBond
                                </span>

                                {/* THE SEPARATOR LINE (Same as Dashboard) */}
                                <div className="hidden sm:block h-6 w-px bg-gray-300 mx-3"></div>

                                {/* THE DYNAMIC PAGE TITLE (Same as Dashboard style) */}
                                <span className="hidden sm:block text-lg sm:text-xl text-gray-500 font-medium">
                                    {getPageTitle()}
                                </span>
                            </div>
                        </Link>

                        {/* RIGHT: Navigation Links + Buttons */}
                        <div className="flex items-center gap-8 ml-auto">
                            
                            <div className="hidden md:block">
                                {isLandingPage && (
                                    <ul className="flex flex-row space-x-8 font-medium">
                                        <li>
                                            <button onClick={() => scrollToSection('features')} className="text-gray-600 hover:text-indigo-600 transition-colors font-bold text-sm">
                                                Features
                                            </button>
                                        </li>
                                        <li>
                                            <button onClick={() => scrollToSection('pricing')} className="text-gray-600 hover:text-indigo-600 transition-colors font-bold text-sm">
                                                Pricing
                                            </button>
                                        </li>
                                    </ul>
                                )}
                            </div>

                            {isLandingPage && <div className="hidden md:block h-6 w-px bg-gray-200"></div>}

                            <div className="hidden md:flex items-center space-x-4">
                                <Link to="/login" className="text-gray-900 hover:text-indigo-600 font-bold text-sm px-4 py-2 transition-colors">
                                    Log In
                                </Link>
                                <Link to="/register" className="text-white bg-indigo-600 hover:bg-indigo-700 font-bold rounded-lg text-sm px-5 py-2.5 text-center transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                                    Get Started
                                </Link>
                            </div>

                            <div className="md:hidden">
                                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-md">
                                    {isMobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {isMobileMenuOpen && (
                        <div className="absolute top-20 left-0 w-full bg-white border-b border-gray-100 shadow-xl md:hidden animate-fade-in-down z-50">
                            <div className="flex flex-col p-4 space-y-3">
                                {isLandingPage && (
                                    <>
                                        <button onClick={() => scrollToSection('features')} className="text-left px-4 py-3 font-semibold text-gray-700 rounded-lg hover:bg-gray-50">Features</button>
                                        <button onClick={() => scrollToSection('pricing')} className="text-left px-4 py-3 font-semibold text-gray-700 rounded-lg hover:bg-gray-50">Pricing</button>
                                        <hr className="border-gray-100 my-1"/>
                                    </>
                                )}
                                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-center font-bold text-gray-700 py-3 rounded-lg hover:bg-gray-50 border border-gray-100">
                                    Log In
                                </Link>
                                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="text-center font-bold text-white bg-indigo-600 py-3 rounded-lg shadow-md">
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    )}
                </nav>

                <main className="flex-grow pt-20">
                    <Outlet />
                </main>

                <footer className="bg-white py-12 border-t border-gray-200">
                    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            <img src="/FiamBond_Logo.png" alt="FiamBond Logo" className="h-8 w-8 object-contain" />
                            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                FiamBond
                            </span>
                        </div>
                        
                        <div className="text-gray-500 text-sm">
                            &copy; {new Date().getFullYear()} Eman Ryan L. Aguilera. All rights reserved.
                        </div>
                        
                        <div className="flex space-x-8 text-gray-500 text-sm font-medium">
                            <Link to="/privacy" className="hover:text-indigo-600 cursor-pointer transition-colors">Privacy Policy</Link>
                            <Link to="/terms" className="hover:text-indigo-600 cursor-pointer transition-colors">Terms of Service</Link>
                        </div>
                    </div>
                </footer>
            </div>
        );
    }

    // --- 2. DASHBOARD LAYOUT (Logged In Users) ---
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md h-20 transition-all duration-300">
                <nav className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8 w-full">
                    
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none">
                            {isMobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                        </button>
                        
                        <Link to="/" className="flex items-center gap-3 group">
                             <img src="/FiamBond_Logo.png" alt="FiamBond Logo" className="h-9 w-9 object-contain" />
                             <div className="flex items-center">
                                <span className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 hidden sm:block">
                                    FiamBond
                                </span>
                                <div className="hidden sm:block h-6 w-px bg-gray-300 mx-3"></div>
                                <span className="hidden sm:block text-lg sm:text-xl text-gray-500 font-medium">Dashboard</span>
                             </div>
                        </Link>
                    </div>
                    
                    {user && (
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-800">{user.full_name || 'User'}</p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                                <div className="h-9 w-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 shadow-sm">
                                    {(user.full_name || user.email || 'U')[0].toUpperCase()}
                                </div>
                            </div>
                            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-600 transition-colors" title="Logout">
                                <ArrowLeftOnRectangleIcon className="h-6 w-6" />
                            </button>
                        </div>
                    )}
                </nav>
            </header>
            
            <div className="flex flex-1 overflow-hidden w-full">
                {isMobileMenuOpen && <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>}
                
                <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <nav className="p-4 space-y-1 mt-4">
                         {navItems.map((item) => (
                            <NavLink key={item.name} to={item.href} onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${isActive ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200' : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'}`}>
                                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                                {item.name}
                            </NavLink>
                        ))}
                    </nav>
                </aside>
                
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}