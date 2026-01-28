import { Route, Routes, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ScrollToTop from "./components/ui/ScrollToTop";

import LandingPage from "./pages/public/landing-page";
import Waitlist from "./pages/public/Waitlist";
import AboutUs from "./pages/public/about-us";
import SupportHub from "./pages/public/support-hub";
import PrivacyPolicy from "./pages/public/privacy-policy";
import ProductPage from "./pages/public/ProductPage";
import SolutionPage from "./pages/public/SolutionPage";
import PricingPage from "./pages/public/PricingPage";
import PublicInvoicePage from "./pages/public/PublicInvoicePage";
import AuthLayout from "./components/auth/layout";
import Login from "./pages/auth/login";
import Register from "./pages/auth/register";
import VerifyEmail from "./pages/auth/verify-email";
import ForgotPassword from "./pages/auth/forgotPassword";
import ResetPassword from "./pages/auth/resetPassword";
import Onboarding from "./pages/merchant/onboarding";
import Dashboard from "./pages/merchant/dashboard";
import CreateSale from "./pages/merchant/create-sale";
import InvoicePage from "./pages/merchant/invoice-page";
import SalesList from "./pages/merchant/sales-list";
import SettingsPage from "./pages/merchant/settings-page";
import ProofsPage from "./pages/merchant/proofs";
import ReportsPage from "./pages/merchant/reports";
import AdminDashboard from "./pages/admin/AdminDashboard";

import DashboardLayout from "./components/dashboard/DashboardLayout";

const App = () => {
  const { user, profile, loading } = useAuth();

  if (loading) return null;

  const getHomeRedirect = () => {
    if (!user) return "/auth/login";
    if (user.role === 'admin') return "/admin";
    return profile ? "/dashboard" : "/onboarding";
  };

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={user ? <Navigate to={getHomeRedirect()} /> : <Waitlist />} />
        <Route path="/waitlist" element={<Waitlist />} />
        
        {/* Landing page accessible at /home for development/reference */}
        <Route path="/home" element={<LandingPage />} />
        
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<SupportHub />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/solution/:id" element={<SolutionPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/invoice/:id" element={<PublicInvoicePage />} />
        <Route path="/i/:id" element={<PublicInvoicePage />} />

        {/* Auth Routes Wrapped in AuthLayout */}
        <Route element={<AuthLayout />}>
          <Route path="/auth/login" element={!user ? <Login /> : <Navigate to={getHomeRedirect()} />} />
          <Route path="/auth/register" element={!user ? <Register /> : <Navigate to={getHomeRedirect()} />} />
          <Route path="/auth/verify-email" element={<VerifyEmail />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Protected Routes with Sidebar Layout */}
        <Route
          element={user && profile ? <DashboardLayout /> : <Navigate to={getHomeRedirect()} />}
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sales" element={<SalesList />} />
          <Route path="/sales/new" element={<CreateSale />} />
          <Route path="/debtors" element={<SalesList initialFilter="outstanding" />} />
          <Route path="/pending-balances" element={<SalesList initialFilter="outstanding" />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/proofs" element={<ProofsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/dashboard/invoice/:id" element={<InvoicePage />} />
        </Route>

        {/* Onboarding - No Sidebar */}
        <Route
          path="/onboarding"
          element={user ? (user.role === 'admin' ? <Navigate to="/admin" /> : (!profile ? <Onboarding /> : <Navigate to="/dashboard" />)) : <Navigate to="/auth/login" />}
        />

        {/* Admin Route - Restricted to Founders */}
        <Route
          path="/admin"
          element={user && user.role === 'admin' ? <AdminDashboard /> : (profile ? <Navigate to="/dashboard" /> : <Navigate to="/onboarding" />)}
        />

        {/* Default Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

export default App;