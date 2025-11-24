import { Link } from "react-router-dom";
import { Helmet } from 'react-helmet-async';

export default function WelcomePage() {
    return (
        <div className="hero-section">
            {/* --- SEO UPDATES --- */}
            <Helmet>
                <title>FiamBond | Secure Finance Tracker (MERN Stack)</title>
                <meta 
                    name="description" 
                    content="FiamBond is a hybrid financial application architected with React, TypeScript, Node.js, Express, and MongoDB Atlas. Features secure Firebase Authentication and Cloudinary storage." 
                />
                <meta 
                    name="keywords" 
                    content="FiamBond, MERN Stack, Finance App, React, TypeScript, MongoDB, Express.js, Node.js, Vercel, Firebase Auth" 
                />
            </Helmet>

            <div className="hero-content">
                <div className="hero-text">
                    <h1 className="hero-headline">Take Control of Your Finances</h1>
                    <p className="hero-subheadline">
                        Fiambond is the simplest way to manage your personal and family finances. 
                        Track your income, monitor expenses, and achieve your financial goals with ease.
                    </p>
                    
                    <div className="hero-cta">
                        <Link to="/register" className="primary-btn text-lg">
                            Get Started for Free
                        </Link>
                        <Link to="/login" className="text-link text-lg">
                            Login to your account
                        </Link>
                    </div>

                    <div className="mt-8 p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-700 rounded-r-lg">
                        <p className="font-bold">Disclaimer:</p>
                        <p className="text-sm">
                            This is a demo application. It does not involve real money, monetary transactions, 
                            or any blockchain technology.
                        </p>
                    </div>
                </div>

                <div className="hero-visual">
                    <img 
                        src="/FiamBond_Image.png" 
                        alt="A family happily managing their finances on a tablet with an overlay of financial charts" 
                        className="rounded-xl shadow-2xl" 
                    />
                </div>
            </div>
        </div>
    );
}