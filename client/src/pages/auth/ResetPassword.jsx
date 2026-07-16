// eslint-disable-next-line no-unused-vars
import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaEye, FaEyeSlash, FaCheckCircle } from "react-icons/fa";
import authService from "../../services/authService";
import {
  validateResetPasswordForm,
  hasErrors,
  passwordRules,
} from "../../utils/validators";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReset, setIsReset] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!token) {
      setMessage(
        "This reset link is invalid or has expired. Request a new one.",
      );
      return;
    }

    const validationErrors = validateResetPasswordForm({
      password,
      confirmPassword,
    });
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    setIsSubmitting(true);
    try {
      await authService.resetPassword({ token, newPassword: password });
      setIsReset(true);
    } catch (errorMessage) {
      setMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="text-center mb-6">
        <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-sky-500 flex items-center justify-center text-white font-bold text-lg">
          Z
        </div>
        <h2 className="text-2xl font-bold text-slate-800">
          {isReset ? "Password reset" : "Set a new password"}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {isReset ?
            "Your password has been updated successfully"
          : "Choose a strong password for your account"}
        </p>
      </div>

      {isReset ?
        <div className="flex flex-col items-center text-center">
          <FaCheckCircle className="text-sky-500 mb-3" size={40} />
          <p className="text-sm text-slate-500 mb-6">
            You can now sign in with your new password.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full rounded-lg bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-semibold py-2.5 text-sm transition-colors shadow-sm shadow-sky-200"
          >
            Go to login
          </button>
        </div>
      : <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter a new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!errors.password}
                className={`w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm text-slate-800 placeholder-slate-400
                  focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition
                  ${errors.password ? "border-red-400" : "border-sky-200"}`}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500 cursor-pointer"
              >
                {showPassword ?
                  <FaEyeSlash size={16} />
                : <FaEye size={16} />}
              </span>
            </div>

            <ul className="mt-2 space-y-1">
              {passwordRules.map((rule) => {
                const passed = rule.test(password);
                return (
                  <li
                    key={rule.key}
                    className={`text-xs flex items-center gap-1.5 ${
                      passed ? "text-sky-600" : "text-slate-400"
                    }`}
                  >
                    <span
                      className={`inline-block h-1.5 w-1.5 rounded-full ${
                        passed ? "bg-sky-500" : "bg-slate-300"
                      }`}
                    />
                    {rule.label}
                  </li>
                );
              })}
            </ul>

            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={!!errors.confirmPassword}
                className={`w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm text-slate-800 placeholder-slate-400
                  focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition
                  ${errors.confirmPassword ? "border-red-400" : "border-sky-200"}`}
              />
              <span
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500 cursor-pointer"
              >
                {showConfirm ?
                  <FaEyeSlash size={16} />
                : <FaEye size={16} />}
              </span>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">
                {errors.confirmPassword}
              </p>
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
            {isSubmitting ? "Updating..." : "Reset password"}
          </button>
        </form>
      }

      {!isReset && (
        <p className="text-center text-sm text-slate-500 mt-6">
          Remembered your password?{" "}
          <Link
            to="/login"
            className="text-sky-600 hover:text-sky-700 font-semibold"
          >
            Back to login
          </Link>
        </p>
      )}
    </>
  );
}

export default ResetPassword;
