import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { loginUser } from "../../store/slices/authSlice";
import { validateLoginForm, hasErrors } from "../../utils/validators";

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    const validationErrors = validateLoginForm({ email, password });
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    setIsSubmitting(true);
    try {
      const user = await dispatch(loginUser({ email, password })).unwrap();
      if (rememberMe) localStorage.setItem("rememberedEmail", email);
      else localStorage.removeItem("rememberedEmail");

      const redirectTo = location.state?.from?.pathname;
      const destinationByRole = {
        vendor: "/vendor/dashboard",
        superadmin: "/admin/analytics",
        customer: "/shop",
      };
      if (redirectTo) navigate(redirectTo, { replace: true });
      else navigate(destinationByRole[user.role] || "/shop", { replace: true });
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
        <h2 className="text-2xl font-bold text-slate-800">Welcome back</h2>
        <p className="text-sm text-slate-500 mt-1">
          Sign in to your vendor or customer account
        </p>
      </div>
      <form onSubmit={handleLogin} noValidate className="space-y-4">
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
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition ${errors.email ? "border-red-400" : "border-sky-200"}`}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email}</p>
          )}
        </div>
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
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!errors.password}
              className={`w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition ${errors.password ? "border-red-400" : "border-sky-200"}`}
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
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-sky-300 text-sky-500 focus:ring-sky-400"
            />
            Remember me
          </label>
          <Link
            to="/forgot-password"
            className="text-sky-600 hover:text-sky-700 font-medium"
          >
            Forgot password?
          </Link>
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
          {isSubmitting ? "Signing in..." : "Login"}
        </button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-6">
        Don&apos;t have an account?{" "}
        <Link
          to="/signup"
          className="text-sky-600 hover:text-sky-700 font-semibold"
        >
          Sign up
        </Link>
      </p>
    </>
  );
}

export default Login;
