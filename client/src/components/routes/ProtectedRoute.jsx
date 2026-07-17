// eslint-disable-next-line no-unused-vars
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

/**
 * Guards routes that require a logged-in user.
 * - Not logged in            -> redirect to /login, remembering where they came from.
 * - Logged in, wrong role     -> redirect to /unauthorized.
 * - Logged in, role allowed   -> render the nested route via <Outlet />.
 *
 * @param {string[]} [allowedRoles] - if omitted, any authenticated user passes.
 */
function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
