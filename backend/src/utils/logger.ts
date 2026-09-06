import winston from "winston";

const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug");

const customFormat = winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
});

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === "production"
      ? winston.format.json()
      : winston.format.combine(winston.format.colorize(), customFormat)
  ),
  transports: [
    new winston.transports.Console()
  ],
});

// Stream wrapper for morgan HTTP request logger
export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
