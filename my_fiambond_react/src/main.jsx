import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import AppProvider from './Context/AppContext.jsx';
import './App.css'; // Assuming you have this for global styles

// 1. Import BrowserRouter from react-router-dom
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. Wrap your entire application with BrowserRouter */}
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);