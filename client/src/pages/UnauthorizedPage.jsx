// eslint-disable-next-line no-unused-vars
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaLock } from "react-icons/fa";

function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-100 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-sky-100 border border-sky-100 p-6 sm:p-8 text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-sky-50 flex items-center justify-center">
          <FaLock className="text-sky-500" size={22} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Access denied</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          Your account doesn&apos;t have permission to view this page. If you
          think this is a mistake, contact your workspace admin.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-full rounded-lg bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-semibold py-2.5 text-sm transition-colors shadow-sm shadow-sky-200"
          >
            Go back
          </button>
          <Link
            to="/login"
            className="w-full rounded-lg border border-sky-200 text-slate-600 hover:bg-sky-50 font-semibold py-2.5 text-sm transition-colors"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default UnauthorizedPage;
