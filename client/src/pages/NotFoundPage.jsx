// eslint-disable-next-line no-unused-vars
import React from "react";
import { Link } from "react-router-dom";
import { FaCompass } from "react-icons/fa";

function NotFoundPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-100 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-sky-100 border border-sky-100 p-6 sm:p-8 text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-sky-50 flex items-center justify-center">
          <FaCompass className="text-sky-500" size={22} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">
          404 — Page not found
        </h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <Link
          to="/login"
          className="inline-block w-full rounded-lg bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-semibold py-2.5 text-sm transition-colors shadow-sm shadow-sky-200"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
