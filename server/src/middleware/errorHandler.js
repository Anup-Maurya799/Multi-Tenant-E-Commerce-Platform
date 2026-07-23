/**
 * Single place all errors funnel through. Controllers just do
 * `next(error)` or throw inside an async handler wrapped by asyncHandler,
 * and this formats a consistent { message } response.
 */
export function errorHandler(err, req, res, next) {
  console.error(err);

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

/** Wraps an async route handler so thrown errors reach errorHandler. */
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
