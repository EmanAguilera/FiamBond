import { Routes, Route } from "react-router-dom";
import { Toaster } from 'react-hot-toast'; // --- 1. IMPORT TOASTER ---

// Import Layouts and Pages
import Layout from "./Pages/layout.jsx";
import Home from "./Pages/Home.jsx";
import Login from "./Pages/Auth/Login";
import Register from "./Pages/Auth/Register";
import Settings from "./Pages/Settings.jsx";
import VerifyEmail from './Pages/Auth/VerifyEmail.jsx';

// Import Route Protectors
import PrivateRoutes from "./Utils/PrivateRoutes.jsx";
import PublicRoute from "./Utils/PublicRoutes.jsx";
import VerificationRoute from "./Utils/VerificationRoute.jsx";

export default function App() {
  return (
    // Use a Fragment <> to wrap both Toaster and Routes
    <>
      {/* --- 2. ADD THE TOASTER COMPONENT HERE --- */}
      {/* It can be placed anywhere, but top-level is best. */}
      {/* You can customize its default position and style here. */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 5000, // Toasts last for 5 seconds
        }}
      />

      {/* --- 3. YOUR EXISTING ROUTES REMAIN UNCHANGED --- */}
      <Routes>
        <Route element={<Layout />}>

          <Route path="/welcome" element={<Home />} />

          {/* --- Public-Facing Routes --- */}
          <Route element={<PublicRoute />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>
          
          {/* --- Verification Route --- */}
          <Route element={<VerificationRoute />}>
            <Route path="verify-email" element={<VerifyEmail />} />
          </Route>

          {/* --- Protected Routes --- */}
          <Route element={<PrivateRoutes />}>
            <Route path="/" element={<Home />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
        </Route>
      </Routes>
    </>
  );
}