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

export function orderConfirmationEmailTemplate({
  customerName,
  orderId,
  items,
  total,
}) {
  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${item.name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">₹${item.price}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
      <h2 style="color:#0c447c;">Order Confirmed 🎉</h2>

      <p>Hello ${customerName},</p>

      <p>Your order has been placed successfully.</p>

      <p><strong>Order ID:</strong> ${orderId}</p>

      <table style="width:100%;border-collapse:collapse;margin-top:20px;">
        <thead>
          <tr>
            <th align="left">Product</th>
            <th align="left">Qty</th>
            <th align="left">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <h3>Total: ₹${total}</h3>

      <p>Thank you for shopping with us.</p>
    </div>
  `;
}
