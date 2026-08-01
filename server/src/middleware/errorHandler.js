/**
 * Single place all errors funnel through. Controllers just do
 * `next(error)` or throw inside an async handler wrapped by asyncHandler,
 * and this formats a consistent { message } response.
 */
import multer from "multer";

export function errorHandler(err, req, res, next) {
  console.error(err);

  // Custom application errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      message: err.message,
    });
  }

  // Multer errors
  if (err instanceof multer.MulterError) {
    let message = err.message;

    if (err.code === "LIMIT_FILE_SIZE") {
      message = "Image size must not exceed 5 MB.";
    }

    return res.status(400).json({
      message,
    });
  }

  // Invalid MongoDB ObjectId
  if (err.name === "CastError") {
    return res.status(400).json({
      message: "Invalid resource ID.",
    });
  }

  // Mongoose validation
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: err.message,
    });
  }

  // Duplicate key
  if (err.code === 11000) {
    return res.status(409).json({
      message: "Duplicate value already exists.",
    });
  }

  // Cloudinary
  if (err.http_code) {
    return res.status(500).json({
      message: "Cloudinary upload failed.",
    });
  }

  // Unknown
  const statusCode = 500;

  const message =
    process.env.NODE_ENV === "production" ?
      "Internal server error."
    : err.message || "Internal server error.";

  res.status(statusCode).json({
    message,
  });
}

export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

/** Wraps an async route handler so thrown errors reach errorHandler. */
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
