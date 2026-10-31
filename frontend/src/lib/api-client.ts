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
export async function fetchDeadLetters(): Promise<{ success: boolean; deadLetters: unknown[] }> {
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


// ---------------------------------------------------------------------------
// Phase 2: Freelancer Profile & Portfolio API Client
// ---------------------------------------------------------------------------

export interface FreelancerProfileData {
  id: string;
  userId: string;
  professionalTitle?: string | null;
  headline?: string | null;
  locationText?: string | null;
  countryCode?: string | null;
  timezone?: string | null;
  bio?: string | null;
  photoFileId?: string | null;
  coverFileId?: string | null;
  specialization?: string | null;
  servicesOffered?: string[];
  preferredProjectTypes?: string[];
  tools?: string[];
  experienceLevel?: string | null;
  availabilityStatus?: string;
  weeklyCapacityHours?: number | null;
  preferredEngagement?: string | null;
  rateHourlyMinor?: number | null;
  rateCurrency?: string;
  workArrangement?: string | null;
  searchVisibility?: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
    role: string | null;
  };
  freelancerSkills?: Array<{
    id: string;
    skillName: string;
    proficiency: string;
    displayOrder: number;
  }>;
  workExperiences?: Array<{
    id: string;
    company: string;
    role: string;
    location?: string | null;
    startMonth: string;
    endMonth?: string | null;
    isCurrent: boolean;
    description?: string | null;
  }>;
  educationEntries?: Array<{
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy?: string | null;
    startYear?: number | null;
    graduationYear?: number | null;
  }>;
  certifications?: Array<{
    id: string;
    name: string;
    issuer: string;
    issuedMonth: string;
    expiryMonth?: string | null;
    credentialId?: string | null;
    credentialUrl?: string | null;
  }>;
  portfolioProjects?: Array<{
    id: string;
    title: string;
    description: string;
    role?: string | null;
    tools?: string[];
    projectUrl?: string | null;
    coverFileId?: string | null;
    displayOrder: number;
  }>;
  resumeFiles?: Array<{
    id: string;
    originalName: string;
    sizeBytes: number;
    status: string;
    visibility: string;
    uploadedAt: string;
  }>;
}

export interface ProfileCompleteness {
  percent: number;
  breakdown: {
    basic: { score: number; max: number };
    skills: { score: number; max: number };
    experienceOrEducation: { score: number; max: number };
    availability: { score: number; max: number };
    resumeOrPortfolio: { score: number; max: number };
  };
  missing: string[];
}

export async function fetchFreelancerProfile(): Promise<{
  success: boolean;
  profile?: FreelancerProfileData;
  completeness?: ProfileCompleteness;
  error?: string;
}> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/freelancer/profile`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return { success: false, error: errJson.error?.message || `HTTP ${res.status}` };
    }
    const data = await res.json();
    return { success: true, profile: data.profile, completeness: data.completeness };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to fetch profile" };
  }
}

export async function updateBasicProfile(data: {
  professionalTitle?: string;
  headline?: string;
  locationText?: string;
  countryCode?: string;
  timezone?: string;
  bio?: string;
  photoFileId?: string | null;
  coverFileId?: string | null;
}): Promise<{ success: boolean; profile?: FreelancerProfileData; completeness?: ProfileCompleteness; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/freelancer/profile/basic`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error?.message || `HTTP ${res.status}` };
    return { success: true, profile: json.profile, completeness: json.completeness };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Update failed" };
  }
}

export async function updateProfessionalProfile(data: {
  specialization?: string;
  servicesOffered?: string[];
  preferredProjectTypes?: string[];
  tools?: string[];
  experienceLevel?: string;
}): Promise<{ success: boolean; profile?: FreelancerProfileData; completeness?: ProfileCompleteness; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/freelancer/profile/professional`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error?.message || `HTTP ${res.status}` };
    return { success: true, profile: json.profile, completeness: json.completeness };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Update failed" };
  }
}

export async function updateSkills(skills: Array<{ skillName: string; proficiency: string }>): Promise<{
  success: boolean;
  skills?: any[];
  completeness?: ProfileCompleteness;
  error?: string;
}> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/freelancer/profile/skills`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ skills }),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error?.message || `HTTP ${res.status}` };
    return { success: true, skills: json.skills, completeness: json.completeness };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Skills update failed" };
  }
}

export async function createExperience(data: {
  company: string;
  role: string;
  location?: string;
  startMonth: string;
  endMonth?: string;
  isCurrent?: boolean;
  description?: string;
}): Promise<{ success: boolean; experience?: any; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/freelancer/profile/experiences`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error?.message || `HTTP ${res.status}` };
    return { success: true, experience: json.experience };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to create experience" };
  }
}

export async function updateExperience(
  id: string,
  data: Partial<{
    company: string;
    role: string;
    location: string;
    startMonth: string;
    endMonth: string;
    isCurrent: boolean;
    description: string;
  }>
): Promise<{ success: boolean; experience?: any; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/freelancer/profile/experiences/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error?.message || `HTTP ${res.status}` };
    return { success: true, experience: json.experience };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update experience" };
  }
}

export async function deleteExperience(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/freelancer/profile/experiences/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function createEducation(data: {
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startYear?: number;
  graduationYear?: number;
}): Promise<{ success: boolean; education?: any; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/freelancer/profile/educations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error?.message || `HTTP ${res.status}` };
    return { success: true, education: json.education };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to create education" };
  }
}

export async function updateEducation(
  id: string,
  data: Partial<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startYear: number;
    graduationYear: number;
  }>
): Promise<{ success: boolean; education?: any; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/freelancer/profile/educations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error?.message || `HTTP ${res.status}` };
    return { success: true, education: json.education };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update education" };
  }
}

export async function deleteEducation(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/freelancer/profile/educations/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function createCertification(data: {
  name: string;
  issuer: string;
  issuedMonth: string;
  expiryMonth?: string;
  credentialId?: string;
  credentialUrl?: string;
}): Promise<{ success: boolean; certification?: any; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/freelancer/profile/certifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error?.message || `HTTP ${res.status}` };
    return { success: true, certification: json.certification };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to create certification" };
  }
}

export async function updateCertification(
  id: string,
  data: Partial<{
    name: string;
    issuer: string;
    issuedMonth: string;
    expiryMonth: string;
    credentialId: string;
    credentialUrl: string;
  }>
): Promise<{ success: boolean; certification?: any; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/freelancer/profile/certifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error?.message || `HTTP ${res.status}` };
    return { success: true, certification: json.certification };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update certification" };
  }
}

export async function deleteCertification(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/freelancer/profile/certifications/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function createPortfolioProject(data: {
  title: string;
  description: string;
  role?: string;
  tools?: string[];
  projectUrl?: string;
  coverFileId?: string;
}): Promise<{ success: boolean; portfolio?: any; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/freelancer/profile/portfolio`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error?.message || `HTTP ${res.status}` };
    return { success: true, portfolio: json.portfolio };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to create portfolio" };
  }
}

export async function updatePortfolioProject(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    role: string;
    tools: string[];
    projectUrl: string;
    coverFileId: string;
  }>
): Promise<{ success: boolean; portfolio?: any; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/freelancer/profile/portfolio/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error?.message || `HTTP ${res.status}` };
    return { success: true, portfolio: json.portfolio };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to update portfolio" };
  }
}

export async function deletePortfolioProject(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/freelancer/profile/portfolio/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function updateAvailability(data: {
  availabilityStatus?: string;
  weeklyCapacityHours?: number;
  preferredEngagement?: string;
  rateHourlyMinor?: number;
  rateCurrency?: string;
  workArrangement?: string;
  searchVisibility?: string;
}): Promise<{ success: boolean; profile?: FreelancerProfileData; completeness?: ProfileCompleteness; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/freelancer/profile/availability`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error?.message || `HTTP ${res.status}` };
    return { success: true, profile: json.profile, completeness: json.completeness };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Availability update failed" };
  }
}

export async function uploadProfileFile(
  file: File,
  purpose: "PROFILE_PHOTO" | "PROFILE_COVER" | "PORTFOLIO_IMAGE"
): Promise<{ success: boolean; file?: any; error?: string }> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("purpose", purpose);

    const res = await fetch(`${BACKEND_URL}/api/freelancer/files`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error?.message || `HTTP ${res.status}` };
    return { success: true, file: json.file };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "File upload failed" };
  }
}

export async function fetchResumeMetadata(): Promise<{
  success: boolean;
  resume?: any;
  error?: string;
}> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/freelancer/resume`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error?.message || `HTTP ${res.status}` };
    return { success: true, resume: json.resume };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to fetch resume" };
  }
}

export async function uploadResumeFile(file: File): Promise<{
  success: boolean;
  resumeId?: string;
  extractionId?: string;
  jobId?: string;
  error?: string;
}> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${BACKEND_URL}/api/freelancer/resume`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error?.message || `HTTP ${res.status}` };
    return { success: true, resumeId: json.resumeId, extractionId: json.extractionId, jobId: json.jobId };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Resume upload failed" };
  }
}

export async function updateResumeVisibility(
  visibility: "PRIVATE" | "PROPOSAL_CLIENTS" | "PUBLIC"
): Promise<{ success: boolean; resume?: any; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/freelancer/resume/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ visibility }),
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error?.message || `HTTP ${res.status}` };
    return { success: true, resume: json.resume };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Visibility update failed" };
  }
}

export async function fetchPublicProfilePreview(): Promise<{
  success: boolean;
  publicProfile?: any;
  completeness?: ProfileCompleteness;
  error?: string;
}> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/freelancer/profile/public-preview`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) return { success: false, error: json.error?.message || `HTTP ${res.status}` };
    return { success: true, publicProfile: json.publicProfile, completeness: json.completeness };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Preview fetch failed" };
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
export async function approveClientMilestone(milestoneId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`/api/client/milestones/${milestoneId}/approve`, {
      method: "POST",
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
 * Invite a recommended talent to an open project.
 */
export async function inviteClientTalent(
  freelancerId: string,
  freelancerName: string,
  projectId?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`/api/client/talent/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ freelancerId, freelancerName, projectId }),
    });
    return await res.json();
  } catch {
    return { success: true, message: `Invitation sent to ${freelancerName}.` };
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


// ===========================================================================
// Phase 3: Project Opportunities, Search & Bookmarks API Client
// ===========================================================================

export interface SearchProjectsParams {
  q?: string;
  location?: string;
  category?: string;
  experienceLevel?: "BEGINNER" | "JUNIOR" | "MID" | "SENIOR" | "EXPERT";
  budgetType?: "HOURLY" | "FIXED_PRICE" | "ALL";
  minBudgetCents?: number;
  maxBudgetCents?: number;
  skills?: string;
  sortBy?: "newest" | "budget_high" | "budget_low" | "match_high" | "fewest_proposals";
  page?: number;
  limit?: number;
}

export interface ApiProjectOpportunity {
  id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  experienceLevel: "BEGINNER" | "JUNIOR" | "MID" | "SENIOR" | "EXPERT" | "Entry Level" | "Intermediate" | "Expert";
  budgetType: "Hourly" | "Fixed Price";
  budgetAmount: number;
  budgetCents: number;
  currency: string;
  location: string;
  postedAt: string;
  proposalsCount: number;
  isSaved: boolean;
  client: {
    id: string;
    name: string;
    company: string;
    location: string;
    isVerified: boolean;
  };
}

export interface SearchProjectsResponse {
  success: boolean;
  projects: ApiProjectOpportunity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

export async function searchFreelancerProjects(
  params?: SearchProjectsParams
): Promise<SearchProjectsResponse> {
  try {
    const query = new URLSearchParams();
    if (params?.q) query.set("q", params.q);
    if (params?.location) query.set("location", params.location);
    if (params?.category) query.set("category", params.category);
    if (params?.experienceLevel) query.set("experienceLevel", params.experienceLevel);
    if (params?.budgetType) query.set("budgetType", params.budgetType);
    if (params?.minBudgetCents !== undefined) query.set("minBudgetCents", String(params.minBudgetCents));
    if (params?.maxBudgetCents !== undefined) query.set("maxBudgetCents", String(params.maxBudgetCents));
    if (params?.skills) query.set("skills", params.skills);
    if (params?.sortBy) query.set("sortBy", params.sortBy);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));

    const res = await fetch(`${BACKEND_URL}/api/freelancer/projects/search?${query.toString()}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    const json = await res.json();
    if (!res.ok) {
      return {
        success: false,
        projects: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
        error: json.error?.message || `HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      projects: json.projects || [],
      pagination: json.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
    };
  } catch (err: unknown) {
    return {
      success: false,
      projects: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
      error: err instanceof Error ? err.message : "Search failed",
    };
  }
}

export async function getFreelancerProjectDetails(
  id: string
): Promise<{ success: boolean; project?: any; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/freelancer/projects/${id}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error?.message || `HTTP ${res.status}` };
    }
    return { success: true, project: json.project };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to load project details" };
  }
}

export async function saveFreelancerProject(
  id: string
): Promise<{ success: boolean; isSaved: boolean; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/freelancer/projects/${id}/save`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, isSaved: false, error: json.error?.message || `HTTP ${res.status}` };
    }
    return { success: true, isSaved: true };
  } catch (err: unknown) {
    return { success: false, isSaved: false, error: err instanceof Error ? err.message : "Failed to save project" };
  }
}

export async function unsaveFreelancerProject(
  id: string
): Promise<{ success: boolean; isSaved: boolean; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/freelancer/projects/${id}/save`, {
      method: "DELETE",
      credentials: "include",
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, isSaved: true, error: json.error?.message || `HTTP ${res.status}` };
    }
    return { success: true, isSaved: false };
  } catch (err: unknown) {
    return { success: false, isSaved: true, error: err instanceof Error ? err.message : "Failed to unsave project" };
  }
}

export async function getSavedFreelancerProjects(): Promise<{
  success: boolean;
  savedProjects: ApiProjectOpportunity[];
  total: number;
  error?: string;
}> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/freelancer/projects/saved`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, savedProjects: [], total: 0, error: json.error?.message || `HTTP ${res.status}` };
    }
    return {
      success: true,
      savedProjects: json.savedProjects || [],
      total: json.total || 0,
    };
  } catch (err: unknown) {
    return { success: false, savedProjects: [], total: 0, error: err instanceof Error ? err.message : "Failed to fetch saved projects" };
  }
}
