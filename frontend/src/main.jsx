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