import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./prisma";

const server = app.listen(env.port, () => {
  console.log(`PeoplePay360 backend listening on http://localhost:${env.port}`);
});

// Without this, a deploy/restart kills in-flight requests mid-write and leaves the
// Prisma connection pool dangling instead of closing it cleanly.
function shutdown(signal: string) {
  console.log(`${signal} received, shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  // Force-exit if connections don't close within 10s instead of hanging forever.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
