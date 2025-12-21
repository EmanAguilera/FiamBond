import { useContext, useState, useRef, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppContext } from "../Context/AppContext.jsx";
import {
    ArrowLeftOnRectangleIcon,
    Cog6ToothIcon,
    Bars3Icon,
    XMarkIcon,
    ChevronDownIcon,
    ClockIcon,
    CheckBadgeIcon
} from '@heroicons/react/24/outline';

export default function Layout() {
    const { user, handleLogout, premiumDetails } = useContext(AppContext);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    
    // Ref to detect clicks outside the dropdown
    const dropdownRef = useRef(null);

    const location = useLocation();
    const navigate = useNavigate();

    const publicLayoutPaths = ['/welcome', '/', '/login', '/register', '/verify-email', '/terms', '/privacy'];
    const isPublicLayout = !user && (publicLayoutPaths.includes(location.pathname) || location.pathname === '/welcome');
    const isLandingPage = location.pathname === '/welcome';

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getPageTitle = () => {
        if (location.pathname === '/login') return "Log In";
        if (location.pathname === '/register') return "Get Started";
        if (location.pathname === '/terms') return "Terms";
        if (location.pathname === '/privacy') return "Privacy";
        return "Welcome"; 
    };

    // Helper function to format subscription dates
    const formatSubscriptionDate = (dateVal) => {
        if (!dateVal) return 'Not active';
        
        // Handle Firestore Timestamp
        if (dateVal.seconds) {
            return new Date(dateVal.seconds * 1000).toLocaleDateString();
        }
        
        // Handle other date formats
        const date = new Date(dateVal);
        return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
    };

    // Helper function to format expiration dates
    const formatExpirationDate = (grantedAt, planCycle) => {
        if (!grantedAt) return 'N/A';
        
        const startDate = grantedAt.seconds ? new Date(grantedAt.seconds * 1000) : new Date(grantedAt);
        if (isNaN(startDate.getTime())) return 'Invalid date';
        
        const endDate = new Date(startDate);
        
        if (planCycle === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
            endDate.setMonth(endDate.getMonth() + 1);
        }
        
        return endDate.toLocaleDateString();
    };

    // Component to display subscription info
    const SubscriptionInfo = ({ type, premium }) => {
        if (!premium) return null;
        
        return (
            <div className="px-4 py-2 text-xs text-gray-600 border-t border-gray-100 first:border-t-0">
                <div className="flex items-center gap-2 font-medium mb-1">
                    <CheckBadgeIcon className="h-3 w-3 text-emerald-500" />
                    <span className="capitalize">{type} Premium</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                        <span className="text-gray-400">Start:</span>
                        <div className="font-mono">{formatSubscriptionDate(premium.granted_at)}</div>
                    </div>
                    <div>
                        <span className="text-gray-400">End:</span>
                        <div className="font-mono">{formatExpirationDate(premium.granted_at, premium.plan_cycle)}</div>
                    </div>
                </div>
            </div>
        );
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

    // --- 1. PUBLIC LAYOUT ---
    if (isPublicLayout) { 
        return (
            <div className="flex flex-col min-h-screen font-sans bg-gray-50 text-gray-900 w-full overflow-x-hidden">
                <nav className="fixed w-full z-50 top-0 start-0 border-b border-gray-200 bg-white/80 backdrop-blur-md h-20 transition-all duration-300">
                    <div className="max-w-screen-2xl flex flex-wrap items-center mx-auto p-4 px-6 lg:px-8 h-full">
                        <Link to="/welcome" className="flex items-center gap-3 group mr-4">
                            <img src="/FiamBond_Logo.png" className="h-9 w-9 object-contain" alt="FiamBond Logo" />
                            <div className="flex items-center">
                                <span className="self-center text-xl sm:text-2xl font-bold whitespace-nowrap text-indigo-600">FiamBond</span>
                                <div className="hidden sm:block h-6 w-px bg-gray-300 mx-3"></div>
                                <span className="hidden sm:block text-lg sm:text-xl text-gray-500 font-medium">{getPageTitle()}</span>
                            </div>
                        </Link>

                        <div className="flex items-center gap-8 ml-auto">
                            <div className="hidden md:block">
                                {isLandingPage && (
                                    <ul className="flex flex-row space-x-8 font-medium">
                                        <li><button onClick={() => scrollToSection('features')} className="text-gray-600 hover:text-indigo-600 transition-colors font-bold text-sm">Features</button></li>
                                        <li><button onClick={() => scrollToSection('pricing')} className="text-gray-600 hover:text-indigo-600 transition-colors font-bold text-sm">Pricing</button></li>
                                    </ul>
                                )}
                            </div>
                            {isLandingPage && <div className="hidden md:block h-6 w-px bg-gray-200"></div>}
                            <div className="hidden md:flex items-center space-x-4">
                                <Link to="/login" className="text-gray-900 hover:text-indigo-600 font-bold text-sm px-4 py-2 transition-colors">Log In</Link>
                                <Link to="/register" className="text-white bg-indigo-600 hover:bg-indigo-700 font-bold rounded-lg text-sm px-5 py-2.5 transition-all shadow-md">Get Started</Link>
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
                                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-center font-bold text-gray-700 py-3 rounded-lg hover:bg-gray-50 border border-gray-100">Log In</Link>
                                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="text-center font-bold text-white bg-indigo-600 py-3 rounded-lg shadow-md">Get Started</Link>
                            </div>
                        </div>
                    )}
                </nav>
                <main className="flex-grow pt-20"><Outlet /></main>
                <footer className="bg-white py-12 border-t border-gray-200">
                    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            <img src="/FiamBond_Logo.png" alt="FiamBond Logo" className="h-8 w-8 object-contain" />
                            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">FiamBond</span>
                        </div>
                        <div className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} Eman Ryan L. Aguilera. All rights reserved.</div>
                        <div className="flex space-x-8 text-gray-500 text-sm font-medium">
                            <Link to="/privacy" className="hover:text-indigo-600 cursor-pointer transition-colors">Privacy Policy</Link>
                            <Link to="/terms" className="hover:text-indigo-600 cursor-pointer transition-colors">Terms of Service</Link>
                        </div>
                    </div>
                </footer>
            </div>
        );
    }

    // --- 2. DASHBOARD LAYOUT (AUTHENTICATED) ---
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md h-20 transition-all duration-300">
                <nav className="max-w-screen-2xl mx-auto flex items-center justify-between h-full px-4 sm:px-6 lg:px-8 w-full">
                    
                    {/* Logo Area */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center gap-3 group">
                             <img src="/FiamBond_Logo.png" alt="FiamBond Logo" className="h-9 w-9 object-contain" />
                             <div className="flex items-center">
                                <span className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                    FiamBond
                                </span>
                                <div className="hidden sm:block h-6 w-px bg-gray-300 mx-3"></div>
                                <span className="hidden sm:block text-lg sm:text-xl text-gray-500 font-medium">Realm</span>
                             </div>
                        </Link>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        
                        {/* Subscription Status - Always Visible */}
                        {user && (
                            <div className="hidden md:flex items-center gap-4">
                                {/* Unified Subscription Display */}
                                {(premiumDetails.company || premiumDetails.family) ? (
                                    <div className="flex items-center gap-3 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <CheckBadgeIcon className="h-4 w-4 text-indigo-600" />
                                            <span className="text-xs font-medium text-gray-700">Subscriptions</span>
                                        </div>
                                        
                                        {/* Company Subscription */}
                                        {premiumDetails.company && (
                                            <div className="flex items-center gap-1">
                                                <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
                                                <span className="text-xs text-gray-600">
                                                    Company: {formatExpirationDate(premiumDetails.company.granted_at, premiumDetails.company.plan_cycle)}
                                                </span>
                                            </div>
                                        )}
                                        
                                        {/* Family Subscription */}
                                        {premiumDetails.family && (
                                            <div className="flex items-center gap-1">
                                                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                                <span className="text-xs text-gray-600">
                                                    Family: {formatExpirationDate(premiumDetails.family.granted_at, premiumDetails.family.plan_cycle)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* No Active Subscriptions */
                                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                        <ClockIcon className="h-4 w-4 text-gray-400" />
                                        <span className="text-xs font-medium text-gray-500">
                                            No subscriptions
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Desktop Profile Dropdown */}
                        {user && (
                            <div className="hidden md:block relative" ref={dropdownRef}>
                                <button 
                                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                    className="flex items-center gap-3 p-1 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none"
                                >
                                    <div className="text-right mr-1">
                                        <p className="text-sm font-bold text-gray-800 capitalize tracking-wide">
                                            {user.full_name || 'User'}
                                        </p>
                                    </div>
                                    <div className="h-9 w-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 shadow-sm">
                                        {(user.full_name || user.email || 'U')[0].toUpperCase()}
                                    </div>
                                    <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {isProfileMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 py-2 animate-fade-in-down origin-top-right z-50">
                                        
                                        <Link 
                                            to="/settings" 
                                            onClick={() => setIsProfileMenuOpen(false)}
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 font-medium whitespace-nowrap"
                                        >
                                            <Cog6ToothIcon className="h-4 w-4 mr-2" />
                                            Settings
                                        </Link>
                                        <div className="border-t border-gray-100 my-1"></div>
                                        <button 
                                            onClick={handleLogout}
                                            className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium whitespace-nowrap"
                                        >
                                            <ArrowLeftOnRectangleIcon className="h-4 w-4 mr-2" />
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Mobile Hamburger Button */}
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none">
                            {isMobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                        </button>
                    </div>
                </nav>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 bg-white">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {/* User Info Header in Mobile */}
                            <div className="flex items-center px-3 py-3 mb-2 bg-indigo-50 rounded-lg mx-2">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                                        {(user.full_name || 'U')[0].toUpperCase()}
                                    </div>
                                </div>
                                <div className="ml-3">
                                    <div className="text-base font-bold capitalize tracking-wide text-gray-800">{user.full_name || 'User'}</div>
                                    <div className="text-xs font-medium text-gray-500">{user.email}</div>
                                </div>
                            </div>
                            
                            {/* Subscription Info in Mobile */}
                            <div className="px-3 py-3 border-t border-gray-100">
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Subscriptions</div>
                                {premiumDetails.company && (
                                    <div className="text-xs text-gray-600 mb-2">
                                        <div className="flex items-center gap-1 font-medium">
                                            <CheckBadgeIcon className="h-3 w-3 text-emerald-500" />
                                            Company Premium
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-[11px] mt-1">
                                            <div>
                                                <span className="text-gray-400">Start:</span>
                                                <div className="font-mono">{formatSubscriptionDate(premiumDetails.company.granted_at)}</div>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">End:</span>
                                                <div className="font-mono">{formatExpirationDate(premiumDetails.company.granted_at, premiumDetails.company.plan_cycle)}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {premiumDetails.family && (
                                    <div className="text-xs text-gray-600">
                                        <div className="flex items-center gap-1 font-medium">
                                            <CheckBadgeIcon className="h-3 w-3 text-blue-500" />
                                            Family Premium
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-[11px] mt-1">
                                            <div>
                                                <span className="text-gray-400">Start:</span>
                                                <div className="font-mono">{formatSubscriptionDate(premiumDetails.family.granted_at)}</div>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">End:</span>
                                                <div className="font-mono">{formatExpirationDate(premiumDetails.family.granted_at, premiumDetails.family.plan_cycle)}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {!premiumDetails.company && !premiumDetails.family && (
                                    <div className="text-xs text-gray-400 italic py-2 text-center">No active subscriptions</div>
                                )}
                            </div>

                            {/* Mobile Navigation Links */}
                            <Link 
                                to="/settings" 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                            >
                                <Cog6ToothIcon className="mr-3 h-6 w-6 text-gray-400" />
                                Settings
                            </Link>

                            <button 
                                onClick={handleLogout}
                                className="w-full flex items-center px-3 py-3 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                            >
                                <ArrowLeftOnRectangleIcon className="mr-3 h-6 w-6" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}
            </header>
            
            <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
}