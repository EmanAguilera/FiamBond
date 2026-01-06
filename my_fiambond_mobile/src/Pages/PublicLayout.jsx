import { Outlet, Link, useLocation } from "react-router-dom";

export default function PublicLayout() {
  const location = useLocation();

  // Check if the current page is the Welcome Page (or root)
  const isLandingPage = location.pathname === "/welcome" || location.pathname === "/";

  const scrollToSection = (id) => {
    if (isLandingPage) {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.location.href = `/welcome#${id}`;
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gray-50 text-gray-900 w-full overflow-x-hidden">
      
      {/* --- HEADER --- */}
      <nav className="fixed w-full z-50 top-0 start-0 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-screen-2xl flex flex-wrap items-center justify-between mx-auto p-4 px-6 lg:px-8">
          
          {/* 1. Logo (This is your Home Link now) */}
          <Link to="/welcome" className="flex items-center gap-2 rtl:space-x-reverse">
             <img src="/FiamBond_Logo.png" className="h-8" alt="FiamBond Logo" />
             <span className="self-center text-xl font-bold whitespace-nowrap text-indigo-600">FiamBond</span>
          </Link>

          {/* 2. Login/Get Started Buttons */}
          <div className="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse gap-4">
            <Link to="/login" className="text-gray-900 hover:text-indigo-600 font-medium text-sm px-4 py-2 transition-colors">
                Log In
            </Link>
            <Link to="/register" className="text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-4 py-2 text-center transition-all">
                Get Started
            </Link>
          </div>

          {/* 3. Navigation Links (ONLY Features & Pricing) */}
          <div className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1">
            
            {isLandingPage && (
                <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-transparent">
                  {/* Home Button REMOVED */}
                  
                  <li>
                    <button onClick={() => scrollToSection('features')} className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-indigo-600 md:p-0">
                      Features
                    </button>
                  </li>
                  <li>
                    <button onClick={() => scrollToSection('pricing')} className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-indigo-600 md:p-0">
                      Pricing
                    </button>
                  </li>
                </ul>
            )}
            
          </div>
        </div>
      </nav>

      {/* --- CONTENT --- */}
      <main className="flex-grow pt-20"> 
        <Outlet />
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-white py-12 border-t border-gray-200">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
                <img src="/FiamBond_Logo.png" alt="FiamBond Logo" className="h-9 w-9 object-contain" />
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