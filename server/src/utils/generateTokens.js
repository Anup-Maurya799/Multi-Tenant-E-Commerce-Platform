import jwt from "jsonwebtoken";

/**
 * Generates a short-lived access token and a longer-lived refresh token
 * for a given user. `sub` (subject) is the standard JWT claim for "whose
 * token is this" — using it instead of a custom field keeps us aligned
 * with JWT conventions other libraries expect.
 */
export function generateTokens(user) {
  const accessToken = jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m" },
  );

  const refreshToken = jwt.sign(
    { sub: user._id.toString() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d" },
  );

  return { accessToken, refreshToken };
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}
