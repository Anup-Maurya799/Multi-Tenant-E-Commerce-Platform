import { jest, describe, test, expect, beforeEach } from "@jest/globals";

// Mock the User model BEFORE importing auth.service.js, so the service
// picks up these fakes instead of a real Mongoose model.
const mockFindOne = jest.fn();
const mockFindById = jest.fn();
const mockCreate = jest.fn();

jest.unstable_mockModule("../../src/models/User.js", () => ({
  default: {
    findOne: mockFindOne,
    findById: mockFindById,
    create: mockCreate,
  },
}));

// Mock outbound email so tests never attempt a real SMTP connection.
const mockSendEmail = jest.fn().mockResolvedValue(undefined);
jest.unstable_mockModule("../../src/utils/sendEmail.js", () => ({
  sendEmail: mockSendEmail,
  verificationEmailTemplate: () => "<html>verify</html>",
  resetPasswordEmailTemplate: () => "<html>reset</html>",
}));

// Dynamic import AFTER the mocks are registered — this is required with
// jest.unstable_mockModule under ESM (unlike jest.mock, it isn't hoisted).
const authService = await import("../../src/services/auth.service.js");

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_ACCESS_SECRET = "test_access_secret";
  process.env.JWT_REFRESH_SECRET = "test_refresh_secret";
});

describe("registerUser", () => {
  test("throws 409 if the email is already registered", async () => {
    mockFindOne.mockResolvedValueOnce({
      _id: "existing_id",
      email: "taken@test.dev",
    });

    await expect(
      authService.registerUser({
        name: "A",
        email: "taken@test.dev",
        password: "Password1",
      }),
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(mockCreate).not.toHaveBeenCalled();
  });

  test("creates a new user, sends a verification email, and never leaks the password hash", async () => {
    mockFindOne.mockResolvedValueOnce(null);
    mockCreate.mockResolvedValueOnce({
      _id: "new_id",
      name: "Jane",
      email: "jane@test.dev",
      role: "customer",
      storeId: null,
      isVerified: false,
    });

    const result = await authService.registerUser({
      name: "Jane",
      email: "jane@test.dev",
      password: "Password1",
      role: "customer",
    });

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(result.user).toEqual({
      id: "new_id",
      name: "Jane",
      email: "jane@test.dev",
      role: "customer",
      storeId: null,
      isVerified: false,
    });
    expect(result.user.passwordHash).toBeUndefined();
  });

  test("defaults role to customer if an invalid role is supplied", async () => {
    mockFindOne.mockResolvedValueOnce(null);
    mockCreate.mockImplementationOnce((doc) =>
      Promise.resolve({ _id: "id2", ...doc, isVerified: false }),
    );

    const result = await authService.registerUser({
      name: "Bob",
      email: "bob@test.dev",
      password: "Password1",
      role: "superadmin", // not a client-settable role
    });

    expect(result.user.role).toBe("customer");
  });
});

describe("loginUser", () => {
  function mockFindOneWithSelect(userDoc) {
    mockFindOne.mockReturnValueOnce({
      select: jest.fn().mockResolvedValueOnce(userDoc),
    });
  }

  test("throws 401 when no user matches the email", async () => {
    mockFindOneWithSelect(null);
    await expect(
      authService.loginUser({ email: "nobody@test.dev", password: "whatever" }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  test("throws 401 when the password doesn't match", async () => {
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.default.hash("correct-password", 10);
    mockFindOneWithSelect({
      _id: "u1",
      email: "a@test.dev",
      role: "customer",
      passwordHash,
    });

    await expect(
      authService.loginUser({
        email: "a@test.dev",
        password: "wrong-password",
      }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  test("returns tokens and the public user shape on correct credentials", async () => {
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.default.hash("correct-password", 10);
    mockFindOneWithSelect({
      _id: "u1",
      email: "a@test.dev",
      role: "vendor",
      storeId: "store1",
      isVerified: true,
      passwordHash,
    });

    const result = await authService.loginUser({
      email: "a@test.dev",
      password: "correct-password",
    });

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.user).toMatchObject({
      id: "u1",
      role: "vendor",
      storeId: "store1",
    });
    expect(result.user.passwordHash).toBeUndefined();
  });
});

describe("requestPasswordReset (email-enumeration safety)", () => {
  test("returns the same generic message whether or not the email exists", async () => {
    mockFindOne.mockResolvedValueOnce(null);
    const resultForUnknown =
      await authService.requestPasswordReset("ghost@test.dev");

    mockFindOne.mockResolvedValueOnce({
      email: "real@test.dev",
      name: "Real",
      save: jest.fn(),
    });
    const resultForReal =
      await authService.requestPasswordReset("real@test.dev");

    expect(resultForUnknown.message).toBe(resultForReal.message);
  });

  test("does not send an email for an unregistered address", async () => {
    mockFindOne.mockResolvedValueOnce(null);
    await authService.requestPasswordReset("ghost@test.dev");
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  test("sends a reset email and saves a hashed token for a real user", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    mockFindOne.mockResolvedValueOnce({
      email: "real@test.dev",
      name: "Real",
      save,
    });

    await authService.requestPasswordReset("real@test.dev");

    expect(save).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });
});

describe("verifyUserEmail", () => {
  test("throws 400 for an invalid or expired token", async () => {
    mockFindOne.mockResolvedValueOnce(null);
    await expect(
      authService.verifyUserEmail("bad-token"),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test("marks the user verified and clears the token on success", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const userDoc = {
      isVerified: false,
      verificationToken: "x",
      verificationTokenExpires: Date.now() + 1000,
      save,
    };
    mockFindOne.mockResolvedValueOnce(userDoc);

    await authService.verifyUserEmail("good-token");

    expect(userDoc.isVerified).toBe(true);
    expect(userDoc.verificationToken).toBeUndefined();
    expect(save).toHaveBeenCalledTimes(1);
  });
});
