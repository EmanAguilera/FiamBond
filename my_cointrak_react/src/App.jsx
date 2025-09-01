import { Routes, Route } from "react-router-dom";
import Layout from "./Pages/layout.jsx"; // Corrected casing for consistency
import Home from "./Pages/Home.jsx";
import Login from "./Pages/Auth/Login.jsx";
import Register from "./Pages/Auth/Register.jsx";
import CreatePost from "./Pages/Posts/Create.jsx";
import ShowPost from "./Pages/Posts/Show.jsx";
import UpdatePost from "./Pages/Posts/Update.jsx";
import FamiliesIndex from "./Pages/Families/Index.jsx";
import FamiliesShow from "./Pages/Families/Show.jsx";
import GoalsIndex from "./Pages/Goals/Index.jsx";
import FamilyLedger from "./Pages/Families/Ledger.jsx";

// --- START OF FIX ---
// Corrected the paths to point inside the 'Pages' directory
import TransactionsCreate from "./Pages/Transactions/Create.jsx";
import ReportsIndex from "./Pages/Reports/Index.jsx";
// --- END OF FIX ---


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Post Routes */}
        <Route path="/create" element={<CreatePost />} />
        <Route path="/posts/:id" element={<ShowPost />} />
        <Route path="/posts/update/:id" element={<UpdatePost />} />
        
        {/* Family Routes */}
        <Route path="/families" element={<FamiliesIndex />} />
        <Route path="/families/:id" element={<FamiliesShow />} />
        <Route path="/families/:id/ledger" element={<FamilyLedger />} />

        {/* Other Routes */}
        <Route path="/goals" element={<GoalsIndex />} />
        <Route path="/transactions/create" element={<TransactionsCreate />} />
        <Route path="/reports" element={<ReportsIndex />} />
      </Route>
    </Routes>
  );
}