import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AuthLayout from "../layouts/AuthLayout";
import VendorLayout from "../layouts/VendorLayout";
import ShopLayout from "../layouts/ShopLayout";
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
import VendorAnalyticsPage from "../pages/vendor/VendorAnalyticsPage";

import StorefrontPage from "../pages/shop/StorefrontPage";
import ProductDetailPage from "../pages/shop/ProductDetailPage";
import CartPage from "../pages/shop/CartPage";
import SuperAdminLayout from "../layouts/SuperAdminLayout";
import SuperAdminAnalyticsPage from "../pages/admin/SuperAdminAnalyticsPage";
import CheckoutPage from "../pages/shop/CheckoutPage";
import OrderConfirmationPage from "../pages/shop/OrderConfirmationPage";

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

        {/* Public storefront — browsable by guests AND logged-in customers */}
        <Route element={<ShopLayout />}>
          <Route path="/shop" element={<StorefrontPage />} />
          <Route
            path="/shop/products/:productId"
            element={<ProductDetailPage />}
          />
          <Route path="/cart" element={<CartPage />} />
        </Route>

        {/* Checkout requires a logged-in customer — CartPage already redirects
            to /login (remembering /cart) before ever reaching here. */}
        <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
          <Route element={<ShopLayout />}>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route
              path="/order-confirmation"
              element={<OrderConfirmationPage />}
            />
          </Route>
        </Route>

        {/* Vendor-only area */}
        <Route element={<ProtectedRoute allowedRoles={["vendor"]} />}>
          <Route path="/vendor/onboarding" element={<CreateStorePage />} />
          <Route element={<VendorLayout />}>
            <Route path="/vendor/dashboard" element={<ProductListPage />} />
            <Route path="/vendor/products/new" element={<ProductFormPage />} />
            <Route
              path="/vendor/products/:productId/edit"
              element={<ProductFormPage />}
            />
            <Route path="/vendor/store" element={<StoreSettingsPage />} />
            <Route path="/vendor/analytics" element={<VendorAnalyticsPage />} />
          </Route>
        </Route>

        {/* Super Admin area */}
        <Route element={<ProtectedRoute allowedRoles={["superadmin"]} />}>
          <Route element={<SuperAdminLayout />}>
            <Route
              path="/admin/analytics"
              element={<SuperAdminAnalyticsPage />}
            />
          </Route>
        </Route>

        {/* Any authenticated role */}
        <Route element={<ProtectedRoute />}>
          {/* <Route path="/imp" element={<CustomerDashboard />} /> */}
        </Route>

        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/" element={<Navigate to="/shop" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
