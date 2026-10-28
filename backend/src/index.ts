import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import healthRouter from "./routes/health.js";
import usersRouter from "./routes/users.js";
import projectsRouter from "./routes/projects.js";
import paymentsRouter from "./routes/payments.js";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";

// Middlewares
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/health", healthRouter);
app.use("/api/users", usersRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/payments", paymentsRouter);

// Root fallback
app.get("/", (_req, res) => {
  res.json({
    service: "nexum-backend",
    version: "0.1.0",
    docs: "/health",
    tagline: "AI drafts, humans approve, PayPal proves.",
  });
});

// Error handling middleware
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
);

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`🚀 Nexum Express Backend running on http://localhost:${port}`);
    console.log(`📡 Health endpoint: http://localhost:${port}/health`);
  });
}

export default app;

