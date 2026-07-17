// eslint-disable-next-line no-unused-vars
import React from "react";

/**
 * Full-screen loading state shown while ProtectedRoute/PublicRoute are
 * checking session status, or during any other app-level async check.
 * Kept as its own file (not inlined in the routes) so it's reusable anywhere.
 */
function LoadingScreen({ label = "Loading..." }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-100">
      <span className="h-10 w-10 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin mb-4" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export default LoadingScreen;
