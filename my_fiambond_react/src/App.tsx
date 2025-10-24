// src/App.tsx

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

export default function App() {
  return (
    // The BrowserRouter and AppProvider are correctly in main.tsx.
    <Routes>
      {/* THE FIX IS HERE: The main Layout wraps EVERYTHING. */}
      <Route path="/" element={<Layout />}>

        {/* --- Section 1: Public-Facing Routes --- */}
        {/* The Home page is now the main index route, accessible to everyone. */}
        {/* The Home component itself will decide to show the Hero or the Dashboard. */}
        <Route index element={<Home />} />

        {/* --- Section 2: Authentication Routes (for logged-out users) --- */}
        {/* These use PublicRoute to redirect logged-in users away. */}
        <Route element={<PublicRoute />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>
        
        {/* --- Section 3: Verification Route (Special Case) --- */}
        <Route path="verify-email" element={<VerifyEmail />} />

        {/* --- Section 4: Protected Routes (for logged-in & verified users) --- */}
        {/* This group contains ONLY the pages that MUST be protected. */}
        <Route element={<PrivateRoutes />}>
          <Route path="settings" element={<Settings />} />
          {/* Add any other strictly private routes here, like /profile, etc. */}
        </Route>
        
      </Route>
    </Routes>
  );
}