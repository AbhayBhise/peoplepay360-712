import rateLimit from "express-rate-limit";

// ── Global API rate limit ──────────────────────────────────────────────────────
// 100 requests per 15 minutes per IP — generous for normal use, blocks scrapers
// and DoS attempts. Applied to every /api/* route in app.ts.
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, error: "rate: too many requests, please slow down" },
  skip: (req) => req.path === "/health", // never rate-limit the health check
});

// ── Auth rate limit ─────────────────────────────────────────────────────────────
// 5 attempts per 15 minutes per IP on login — tight enough to stop brute-force
// while still allowing a user who has forgotten their password a few tries.
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, error: "auth: too many login attempts, try again in 15 minutes" },
});

// ── Sensitive account ops rate limit ───────────────────────────────────────────
// 5 attempts per 15 min for change-password, forgot-password, reset-password.
// Lower ceiling than login because these endpoints change credentials, not just read them.
export const sensitiveRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, error: "too many credential change attempts, try again in 15 minutes" },
});

// ── Admin provisioning rate limit ─────────────────────────────────────────────
// 20 per 15 min — enough to batch-create a new department's accounts in one sitting.
export const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, error: "admin: too many provisioning requests" },
});
