/**
 * Nexum API Client
 * Provides typed connectivity between the Next.js frontend and the Express/Prisma backend.
 */

import { AppNotification } from "./notifications-data";

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
  presence?: string;
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

/**
 * Fetch notifications from API.
 */
export async function fetchNotifications(role?: string, userId?: string): Promise<{
  success: boolean;
  notifications: AppNotification[];
  unreadCount: number;
}> {
  try {
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (userId) params.set("userId", userId);

    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`/api/notifications${query}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return { success: false, notifications: [], unreadCount: 0 };
  }
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Mark all notifications as read.
 */
export async function markAllNotificationsAsRead(role?: string, userId?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/notifications/read-all`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, userId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Fetch user presence status.
 */
export async function fetchUserPresence(): Promise<string> {
  try {
    const res = await fetch(`/api/users/presence`, { cache: "no-store" });
    if (!res.ok) return "available";
    const data = await res.json();
    return data.presence || "available";
  } catch {
    return "available";
  }
}

/**
 * Update user presence status in backend and session.
 */
export async function updateUserPresence(presence: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/users/presence`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ presence }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Enqueue an event notification via the resilient backend queue.
 */
export async function publishNotificationEvent(event: {
  eventName: string;
  recipientUserId?: string;
  recipientRole?: string;
  type?: string;
  priority?: string;
  title: string;
  message: string;
  projectName?: string;
  projectId?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  maxAttempts?: number;
}): Promise<{ success: boolean; jobId?: string; error?: string }> {
  try {
    const res = await fetch(`/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    return await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to publish notification";
    return { success: false, error: msg };
  }
}

/**
 * Fetch Dead Letter Queue (DLQ) records for monitoring & forensics.
 */
export async function fetchDeadLetters(): Promise<{ success: boolean; deadLetters: any[] }> {
  try {
    const res = await fetch(`/api/notifications/queue/dlq`, { cache: "no-store" });
    if (!res.ok) return { success: false, deadLetters: [] };
    return await res.json();
  } catch {
    return { success: false, deadLetters: [] };
  }
}

/**
 * Replay a dead-lettered event back into the processing queue.
 */
export async function replayDeadLetter(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/notifications/queue/dlq/${id}/replay`, {
      method: "POST",
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Fetch aggregated client overview telemetry, attention items, projects & talent.
 */
export async function fetchClientOverview(clientId?: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const q = clientId ? `?clientId=${clientId}` : "";
    const res = await fetch(`/api/client/overview${q}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load client overview";
    return { success: false, error: msg };
  }
}

/**
 * Approve a milestone deliverable and capture/release escrow funds.
 */
export async function approveClientMilestone(
  milestoneId: string,
  payload?: { clientId?: string; orderId?: string }
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`/api/client/milestones/${milestoneId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });
    return await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to approve milestone";
    return { success: false, error: msg };
  }
}

/**
 * Approve a scope change request / counteroffer.
 */
export async function approveClientScopeChange(changeRequestId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`/api/client/change-requests/${changeRequestId}/approve`, {
      method: "POST",
    });
    return await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to approve scope change";
    return { success: false, error: msg };
  }
}

/**
 * Invite a recommended talent to an open project (supports object payload or arguments).
 */
export type InviteTalentPayload = {
  clientId?: string;
  freelancerId: string;
  freelancerName?: string;
  freelancerAvatar?: string;
  freelancerTitle?: string;
  projectId: string;
  projectName?: string;
  proposedRate?: string;
  customNote?: string;
};

export async function inviteClientTalent(
  payloadOrFreelancerId: string | InviteTalentPayload,
  freelancerName?: string,
  projectId?: string
): Promise<{ success: boolean; invitation?: any; message?: string; error?: string }> {
  try {
    const payload =
      typeof payloadOrFreelancerId === "string"
        ? {
            freelancerId: payloadOrFreelancerId,
            freelancerName: freelancerName || "Talent",
            projectId: projectId || "proj_1",
          }
        : payloadOrFreelancerId;

    const res = await fetch(`/api/client/talent/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    const name = typeof payloadOrFreelancerId === "string" ? freelancerName : payloadOrFreelancerId.freelancerName;
    return { success: true, message: `Invitation sent to ${name || "talent"}.` };
  }
}

/**
 * Fetch paginated & filtered audit logs.
 */
export async function fetchClientAuditLogs(params?: {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  objectType?: string;
}): Promise<{
  success: boolean;
  logs: any[];
  total: number;
  page: number;
  totalPages: number;
  error?: string;
}> {
  try {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.search) query.set("search", params.search);
    if (params?.action && params.action !== "ALL") query.set("action", params.action);
    if (params?.objectType && params.objectType !== "ALL") query.set("objectType", params.objectType);

    const res = await fetch(`/api/client/audit-logs?${query.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch audit logs";
    return { success: false, logs: [], total: 0, page: 1, totalPages: 1, error: msg };
  }
}

/**
 * Fetch projects and drafts with dynamic counts and filter status
 */
export async function fetchClientProjects(params?: {
  clientId?: string;
  status?: string;
  search?: string;
}): Promise<{
  success: boolean;
  count: number;
  data: any[];
  stats: {
    totalCount: number;
    inProgressCount: number;
    needsActionCount: number;
    countsByStatus: Record<string, number>;
  };
}> {
  try {
    const query = new URLSearchParams();
    if (params?.clientId) query.set("clientId", params.clientId);
    if (params?.status && params.status !== "ALL") query.set("status", params.status);
    if (params?.search) query.set("search", params.search);

    const res = await fetch(`/api/projects?${query.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {
      success: true,
      count: 0,
      data: [],
      stats: {
        totalCount: 0,
        inProgressCount: 0,
        needsActionCount: 0,
        countsByStatus: {
          ALL: 0,
          IN_PROGRESS: 0,
          IN_REVIEW: 0,
          NEGOTIATION: 0,
          FINDING_FREELANCERS: 0,
          DRAFT: 0,
          COMPLETED: 0,
          DISPUTED: 0,
        },
      },
    };
  }
}

/**
 * Fetch a single project or draft specification by ID
 */
export async function fetchProjectById(id: string): Promise<any | null> {
  try {
    const res = await fetch(`/api/projects/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

/**
 * Save or publish a project/draft
 */
export async function saveProject(payload: any): Promise<{
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}> {
  try {
    const method = payload.id ? "PUT" : "POST";
    const endpoint = payload.id ? `/api/projects/${payload.id}` : "/api/projects";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to save project";
    return { success: false, error: msg };
  }
}

/**
 * Delete a project or draft
 */
export async function deleteProject(id: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`/api/projects/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete project";
    return { success: false, error: msg };
  }
}

/**
 * Fetch all client milestones with live telemetry stats and project groupings
 */
export async function fetchClientMilestones(clientId?: string): Promise<{
  success: boolean;
  count: number;
  data: any[];
  stats: {
    upcomingCount: number;
    awaitingReviewCount: number;
    overdueCount: number;
    completedCount: number;
  };
  distinctProjects: Array<{ id: string; name: string }>;
  error?: string;
}> {
  try {
    const query = clientId ? `?clientId=${clientId}` : "";
    const res = await fetch(`/api/client/milestones${query}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch milestones";
    return {
      success: false,
      count: 0,
      data: [],
      stats: {
        upcomingCount: 0,
        awaitingReviewCount: 0,
        overdueCount: 0,
        completedCount: 0,
      },
      distinctProjects: [],
      error: msg,
    };
  }
}

/**
 * Request corrections for an unaccepted milestone deliverable
 */
export async function requestClientMilestoneCorrections(
  milestoneId: string,
  payload: { notes: string; unmetCriteria: string[]; clientId?: string }
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`/api/client/milestones/${milestoneId}/corrections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to request corrections";
    return { success: false, error: msg };
  }
}

/**
 * Fetch verified freelancers with explainable match fitScores, breakdown metrics, and server-side pagination
 */
export async function fetchClientFreelancers(
  paramsOrClientId?: string | {
    clientId?: string;
    page?: number;
    limit?: number;
    search?: string;
    skills?: string[];
    experienceLevel?: string;
    type?: string;
    availability?: string;
    projectId?: string;
    maxHourlyRate?: number;
    sortBy?: string;
  }
): Promise<{
  success: boolean;
  count: number;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  hasMore?: boolean;
  data: any[];
  error?: string;
}> {
  try {
    const query = new URLSearchParams();
    if (typeof paramsOrClientId === "string") {
      query.set("clientId", paramsOrClientId);
    } else if (paramsOrClientId) {
      if (paramsOrClientId.clientId) query.set("clientId", paramsOrClientId.clientId);
      if (paramsOrClientId.page) query.set("page", String(paramsOrClientId.page));
      if (paramsOrClientId.limit) query.set("limit", String(paramsOrClientId.limit));
      if (paramsOrClientId.search) query.set("search", paramsOrClientId.search);
      if (paramsOrClientId.skills?.length) query.set("skills", paramsOrClientId.skills.join(","));
      if (paramsOrClientId.experienceLevel && paramsOrClientId.experienceLevel !== "ALL") {
        query.set("experienceLevel", paramsOrClientId.experienceLevel);
      }
      if (paramsOrClientId.type && paramsOrClientId.type !== "ALL") {
        query.set("type", paramsOrClientId.type);
      }
      if (paramsOrClientId.availability && paramsOrClientId.availability !== "ALL") {
        query.set("availability", paramsOrClientId.availability);
      }
      if (paramsOrClientId.projectId && paramsOrClientId.projectId !== "ALL") {
        query.set("projectId", paramsOrClientId.projectId);
      }
      if (paramsOrClientId.maxHourlyRate) {
        query.set("maxHourlyRate", String(paramsOrClientId.maxHourlyRate));
      }
      if (paramsOrClientId.sortBy) query.set("sortBy", paramsOrClientId.sortBy);
    }

    const res = await fetch(`/api/client/freelancers?${query.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch freelancers";
    return { success: false, count: 0, data: [], error: msg };
  }
}

/**
 * Toggle bookmark / saved status for a freelancer candidate
 */
export async function toggleSaveFreelancer(
  freelancerId: string,
  clientId?: string
): Promise<{ success: boolean; isSaved: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`/api/client/freelancers/${freelancerId}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to toggle bookmark";
    return { success: false, isSaved: false, error: msg };
  }
}

/**
 * Fetch all formal project invitations sent by this client
 */
export async function fetchClientInvitations(clientId?: string): Promise<{
  success: boolean;
  count: number;
  data: any[];
  error?: string;
}> {
  try {
    const query = clientId ? `?clientId=${clientId}` : "";
    const res = await fetch(`/api/client/invitations${query}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch invitations";
    return { success: false, count: 0, data: [], error: msg };
  }
}

export interface ClientSettingsProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  company: string;
  website: string;
  timezone: string;
  bio: string;
  avatar: string;
}

export interface ClientSettingsSecurity {
  twoFactorEnabled: boolean;
  passwordLastChanged: string;
  activeSessions: Array<{
    id: string;
    device: string;
    location: string;
    ip: string;
    isCurrent: boolean;
    lastActive: string;
  }>;
}

export interface BillingReceiptItem {
  id: string;
  orderId: string;
  projectTitle: string;
  date: string;
  amount: string;
  status: string;
  receiptUrl?: string;
}

export interface ClientSettingsPayments {
  autoFundMilestones: boolean;
  disputeMediationBuffer: boolean;
  paypalSandboxStatus: "CONNECTED" | "DISCONNECTED";
  paypalEmail: string;
  defaultCurrency: string;
  vatOrTaxId: string;
  billingReceipts?: BillingReceiptItem[];
}

export interface ClientSettingsNotifications {
  proposalsEmail: boolean;
  proposalsInApp: boolean;
  messagesEmail: boolean;
  messagesInApp: boolean;
  milestonesEmail: boolean;
  milestonesInApp: boolean;
  revisionsEmail: boolean;
  revisionsInApp: boolean;
  paymentsEmail: boolean;
  paymentsInApp: boolean;
  deadlinesEmail: boolean;
  deadlinesInApp: boolean;
}

export interface ClientSettingsHiring {
  budgetMin: number;
  budgetMax: number;
  preferredExpLevel: "ENTRY" | "INTERMEDIATE" | "SENIOR" | "EXPERT" | string;
  preferredSkills: string[];
  autoMatchThreshold: number;
}

export interface ClientSettingsPrivacy {
  profileVisibility: "PUBLIC" | "VERIFIED_ONLY" | "PRIVATE";
  shareAuditTelemetry: boolean;
}

export interface ClientSettingsData {
  profile: ClientSettingsProfile;
  security: ClientSettingsSecurity;
  payments: ClientSettingsPayments;
  notifications: ClientSettingsNotifications;
  hiring: ClientSettingsHiring;
  privacy: ClientSettingsPrivacy;
  updatedAt: string;
}

/**
 * Fetch full workspace settings for a client
 */
export async function fetchClientSettings(clientId?: string): Promise<{
  success: boolean;
  data: ClientSettingsData;
  error?: string;
}> {
  try {
    const q = clientId ? `?clientId=${clientId}` : "";
    const res = await fetch(`/api/client/settings${q}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch settings";
    return { success: false, data: {} as any, error: msg };
  }
}

/**
 * Update client workspace settings
 */
export async function updateClientSettings(
  settings: Partial<ClientSettingsData>,
  clientId?: string
): Promise<{
  success: boolean;
  data?: ClientSettingsData;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`/api/client/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...settings, clientId }),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update settings";
    return { success: false, error: msg };
  }
}

/**
 * Change client password securely
 */
export async function changeClientPassword(payload: {
  currentPassword: string;
  newPassword: string;
  userId?: string;
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`/api/client/settings/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error || `HTTP ${res.status}` };
    }
    return json;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to change password";
    return { success: false, error: msg };
  }
}

/**
 * Revoke other active device sessions
 */
export async function revokeOtherClientSessions(userId?: string): Promise<{
  success: boolean;
  remainingSessions?: number;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`/api/client/settings/sessions/revoke-others`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    return await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to revoke sessions";
    return { success: false, error: msg };
  }
}

/**
 * Submit priority support or mediation ticket
 */
export async function submitClientSupportTicket(ticket: {
  category: string;
  issue: string;
  projectId?: string;
  userId?: string;
}): Promise<{
  success: boolean;
  ticketId?: string;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`/api/client/settings/support`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ticket),
    });
    return await res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to submit ticket";
    return { success: false, error: msg };
  }
}
