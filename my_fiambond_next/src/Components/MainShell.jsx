"use client"; // Your instruction remembered!

import { useContext, useState, useRef, useEffect } from "react";
import Link from "next/link"; 
import { usePathname } from "next/navigation";
import { AppContext } from "../Context/AppContext";
import {
    ArrowLeftOnRectangleIcon,
    Cog6ToothIcon,
    Bars3Icon,
    XMarkIcon,
    ChevronDownIcon,
    ClockIcon,
    CheckBadgeIcon
} from '@heroicons/react/24/outline'; // Import new icons

// --- HELPER FUNCTIONS (Copied from my_fiambond_react) ---

// Helper function to format subscription dates
const formatSubscriptionDate = (dateVal) => {
    if (!dateVal) return 'Not active';
    
    // Handle Firestore Timestamp (checking for .seconds property)
    if (dateVal.seconds) {
        return new Date(dateVal.seconds * 1000).toLocaleDateString();
    }
    
    // Handle other date formats (e.g., standard Date object or string)
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


// --- REUSABLE FOOTER COMPONENT ---
const AppFooter = () => (
    <footer className="bg-white py-12 border-t border-gray-200">
        <div className="max-w-screen-2xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
                <img src="/FiamBond_Logo.png" alt="Logo" className="h-8 w-8" />
                <span className="text-xl font-bold text-indigo-600">FiamBond</span>
            </div>
            
            <nav className="flex gap-8 text-sm font-medium text-gray-500">
                <Link href="/privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-indigo-600 transition-colors">Terms of Service</Link>
            </nav>

            <div className="text-gray-400 text-xs font-medium">
                &copy; {new Date().getFullYear()} FiamBond Realm.
            </div>
        </div>
    </footer>
);
// -----------------------------------------------------------


export default function MainShell({ children }) {
    // Destructure premiumDetails here
    const { user, handleLogout, premiumDetails } = useContext(AppContext);
    
    // Using two states for better mobile/desktop menu control
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    
    const dropdownRef = useRef(null);

    const pathname = usePathname();

    // 1. Define Public Routes
    const publicLayoutPaths = [ 
        '/', 
        '/login', 
        '/register', 
        '/verify-email', 
        '/terms', 
        '/privacy'
    ];
    
    // Simplify public check for Next.js routes
    const isPublicLayout = !user && (publicLayoutPaths.includes(pathname) || pathname === '/welcome');
    // Note: Since Next.js uses one file per route, a separate /welcome route isn't necessary unless you have one.
    // I'll keep the logic generic, assuming '/' is the landing page.
    const isLandingPage = pathname === '/'; 

    // Close desktop profile dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Helper to determine the title for the public layout (using usePathname)
    const getPageTitle = () => {
        if (pathname === '/login') return "Log In";
        if (pathname === '/register') return "Get Started";
        if (pathname === '/terms') return "Terms";
        if (pathname === '/privacy') return "Privacy";
        return "Welcome"; 
    };
    
    // Note: scrollToSection logic is removed as it's complex to replicate with Next.js router and hash scrolling
    // without seeing the full pages/routes. Assuming static public links work for now.

    // --- VIEW A: PUBLIC / LANDING LAYOUT ---
    if (isPublicLayout) { 
        return (
            <div className="flex flex-col min-h-screen font-sans bg-gray-50 text-gray-800 w-full overflow-x-hidden">
                <nav className="fixed w-full z-50 top-0 start-0 border-b border-gray-200 bg-white/80 backdrop-blur-md h-20">
                    <div className="max-w-screen-2xl flex items-center justify-between mx-auto p-4 px-6 lg:px-8 h-full">
                        <Link href="/" className="flex items-center gap-3">
                            <img src="/FiamBond_Logo.png" className="h-9 w-9 object-contain" alt="FiamBond Logo" />
                            <span className="text-2xl font-bold text-indigo-600 tracking-tight">FiamBond</span>
                        </Link>
                        
                        <div className="flex items-center gap-4">
                            <Link href="/login" className="hidden sm:block text-gray-700 hover:text-indigo-600 font-semibold px-4 py-2 transition-colors">
                                Log In
                            </Link>
                            <Link href="/register" className="primary-btn-sm !text-sm !px-6 !py-2.5">
                                Get Started
                            </Link>
                        </div>
                    </div>
                </nav>

                <main className="flex-grow pt-20">
                    {children}
                </main>

                <AppFooter />
            </div>
        );
    }

    // --- VIEW B: DASHBOARD / APP LAYOUT (AUTHENTICATED) ---
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md h-20 transition-all duration-300">
                <nav className="max-w-screen-2xl mx-auto flex items-center justify-between h-full px-4 sm:px-6 lg:px-8 w-full">
                    
                    {/* Logo Area */}
                    <div className="flex items-center">
                        <Link href="/realm" className="flex items-center gap-3 group"> {/* Assuming /realm is the user's dashboard entry */}
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
                        
                        {/* Subscription Status - Always Visible (Desktop) */}
                        {user && (
                            <div className="hidden md:flex items-center gap-4">
                                {/* Unified Subscription Display */}
                                {(premiumDetails?.company || premiumDetails?.family) ? ( // Added optional chaining for safety
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
                                        
                                        {/* Subscription Info in Desktop Dropdown - Added for completeness/redundancy */}
                                        {(premiumDetails?.company || premiumDetails?.family) && (
                                            <div className="px-4 py-2 text-xs text-gray-600 mb-1">
                                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Subscriptions</div>
                                                {premiumDetails.company && (
                                                    <div className="flex flex-col mb-2">
                                                        <div className="flex items-center gap-1 font-medium text-emerald-600">
                                                            <CheckBadgeIcon className="h-3 w-3" />
                                                            Company Premium
                                                        </div>
                                                        <span className="text-gray-400 text-[11px] ml-4">Expires: {formatExpirationDate(premiumDetails.company.granted_at, premiumDetails.company.plan_cycle)}</span>
                                                    </div>
                                                )}
                                                {premiumDetails.family && (
                                                    <div className="flex flex-col mb-2">
                                                        <div className="flex items-center gap-1 font-medium text-blue-600">
                                                            <CheckBadgeIcon className="h-3 w-3" />
                                                            Family Premium
                                                        </div>
                                                        <span className="text-gray-400 text-[11px] ml-4">Expires: {formatExpirationDate(premiumDetails.family.granted_at, premiumDetails.family.plan_cycle)}</span>
                                                    </div>
                                                )}
                                                <div className="border-t border-gray-100 mt-2"></div>
                                            </div>
                                        )}
                                        
                                        <Link 
                                            href="/settings" 
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
                        <button onClick={() => { setIsMobileMenuOpen(!isMobileMenuOpen); setIsProfileMenuOpen(false); }} className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none">
                            {isMobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                        </button>
                    </div>
                </nav>

                {/* Mobile Menu (Full Overlay) */}
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
                                
                                    {/* FIX: Add Mobile Subscription Status summary underneath name */}
                                    {(premiumDetails?.company || premiumDetails?.family) && (
                                        <div className="mt-2 text-[10px] font-semibold text-gray-700">
                                            <span className="text-emerald-600">{premiumDetails.company ? 'Company Active' : ''}</span>
                                            {premiumDetails.company && premiumDetails.family && ' & '}
                                            <span className="text-blue-600">{premiumDetails.family ? 'Family Active' : ''}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Subscription Info in Mobile Menu (Detailed) */}
                            <div className="px-3 py-3 border-t border-gray-100">
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Subscriptions</div>
                                
                                {premiumDetails.company && (
                                    <div className="text-xs text-gray-600 mb-4">
                                        <div className="flex items-center gap-1 font-medium text-emerald-600">
                                            <CheckBadgeIcon className="h-3 w-3" />
                                            Company Premium
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-[11px] mt-1 ml-4">
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
                                    <div className="text-xs text-gray-600 mb-4">
                                        <div className="flex items-center gap-1 font-medium text-blue-600">
                                            <CheckBadgeIcon className="h-3 w-3" />
                                            Family Premium
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-[11px] mt-1 ml-4">
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
                                href="/settings" 
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
                {children}
            </main>
            
            <AppFooter />
        </div>
    );
}