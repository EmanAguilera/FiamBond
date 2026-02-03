"use client";

import React, { useContext, useState, useRef, useEffect } from "react"; // Added React import
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
} from '@heroicons/react/24/outline';

// --- HELPER FUNCTIONS ---

const formatExpirationDate = (grantedAt: any, planCycle: string | null) => {
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

// --- REUSABLE FOOTER ---
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

export default function MainShell({ children }: { children: React.ReactNode }) {
    const { user, handleLogout, premiumDetails }: any = useContext(AppContext);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    
    // Fix for "Property 'contains' does not exist on type 'never'"
    const dropdownRef = useRef<HTMLDivElement>(null); 
    
    const pathname = usePathname();

    const publicLayoutPaths = ['/', '/login', '/register', '/verify-email', '/terms', '/privacy'];
    const isPublicLayout = !user && (publicLayoutPaths.includes(pathname) || pathname === '/welcome');

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- VIEW A: PUBLIC LAYOUT ---
    if (isPublicLayout) { 
        return (
            <div className="flex flex-col min-h-screen font-sans bg-gray-50 text-gray-800 w-full overflow-x-hidden">
                <nav className="fixed w-full z-50 top-0 start-0 border-b border-gray-200 bg-white/80 backdrop-blur-md h-20">
                    <div className="max-w-screen-2xl flex items-center justify-between mx-auto p-4 px-6 lg:px-8 h-full">
                        <Link href="/" className="flex items-center gap-3">
                            <img src="/FiamBond_Logo.png" className="h-9 w-9 object-contain" alt="Logo" />
                            <span className="text-2xl font-bold text-indigo-600 tracking-tight">FiamBond</span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link href="/login" className="hidden sm:block text-gray-700 hover:text-indigo-600 font-semibold px-4 py-2 transition-colors">Log In</Link>
                            <Link href="/register" className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all">Get Started</Link>
                        </div>
                    </div>
                </nav>
                <main className="flex-grow pt-20">{children}</main>
                <AppFooter />
            </div>
        );
    }

    // --- VIEW B: AUTHENTICATED LAYOUT ---
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md h-20">
                <nav className="max-w-screen-2xl mx-auto flex items-center justify-between h-full px-4 sm:px-6 lg:px-8 w-full">
                    
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/realm" className="flex items-center gap-3 group">
                             <img src="/FiamBond_Logo.png" alt="Logo" className="h-9 w-9 object-contain" />
                             <div className="flex items-center">
                                <span className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">FiamBond</span>
                                <div className="hidden sm:block h-6 w-px bg-gray-300 mx-3"></div>
                                <span className="hidden sm:block text-lg sm:text-xl text-gray-500 font-medium">Realm</span>
                             </div>
                        </Link>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        {/* Unified Subscription Display (Desktop) */}
                        {user && (
                            <div className="hidden md:flex items-center gap-3 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                                <CheckBadgeIcon className="h-4 w-4 text-indigo-600" />
                                
                                {premiumDetails?.company && (
                                    <div className={`flex items-center gap-1.5 ${premiumDetails?.family ? 'border-r border-gray-200 pr-3' : ''}`}>
                                        <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <span className="text-[11px] text-emerald-700 font-bold uppercase tracking-tight">
                                            Co: {formatExpirationDate(premiumDetails.company.granted_at, premiumDetails.company.plan_cycle)}
                                        </span>
                                    </div>
                                )}
                                
                                {premiumDetails?.family && (
                                    <div className="flex items-center gap-1.5 pl-1">
                                        <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                                        <span className="text-[11px] text-blue-700 font-bold uppercase tracking-tight">
                                            Fam: {formatExpirationDate(premiumDetails.family.granted_at, premiumDetails.family.plan_cycle)}
                                        </span>
                                    </div>
                                )}

                                {!premiumDetails?.company && !premiumDetails?.family && (
                                    <div className="flex items-center gap-2">
                                        <ClockIcon className="h-3 w-3 text-gray-400" />
                                        <span className="text-[11px] font-medium text-gray-400 uppercase">Free Tier</span>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Profile Dropdown */}
                        {user && (
                            <div className="hidden md:block relative" ref={dropdownRef}>
                                <button 
                                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                    className="flex items-center gap-3 p-1 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none"
                                >
                                    <div className="text-right mr-1">
                                        <p className="text-sm font-bold text-gray-800 capitalize tracking-wide">{user.full_name || 'User'}</p>
                                    </div>
                                    <div className="h-9 w-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 shadow-sm">
                                        {(user.full_name || user.email || 'U')[0].toUpperCase()}
                                    </div>
                                    <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isProfileMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                                        <Link 
                                            href="/settings" 
                                            onClick={() => setIsProfileMenuOpen(false)}
                                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 font-medium"
                                        >
                                            <Cog6ToothIcon className="h-4 w-4 mr-2" /> Settings
                                        </Link>
                                        <div className="border-t border-gray-100 my-1"></div>
                                        <button 
                                            onClick={handleLogout}
                                            className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium"
                                        >
                                            <ArrowLeftOnRectangleIcon className="h-4 w-4 mr-2" /> Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                            {isMobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                        </button>
                    </div>
                </nav>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 bg-white animate-in slide-in-from-top">
                        <div className="px-4 py-6 space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-2xl">
                                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg border-2 border-white shadow-sm">
                                    {(user?.full_name || 'U')[0].toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-base font-bold text-gray-900">{user?.full_name || 'User'}</div>
                                    <div className="text-xs text-gray-500 font-medium">{user?.email}</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Active Plans</p>
                                {premiumDetails?.company && (
                                    <div className="flex justify-between items-center p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                                        <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                                            <CheckBadgeIcon className="h-4 w-4" /> Company Plan
                                        </div>
                                        <span className="text-[10px] text-emerald-600 font-bold">Ends: {formatExpirationDate(premiumDetails.company.granted_at, premiumDetails.company.plan_cycle)}</span>
                                    </div>
                                )}
                                {premiumDetails?.family && (
                                    <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                        <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                                            <CheckBadgeIcon className="h-4 w-4" /> Family Plan
                                        </div>
                                        <span className="text-[10px] text-blue-600 font-bold">Ends: {formatExpirationDate(premiumDetails.family.granted_at, premiumDetails.family.plan_cycle)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                                <Link 
                                    href="/settings" 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center py-4 px-2 text-gray-700 font-bold hover:bg-gray-50 rounded-lg"
                                >
                                    <Cog6ToothIcon className="h-6 w-6 mr-3 text-gray-400" /> Settings
                                </Link>
                                <button 
                                    onClick={handleLogout}
                                    className="flex w-full items-center py-4 px-2 text-red-600 font-bold hover:bg-red-50 rounded-lg"
                                >
                                    <ArrowLeftOnRectangleIcon className="h-6 w-6 mr-3 text-red-400" /> Sign Out
                                </button>
                            </div>
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