// eslint-disable-next-line no-unused-vars
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AuthLayout from "../layouts/AuthLayout";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* All auth screens share AuthLayout's background + card */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Route>

        {/* Default landing */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Your dashboards / app routes go here, outside AuthLayout */}
        {/* <Route path="/imp" element={<CustomerDashboard />} /> */}
        {/* <Route path="/vendor/dashboard" element={<VendorDashboard />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
