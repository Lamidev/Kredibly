// import { Navigate, useLocation } from "react-router-dom";
// import { useSelector } from "react-redux";
// import LoadingState from "@/components/business/loadingState";

// const CheckAuth = ({ children }) => {
//   const location = useLocation();
//   const { isAuthenticated, business, isCheckingAuth } = useSelector((state) => state.auth);

//   const authPages = [
//     "/auth/login",
//     "/auth/register",
//     "/auth/forgot-password",
//     "/auth/reset-password",
//     "/auth/verify-email",
//   ];

//   if (isCheckingAuth) {
//     return <LoadingState />;
//   }

//   if (!isAuthenticated && !authPages.includes(location.pathname)) {
//     return <Navigate to="/auth/login" state={{ from: location }} replace />;
//   }

//   if (
//     isAuthenticated &&
//     business &&
//     !business.isVerified &&
//     location.pathname !== "/auth/verify-email"
//   ) {
//     return <Navigate to="/auth/verify-email" replace />;
//   }

//   if (
//     isAuthenticated &&
//     business?.isVerified &&
//     authPages.includes(location.pathname)
//   ) {
//     return <Navigate to="/business/home" replace />;
//   }

//   return children;
// };

// export default CheckAuth;

import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import LoadingState from "@/components/business/loadingState";

const CheckAuth = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, business, isCheckingAuth } = useSelector((state) => state.auth);

  const authPages = [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/verify-email",
  ];

  // Skip auth check during registration process
  if (location.pathname === "/auth/register" && location.search) {
    return children;
  }

  if (isCheckingAuth) {
    return <LoadingState />;
  }

  if (!isAuthenticated && !authPages.includes(location.pathname)) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (
    isAuthenticated &&
    business &&
    !business.isVerified &&
    location.pathname !== "/auth/verify-email"
  ) {
    return <Navigate to="/auth/verify-email" replace />;
  }

  if (
    isAuthenticated &&
    business?.isVerified &&
    authPages.includes(location.pathname)
  ) {
    return <Navigate to="/business/home" replace />;
  }

  return children;
};

export default CheckAuth;