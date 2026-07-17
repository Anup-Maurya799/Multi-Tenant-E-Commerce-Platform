// eslint-disable-next-line no-unused-vars
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

/**
 * Guards routes that should NOT be visible to an already-logged-in user
 * (Login, Signup). If they're already authenticated, send them straight to
 * their dashboard instead of showing the login form again.
 */
function PublicRoute() {
  const { isAuthenticated, role } = useAuth();

  if (isAuthenticated) {
    return (
      <Navigate to={role === "vendor" ? "/vendor/dashboard" : "/imp"} replace />
    );
  }

  return <Outlet />;
}

export default PublicRoute;
