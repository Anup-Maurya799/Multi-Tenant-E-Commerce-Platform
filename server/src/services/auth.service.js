import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { generateTokens, verifyRefreshToken } from "../utils/generateTokens.js";
import {
  sendEmail,
  verificationEmailTemplate,
  resetPasswordEmailTemplate,
} from "../utils/sendEmail.js";

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Shape returned to the client — never leaks passwordHash or raw tokens. */
function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    storeId: user.storeId,
    isVerified: user.isVerified,
  };
}

export async function registerUser({ name, email, password, role }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, "An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const rawVerificationToken = crypto.randomBytes(32).toString("hex");

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: role === "vendor" ? "vendor" : "customer",
    verificationToken: hashToken(rawVerificationToken),
    verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
  });

  const verifyUrl = `${CLIENT_URL}/verify-email?token=${rawVerificationToken}`;
  await sendEmail({
    to: user.email,
    subject: "Verify your Marketplace account",
    html: verificationEmailTemplate({ name: user.name, verifyUrl }),
  });

  return { user: toPublicUser(user) };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+passwordHash",
  );
  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const { accessToken, refreshToken } = generateTokens(user);
  return { accessToken, refreshToken, user: toPublicUser(user) };
}

export async function refreshAccessToken(refreshToken) {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token.");
  }

  const user = await User.findById(decoded.sub);
  if (!user) {
    throw new ApiError(401, "User no longer exists.");
  }

  const { accessToken } = generateTokens(user);
  return { accessToken };
}

export function getCurrentUser(user) {
  return { user: toPublicUser(user) };
}

export async function requestPasswordReset(email) {
  const user = await User.findOne({ email: email.toLowerCase() });

  // Always behave the same whether or not the account exists — this
  // endpoint must never be usable to check which emails are registered.
  if (user) {
    const rawResetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = hashToken(rawResetToken);
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    const resetUrl = `${CLIENT_URL}/reset-password?token=${rawResetToken}`;
    await sendEmail({
      to: user.email,
      subject: "Reset your Marketplace password",
      html: resetPasswordEmailTemplate({ name: user.name, resetUrl }),
    });
  }

  return {
    message: "If that email is registered, a reset link has been sent.",
  };
}

export async function resetUserPassword({ token, newPassword }) {
  const user = await User.findOne({
    resetPasswordToken: hashToken(token),
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "This reset link is invalid or has expired.");
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return { message: "Password has been reset successfully." };
}

export async function verifyUserEmail(token) {
  const user = await User.findOne({
    verificationToken: hashToken(token),
    verificationTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(
      400,
      "This verification link is invalid or has expired.",
    );
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  return { message: "Email verified successfully." };
}

export async function resendVerification(email) {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (user && !user.isVerified) {
    const rawVerificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = hashToken(rawVerificationToken);
    user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const verifyUrl = `${CLIENT_URL}/verify-email?token=${rawVerificationToken}`;
    await sendEmail({
      to: user.email,
      subject: "Verify your Marketplace account",
      html: verificationEmailTemplate({ name: user.name, verifyUrl }),
    });
  }

  return {
    message: "If that email needs verifying, a new link has been sent.",
  };
}
