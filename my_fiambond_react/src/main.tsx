// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async'; // <--- 1. IMPORT THIS
import AppProvider from './Context/AppContext';
import App from './App';
import './App.css'; 

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      {/* 2. WRAP EVERYTHING IN HELMET PROVIDER */}
      <HelmetProvider>
        <BrowserRouter>
          <AppProvider>
            <App />
          </AppProvider>
        </BrowserRouter>
      </HelmetProvider>
    </React.StrictMode>
  );
} else {
  console.error("Failed to find the root element. Check your index.html file.");
}