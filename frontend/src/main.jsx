import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SaleProvider } from "./context/SaleContext";
import { Toaster } from "sonner";
import * as Sentry from "@sentry/react";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // 🛡️ Noise Cancellation: Silence in-app browser 'ghost' errors and external scripts
    ignoreErrors: [
      'window.webkit.messageHandlers', // Facebook/Instagram in-app browser error
      'webkit.messageHandlers',
      'Non-Error promise rejection captured',
      'The expression cannot be converted to a number',
    ],
    denyUrls: [
      /graph\.facebook\.com/i,
      /connect\.facebook\.net/i,
      /googletagmanager\.com/i,
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, 
    // Session Replay
    replaysSessionSampleRate: 0.1, 
    replaysOnErrorSampleRate: 1.0, 
  });
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <SaleProvider>
        <App />
        <Toaster position="top-center" expand={true} richColors />
      </SaleProvider>
    </AuthProvider>
  </BrowserRouter>
);

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}