import rateLimit from "express-rate-limit";

// ── Global API rate limit ──────────────────────────────────────────────────────
// 100 requests per 15 minutes per IP — generous for normal use, blocks scrapers
// and DoS attempts. Applied to every /api/* route in app.ts.
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, error: "rate: too many requests, please slow down" },
  skip: (req) => req.path === "/health", // never rate-limit the health check
});

// ── Auth rate limit ─────────────────────────────────────────────────────────────
// Generous enough for comprehensive testing of multiple demo roles while preventing abuse
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, error: "auth: too many login attempts, try again in 15 minutes" },
});

// ── Sensitive account ops rate limit ───────────────────────────────────────────
export const sensitiveRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, error: "too many credential change attempts, try again in 15 minutes" },
});

// ── Admin provisioning rate limit ─────────────────────────────────────────────
export const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, error: "admin: too many provisioning requests" },
});
