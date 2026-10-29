/**
 * Nexum API Client
 * Provides typed connectivity between the Next.js frontend and the Express/Prisma backend.
 */

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "http://localhost:4000";

export interface BackendHealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  database: {
    provider: string;
    status: "CONNECTED" | "DISCONNECTED" | "ERROR";
    latencyMs: number | null;
  };
  truthStatement: string;
}

export interface ApiUser {
  id: string;
  role: "CLIENT" | "FREELANCER" | "OPERATOR";
  email: string;
  name: string;
  locale: string;
  timezone: string;
  status: string;
  createdAt: string;
  freelancerProfile?: {
    id: string;
    title: string;
    bio: string;
    skills: string[];
    availability: string;
    isDemoData: boolean;
  } | null;
}

export interface ApiProject {
  id: string;
  title: string;
  description: string;
  state: string;
  goals: string;
  budgetCents: number;
  currency: string;
  client?: { id: string; name: string; email: string };
  proposals?: Array<{
    id: string;
    version: number;
    versionHash: string;
    amountCents: number;
    currency: string;
    milestones: Array<{
      id: string;
      orderIndex: number;
      title: string;
      amountCents: number;
      state: string;
    }>;
  }>;
}

export interface ApiPaymentAttempt {
  id: string;
  milestoneId: string;
  provider: string;
  orderId?: string | null;
  captureId?: string | null;
  amountCents: number;
  currency: string;
  state: string;
  idempotencyKey: string;
  uncertaintyReason?: string | null;
  createdAt: string;
}

/**
 * Health check probe to the Express backend.
 */
export async function checkBackendHealth(): Promise<{
  connected: boolean;
  data?: BackendHealthResponse;
  error?: string;
}> {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      return { connected: false, error: `HTTP ${res.status}: ${res.statusText}` };
    }
    const data = (await res.json()) as BackendHealthResponse;
    return { connected: true, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to connect to backend";
    return { connected: false, error: msg };
  }
}

/**
 * Fetch all seeded users and profiles from the backend.
 */
export async function fetchBackendUsers(): Promise<{
  success: boolean;
  data?: ApiUser[];
  error?: string;
}> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/users`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch users",
    };
  }
}

/**
 * Fetch all projects from the backend.
 */
export async function fetchBackendProjects(): Promise<{
  success: boolean;
  data?: ApiProject[];
  error?: string;
}> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/projects`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch projects",
    };
  }
}

/**
 * Fetch payment attempts and audit timeline from the backend.
 */
export async function fetchBackendPaymentAttempts(): Promise<{
  success: boolean;
  data?: ApiPaymentAttempt[];
  error?: string;
}> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/payments/attempts`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch payments",
    };
  }
}

