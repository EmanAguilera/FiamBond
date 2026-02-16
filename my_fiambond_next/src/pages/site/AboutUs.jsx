'use client'; 

import Link from "next/link";
import React, { useState, useEffect } from "react";
// ⭐️ INTEGRATION: Using your specific UnifiedLoadingWidget
import UnifiedLoadingWidget from "../../components/ui/UnifiedLoadingWidget";

export default function AboutUs() {
    // 🛡️ Mounted State Guard
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // 🛡️ Show Loader to match Privacy Policy behavior
    if (!mounted) {
        return (
            <UnifiedLoadingWidget 
                type="fullscreen" 
                message="Loading the Archive..." 
                variant="indigo" 
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-900">
            <div className="max-w-4xl mx-auto">
                {/* Back Button - Identical to Privacy Policy */}
                <div className="mb-8">
                    <Link 
                        href="/" 
                        className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Home
                    </Link>
                </div>

                {/* Main Content Card - Identical Face to Privacy Policy */}
                <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
                    <div className="border-b border-gray-100 pb-8 mb-8">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">About Us</h1>
                        <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">The Story of the Ledger of Truth</p>
                    </div>

                    <div className="space-y-8 text-gray-600 leading-relaxed text-left">
                        {/* THE "WHY" SECTION */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Why FiamBond?</h2>
                            <p>
                                FiamBond was created to solve a fundamental problem: <strong>Financial Fragmentation.</strong> 
                                Most people track their personal money in one place, their family expenses in another, 
                                and their business records in a third. 
                            </p>
                            <p className="mt-3">
                                We asked, <em>"Why not have one 'Ledger of Truth' that handles everything?"</em> FiamBond 
                                provides a unified ecosystem where different financial "Realms" co-exist securely.
                            </p>
                        </section>

                        {/* THE PROGRESS SECTION */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Our Progress</h2>
                            <p>
                                This platform is a result of constant iteration and development. We have evolved from a simple 
                                transaction tracker into a comprehensive financial engine. Our current progress includes:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mt-3">
                                <li><strong>The Realm System:</strong> Specialized environments for Personal, Family, and Corporate accounting.</li>
                                <li><strong>Automated Insights:</strong> Real-time analytics that visualize growth and spending habits.</li>
                                <li><strong>Strategic Goals:</strong> Tools that help users not just track money, but achieve specific financial targets.</li>
                                <li><strong>Corporate Integrity:</strong> A full-scale payroll and disbursement system for small businesses.</li>
                            </ul>
                        </section>

                        {/* PHILOSOPHY SECTION */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">3. The Three Realms</h2>
                            <p>We believe financial management happens at three distinct levels:</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <h4 className="font-bold text-indigo-600 text-sm mb-1">Personal</h4>
                                    <p className="text-xs">Your private daily financial habits and security.</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <h4 className="font-bold text-indigo-600 text-sm mb-1">Family</h4>
                                    <p className="text-xs">Shared accountability and collective growth.</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <h4 className="font-bold text-indigo-600 text-sm mb-1">Corporate</h4>
                                    <p className="text-xs">Professional payroll and business-grade transparency.</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Looking Ahead</h2>
                            <p>
                                Our journey is far from over. We are currently working on expanding our automated reporting 
                                features, enhancing loan tracking algorithms, and streamlining the user experience to ensure 
                                that the "Ledger of Truth" remains the most reliable financial tool in your arsenal.
                            </p>
                        </section>
                    </div>
                </div>

                {/* Footer Quote */}
                <div className="mt-12 text-center">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.3em]">
                        Precision • Transparency • Growth
                    </p>
                </div>
            </div>
        </div>
    );
}