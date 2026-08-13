import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import LoadingScreen from "../../screens/LoadingScreen";

function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, role, isCheckingSession } = useAuth();
  const location = useLocation();

  // Wait until the existing session has been checked
  if (isCheckingSession) {
    return <LoadingScreen />;
  }

  // User is definitely not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated but doesn't have permission
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
