import { describe, test, expect, jest } from "@jest/globals";
import multer from "multer";
import {
  errorHandler,
  notFound,
  asyncHandler,
} from "../../src/middleware/errorHandler.js";
import { ApiError } from "../../src/utils/ApiError.js";

function buildRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("errorHandler", () => {
  test("formats an ApiError using its own statusCode and message", () => {
    const res = buildRes();
    errorHandler(new ApiError(403, "Not allowed."), {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Not allowed." });
  });

  test("converts a Mongoose CastError into a 400 naming the bad field", () => {
    const res = buildRes();
    const castError = Object.assign(new Error("Cast failed"), {
      name: "CastError",
      path: "productId",
    });
    errorHandler(castError, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid value for field "productId".',
    });
  });

  test("converts a Mongoose ValidationError into a 400 with all field messages joined", () => {
    const res = buildRes();
    const validationError = Object.assign(new Error("Validation failed"), {
      name: "ValidationError",
      errors: {
        name: { message: "Name is required." },
        price: { message: "Price must be positive." },
      },
    });
    errorHandler(validationError, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toContain("Name is required.");
    expect(res.json.mock.calls[0][0].message).toContain(
      "Price must be positive.",
    );
  });

  test("converts a MongoDB duplicate-key error (11000) into a 409 naming the field", () => {
    const res = buildRes();
    const duplicateError = Object.assign(new Error("E11000 duplicate key"), {
      code: 11000,
      keyPattern: { email: 1 },
    });
    errorHandler(duplicateError, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: "That email is already in use.",
    });
  });

  test("formats a Multer error as a 400 with an 'Upload error:' prefix", () => {
    const res = buildRes();
    const multerError = new multer.MulterError("LIMIT_FILE_SIZE");
    errorHandler(multerError, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].message).toMatch(/^Upload error:/);
  });

  test("falls back to 500 with a generic message in production for an unrecognized error", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const res = buildRes();
    errorHandler(
      new Error("some internal detail that shouldn't leak"),
      {},
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal server error.",
    });

    process.env.NODE_ENV = originalEnv;
  });

  test("shows the real error message outside production, for debugging", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const res = buildRes();
    errorHandler(new Error("helpful debug detail"), {}, res, jest.fn());
    expect(res.json).toHaveBeenCalledWith({ message: "helpful debug detail" });

    process.env.NODE_ENV = originalEnv;
  });
});

describe("notFound", () => {
  test("responds 404 naming the requested URL", () => {
    const res = buildRes();
    notFound({ originalUrl: "/api/v1/nonexistent" }, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json.mock.calls[0][0].message).toContain("/api/v1/nonexistent");
  });
});

describe("asyncHandler", () => {
  test("passes a thrown/rejected error to next(), rather than crashing the process", async () => {
    const next = jest.fn();
    const handler = asyncHandler(async () => {
      throw new ApiError(400, "boom");
    });

    await handler({}, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(ApiError);
  });

  test("does not call next() when the handler succeeds", async () => {
    const next = jest.fn();
    const handler = asyncHandler(async (req, res) => {
      res.json({ ok: true });
    });
    const res = buildRes();

    await handler({}, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });
});
