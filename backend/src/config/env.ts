import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

const nodeEnv = optional("NODE_ENV", "development");
if (!["development", "production", "test"].includes(nodeEnv)) {
  throw new Error(`NODE_ENV must be development | production | test, got: ${nodeEnv}`);
}

const frontendUrl = optional("FRONTEND_URL", "http://localhost:3000");

export const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  isDevelopment: nodeEnv === "development",

  port: Number(optional("PORT", "4000")),
  databaseUrl: required("DATABASE_URL"),

  // JWT — HS256 only; secret must be ≥32 chars in production
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: optional("JWT_EXPIRES_IN", "8h"),
  jwtAlgorithm: "HS256" as const,

  // CORS — always explicit, never wildcard
  frontendUrl,
  corsOrigins: optional("CORS_ORIGIN", frontendUrl)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  // bcrypt — cost 12 is NIST-recommended for payroll/HR systems
  bcryptRounds: Number(optional("BCRYPT_ROUNDS", "12")),

  // SMTP
  smtpHost: optional("SMTP_HOST", ""),
  smtpPort: Number(optional("SMTP_PORT", "587")),
  smtpSecure: optional("SMTP_SECURE", "false") === "true",
  smtpUser: optional("SMTP_USER", ""),
  smtpPass: optional("SMTP_PASS", ""),
  smtpFrom: optional("SMTP_FROM", "payroll@peoplepay360.dev"),
};
