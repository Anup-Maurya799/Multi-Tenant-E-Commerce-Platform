import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { generateTokens, verifyRefreshToken } from "../utils/generateTokens.js";
import {
  sendEmail,
  verificationEmailTemplate,
  resetPasswordEmailTemplate,
} from "../utils/sendEmail.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    storeId: user.storeId,
    isVerified: user.isVerified,
  };
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Name, email, and password are required." });
  }
  if (password.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters." });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res
      .status(409)
      .json({ message: "An account with this email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const rawVerificationToken = crypto.randomBytes(32).toString("hex");

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: role === "vendor" ? "vendor" : "customer",
    verificationToken: hashToken(rawVerificationToken),
    verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24h
  });

  const verifyUrl = `${CLIENT_URL}/verify-email?token=${rawVerificationToken}`;
  await sendEmail({
    to: user.email,
    subject: "Verify your Zaalima Marketplace account",
    html: verificationEmailTemplate({ name: user.name, verifyUrl }),
  });

  res.status(201).json({
    message: "Account created. Please check your email to verify your account.",
    user: publicUser(user),
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+passwordHash",
  );
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const { accessToken, refreshToken } = generateTokens(user);

  res.json({
    accessToken,
    refreshToken,
    user: publicUser(user),
  });
});

export const refreshTokenHandler = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required." });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    return res
      .status(401)
      .json({ message: "Invalid or expired refresh token." });
  }

  const user = await User.findById(decoded.sub);
  if (!user) {
    return res.status(401).json({ message: "User no longer exists." });
  }

  const { accessToken } = generateTokens(user);
  res.json({ accessToken });
});

export const logout = asyncHandler(async (req, res) => {
  // Stateless JWT — logout is enforced client-side by discarding tokens.
  // If you later add a token blacklist/refresh-token store, revoke it here.
  res.json({ message: "Logged out." });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required." });

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always respond the same way whether or not the user exists —
  // prevents this endpoint from being used to enumerate registered emails.
  if (user) {
    const rawResetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = hashToken(rawResetToken);
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1h
    await user.save();

    const resetUrl = `${CLIENT_URL}/reset-password?token=${rawResetToken}`;
    await sendEmail({
      to: user.email,
      subject: "Reset your Zaalima Marketplace password",
      html: resetPasswordEmailTemplate({ name: user.name, resetUrl }),
    });
  }

  res.json({
    message: "If that email is registered, a reset link has been sent.",
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ message: "Token and new password are required." });
  }
  if (newPassword.length < 8) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters." });
  }

  const user = await User.findOne({
    resetPasswordToken: hashToken(token),
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res
      .status(400)
      .json({ message: "This reset link is invalid or has expired." });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: "Password has been reset successfully." });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: "Token is required." });

  const user = await User.findOne({
    verificationToken: hashToken(token),
    verificationTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res
      .status(400)
      .json({ message: "This verification link is invalid or has expired." });
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  res.json({ message: "Email verified successfully." });
});

export const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required." });

  const user = await User.findOne({ email: email.toLowerCase() });

  if (user && !user.isVerified) {
    const rawVerificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = hashToken(rawVerificationToken);
    user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const verifyUrl = `${CLIENT_URL}/verify-email?token=${rawVerificationToken}`;
    await sendEmail({
      to: user.email,
      subject: "Verify your Zaalima Marketplace account",
      html: verificationEmailTemplate({ name: user.name, verifyUrl }),
    });
  }

  res.json({
    message: "If that email needs verifying, a new link has been sent.",
  });
});
