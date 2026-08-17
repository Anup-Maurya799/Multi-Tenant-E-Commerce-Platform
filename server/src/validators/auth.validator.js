import { body } from "express-validator";

export const registerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required."),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Enter a valid email address.")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters.")
    .matches(/[A-Z]/)
    .withMessage("Password must contain an uppercase letter.")
    .matches(/\d/)
    .withMessage("Password must contain a number."),
  body("role")
    .optional()
    .isIn(["customer", "vendor"])
    .withMessage("Role must be either customer or vendor."),
];

export const loginValidator = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Enter a valid email address.")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required."),
];

export const refreshTokenValidator = [
  body("refreshToken").notEmpty().withMessage("Refresh token is required."),
];

export const forgotPasswordValidator = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Enter a valid email address.")
    .normalizeEmail(),
];

export const resetPasswordValidator = [
  body("token").notEmpty().withMessage("Reset token is required."),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters.")
    .matches(/[A-Z]/)
    .withMessage("Password must contain an uppercase letter.")
    .matches(/\d/)
    .withMessage("Password must contain a number."),
];

export const verifyEmailValidator = [
  body("token").notEmpty().withMessage("Verification token is required."),
];

export const resendVerificationValidator = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Enter a valid email address.")
    .normalizeEmail(),
];
