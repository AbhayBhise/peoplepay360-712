import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { ApiError } from "./ApiError";

// Evidence files are stored under uploads/evidence/ relative to the backend process root.
// A random hex prefix is prepended to the original filename to avoid collisions and prevent
// directory traversal attacks (multer does not sanitise the original name by default).
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    const destination = path.join(process.cwd(), "uploads", "evidence");
    fs.mkdirSync(destination, { recursive: true });
    cb(null, destination);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const rand = crypto.randomBytes(12).toString("hex");
    cb(null, `${rand}${ext}`);
  },
});

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

export const uploadEvidence = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter(_req, file, cb) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(
        ApiError.badRequest(
          "evidence: only JPEG, PNG, WEBP, GIF, and PDF files are accepted"
        ) as unknown as null,
        false
      );
    }
    cb(null, true);
  },
});
