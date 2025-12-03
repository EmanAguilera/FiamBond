// src/App.tsx
import { Routes, Route } from "react-router-dom";
import { Toaster } from 'react-hot-toast';

// --- LAYOUTS & GUARDS ---
import Layout from "./Pages/layout.jsx";
import PrivateRoutes from "./Utils/PrivateRoutes.jsx";
import PublicRoute from "./Utils/PublicRoutes.jsx";
import VerificationRoute from "./Utils/VerificationRoute.jsx";
import AdminRoute from "./Components/Admin/AdminRoute.jsx";

// --- PUBLIC PAGES ---
import WelcomePage from "./Pages/Landing/WelcomePage.jsx";
import TermsOfService from "./Pages/TermsOfService.jsx"; // <--- ADDED THIS
import PrivacyPolicy from "./Pages/PrivacyPolicy.jsx";   // <--- ADDED THIS
import Login from "./Pages/Auth/Login";
import Register from "./Pages/Auth/Register";
import VerifyEmail from './Pages/Auth/VerifyEmail.jsx';

// --- DASHBOARD PAGES ---
import UserDashboard from "./Pages/Personal/UserDashboard.jsx"; // Personal Realm
import Settings from "./Pages/Settings.jsx";
import AdminDashboard from "./Pages/Admin/AdminDashboard.jsx";   // Admin Realm

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
      <Routes>
        <Route element={<Layout />}>
          
          {/* 1. PUBLIC LANDING PAGE */}
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />

          {/* 2. AUTHENTICATION (Only for non-logged-in users) */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
          
          {/* 3. EMAIL VERIFICATION */}
          <Route element={<VerificationRoute />}>
            <Route path="/verify-email" element={<VerifyEmail />} />
          </Route>

          {/* 4. PRIVATE APP (Logged in & Verified) */}
          <Route element={<PrivateRoutes />}>
            
            {/* PERSONAL REALM (The Hub) */}
            <Route path="/" element={<UserDashboard />} />
            <Route path="/settings" element={<Settings />} />

            {/* ADMIN REALM */}
            <Route element={<AdminRoute />}>
               <Route path="/admin" element={<AdminDashboard />} />
            </Route>

          </Route>

        </Route>
      </Routes>
    </>
  );
}