import { Link } from "react-router-dom";
import { Helmet } from 'react-helmet-async';
import { useState } from "react";

// --- ICONS ---
const CheckIcon = () => (
    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
);
const CrossIcon = () => (
    <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
);
const ShieldIcon = () => (
    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
);
const UsersIcon = () => (
    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
);
const BuildingIcon = () => (
    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
);

export default function WelcomePage() {
    const [billingCycle, setBillingCycle] = useState('monthly');
    const getPrice = (monthly, annual) => billingCycle === 'monthly' ? monthly : annual;
    const getPeriod = () => billingCycle === 'monthly' ? '/mo' : '/yr';

    const handleScroll = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="flex flex-col min-h-screen font-sans bg-gray-50 text-gray-900 w-full overflow-x-hidden">
            <Helmet>
                <title>FiamBond | The Ledger of Truth</title>
                <meta name="description" content="Secure financial tracking for individuals, families, and companies." />
            </Helmet>

            <style>{`
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-15px); }
                    100% { transform: translateY(0px); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
            `}</style>

            {/* --- HERO SECTION --- */}
            <header className="hero-section relative w-full pt-28 pb-16 lg:pt-36 lg:pb-32 overflow-hidden bg-gradient-to-b from-indigo-50/50 via-white to-white">
                
                {/* Decorative Blobs */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-indigo-100 blur-3xl opacity-60 pointer-events-none"></div>
                <div className="absolute top-1/2 left-0 -ml-20 w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-blue-100 blur-3xl opacity-60 pointer-events-none"></div>

                {/* 
                   FIXED ALIGNMENT: 
                   - Changed 'max-w-7xl' to 'max-w-screen-2xl' to match Layout Header.
                   - Maintained 'px-4 sm:px-6 lg:px-8' so the padding matches exactly.
                */}
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-10 lg:gap-20 items-center relative z-10">
                    
                    {/* Text Side */}
                    <div className="hero-text text-center md:text-left">
                        <div className="inline-flex items-center gap-2 py-1.5 px-3 rounded-full bg-white border border-indigo-100 shadow-sm text-indigo-600 text-xs font-bold uppercase tracking-wide mb-6">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            v1.0 Public Release
                        </div>
                        
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight text-gray-900 tracking-tight">
                            Take Control of <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-500">
                                Your Finances
                            </span>
                        </h1>
                        
                        <p className="text-lg lg:text-xl text-gray-600 mb-8 leading-relaxed max-w-lg mx-auto md:mx-0">
                            FiamBond is the ledger of truth for personal loans, family budgets, and company payroll.
                            Stop relying on memory. Start tracking today.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start px-4 sm:px-0">
                            <Link to="/register" className="primary-btn text-lg px-8 py-4 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 hover:shadow-indigo-200 transition-all transform hover:-translate-y-1 text-center">
                                Start Free Account
                            </Link>
                            <button 
                                onClick={() => handleScroll('features')}
                                className="secondary-btn text-lg px-8 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all text-center"
                            >
                                View Features
                            </button>
                        </div>

                        <div className="mt-10 mx-4 sm:mx-0 p-4 bg-white/80 backdrop-blur-md border border-blue-100 border-l-4 border-l-blue-500 rounded-r-xl shadow-sm text-left">
                            <p className="text-sm text-gray-600">
                                <strong className="text-blue-700">Disclaimer:</strong> This is a demo application. No real money or bank connections involved.
                            </p>
                        </div>
                    </div>

                    {/* Image Side */}
                    <div className="hero-visual relative hidden md:block group perspective-1000">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-indigo-200/40 to-white/0 rounded-full blur-3xl -z-10"></div>
                        <img 
                            src="/FiamBond_Image.png" 
                            alt="FiamBond Dashboard Preview" 
                            className="rounded-2xl shadow-2xl border border-gray-200/50 animate-float transform transition-transform duration-500 hover:rotate-1" 
                        />
                        <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-gray-100 animate-bounce" style={{ animationDuration: '3.5s' }}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-full text-green-600">
                                    <ShieldIcon />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Security</p>
                                    <p className="text-sm font-bold text-gray-800">AES-256 Encrypted</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- FEATURES GRID --- */}
            {/* Updated container to max-w-screen-2xl to match Header alignment */}
            <section id="features" className="py-16 md:py-24 bg-white scroll-mt-24 w-full">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                   <div className="text-center mb-16 max-w-2xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 md:mb-6 tracking-tight">One App. Three Realms.</h2>
                        <p className="text-lg md:text-xl text-gray-500 leading-relaxed">
                            FiamBond adapts to your context. Whether you are lending money to a friend, 
                            managing household bills, or running a startup.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="relative p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:border-indigo-100 hover:shadow-xl transition-all duration-300 group">
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 border border-gray-100 group-hover:scale-110 transition-transform duration-300">
                                <ShieldIcon />
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">Smart Loan Ledger</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Solve the "irritation" of partial payments. Track every parcel given and received. 
                                It’s a unilateral ledger that remembers the math for you.
                            </p>
                        </div>
                        <div className="relative p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:border-indigo-100 hover:shadow-xl transition-all duration-300 group">
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 border border-gray-100 group-hover:scale-110 transition-transform duration-300">
                                <UsersIcon />
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">Family Realms</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Create a shared financial space. Track household income, expenses, and goals together.
                                Transparency for the whole family.
                            </p>
                        </div>
                        <div className="relative p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:border-indigo-100 hover:shadow-xl transition-all duration-300 group">
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 border border-gray-100 group-hover:scale-110 transition-transform duration-300">
                                <BuildingIcon />
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">Company Command</h3>
                            <p className="text-gray-600 leading-relaxed">
                                A professional suite for businesses. Manage employee cash advances, automate payroll, 
                                and generate official PDF invoices.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- PRICING --- */}
            {/* Updated container to max-w-screen-2xl to match Header alignment */}
            <section id="pricing" className="py-20 md:py-24 bg-slate-900 text-white relative overflow-hidden scroll-mt-24 w-full">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-30 pointer-events-none">
                    <div className="absolute top-20 left-20 w-96 h-96 bg-indigo-600 rounded-full blur-[128px]"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-600 rounded-full blur-[128px]"></div>
                </div>

                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                     <div className="text-center mb-12 md:mb-16">
                        <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Flexible Pricing</h2>
                        <p className="text-slate-400 text-lg">Start for free. Upgrade when you mean business.</p>
                        <div className="mt-8 inline-flex bg-slate-800 rounded-xl p-1 border border-slate-700">
                            <button onClick={() => setBillingCycle('monthly')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${billingCycle === 'monthly' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Monthly</button>
                            <button onClick={() => setBillingCycle('annual')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${billingCycle === 'annual' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Annual</button>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                         <div className="bg-slate-800/50 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-slate-700 hover:border-slate-600 transition-all hover:transform hover:-translate-y-2 duration-300 flex flex-col h-full">
                            <div className="mb-6"><h3 className="text-2xl font-bold text-white">Personal</h3><p className="text-slate-400 text-sm mt-2">For individuals & loans.</p></div>
                            <div className="text-4xl font-bold mb-8">₱0<span className="text-lg text-slate-500 font-normal">/mo</span></div>
                            <Link to="/register" className="secondary-btn w-full mb-8 bg-slate-700 text-white border-none hover:bg-slate-600 text-center py-3 rounded-xl">Get Started</Link>
                            <ul className="space-y-4 text-sm text-slate-300 flex-grow">
                                <li className="flex gap-3 items-center"><CheckIcon /> Unlimited Transactions</li>
                                <li className="flex gap-3 items-center"><CheckIcon /> Smart Loan Tracking</li>
                                <li className="flex gap-3 items-center"><CheckIcon /> 1 Family Realm</li>
                                <li className="flex gap-3 items-center text-slate-600"><CrossIcon /> No Payroll Features</li>
                            </ul>
                        </div>
                        <div className="bg-white text-gray-900 rounded-3xl p-6 md:p-8 border-4 border-indigo-600 relative flex flex-col shadow-2xl transform md:scale-105 md:-translate-y-4 z-10">
                            <div className="absolute top-0 inset-x-0 flex justify-center -mt-3"><span className="bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide shadow-md">Most Popular</span></div>
                            <div className="mb-6 mt-2"><h3 className="text-2xl font-bold text-indigo-900">Company</h3><p className="text-gray-500 text-sm mt-2">For startups & barangays.</p></div>
                            <div className="text-5xl font-bold mb-8 text-gray-900 tracking-tight">{getPrice('₱1,500', '₱15,000')}<span className="text-lg text-gray-400 font-normal tracking-normal">{getPeriod()}</span></div>
                            <Link to="/register?plan=pro" className="primary-btn w-full mb-8 justify-center text-center py-4 rounded-xl shadow-indigo-200">Start 14-Day Trial</Link>
                            <ul className="space-y-4 text-sm text-gray-600 flex-grow font-medium">
                                <li className="flex gap-3 items-center"><CheckIcon /> Everything in Personal</li>
                                <li className="flex gap-3 items-center"><CheckIcon /> <strong>Company Realm Access</strong></li>
                                <li className="flex gap-3 items-center"><CheckIcon /> Generate PDF Payslips</li>
                                <li className="flex gap-3 items-center"><CheckIcon /> Employee Management</li>
                            </ul>
                        </div>
                        <div className="bg-slate-800/50 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-slate-700 hover:border-slate-600 transition-all hover:transform hover:-translate-y-2 duration-300 flex flex-col h-full">
                            <div className="mb-6"><h3 className="text-2xl font-bold text-white">Commercial</h3><p className="text-slate-400 text-sm mt-2">For larger organizations.</p></div>
                            <div className="text-4xl font-bold mb-8">{getPrice('₱3,500', '₱35,000')}<span className="text-lg text-slate-500 font-normal">{getPeriod()}</span></div>
                            <button className="secondary-btn w-full mb-8 bg-slate-700 text-white border-none hover:bg-slate-600 py-3 rounded-xl">Contact Sales</button>
                            <ul className="space-y-4 text-sm text-slate-300 flex-grow">
                                <li className="flex gap-3 items-center"><CheckIcon /> Everything in Company</li>
                                <li className="flex gap-3 items-center"><CheckIcon /> Unlimited Employees</li>
                                <li className="flex gap-3 items-center"><CheckIcon /> Audit Logs & Exports</li>
                                <li className="flex gap-3 items-center"><CheckIcon /> Custom Branding</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
             
        </div>
    );
}