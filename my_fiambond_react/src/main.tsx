// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppProvider from './Context/AppContext';
import App from './App';
import './App.css'; 

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      {/* THIS is the one and only BrowserRouter for your entire application */}
      <BrowserRouter>
        {/* The context provider wraps the App so all components can access the user state */}
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
} else {
  console.error("Failed to find the root element. Check your index.html file.");
}