import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { apiRouter } from "./routes";
import { errorHandler } from "./middleware/errorHandler";

export const app = express();

// BigInt serialization fix for Prisma BigInt fields
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

app.use(helmet());
// Origin restricted via env in anything resembling production; permissive in dev so the
// frontend on :3000 talking to the backend on :4000 (or a teammate's machine) just works.
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true }));
app.use(compression());
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));

app.use("/api", apiRouter);

// 404 for anything not matched above — still uses the shared error envelope.
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "route: not found" });
});

app.use(errorHandler);
