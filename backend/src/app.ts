import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { apiRouter } from "./routes";
import { errorHandler } from "./middleware/errorHandler";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));

app.use("/api", apiRouter);

// 404 for anything not matched above — still uses the shared error envelope.
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "route: not found" });
});

app.use(errorHandler);
