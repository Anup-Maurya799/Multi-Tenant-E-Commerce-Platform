// eslint-disable-next-line no-unused-vars
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft, FaCheckCircle } from "react-icons/fa";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const validate = () => {
    const next = {};
    if (!email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Enter a valid email address.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("");
    if (!validate()) return;

    const storedUsers = JSON.parse(localStorage.getItem("users")) || [];
    const user = storedUsers.find((u) => u.email === email);

    if (!user) {
      setMessage("No account found with this email address.");
      return;
    }

    setIsSubmitting(true);

    // Placeholder for the real request to M3's backend, e.g.:
    // await authService.requestPasswordReset(email)
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-100 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-sky-100 border border-sky-100 p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-sky-500 flex items-center justify-center text-white font-bold text-lg">
            Z
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            {isSent ? "Check your email" : "Forgot your password?"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {isSent ?
              `We've sent a reset link to ${email}`
            : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        {isSent ?
          /* Success state */
          <div className="flex flex-col items-center text-center">
            <FaCheckCircle className="text-sky-500 mb-3" size={40} />
            <p className="text-sm text-slate-500 mb-6">
              Didn&apos;t get the email? Check your spam folder, or try again
              with a different address.
            </p>
            <button
              onClick={() => {
                setIsSent(false);
                setEmail("");
              }}
              className="w-full rounded-lg border border-sky-200 text-slate-600 hover:bg-sky-50 font-semibold py-2.5 text-sm transition-colors"
            >
              Try a different email
            </button>
          </div>
        : /* Form state */
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400
                  focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition
                  ${errors.email ? "border-red-400" : "border-sky-200"}`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {message && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-sky-500 hover:bg-sky-600 active:bg-sky-700 disabled:bg-sky-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 text-sm transition-colors shadow-sm shadow-sky-200 flex items-center justify-center gap-2"
            >
              {isSubmitting && (
                <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              {isSubmitting ? "Sending link..." : "Send reset link"}
            </button>
          </form>
        }

        <Link
          to="/login"
          className="mt-6 flex items-center justify-center gap-2 text-sm text-sky-600 hover:text-sky-700 font-medium"
        >
          <FaArrowLeft size={12} />
          Back to login
        </Link>
      </div>
    </div>
  );
}

export default ForgotPassword;
