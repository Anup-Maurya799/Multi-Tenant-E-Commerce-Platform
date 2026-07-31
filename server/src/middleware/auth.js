import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Like requireAuth, but never blocks the request — attaches req.user if a
 * valid token is present, otherwise just calls next() with req.user
 * undefined. Used on routes that are public but behave differently for an
 * authenticated owner (e.g. viewing your own unpublished product).
 */
export async function attachUserIfPresent(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.sub);
    if (user) req.user = user;
  } catch {
    // Invalid/expired token on a public route — treat as anonymous, don't error.
  }
  next();
}

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Authentication token missing." });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.sub);

    if (!user) {
      return res.status(401).json({ message: "User no longer exists." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}
