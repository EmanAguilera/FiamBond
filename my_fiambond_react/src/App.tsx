import { Routes, Route } from "react-router-dom";
import Layout from "./Pages/layout.jsx";
import Home from "./Pages/Home.jsx";
import Login from "./Pages/Auth/Login";
import Register from "./Pages/Auth/Register";
import Settings from "./Pages/Settings.jsx"; // Import the new Settings component
import PrivateRoutes from "./Utils/PrivateRoutes.jsx"; // Import a guard for authenticated routes

import FirebaseTutorialPage from "./Pages/FirebaseTutorialPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public Routes */}
        <Route index element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/tutorial" element={<FirebaseTutorialPage />} />
        {/* Protected Routes */}
          <Route element={<PrivateRoutes />}>
          <Route path="/settings" element={<Settings />} /> {/* Add the new settings route here */}
        </Route>
      </Route>
    </Routes>
  );
}