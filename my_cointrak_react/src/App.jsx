import { Routes, Route } from "react-router-dom";
import Layout from "./Pages/layout.jsx";
import Home from "./Pages/Home.jsx";
import Login from "./Pages/Auth/Login.jsx";
import Register from "./Pages/Auth/Register.jsx";
import FamiliesIndex from "./Pages/Families/Index.jsx";
import FamiliesShow from "./Pages/Families/Show.jsx";
import GoalsIndex from "./Pages/Goals/Index.jsx";
import FamilyLedger from "./Pages/Families/Ledger.jsx";
import Settings from "./Pages/Settings.jsx"; // Import the new Settings component
import PrivateRoutes from "./Utils/PrivateRoutes"; // Import a guard for authenticated routes

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public Routes */}
        <Route index element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route element={<PrivateRoutes />}>
          <Route path="/families" element={<FamiliesIndex />} />
          <Route path="/families/:id" element={<FamiliesShow />} />
          <Route path="/families/:id/ledger" element={<FamilyLedger />} />
          <Route path="/goals" element={<GoalsIndex />} />
          <Route path="/settings" element={<Settings />} /> {/* Add the new settings route here */}
        </Route>
      </Route>
    </Routes>
  );
}