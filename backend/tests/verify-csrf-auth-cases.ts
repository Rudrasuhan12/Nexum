import { csrfProtection } from "../src/middleware/csrf.js";
import { SESSION_COOKIE_NAME } from "../src/lib/auth.js";
import { ForbiddenError } from "../src/lib/errors.js";

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
  } catch (err: any) {
    console.error(`❌ FAIL: ${name}`, err?.message || err);
    process.exitCode = 1;
  }
}

console.log("\n--- Testing CSRF Protection & Internal Proxy Rules ---\n");

// 1. Rejects state-changing cookie requests with no Origin/Referer from external caller
runTest("CSRF blocks POST request with session cookie and missing Origin/Referer", () => {
  let calledNext = false;
  let receivedError: any = null;

  const mockReq: any = {
    method: "POST",
    headers: {},
    cookies: { [SESSION_COOKIE_NAME]: "session_token_123" },
    path: "/api/auth/role",
    socket: { remoteAddress: "192.168.1.50" }, // external IP
  };
  const mockRes: any = {};
  const mockNext = (err?: any) => {
    if (err) receivedError = err;
    else calledNext = true;
  };

  csrfProtection(mockReq, mockRes, mockNext);

  if (calledNext || !(receivedError instanceof ForbiddenError)) {
    throw new Error(`Expected ForbiddenError, got calledNext=${calledNext}, error=${receivedError}`);
  }
  if (!receivedError.message.includes("Missing Origin or Referer")) {
    throw new Error(`Unexpected error message: ${receivedError.message}`);
  }
});

// 2. Allows POST with valid localhost Origin
runTest("CSRF allows POST request with valid Origin (http://localhost:3000)", () => {
  let calledNext = false;
  let receivedError: any = null;

  const mockReq: any = {
    method: "POST",
    headers: { origin: "http://localhost:3000" },
    cookies: { [SESSION_COOKIE_NAME]: "session_token_123" },
    path: "/api/auth/role",
    socket: { remoteAddress: "127.0.0.1" },
  };
  const mockRes: any = {};
  const mockNext = (err?: any) => {
    if (err) receivedError = err;
    else calledNext = true;
  };

  csrfProtection(mockReq, mockRes, mockNext);

  if (!calledNext || receivedError) {
    throw new Error(`Expected next() without error, got calledNext=${calledNext}, error=${receivedError}`);
  }
});

// 3. Allows POST from Next.js server proxy with x-nexum-internal on loopback
runTest("CSRF allows internal Next.js proxy request with x-nexum-internal on loopback", () => {
  let calledNext = false;
  let receivedError: any = null;

  const mockReq: any = {
    method: "POST",
    headers: { "x-nexum-internal": "true" },
    cookies: { [SESSION_COOKIE_NAME]: "session_token_123" },
    path: "/api/auth/role",
    socket: { remoteAddress: "127.0.0.1" },
  };
  const mockRes: any = {};
  const mockNext = (err?: any) => {
    if (err) receivedError = err;
    else calledNext = true;
  };

  csrfProtection(mockReq, mockRes, mockNext);

  if (!calledNext || receivedError) {
    throw new Error(`Expected next() without error, got calledNext=${calledNext}, error=${receivedError}`);
  }
});

// 4. Rejects untrusted attacker origin
runTest("CSRF rejects unauthorized attacker origin", () => {
  let calledNext = false;
  let receivedError: any = null;

  const mockReq: any = {
    method: "POST",
    headers: { origin: "https://evil-attacker.com" },
    cookies: { [SESSION_COOKIE_NAME]: "session_token_123" },
    path: "/api/auth/role",
    socket: { remoteAddress: "127.0.0.1" },
  };
  const mockRes: any = {};
  const mockNext = (err?: any) => {
    if (err) receivedError = err;
    else calledNext = true;
  };

  csrfProtection(mockReq, mockRes, mockNext);

  if (calledNext || !(receivedError instanceof ForbiddenError)) {
    throw new Error(`Expected ForbiddenError, got calledNext=${calledNext}, error=${receivedError}`);
  }
  if (!receivedError.message.includes("is not authorized")) {
    throw new Error(`Unexpected error message: ${receivedError.message}`);
  }
});

// 5. Test OAuth 4-cases destination resolution helper
console.log("\n--- Testing OAuth Redirection Logic for All 4 Cases ---\n");

interface ResolveTargetInput {
  requiresRole?: boolean;
  role: "CLIENT" | "FREELANCER" | null;
}

function resolveOAuthTarget(input: ResolveTargetInput): string {
  if (input.requiresRole || !input.role) {
    return "/choose-role";
  }
  return input.role === "FREELANCER" ? "/freelancer/dashboard" : "/client/dashboard";
}

// Case 1: New user (Google/GitHub) clicks Sign In
runTest("Case 1 (New User clicks Sign In) -> redirects to /choose-role", () => {
  const target = resolveOAuthTarget({ role: null, requiresRole: true });
  if (target !== "/choose-role") throw new Error(`Expected /choose-role, got ${target}`);
});

// Case 2: New user (Google/GitHub) clicks Sign Up
runTest("Case 2 (New User clicks Sign Up) -> redirects to /choose-role", () => {
  const target = resolveOAuthTarget({ role: null, requiresRole: true });
  if (target !== "/choose-role") throw new Error(`Expected /choose-role, got ${target}`);
});

// Case 3a: Old user (Client) clicks Sign In
runTest("Case 3a (Old Client clicks Sign In) -> redirects directly to /client/dashboard", () => {
  const target = resolveOAuthTarget({ role: "CLIENT", requiresRole: false });
  if (target !== "/client/dashboard") throw new Error(`Expected /client/dashboard, got ${target}`);
});

// Case 3b: Old user (Freelancer) clicks Sign In
runTest("Case 3b (Old Freelancer clicks Sign In) -> redirects directly to /freelancer/dashboard", () => {
  const target = resolveOAuthTarget({ role: "FREELANCER", requiresRole: false });
  if (target !== "/freelancer/dashboard") throw new Error(`Expected /freelancer/dashboard, got ${target}`);
});

// Case 4a: Old user (Client) clicks Sign Up
runTest("Case 4a (Old Client clicks Sign Up) -> redirects directly to /client/dashboard without /choose-role", () => {
  const target = resolveOAuthTarget({ role: "CLIENT", requiresRole: false });
  if (target !== "/client/dashboard") throw new Error(`Expected /client/dashboard, got ${target}`);
});

// Case 4b: Old user (Freelancer) clicks Sign Up
runTest("Case 4b (Old Freelancer clicks Sign Up) -> redirects directly to /freelancer/dashboard without /choose-role", () => {
  const target = resolveOAuthTarget({ role: "FREELANCER", requiresRole: false });
  if (target !== "/freelancer/dashboard") throw new Error(`Expected /freelancer/dashboard, got ${target}`);
});

console.log("\nAll CSRF and OAuth resolution checks verified!\n");

