import rateLimit from "express-rate-limit";

// Closes a gap flagged but never implemented: auth.service.ts deliberately returns an
// identical error for "no such user" and "wrong password" (security.md), but without a
// rate limit that still allows unlimited password guesses against one account. 10 attempts
// per 15 minutes per IP is generous enough for a real user who mistypes, tight enough to
// make brute-forcing impractical.
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "auth: too many login attempts, try again in a few minutes" },
});
