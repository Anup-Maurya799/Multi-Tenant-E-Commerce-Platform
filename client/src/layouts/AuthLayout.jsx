// eslint-disable-next-line no-unused-vars
import React from "react";
import { Outlet } from "react-router-dom";

/**
 * Shared shell for every auth screen (Login, Signup, Forgot/Reset Password,
 * Verify Email). Owns the page background, centering, and the white card —
 * so individual pages only need to render what's inside the card.
 */
function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-100 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-sky-100 border border-sky-100 p-6 sm:p-8">
        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout;
