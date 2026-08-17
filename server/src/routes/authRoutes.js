import { Router } from "express";
import rateLimit from "express-rate-limit";

import * as authController from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  verifyEmailValidator,
  resendVerificationValidator,
} from "../validators/auth.validator.js";

const router = Router();

// Slows down brute-force attempts on login/register/reset without
// affecting normal usage — 20 requests per 15 minutes per IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." },
});

router.post(
  "/register",
  authLimiter,
  registerValidator,
  validateRequest,
  authController.register,
);
router.post(
  "/login",
  authLimiter,
  loginValidator,
  validateRequest,
  authController.login,
);
router.post(
  "/refresh-token",
  refreshTokenValidator,
  validateRequest,
  authController.refreshTokenHandler,
);
router.post("/logout", requireAuth, authController.logout);
router.get("/me", requireAuth, authController.getMe);

router.post(
  "/forgot-password",
  authLimiter,
  forgotPasswordValidator,
  validateRequest,
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  authLimiter,
  resetPasswordValidator,
  validateRequest,
  authController.resetPassword,
);
router.post(
  "/verify-email",
  verifyEmailValidator,
  validateRequest,
  authController.verifyEmail,
);
router.post(
  "/resend-verification",
  authLimiter,
  resendVerificationValidator,
  validateRequest,
  authController.resendVerificationEmail,
);

export default router;
