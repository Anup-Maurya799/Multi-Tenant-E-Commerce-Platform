import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import LoadingScreen from "../../screens/LoadingScreen";

function PublicRoute() {
  const { isAuthenticated, role, isCheckingSession } = useAuth();

  // Wait until session verification is complete
  if (isCheckingSession) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    const destinationByRole = {
      vendor: "/vendor/dashboard",
      superadmin: "/admin/analytics",
      customer: "/shop",
    };

    return <Navigate to={destinationByRole[role] || "/shop"} replace />;
  }

  return <Outlet />;
}

export default PublicRoute;
