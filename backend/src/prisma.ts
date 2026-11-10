import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const backendEnv = path.resolve(process.cwd(), "backend/.env");
const localEnv = path.resolve(process.cwd(), ".env");
if (fs.existsSync(backendEnv)) {
  dotenv.config({ path: backendEnv, override: true });
} else if (fs.existsSync(localEnv)) {
  dotenv.config({ path: localEnv, override: true });
} else {
  dotenv.config();
}

declare global {
  // eslint-disable-next-line no-var
  var __globalPrisma__: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  // Optional WebSocket fallback for firewalled networks (e.g. college Wi-Fi blocking port 5432)
  if (process.env.USE_NEON_WEBSOCKET === "true") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { PrismaNeon } = require("@prisma/adapter-neon");
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { neonConfig } = require("@neondatabase/serverless");
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ws = require("ws");
      neonConfig.webSocketConstructor = ws;
      const dbUrl = (process.env.DATABASE_URL || "").trim().replace(/^['"]|['"]$/g, "");
      const adapter = new PrismaNeon({ connectionString: dbUrl });
      return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
      });
    } catch {
      // Fall through to standard client
    }
  }

  // Normal direct database connection without WebSocket adapter
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalThis.__globalPrisma__ ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__globalPrisma__ = prisma;
}

export default prisma;
