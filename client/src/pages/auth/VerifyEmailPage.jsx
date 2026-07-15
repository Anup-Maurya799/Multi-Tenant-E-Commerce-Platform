// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaEnvelopeOpenText,
} from "react-icons/fa";

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token"); // sent by M3's backend in the verification email

  // "verifying" | "success" | "error"
  const [status, setStatus] = useState("verifying");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("error");
      return;
    }

    // Placeholder for the real request to M3's backend, e.g.:
    // authService.verifyEmail(token).then(...).catch(...)
    const timer = setTimeout(() => {
      const storedUsers = JSON.parse(localStorage.getItem("users")) || [];
      const user = storedUsers.find((u) => u.verificationToken === token);

      if (!user) {
        setStatus("error");
        return;
      }

      const updatedUsers = storedUsers.map((u) =>
        u.verificationToken === token ? { ...u, isVerified: true } : u,
      );
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      setStatus("success");
    }, 1500);

    return () => clearTimeout(timer);
  }, [token]);

  // Auto-redirect to login a few seconds after success
  useEffect(() => {
    if (status !== "success") return;
    const redirect = setTimeout(() => navigate("/login"), 4000);
    return () => clearTimeout(redirect);
  }, [status, navigate]);

  // Resend cooldown ticker
  useEffect(() => {
    if (resendCooldown === 0) return;
    const tick = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(tick);
  }, [resendCooldown]);

  const handleResend = () => {
    if (resendCooldown > 0) return;
    // Placeholder for the real request to M3's backend, e.g.:
    // await authService.resendVerificationEmail(email)
    setResendMessage("Verification email sent. Check your inbox.");
    setResendCooldown(30);
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
            {status === "verifying" && "Verifying your email"}
            {status === "success" && "Email verified"}
            {status === "error" && "Verification failed"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {status === "verifying" && "Hold on while we confirm your address"}
            {status === "success" && "Your account is now active"}
            {status === "error" && "This link is invalid or has expired"}
          </p>
        </div>

        <div className="flex flex-col items-center text-center">
          {/* Verifying state */}
          {status === "verifying" && (
            <>
              <span className="h-10 w-10 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin mb-4" />
              <p className="text-sm text-slate-500">
                This usually only takes a moment.
              </p>
            </>
          )}

          {/* Success state */}
          {status === "success" && (
            <>
              <FaCheckCircle className="text-sky-500 mb-4" size={44} />
              <p className="text-sm text-slate-500 mb-6">
                You&apos;ll be redirected to login automatically, or continue
                right away.
              </p>
              <Link
                to="/login"
                className="w-full rounded-lg bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-semibold py-2.5 text-sm transition-colors shadow-sm shadow-sky-200 text-center"
              >
                Continue to login
              </Link>
            </>
          )}

          {/* Error state */}
          {status === "error" && (
            <>
              <FaTimesCircle className="text-red-400 mb-4" size={44} />
              <p className="text-sm text-slate-500 mb-6">
                The link may have expired, or already been used. Request a new
                verification email below.
              </p>

              {resendMessage && (
                <p className="w-full text-sm text-sky-600 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2 mb-4 flex items-center justify-center gap-2">
                  <FaEnvelopeOpenText size={14} />
                  {resendMessage}
                </p>
              )}

              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="w-full rounded-lg bg-sky-500 hover:bg-sky-600 active:bg-sky-700 disabled:bg-sky-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 text-sm transition-colors shadow-sm shadow-sky-200 mb-3"
              >
                {resendCooldown > 0 ?
                  `Resend available in ${resendCooldown}s`
                : "Resend verification email"}
              </button>

              <Link
                to="/login"
                className="text-sm text-sky-600 hover:text-sky-700 font-medium"
              >
                Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifyEmailPage;
