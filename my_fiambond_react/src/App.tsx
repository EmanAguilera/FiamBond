import { Routes, Route } from "react-router-dom";

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
// THE FIX IS HERE: Import your new VerificationRoute protector
import VerificationRoute from "./Utils/VerificationRoute.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>

        <Route path="/welcome" element={<Home />} />

        {/* --- Public-Facing Routes --- */}
        <Route element={<PublicRoute />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>
        
        {/* --- Verification Route --- */}
        {/* THE FIX IS HERE: Wrap the verify-email route in its new, dedicated protector. */}
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
  );
}