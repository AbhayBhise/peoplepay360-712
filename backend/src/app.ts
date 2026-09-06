import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import morgan from "morgan";
import { apiRouter } from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { morganStream } from "./utils/logger";
import { globalRateLimit } from "./middleware/rateLimit";
import { sanitizeBody, requireJsonContentType, antiHPP, additionalSecurityHeaders } from "./middleware/security";
import { env } from "./config/env";

export const app = express();

// BigInt serialization fix for Prisma BigInt fields
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

// ── Security Middleware ────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));
app.use(additionalSecurityHeaders);

// CORS — locked to explicit frontend origin, never wildcard
app.use(cors({ origin: env.corsOrigins }));

// Global rate limiting
app.use(globalRateLimit);

app.use(compression());
app.use(morgan("combined", { stream: morganStream }));

// ── Body Parsing & Sanitisation ────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(requireJsonContentType);
app.use(sanitizeBody);

// HTTP Parameter Pollution protection
app.use(hpp());
app.use(antiHPP);

// ── Routes ─────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));

app.use("/api", apiRouter);

// 404 for anything not matched above — still uses the shared error envelope.
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "route: not found" });
});

app.use(errorHandler);
