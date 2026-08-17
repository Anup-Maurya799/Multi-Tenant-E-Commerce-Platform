import { describe, test, expect } from "vitest";
import {
  isValidEmail,
  isStrongPassword,
  validateLoginForm,
  validateSignupForm,
  validateForgotPasswordForm,
  validateResetPasswordForm,
  validateProductForm,
  validateStoreForm,
  hasErrors,
} from "../../src/utils/validators";

describe("isValidEmail", () => {
  test.each([
    ["a@b.com", true],
    ["jane.doe+test@zaalima.dev", true],
    ["not-an-email", false],
    ["missing@domain", false],
    ["", false],
    ["  spaced@ok.com  ", true], // trimmed before checking
  ])("%s -> %s", (input, expected) => {
    expect(isValidEmail(input)).toBe(expected);
  });
});

describe("isStrongPassword", () => {
  test("requires at least 8 chars, one uppercase, one number", () => {
    expect(isStrongPassword("short1A")).toBe(false); // too short
    expect(isStrongPassword("alllowercase1")).toBe(false); // no uppercase
    expect(isStrongPassword("NoNumbersHere")).toBe(false); // no number
    expect(isStrongPassword("ValidPass1")).toBe(true);
  });
});

describe("validateLoginForm", () => {
  test("flags missing email and password", () => {
    const errors = validateLoginForm({ email: "", password: "" });
    expect(errors.email).toBeDefined();
    expect(errors.password).toBeDefined();
  });

  test("passes with valid input", () => {
    const errors = validateLoginForm({
      email: "a@b.com",
      password: "anything",
    });
    expect(hasErrors(errors)).toBe(false);
  });
});

describe("validateSignupForm", () => {
  test("requires matching passwords and accepted terms", () => {
    const errors = validateSignupForm({
      name: "Jane",
      email: "jane@test.dev",
      password: "ValidPass1",
      confirmPassword: "Different1",
      agreeTerms: false,
    });
    expect(errors.confirmPassword).toBeDefined();
    expect(errors.agreeTerms).toBeDefined();
  });

  test("passes with fully valid input", () => {
    const errors = validateSignupForm({
      name: "Jane",
      email: "jane@test.dev",
      password: "ValidPass1",
      confirmPassword: "ValidPass1",
      agreeTerms: true,
    });
    expect(hasErrors(errors)).toBe(false);
  });
});

describe("validateForgotPasswordForm / validateResetPasswordForm", () => {
  test("forgot-password requires a valid email", () => {
    expect(hasErrors(validateForgotPasswordForm({ email: "" }))).toBe(true);
    expect(hasErrors(validateForgotPasswordForm({ email: "a@b.com" }))).toBe(
      false,
    );
  });

  test("reset-password requires a strong password and a match", () => {
    const errors = validateResetPasswordForm({
      password: "weak",
      confirmPassword: "weak",
    });
    expect(errors.password).toBeDefined();

    const mismatch = validateResetPasswordForm({
      password: "ValidPass1",
      confirmPassword: "Nope1234",
    });
    expect(mismatch.confirmPassword).toBeDefined();
  });
});

describe("validateProductForm", () => {
  test("requires a name and a non-negative price", () => {
    expect(
      hasErrors(validateProductForm({ name: "", price: "10", stock: "1" })),
    ).toBe(true);
    expect(
      hasErrors(
        validateProductForm({ name: "Candle", price: "-5", stock: "1" }),
      ),
    ).toBe(true);
    expect(
      hasErrors(
        validateProductForm({ name: "Candle", price: "10", stock: "1" }),
      ),
    ).toBe(false);
  });

  test("rejects negative stock but allows an empty stock field (defaults to 0 downstream)", () => {
    expect(
      hasErrors(
        validateProductForm({ name: "Candle", price: "10", stock: "-1" }),
      ),
    ).toBe(true);
    expect(
      hasErrors(
        validateProductForm({ name: "Candle", price: "10", stock: "" }),
      ),
    ).toBe(false);
  });
});

describe("validateStoreForm", () => {
  test("requires a non-empty name", () => {
    expect(hasErrors(validateStoreForm({ name: "  " }))).toBe(true);
    expect(hasErrors(validateStoreForm({ name: "My Shop" }))).toBe(false);
  });
});
