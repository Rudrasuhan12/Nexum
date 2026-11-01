import { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/errors.js";
import { ZodError } from "zod";

export interface StandardErrorResponse {
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<StandardErrorResponse>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // 1. Handled Domain AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // 2. Zod Validation Error
  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const field = issue.path.join(".") || "root";
      if (!details[field]) details[field] = [];
      details[field].push(issue.message);
    }

    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        details,
      },
    });
    return;
  }

  // 2.5 Any error with a numeric statusCode (e.g. InvalidMilestoneTransitionError, MilestoneLockedError)
  if ("statusCode" in err && typeof (err as any).statusCode === "number") {
    res.status((err as any).statusCode).json({
      error: {
        code: (err as any).code || "CONFLICT",
        message: err.message,
        details: (err as any).details || {},
      },
    });
    return;
  }

  // 3. Unhandled Server Error
  console.error("Unhandled Server Error:", err);
  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message:
        process.env.NODE_ENV === "production"
          ? "An unexpected error occurred"
          : err.message || "Internal server error",
      details: {},
    },
  });
}

// 404 Not Found Handler for unregistered routes
export function notFoundHandler(
  req: Request,
  res: Response<StandardErrorResponse>
): void {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      details: {},
    },
  });
}

