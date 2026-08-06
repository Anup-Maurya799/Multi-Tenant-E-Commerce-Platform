import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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
      <p>Hi ${name}, thanks for signing up to Marketplace.</p>
      <p><a href="${verifyUrl}" style="background:#378ADD;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Verify Email</a></p>
      <p style="color:#5c7a94;font-size:13px;">This link expires in 24 hours.</p>
    </div>
  `;
}

export function orderConfirmationEmailTemplate({ name, order }) {
  const itemRows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:6px 0;color:#345067;">${item.name}${item.variantLabel ? ` (${item.variantLabel})` : ""}</td>
          <td style="padding:6px 0;text-align:center;color:#5c7a94;">x${item.quantity}</td>
          <td style="padding:6px 0;text-align:right;color:#345067;">$${(item.unitPrice * item.quantity).toFixed(2)}</td>
        </tr>`,
    )
    .join("");

  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color:#0c447c;">Order confirmed</h2>
      <p>Hi ${name}, thanks for your order! Here's a summary:</p>
      <table style="width:100%;border-collapse:collapse;margin:12px 0;">
        ${itemRows}
      </table>
      <p style="font-weight:bold;color:#0c2b45;">Total: $${order.totalAmount.toFixed(2)}</p>
      <p style="color:#5c7a94;font-size:13px;">Order ID: ${order._id}</p>
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
