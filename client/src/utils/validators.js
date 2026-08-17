/**
 * Pure validation helpers shared by Login, Signup, ForgotPassword,
 * ResetPassword. No React, no side effects — just input in, result out.
 * Each `validateXForm` returns an errors object shaped for `setErrors(...)`.
 */

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPhone(value) {
  // Accepts optional +, 10-15 digits — loosen/tighten to match your target markets.
  return /^\+?\d{10,15}$/.test(value.replace(/[\s-]/g, ""));
}

/**
 * Password strength rules used by both Signup and ResetPassword. Exported as
 * an array (not a single boolean) so the UI can render a live checklist,
 * not just a single pass/fail message.
 */
export const passwordRules = [
  { key: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  {
    key: "uppercase",
    label: "One uppercase letter",
    test: (v) => /[A-Z]/.test(v),
  },
  { key: "number", label: "One number", test: (v) => /\d/.test(v) },
];

export function isStrongPassword(value) {
  return passwordRules.every((rule) => rule.test(value));
}

export function validateLoginForm({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = "Email is required.";
  else if (!isValidEmail(email)) errors.email = "Enter a valid email address.";

  if (!password) errors.password = "Password is required.";

  return errors;
}

export function validateSignupForm({
  name,
  email,
  password,
  confirmPassword,
  agreeTerms,
}) {
  const errors = {};
  if (!name.trim()) errors.name = "Full name is required.";

  if (!email.trim()) errors.email = "Email is required.";
  else if (!isValidEmail(email)) errors.email = "Enter a valid email address.";

  if (!password) errors.password = "Password is required.";
  else if (!isStrongPassword(password))
    errors.password = "Password doesn't meet all requirements below.";

  if (confirmPassword !== password)
    errors.confirmPassword = "Passwords do not match.";

  if (!agreeTerms)
    errors.agreeTerms = "You must accept the Terms & Conditions.";

  return errors;
}

export function validateForgotPasswordForm({ email }) {
  const errors = {};
  if (!email.trim()) errors.email = "Email is required.";
  else if (!isValidEmail(email)) errors.email = "Enter a valid email address.";
  return errors;
}

export function validateResetPasswordForm({ password, confirmPassword }) {
  const errors = {};
  if (!password) errors.password = "Password is required.";
  else if (!isStrongPassword(password))
    errors.password = "Password doesn't meet all requirements below.";

  if (confirmPassword !== password)
    errors.confirmPassword = "Passwords do not match.";

  return errors;
}

/** Product validation — used by the Vendor Dashboard's product form. */
export function validateProductForm({ name, price, stock }) {
  const errors = {};
  if (!name.trim()) errors.name = "Product name is required.";
  if (price === "" || price === null || Number.isNaN(Number(price)))
    errors.price = "Price is required.";
  else if (Number(price) < 0) errors.price = "Price cannot be negative.";
  if (stock !== "" && stock !== null && Number(stock) < 0)
    errors.stock = "Stock cannot be negative.";
  return errors;
}

export function validateStoreForm({ name }) {
  const errors = {};
  if (!name.trim()) errors.name = "Store name is required.";
  return errors;
}

export function hasErrors(errorsObject) {
  return Object.keys(errorsObject).length > 0;
}
