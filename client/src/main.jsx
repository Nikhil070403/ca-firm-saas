import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './features/auth/context/AuthContext.jsx';
import { BrandingProvider } from './features/settings/context/BrandingContext.jsx';
import { ToastProvider } from './components/shared/Toast.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <BrandingProvider>
            <App />
          </BrandingProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
