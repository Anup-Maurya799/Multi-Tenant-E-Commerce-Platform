import multer from "multer";

export function errorHandler(err, req, res, next) {
  console.error(err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }

  // Mongoose throws CastError when a value can't be cast to the field type
  // it expects — most commonly an invalid ObjectId reaching a query that
  // express-validator's isMongoId() didn't cover (e.g. a nested lookup).
  if (err.name === "CastError") {
    return res
      .status(400)
      .json({ message: `Invalid value for field "${err.path}".` });
  }

  // Mongoose's own schema validation (required fields, enum values, etc.)
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(" ") });
  }

  // MongoDB duplicate-key error — happens on a race condition even when
  // application-level checks (e.g. "does this email already exist?") passed
  // a moment earlier, since two requests can interleave between that check
  // and the actual insert.
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "value";
    return res
      .status(409)
      .json({ message: `That ${field} is already in use.` });
  }

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production" && statusCode === 500 ?
      "Internal server error."
    : err.message || "Internal server error.";

  res.status(statusCode).json({ message });
}

export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
