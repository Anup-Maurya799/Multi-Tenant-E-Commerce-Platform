import { validationResult } from "express-validator";

/**
 * Drop this after any array of express-validator chains
 * (e.g. router.post('/x', [body('email').isEmail()], validateRequest, handler)).
 * Collects all failed checks into one 400 response instead of failing on
 * just the first one — the frontend gets every field error in one round trip.
 */
export function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed.",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}
