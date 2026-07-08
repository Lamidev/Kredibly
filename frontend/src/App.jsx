import { Route, Routes, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ScrollToTop from "./components/ui/ScrollToTop";

import LandingPage from "./pages/public/landing-page";
import AboutUs from "./pages/public/about-us";
import SupportHub from "./pages/public/support-hub";
import PrivacyPolicy from "./pages/public/privacy-policy";
import ProductPage from "./pages/public/ProductPage";
import SolutionPage from "./pages/public/SolutionPage";
import PricingPage from "./pages/public/PricingPage";
import PublicInvoicePage from "./pages/public/PublicInvoicePage";
import PublicReceiptPage from "./pages/public/PublicReceiptPage";
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
import Workspace from "./pages/merchant/workspace";
import Customers from "./pages/merchant/customers";
import Money from "./pages/merchant/money";
import Tasks from "./pages/merchant/tasks";
import Kreddy from "./pages/merchant/kreddy";
import SettingsLayout from "./pages/merchant/settings/SettingsLayout";
import SettingsIdentityPage from "./pages/merchant/settings/SettingsIdentityPage";
import SettingsNotificationsPage from "./pages/merchant/settings/SettingsNotificationsPage";
import SettingsKreddyPage from "./pages/merchant/settings/SettingsKreddyPage";
import SettingsPayoutsPage from "./pages/merchant/settings/SettingsPayoutsPage";
import SettingsVerificationPage from "./pages/merchant/settings/SettingsVerificationPage";
import SettingsStaffPage from "./pages/merchant/settings/SettingsStaffPage";
import SettingsPlanPage from "./pages/merchant/settings/SettingsPlanPage";
import ReportsPage from "./pages/merchant/reports";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMerchants from "./pages/admin/AdminMerchants";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminRevenue from "./pages/admin/AdminRevenue";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminMissionControl from "./pages/admin/AdminMissionControl";
import AdminLayout from "./components/admin/AdminLayout";

import DashboardLayout from "./components/dashboard/DashboardLayout";

const App = () => {
  const { user, profile, loading } = useAuth();

  if (loading) return null;

  const getHomeRedirect = () => {
    if (!user) return "/";
    if (user.role === 'admin') return "/admin";
    // A completed profile always has a displayName — works for all users regardless of onboardingStep value
    const onboardingComplete = profile && profile.displayName;
    return onboardingComplete ? "/dashboard" : "/onboarding";
  };

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={!user ? <LandingPage /> : <Navigate to={getHomeRedirect()} />} />
        
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
        <Route path="/r/:id" element={<PublicReceiptPage />} />

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
          element={user && profile && profile.displayName ? <DashboardLayout /> : <Navigate to={getHomeRedirect()} />}
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/money" element={<Money />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/kreddy" element={<Kreddy />} />
          
          {/* Legacy route fallbacks */}
          <Route path="/sales" element={<Workspace />} />
          <Route path="/sales/new" element={<Workspace />} />
          <Route path="/debtors" element={<Workspace />} />
          <Route path="/pending-balances" element={<Workspace />} />
          <Route path="/reports" element={<Kreddy />} />
          <Route path="/settings" element={<SettingsLayout />}>
            <Route index element={<SettingsIdentityPage />} />
            <Route path="identity" element={<Navigate to="/settings" replace />} />
            <Route path="payouts" element={<SettingsPayoutsPage />} />
            <Route path="verification" element={<SettingsVerificationPage />} />
            <Route path="plan" element={<SettingsPlanPage />} />
          </Route>
          <Route path="/dashboard/invoice/:id" element={<InvoicePage />} />
        </Route>

        {/* Onboarding - No Sidebar */}
        <Route
          path="/onboarding"
          element={
            !user ? <Navigate to="/auth/login" /> :
            user.role === 'admin' ? <Navigate to="/admin" /> :
            (!profile || !profile.displayName) ? <Onboarding /> :
            <Navigate to="/dashboard" />
          }
        />

        {/* Admin Routes - Restricted to Founders */}
        <Route
          element={user && user.role === 'admin' ? <AdminLayout /> : <Navigate to={getHomeRedirect()} />}
        >
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/merchants" element={<AdminMerchants />} />
          <Route path="/admin/support" element={<AdminSupport />} />
          <Route path="/admin/revenue" element={<AdminRevenue />} />
           <Route path="/admin/coupons" element={<AdminCoupons />} />
          <Route path="/admin/mission-control" element={<AdminMissionControl />} />
        </Route>

        {/* Default Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

export default App;