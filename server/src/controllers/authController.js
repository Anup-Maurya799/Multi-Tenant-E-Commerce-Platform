import { asyncHandler } from "../middleware/errorHandler.js";
import * as authService from "../services/auth.service.js";

/**
 * Controllers stay thin on purpose: pull data off req, hand it to the
 * service layer, send back whatever the service returns. No business
 * logic, no direct model queries — that all lives in auth.service.js now.
 */

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const result = await authService.registerUser({
    name,
    email,
    password,
    role,
  });
  res.status(201).json({
    message: "Account created. Please check your email to verify your account.",
    ...result,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginUser({ email, password });
  res.json(result);
});

export const refreshTokenHandler = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshAccessToken(refreshToken);
  res.json(result);
});

export const logout = asyncHandler(async (req, res) => {
  // Stateless JWT — logout is enforced client-side by discarding tokens.
  // If a token-blacklist/refresh-store is added later, revoke it here.
  res.json({ message: "Logged out." });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json(authService.getCurrentUser(req.user));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.requestPasswordReset(req.body.email);
  res.json(result);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const result = await authService.resetUserPassword({ token, newPassword });
  res.json(result);
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyUserEmail(req.body.token);
  res.json(result);
});

export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const result = await authService.resendVerification(req.body.email);
  res.json(result);
});
