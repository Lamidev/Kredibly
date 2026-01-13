import { Route, Routes, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import LandingPage from "./pages/landing-page";
import AuthLayout from "./components/auth/layout";
import Login from "./pages/auth/login";
import Register from "./pages/auth/register";
import VerifyEmail from "./pages/auth/verify-email";
import ForgotPassword from "./pages/auth/forgotPassword";
import ResetPassword from "./pages/auth/resetPassword";
import Onboarding from "./pages/onboarding";
import Dashboard from "./pages/dashboard";
import CreateSale from "./pages/create-sale";
import InvoicePage from "./pages/invoice-page";
import SalesList from "./pages/sales-list";

const App = () => {
  const { user, profile, loading } = useAuth();

  if (loading) return null;

  const getHomeRedirect = () => {
    if (!user) return "/auth/login";
    return profile ? "/dashboard" : "/onboarding";
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/invoice/:id" element={<InvoicePage />} />

      {/* Auth Routes Wrapped in AuthLayout */}
      <Route element={<AuthLayout />}>
        <Route path="/auth/login" element={!user ? <Login /> : <Navigate to={getHomeRedirect()} />} />
        <Route path="/auth/register" element={!user ? <Register /> : <Navigate to={getHomeRedirect()} />} />
        <Route path="/auth/verify-email" element={<VerifyEmail />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={user ? (profile ? <Dashboard /> : <Navigate to="/onboarding" />) : <Navigate to="/auth/login" />}
      />
      <Route
        path="/onboarding"
        element={user ? (!profile ? <Onboarding /> : <Navigate to="/dashboard" />) : <Navigate to="/auth/login" />}
      />
      <Route
        path="/sales/new"
        element={user ? <CreateSale /> : <Navigate to="/auth/login" />}
      />
      <Route
        path="/sales"
        element={user ? <SalesList /> : <Navigate to="/auth/login" />}
      />

      {/* Default Catch-all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;