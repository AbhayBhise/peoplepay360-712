import { NextFunction, Request, Response } from "express";
import xss from "xss";

// ── Sanitise req.body ──────────────────────────────────────────────────────────
// Recursively strips XSS payloads and prototype-pollution keys from any JSON
// body before it reaches controllers. Does NOT mutate the original object type
// so Zod still sees the correct shape.
function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    // xss() escapes HTML entities; trim null bytes that can bypass validators
    return xss(value.replace(/\0/g, ""), {
      whiteList: {},       // no tags allowed at all
      stripIgnoreTag: true,
      stripIgnoreTagBody: ["script", "style"],
    });
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === "object") {
    const safe: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      // Block prototype-pollution keys
      if (k === "__proto__" || k === "constructor" || k === "prototype") continue;
      safe[k] = sanitizeValue(v);
    }
    return safe;
  }
  return value;
}

export function sanitizeBody(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }
  next();
}

// ── Enforce JSON Content-Type on mutating requests ────────────────────────────
// Prevents raw text / form-data bodies being parsed as JSON silently.
export function requireJsonContentType(req: Request, res: Response, next: NextFunction) {
  const mutating = ["POST", "PUT", "PATCH"];
  if (mutating.includes(req.method)) {
    const ct = req.headers["content-type"] || "";
    if (!ct.includes("application/json")) {
      return res.status(415).json({
        success: false,
        error: "Content-Type must be application/json",
      });
    }
  }
  next();
}

// ── Anti-HTTP-Parameter-Pollution ─────────────────────────────────────────────
// If the same query param appears multiple times (e.g. ?role=ADMIN&role=EMPLOYEE),
// collapse it to the LAST value so upstream code always sees a scalar, not an array.
// This is a lightweight complement to the hpp npm package — we use both.
export function antiHPP(req: Request, _res: Response, next: NextFunction) {
  for (const key of Object.keys(req.query)) {
    if (Array.isArray(req.query[key])) {
      const arr = req.query[key] as string[];
      req.query[key] = arr[arr.length - 1];
    }
  }
  next();
}

// ── Security response headers not covered by Helmet ───────────────────────────
export function additionalSecurityHeaders(_req: Request, res: Response, next: NextFunction) {
  // Prevent browsers caching sensitive API responses
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  // Remove server fingerprint
  res.removeHeader("X-Powered-By");
  next();
}
