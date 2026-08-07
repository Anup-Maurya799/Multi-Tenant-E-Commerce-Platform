import { jest, describe, test, expect, beforeEach } from "@jest/globals";
import jwt from "jsonwebtoken";

const mockFindById = jest.fn();
jest.unstable_mockModule("../../src/models/User.js", () => ({
  default: { findById: mockFindById },
}));

const { requireAuth, attachUserIfPresent } =
  await import("../../src/middleware/auth.js");

function buildRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function signToken(
  payload,
  secret = process.env.JWT_ACCESS_SECRET,
  expiresIn = "15m",
) {
  return jwt.sign(payload, secret, { expiresIn });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("requireAuth", () => {
  test("responds 401 when no Authorization header is present", async () => {
    const req = { headers: {} };
    const res = buildRes();
    const next = jest.fn();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("responds 401 for a malformed token", async () => {
    const req = { headers: { authorization: "Bearer not-a-real-jwt" } };
    const res = buildRes();
    const next = jest.fn();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("responds 401 for an expired token", async () => {
    const expiredToken = signToken(
      { sub: "user1", role: "customer" },
      process.env.JWT_ACCESS_SECRET,
      "-1s",
    );
    const req = { headers: { authorization: `Bearer ${expiredToken}` } };
    const res = buildRes();
    const next = jest.fn();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("responds 401 if the token is valid but the user no longer exists", async () => {
    const token = signToken({ sub: "deleted_user", role: "customer" });
    mockFindById.mockResolvedValueOnce(null);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = buildRes();
    const next = jest.fn();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("attaches req.user and calls next() for a valid token and existing user", async () => {
    const token = signToken({ sub: "user1", role: "vendor" });
    const fakeUser = { _id: "user1", role: "vendor" };
    mockFindById.mockResolvedValueOnce(fakeUser);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = buildRes();
    const next = jest.fn();

    await requireAuth(req, res, next);

    expect(req.user).toBe(fakeUser);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe("attachUserIfPresent", () => {
  test("calls next() with no req.user when there's no Authorization header (never blocks)", async () => {
    const req = { headers: {} };
    const res = buildRes();
    const next = jest.fn();

    await attachUserIfPresent(req, res, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test("calls next() with no req.user for an invalid token (treats as anonymous, does not error)", async () => {
    const req = { headers: { authorization: "Bearer garbage" } };
    const res = buildRes();
    const next = jest.fn();

    await attachUserIfPresent(req, res, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test("attaches req.user for a valid token", async () => {
    const token = signToken({ sub: "user1", role: "customer" });
    const fakeUser = { _id: "user1", role: "customer" };
    mockFindById.mockResolvedValueOnce(fakeUser);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = buildRes();
    const next = jest.fn();

    await attachUserIfPresent(req, res, next);

    expect(req.user).toBe(fakeUser);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
