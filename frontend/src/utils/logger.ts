import log from "loglevel";

// Configure default log level based on environment
const level = (import.meta.env.VITE_LOG_LEVEL as log.LogLevelDesc) || (import.meta.env.DEV ? "debug" : "warn");
log.setLevel(level);

export const logger = {
  trace: (...args: unknown[]) => log.trace("[TRACE]", ...args),
  debug: (...args: unknown[]) => log.debug("[DEBUG]", ...args),
  info: (...args: unknown[]) => log.info("[INFO]", ...args),
  warn: (...args: unknown[]) => log.warn("[WARN]", ...args),
  error: (...args: unknown[]) => log.error("[ERROR]", ...args),
};

export default logger;
