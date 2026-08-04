import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AuthLayout from "../layouts/AuthLayout";
import VendorLayout from "../layouts/VendorLayout";
import ProtectedRoute from "../components/routes/ProtectedRoute";
import PublicRoute from "../components/routes/PublicRoute";

import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import NotFoundPage from "../pages/NotFoundPage";

import CreateStorePage from "../pages/vendor/CreateStorePage";
import ProductListPage from "../pages/vendor/ProductListPage";
import ProductFormPage from "../pages/vendor/ProductFormPage";
import StoreSettingsPage from "../pages/vendor/StoreSettingsPage";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public-only auth screens */}
        <Route element={<PublicRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>
        </Route>

        {/* Token-linked auth screens */}
        <Route element={<AuthLayout />}>
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Route>

        {/* Vendor-only area */}
        <Route element={<ProtectedRoute allowedRoles={["vendor"]} />}>
          {/* Standalone — outside VendorLayout, since the sidebar assumes a store already exists */}
          <Route path="/vendor/onboarding" element={<CreateStorePage />} />

          <Route element={<VendorLayout />}>
            <Route path="/vendor/dashboard" element={<ProductListPage />} />
            <Route path="/vendor/products/new" element={<ProductFormPage />} />
            <Route
              path="/vendor/products/:productId/edit"
              element={<ProductFormPage />}
            />
            <Route path="/vendor/store" element={<StoreSettingsPage />} />
          </Route>
        </Route>

        {/* Any authenticated role */}
        <Route element={<ProtectedRoute />}>
          {/* <Route path="/imp" element={<CustomerDashboard />} /> */}
        </Route>

        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
