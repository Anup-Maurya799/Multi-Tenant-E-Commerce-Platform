/* eslint-disable react-hooks/set-state-in-effect */
// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaEnvelopeOpenText,
} from "react-icons/fa";
import authService from "../../services/authService";
import { isValidEmail } from "../../utils/validators";

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("verifying");
  const [resendEmail, setResendEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!token) {
      setStatus("error");
      return;
    }
    authService
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  useEffect(() => {
    if (status !== "success") return;
    const redirect = setTimeout(() => navigate("/login"), 4000);
    return () => clearTimeout(redirect);
  }, [status, navigate]);

  useEffect(() => {
    if (resendCooldown === 0) return;
    const tick = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(tick);
  }, [resendCooldown]);

  const handleResend = async () => {
    setResendError("");
    setResendMessage("");
    if (resendCooldown > 0) return;
    if (!isValidEmail(resendEmail)) {
      setResendError("Enter a valid email address to resend the link.");
      return;
    }
    try {
      await authService.resendVerificationEmail(resendEmail);
      setResendMessage(
        "If that email needs verifying, a new link has been sent.",
      );
      setResendCooldown(30);
    } catch (errorMessage) {
      setResendError(errorMessage);
    }
  };

  return (
    <>
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
        {status === "verifying" && (
          <>
            <span className="h-10 w-10 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin mb-4" />
            <p className="text-sm text-slate-500">
              This usually only takes a moment.
            </p>
          </>
        )}
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
        {status === "error" && (
          <>
            <FaTimesCircle className="text-red-400 mb-4" size={44} />
            <p className="text-sm text-slate-500 mb-4">
              The link may have expired, or already been used. Enter your email
              to request a new one.
            </p>
            <input
              type="email"
              placeholder="you@example.com"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              className="w-full mb-3 rounded-lg border border-sky-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition"
            />
            {resendError && (
              <p className="w-full text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
                {resendError}
              </p>
            )}
            {resendMessage && (
              <p className="w-full text-sm text-sky-600 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2 mb-3 flex items-center justify-center gap-2">
                <FaEnvelopeOpenText size={14} /> {resendMessage}
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
    </>
  );
}

export default VerifyEmailPage;
