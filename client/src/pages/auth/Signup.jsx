// eslint-disable-next-line no-unused-vars
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import CryptoJS from "crypto-js";

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("customer"); // multi-tenant: customer or vendor
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = "Full name is required.";
    if (!email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Enter a valid email address.";
    if (!password) next.password = "Password is required.";
    else if (password.length < 8)
      next.password = "Password must be at least 8 characters.";
    if (confirmPassword !== password)
      next.confirmPassword = "Passwords do not match.";
    if (!agreeTerms)
      next.agreeTerms = "You must accept the Terms & Conditions.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSignup = (e) => {
    e.preventDefault();
    setMessage("");
    if (!validate()) return;

    const existingUsers = JSON.parse(localStorage.getItem("users")) || [];

    if (existingUsers.find((u) => u.email === email)) {
      setMessage("An account with this email already exists. Please login.");
      return;
    }

    const encryptedPassword = CryptoJS.AES.encrypt(
      password,
      "my-secret-key",
    ).toString();

    existingUsers.push({ name, email, role, password: encryptedPassword });
    localStorage.setItem("users", JSON.stringify(existingUsers));

    navigate("/login");
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
            Create your account
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Join as a vendor or a customer
          </p>
        </div>

        <form onSubmit={handleSignup} noValidate className="space-y-4">
          {/* Role toggle — core to a multi-tenant platform */}
          <div>
            <span className="block text-sm font-medium text-slate-700 mb-1.5">
              I am a
            </span>
            <div className="grid grid-cols-2 gap-3">
              {["customer", "vendor"].map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className={`rounded-lg border py-2 text-sm font-medium capitalize transition-colors
                    ${
                      role === r ?
                        "bg-sky-500 border-sky-500 text-white"
                      : "border-sky-200 text-slate-600 hover:bg-sky-50"
                    }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Full name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Full Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400
                focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition
                ${errors.name ? "border-red-400" : "border-sky-200"}`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Email */}
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
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400
                focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition
                ${errors.email ? "border-red-400" : "border-sky-200"}`}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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

          {/* Terms */}
          <div>
            <label className="flex items-start gap-2 text-sm text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-sky-300 text-sky-500 focus:ring-sky-400"
              />
              I agree to the{" "}
              <Link
                to="/terms"
                className="text-sky-600 hover:text-sky-700 font-medium"
              >
                Terms &amp; Conditions
              </Link>
            </label>
            {errors.agreeTerms && (
              <p className="mt-1 text-xs text-red-500">{errors.agreeTerms}</p>
            )}
          </div>

          {message && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {message}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-semibold py-2.5 text-sm transition-colors shadow-sm shadow-sky-200"
          >
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-sky-600 hover:text-sky-700 font-semibold"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
