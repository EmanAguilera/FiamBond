import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppContext } from "./Context/AppContext";
import { useContext } from "react";

import Layout from "./Pages/layout";
import Home from "./Pages/Home";
import Register from "./Pages/Auth/Register";
import Login from "./Pages/Auth/Login";
import Create from "./Pages/Posts/Create";
import Show from "./Pages/Posts/Show";
import Update from "./Pages/Posts/Update";
import "./App.css";

import Families from "./Pages/Families/Index";
import ShowFamily from "./Pages/Families/Show";
import CreateTransaction from "./Pages/Transactions/Create";
import Goals from "./Pages/Goals/Index";
import Reports from "./Pages/Reports/Index";

export default function App() {
  const { user } = useContext(AppContext);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />

          <Route path="/register" element={user ? <Home /> : <Register />} />
          <Route path="/login" element={user ? <Home /> : <Login />} />

          <Route path="/create" element={user ? <Create /> : <Login />} />
          <Route path="/posts/:id" element={<Show />} />
          <Route path="/posts/update/:id" element={user ? <Update /> : <Login />} />

          <Route path="/families" element={<Families />} />
          <Route path="/families/:id" element={<ShowFamily />} />
          <Route path="/transactions/create" element={<CreateTransaction />} />

            <Route path="/goals" element={user ? <Goals /> : <Login />} />

             <Route path="/reports" element={user ? <Reports /> : <Login />} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}