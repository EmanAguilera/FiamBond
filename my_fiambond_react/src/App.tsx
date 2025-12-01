import { Routes, Route } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import Layout from "./Pages/layout.jsx"; // Just this one!
import Home from "./Pages/Home.jsx";
import WelcomePage from "./Pages/Landing/WelcomePage.jsx";
import Settings from "./Pages/Settings.jsx";
import TermsOfService from './Pages/TermsOfService';
import PrivacyPolicy from './Pages/PrivacyPolicy';
import Login from "./Pages/Auth/Login";
import Register from "./Pages/Auth/Register";
import VerifyEmail from './Pages/Auth/VerifyEmail.jsx';
import PrivateRoutes from "./Utils/PrivateRoutes.jsx";
import PublicRoute from "./Utils/PublicRoutes.jsx";
import VerificationRoute from "./Utils/VerificationRoute.jsx";

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
      <Routes>
        <Route element={<Layout />}>
          
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />

          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
          
          <Route element={<VerificationRoute />}>
            <Route path="/verify-email" element={<VerifyEmail />} />
          </Route>

          <Route element={<PrivateRoutes />}>
            <Route path="/" element={<Home />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

        </Route>
      </Routes>
    </>
  );
}