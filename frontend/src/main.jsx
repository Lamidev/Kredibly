import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SaleProvider } from "./context/SaleContext";
import { Toaster } from "sonner";

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