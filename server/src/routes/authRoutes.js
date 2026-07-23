import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  refreshTokenHandler,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

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

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/refresh-token", refreshTokenHandler);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, getMe);

router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", authLimiter, resendVerificationEmail);

export default router;
