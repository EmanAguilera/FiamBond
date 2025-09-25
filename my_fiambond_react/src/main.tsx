import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // .js extension is not needed
import AppProvider from './Context/AppContext'; // .jsx extension is not needed
import './App.css'; 

import { BrowserRouter } from 'react-router-dom';

// 1. Get the root element from the DOM
const rootElement = document.getElementById('root');

// 2. Check if the element was actually found before rendering
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
} else {
  // Optional: Log an error to the console if the root element is missing
  console.error("Failed to find the root element. Check your index.html file.");
}