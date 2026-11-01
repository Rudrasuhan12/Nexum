export type ErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "STATE_CONFLICT"
  | "INTERNAL_SERVER_ERROR";

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode = 400,
    details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details: Record<string, unknown> = {}, statusCode: number = 400) {
    super("VALIDATION_ERROR", message, statusCode, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required to access this resource") {
    super("UNAUTHORIZED", message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to access this resource") {
    super("FORBIDDEN", message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const msg = identifier
      ? `${resource} with identifier "${identifier}" not found`
      : `${resource} not found`;
    super("NOT_FOUND", msg, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, codeOrDetails?: string | Record<string, unknown>, details: Record<string, unknown> = {}) {
    if (typeof codeOrDetails === "string") {
      super(codeOrDetails as any, message, 409, details);
    } else {
      super("CONFLICT", message, 409, codeOrDetails || {});
    }
  }
}

export class StateConflictError extends AppError {
  constructor(fromState: string, toState: string, reason?: string) {
    const msg = `Invalid state transition from "${fromState}" to "${toState}"${
      reason ? `: ${reason}` : ""
    }`;
    super("STATE_CONFLICT", msg, 409, { fromState, toState });
  }
}

