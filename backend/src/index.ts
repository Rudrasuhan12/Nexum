import express from "express";
import cors from "cors";
import crypto from "crypto";
import cookieParser from "cookie-parser";
import { env } from "./lib/env.js";

import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import projectsRouter from "./routes/projects.js";
import paymentsRouter from "./routes/payments.js";
import freelancerOnboardingRouter from "./routes/freelancer/onboarding.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { csrfProtection } from "./middleware/csrf.js";
import { backgroundWorker } from "./jobs/worker.js";
import "./jobs/resumeExtractor.js";
import freelancerProfileRouter from "./routes/freelancer/profile.js";
import {
  freelancerFilesRouter,
  publicFilesRouter,
  publicFreelancersRouter,
} from "./routes/freelancer/files.js";
import freelancerProjectsRouter from "./routes/freelancer/projects.js";
import freelancerProposalsRouter from "./routes/freelancer/proposals.js";
import freelancerAgreementsRouter from "./routes/freelancer/agreements.js";
import freelancerMilestonesRouter from "./routes/freelancer/milestones.js";
import freelancerChangeRequestsRouter from "./routes/freelancer/changeRequests.js";
import devProposalsRouter from "./routes/dev/proposals.js";
import devAgreementsRouter from "./routes/dev/agreements.js";
import devMilestonesRouter from "./routes/dev/milestones.js";
import clientRouter from "./routes/client.js";

const app = express();
const port = env.PORT || 4000;
const allowedOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : ["http://localhost:3000", "http://127.0.0.1:3000"];

// Request ID and Basic Audit Logging Middleware
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  const requestId = (req.headers["x-request-id"] as string) || crypto.randomUUID();
  res.setHeader("X-Request-Id", requestId);
  (req as express.Request & { id?: string }).id = requestId;
  next();
});

// Middlewares
app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, curl, Next.js server-side fetch)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(csrfProtection);

// Routes
app.use("/health", healthRouter);
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/payments", paymentsRouter);

// Freelancer Onboarding & Resume Routes
app.use("/api/freelancer", freelancerOnboardingRouter);
app.use("/api/freelancer/onboarding", freelancerOnboardingRouter);

// Freelancer Proposals Routes
app.use("/api/freelancer/proposals", freelancerProposalsRouter);

// Freelancer Agreements, Milestones & Change Requests Routes
app.use("/api/freelancer/agreements", freelancerAgreementsRouter);
app.use("/api/freelancer/milestones", freelancerMilestonesRouter);
app.use("/api/freelancer/change-requests", freelancerChangeRequestsRouter);

// Freelancer Profile, Portfolio & Files Routes
app.use("/api/freelancer/profile", freelancerProfileRouter);
app.use("/api/freelancer/projects", freelancerProjectsRouter);
app.use("/api/freelancer", freelancerProjectsRouter);
app.use("/api/freelancer", freelancerFilesRouter);
app.use("/api/files", publicFilesRouter);
app.use("/api/public/freelancers", publicFreelancersRouter);

// Dev-Only Client Stand-in Routes (guards internally for ENABLE_DEV_TOOLS)
app.use("/api/dev/proposals", devProposalsRouter);
app.use("/api/dev/agreements", devAgreementsRouter);
app.use("/api/dev/milestones", devMilestonesRouter);
app.use("/api/dev", devMilestonesRouter);

// Client Overview Routes
app.use("/api/client", clientRouter);

// Root fallback
app.get("/", (_req: express.Request, res: express.Response) => {
  res.json({
    service: "nexum-backend",
    version: "0.1.0",
    docs: "/health",
    tagline: "AI drafts, humans approve, PayPal proves.",
  });
});

// 404 handler for unregistered routes
app.use(notFoundHandler);

// Global Standardized Error Handler: { error: { code, message, details } }
app.use(errorHandler);

if (env.NODE_ENV !== "test") {
  const server = app.listen(Number(port), "0.0.0.0", () => {
    console.log(`🚀 Nexum Express Backend running on port ${port}`);
    console.log(`📡 Health endpoint: http://localhost:${port}/health`);
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`⚠️  Port ${port} in use; skipping standalone listen.`);
    } else {
      console.error("Server listen error:", err);
    }
  });

  // Start persistent PostgreSQL-backed background job worker unless explicitly disabled (e.g. in test suites)
  if (process.env.DISABLE_BACKGROUND_WORKER !== "true") {
    backgroundWorker.start(2000);
    console.log("⚙️  PostgreSQL background worker started (polling interval: 2000ms)");
  }
}

export { app };
export default app;
