import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Thin wrapper around nodemailer so controllers never touch transporter
 * config directly. Swap the transport (e.g. to SES/SendGrid) here only.
 */
export async function sendEmail({ to, subject, html }) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
}

export function verificationEmailTemplate({ name, verifyUrl }) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color:#0c447c;">Verify your email</h2>
      <p>Hi ${name}, thanks for signing up to Zaalima Marketplace.</p>
      <p><a href="${verifyUrl}" style="background:#378ADD;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Verify Email</a></p>
      <p style="color:#5c7a94;font-size:13px;">This link expires in 24 hours.</p>
    </div>
  `;
}

export function resetPasswordEmailTemplate({ name, resetUrl }) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color:#0c447c;">Reset your password</h2>
      <p>Hi ${name}, we received a request to reset your password.</p>
      <p><a href="${resetUrl}" style="background:#378ADD;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Reset Password</a></p>
      <p style="color:#5c7a94;font-size:13px;">If you didn't request this, you can safely ignore this email. This link expires in 1 hour.</p>
    </div>
  `;
}
