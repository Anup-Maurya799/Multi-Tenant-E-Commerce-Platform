/**
 * Throw this from anywhere in the service layer instead of building a
 * response directly. asyncHandler + errorHandler (middleware/errorHandler.js)
 * catch it and turn it into a consistent { message } JSON response with the
 * right status code — services never touch `res` at all.
 */
export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";
  }
}
