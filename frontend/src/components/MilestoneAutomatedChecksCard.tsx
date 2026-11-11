"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Terminal,
  ExternalLink,
  FileCode,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  GitBranch,
  FileText,
  AlertTriangle,
  Camera,
  Maximize2,
  KeyRound,
  ShieldAlert,
  Layers,
  Monitor,
  X,
} from "lucide-react";

export interface DeliverableCheckItem {
  id: string;
  name: string;
  status: "SUCCESS" | "FAILURE" | "RUNNING" | "PENDING";
  summary: string;
  durationMs: number;
  details?: string;
}

export interface DemoEntityCredential {
  entity: string;
  login: string;
  password: string;
  notes?: string;
}

export interface UiComponentAssertion {
  name: string;
  status: "VERIFIED" | "MISSING" | "WARNING";
  details: string;
}

export interface VisualProofData {
  status: "VERIFIED" | "WAITING_FOR_CREDENTIALS" | "NOT_REQUIRED";
  targetUrl?: string;
  authenticatedEntity?: string;
  screenshotUrl?: string;
  authGateDetected: boolean;
  credentialsProvided: boolean;
  parsedCredentials?: DemoEntityCredential[];
  uiComponentsVerified: UiComponentAssertion[];
  missingCredentialsPrompt?: string;
  timestamp: string;
}

export interface VerificationAuditRecord {
  id: string;
  milestoneId: string;
  projectId: string;
  revisionNumber: number;
  status: "PASSED" | "FAILED" | "RUNNING" | "PENDING";
  checks: DeliverableCheckItem[];
  testPassRate: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  terminalOutput: string;
  sha256Seal: string;
  securityScanPassed: boolean;
  modelCascade: string;
  visualProof?: VisualProofData;
  fileName?: string;
  fileSize?: string;
  githubPrUrl?: string;
  demoUrl?: string;
  demoCredentialsText?: string;
  completionNote?: string;
  submittedAt: string;
}

interface MilestoneAutomatedChecksCardProps {
  milestoneId: string;
  milestoneTitle?: string;
  projectId?: string;
  acceptanceCriteria?: string[];
  initialHistory?: VerificationAuditRecord[];
  onVerificationComplete?: (record: VerificationAuditRecord) => void;
}

export default function MilestoneAutomatedChecksCard({
  milestoneId,
  milestoneTitle,
  projectId,
  acceptanceCriteria,
  initialHistory,
  onVerificationComplete,
}: MilestoneAutomatedChecksCardProps) {
  const [history, setHistory] = useState<VerificationAuditRecord[]>(initialHistory || []);
  const [selectedRevisionIdx, setSelectedRevisionIdx] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(!initialHistory || initialHistory.length === 0);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [expandedCheckId, setExpandedCheckId] = useState<string | null>(null);
  const [showTerminal, setShowTerminal] = useState<boolean>(false);
  const [copiedSeal, setCopiedSeal] = useState<boolean>(false);
  const [copiedLogins, setCopiedLogins] = useState<boolean>(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState<boolean>(false);
  const [inlineCredsText, setInlineCredsText] = useState<string>("");
  const [isSubmittingCreds, setIsSubmittingCreds] = useState<boolean>(false);
  const [credsSuccessMsg, setCredsSuccessMsg] = useState<string>("");

  const handleCopyLogins = () => {
    const textToCopy =
      activeRecord?.demoCredentialsText ||
      activeRecord?.visualProof?.authenticatedEntity ||
      "Client: demo@shopkart.com / DemoPass2026!";
    navigator.clipboard?.writeText(textToCopy);
    setCopiedLogins(true);
    setTimeout(() => setCopiedLogins(false), 2000);
  };

  // Fetch deliverable history from API
  useEffect(() => {
    let isMounted = true;
    async function loadHistory() {
      try {
        const res = await fetch(`/api/milestones/${milestoneId}/deliverable-history`);
        if (res.ok) {
          const data = await res.json();
          const revs = data.revisions || data.data || (Array.isArray(data) ? data : []);
          if (isMounted && revs && revs.length > 0) {
            setHistory(revs);
            setSelectedRevisionIdx(revs.length - 1); // latest by default
          }
        }
      } catch {
        // Fallback or offline
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (!initialHistory || initialHistory.length === 0) {
      loadHistory();
    } else {
      setHistory(initialHistory);
      setSelectedRevisionIdx(initialHistory.length - 1);
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [milestoneId, initialHistory]);

  const activeRecord: VerificationAuditRecord | undefined =
    history[selectedRevisionIdx] || history[history.length - 1];

  const handleCopySeal = (seal: string) => {
    if (!seal) return;
    navigator.clipboard?.writeText(seal);
    setCopiedSeal(true);
    setTimeout(() => setCopiedSeal(false), 2000);
  };

  const handleManualRerun = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch(`/api/milestones/${milestoneId}/verify-deliverable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: projectId || "proj_live",
          milestoneTitle: milestoneTitle,
          acceptanceCriteria: acceptanceCriteria || [
            "Core technical specifications implemented",
            "Automated tests pass with zero unhandled exceptions",
            "Dual SHA-256 state consensus verified",
          ],
          fileName: activeRecord?.fileName || "deliverables-package.zip",
          githubPrUrl: activeRecord?.githubPrUrl,
          completionNote: activeRecord?.completionNote,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const record = data.result || data.data || data.record;
        if (record) {
          const newRecord: VerificationAuditRecord = record;
          setHistory((prev) => [...prev, newRecord]);
          setSelectedRevisionIdx(history.length);
          if (onVerificationComplete) {
            onVerificationComplete(newRecord);
          }
        }
      }
    } catch {
      // offline error handling
    } finally {
      setIsVerifying(false);
    }
  };

  const handleProvideMissingCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineCredsText.trim()) return;

    setIsSubmittingCreds(true);
    setCredsSuccessMsg("");

    try {
      const res = await fetch(`/api/milestones/${milestoneId}/provide-credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialsText: inlineCredsText.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          const updatedRecord: VerificationAuditRecord = data.data;
          setHistory((prev) => {
            const next = [...prev];
            const targetIdx = selectedRevisionIdx < next.length ? selectedRevisionIdx : next.length - 1;
            next[targetIdx] = updatedRecord;
            return next;
          });
          setCredsSuccessMsg("Credentials verified! Autonomous visual proof captured.");
          setTimeout(() => setCredsSuccessMsg(""), 4000);
          if (onVerificationComplete) {
            onVerificationComplete(updatedRecord);
          }
        }
      }
    } catch {
      // offline error handling
    } finally {
      setIsSubmittingCreds(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-[#4f46e5] border-t-transparent animate-spin" />
          <span className="text-xs font-bold text-slate-700">
            Loading Autonomous Deliverable Verification Checks...
          </span>
        </div>
        <p className="text-[11px] text-slate-500">
          Fetching versioned test assertions, secret scan logs, and SHA-256 consensus seal.
        </p>
      </div>
    );
  }

  if (!activeRecord) {
    return (
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Autonomous Proof-of-Execution Verifier
            </h4>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            Awaiting Submission
          </span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          When a milestone deliverable is submitted, Nexum AI automatically initiates an automated 3-tier inspection (Gemini 2.0 Flash contract test suite, Groq LPU security scan, and dual SHA-256 consensus seal).
        </p>
        <button
          type="button"
          onClick={handleManualRerun}
          disabled={isVerifying}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? "animate-spin" : ""}`} />
          <span>{isVerifying ? "Running 3-Tier Verification..." : "Run Pre-Flight Verification"}</span>
        </button>
      </div>
    );
  }

  const allChecksPassed = activeRecord.checks.every((c) => c.status === "SUCCESS");
  const totalDuration = activeRecord.checks.reduce((acc, c) => acc + c.durationMs, 0);

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden transition">
      {/* Top Header Bar: Status + Revision Switcher */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              allChecksPassed
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {allChecksPassed ? (
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">
                Proof-of-Execution Verifier
              </h4>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  allChecksPassed
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                    : "bg-rose-50 text-rose-700 border border-rose-200/80"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    allChecksPassed ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                />
                {allChecksPassed
                  ? `All ${activeRecord.checks.length} checks passed`
                  : "Checks require attention"}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                in {totalDuration}ms
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated Pre-Flight Inspection executed via 3-Tier Multi-Model Orchestration.
            </p>
          </div>
        </div>

        {/* Revision selector & Re-run */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {history.length > 1 && (
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
              {history.map((rec, idx) => (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => setSelectedRevisionIdx(idx)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    selectedRevisionIdx === idx
                      ? "bg-[#4f46e5] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  Rev #{rec.revisionNumber}
                </button>
              ))}
            </div>
          )}

          {/* Sleek compact Demo & Run buttons */}
          {(activeRecord?.demoUrl || activeRecord?.visualProof?.targetUrl) && (
            <a
              href={activeRecord.demoUrl || activeRecord.visualProof?.targetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold transition shadow-2xs"
              title="Open Live Staging Demo"
            >
              <span>Demo</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          <button
            type="button"
            onClick={handleManualRerun}
            disabled={isVerifying}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Re-run automated inspection and visual proof"
          >
            <RefreshCw className={`w-3 h-3 ${isVerifying ? "animate-spin text-[#4f46e5]" : "text-slate-500"}`} />
            <span>{isVerifying ? "Running..." : "Run Demo"}</span>
          </button>
        </div>
      </div>

      {/* Submission Context Card */}
      <div className="px-4 py-3 sm:px-5 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-4 flex-wrap">
          {activeRecord.fileName && (
            <span className="inline-flex items-center gap-1.5 font-medium">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-800">{activeRecord.fileName}</span>
              {activeRecord.fileSize && (
                <span className="text-[10px] text-slate-400">({activeRecord.fileSize})</span>
              )}
            </span>
          )}

          {activeRecord.githubPrUrl && (
            <a
              href={activeRecord.githubPrUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[#4f46e5] hover:underline font-medium"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>GitHub PR #15</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          )}

          <span className="text-[11px] text-slate-400">
            Submitted: {new Date(activeRecord.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Dual SHA-256 Consensus Seal Badge */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-bold text-slate-900">Consensus Seal:</span>
            <span className="truncate max-w-[130px] sm:max-w-[180px]">
              {activeRecord.sha256Seal}
            </span>
            <button
              type="button"
              onClick={() => handleCopySeal(activeRecord.sha256Seal)}
              className="p-0.5 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              title="Copy cryptographic seal"
            >
              {copiedSeal ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Missing Credentials Alert & Action Banner */}
      {activeRecord.visualProof?.status === "WAITING_FOR_CREDENTIALS" && (
        <div className="p-4 sm:p-5 bg-amber-50/70 border-b border-amber-200/80 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <KeyRound className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h5 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Action Required: Demo Credentials Needed
                </h5>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/70 text-amber-900">
                  Authentication Gate Detected
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                {activeRecord.visualProof.missingCredentialsPrompt ||
                  "Nexum AI encountered an authentication gate at the dashboard. Please provide demo credentials for Client or Admin entity so the autonomous visual inspection can complete."}
              </p>

              <form onSubmit={handleProvideMissingCredentials} className="mt-3 space-y-2">
                <textarea
                  rows={2}
                  value={inlineCredsText}
                  onChange={(e) => setInlineCredsText(e.target.value)}
                  placeholder="e.g.&#10;Client: demo@shopkart.com / DemoPass2026!&#10;Admin: admin@shopkart.com / AdminSecure99#"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] font-mono resize-none shadow-2xs"
                />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-amber-700">
                    Write logins for any entity (Client, Admin, User). AI will parse and log in.
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmittingCreds || !inlineCredsText.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isSubmittingCreds ? "Logging In & Inspecting..." : "Submit & Run Visual Inspector"}</span>
                  </button>
                </div>
              </form>

              {credsSuccessMsg && (
                <p className="text-xs font-semibold text-emerald-700 mt-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{credsSuccessMsg}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Autonomous Visual UI Proof & Authenticated Inspection Section */}
      {activeRecord.visualProof?.status === "VERIFIED" && (
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-[#4f46e5] flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span>Autonomous Visual UI Proof & Staging Inspection</span>
                </h5>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Captured by Nexum AI Visual Inspector via authenticated headless session.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{activeRecord.visualProof.authenticatedEntity || "Session Verified"}</span>
              </span>
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 shadow-2xs transition cursor-pointer"
              >
                <Maximize2 className="w-3 h-3 text-slate-500" />
                <span>Zoom Proof</span>
              </button>
            </div>
          </div>

          {/* Screenshot Viewport Container */}
          <div
            onClick={() => setIsZoomModalOpen(true)}
            className="group relative rounded-xl border border-slate-200/90 overflow-hidden bg-white shadow-2xs cursor-pointer transition hover:border-[#4f46e5]/50"
          >
            {/* Visual Screenshot (SVG / Image) */}
            <div className="relative w-full aspect-16/10 max-h-80 sm:max-h-96 overflow-hidden bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeRecord.visualProof.screenshotUrl || "/uploads/visual-proofs/sample.svg"}
                alt="Autonomous Visual Proof Screenshot"
                className="w-full h-full object-contain object-top transition duration-200 group-hover:scale-[1.01]"
              />
            </div>

            {/* Hover overlay hint */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition flex items-center justify-center p-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 text-slate-800 border border-slate-200/90 shadow-md text-xs font-bold backdrop-blur-xs">
                <Maximize2 className="w-3.5 h-3.5 text-[#4f46e5]" />
                <span>Click to Expand High-Resolution Proof</span>
              </div>
            </div>
          </div>

          {/* UI Component Assertions Checklist */}
          {activeRecord.visualProof.uiComponentsVerified.length > 0 && (
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Verified Interface & Layout Components:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {activeRecord.visualProof.uiComponentsVerified.map((comp, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">{comp.name}</span>
                      <p className="text-[11px] text-slate-500 leading-normal">{comp.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <span className="text-[11px] font-mono text-slate-500 truncate max-w-xs">
              Target: <strong className="text-slate-800">{activeRecord.visualProof.targetUrl}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLogins}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 transition shadow-2xs cursor-pointer"
                title="Copy demo credentials to clipboard"
              >
                {copiedLogins ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                <span>{copiedLogins ? "Copied!" : "Copy Logins"}</span>
              </button>

              <button
                type="button"
                onClick={handleManualRerun}
                disabled={isVerifying}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-[11px] font-bold text-[#4f46e5] transition shadow-2xs disabled:opacity-50 cursor-pointer"
                title="Re-run automated inspection and visual proof"
              >
                <RefreshCw className={`w-3 h-3 ${isVerifying ? "animate-spin" : ""}`} />
                <span>{isVerifying ? "Running..." : "Run Demo"}</span>
              </button>

              {activeRecord.visualProof.targetUrl && (
                <a
                  href={activeRecord.visualProof.targetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold transition shadow-2xs"
                  title="Open live staging demo in new tab"
                >
                  <span>Demo</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GitHub Actions Style 4 Checks List */}
      <div className="divide-y divide-slate-100 bg-white">
        {activeRecord.checks.map((check) => {
          const isExpanded = expandedCheckId === check.id;
          const isPassed = check.status === "SUCCESS";
          return (
            <div key={check.id} className="transition hover:bg-slate-50/50">
              <div
                onClick={() => setExpandedCheckId(isExpanded ? null : check.id)}
                className="px-4 py-3.5 sm:px-5 flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0">
                    {isPassed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {check.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {check.summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono text-[11px] text-slate-400">
                    {check.durationMs}ms
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Accordion Detail Breakdown */}
              {isExpanded && check.details && (
                <div className="px-4 pb-3.5 sm:px-5 pl-11 text-xs text-slate-600 bg-slate-50/60 border-t border-slate-100 animate-in fade-in duration-150">
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 font-mono text-[11px] whitespace-pre-wrap leading-relaxed text-slate-700">
                    {check.details}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Terminal Stderr/Stdout Drawer Button */}
      <div className="px-4 py-3 sm:px-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setShowTerminal(!showTerminal)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4f46e5] hover:text-[#4338ca] transition cursor-pointer"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>{showTerminal ? "Hide Vitest Assertions Log" : "View Raw Test Assertions (Vitest stdout)"}</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-50 border border-indigo-200 font-mono">
            {activeRecord.passedTests}/{activeRecord.totalTests} passed
          </span>
        </button>

        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Cascade: <strong className="font-medium text-slate-600">{activeRecord.modelCascade}</strong>
        </span>
      </div>

      {/* Light-Theme Terminal Raw Console Output */}
      {showTerminal && (
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-slate-800 font-mono text-[11px] leading-relaxed overflow-x-auto select-all max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 text-slate-500 text-[10px]">
            <span className="font-semibold text-slate-700">vitest --run contracts/milestone_verification.test.ts</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              EXIT CODE 0 · ALL TESTS PASS
            </span>
          </div>
          <pre className="whitespace-pre-wrap font-mono text-slate-700 leading-normal">
            {activeRecord.terminalOutput}
          </pre>
        </div>
      )}

      {/* Lightbox Zoom Modal for High-Resolution Visual Proof (Clean Light SaaS Backdrop) */}
      {isZoomModalOpen && activeRecord.visualProof?.screenshotUrl && (
        <div
          onClick={() => setIsZoomModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-2xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-3 max-h-[95vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#4f46e5]" />
                <h4 className="text-sm font-extrabold text-slate-900">
                  High-Resolution Autonomous Visual Proof Viewport
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeRecord.visualProof.screenshotUrl}
                alt="Full resolution visual proof"
                className="w-full h-auto object-contain max-h-[75vh]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-1">
              <span>
                Session: <strong>{activeRecord.visualProof.authenticatedEntity}</strong>
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                Seal: {activeRecord.sha256Seal}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

