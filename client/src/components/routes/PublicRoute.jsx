import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

function PublicRoute() {
  const { isAuthenticated, role } = useAuth();
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
