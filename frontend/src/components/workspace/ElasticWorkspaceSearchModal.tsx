"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Search,
  X,
  MessageSquare,
  FileCheck,
  ShieldAlert,
  Sparkles,
  Database,
  ArrowRight,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  searchWorkspaceElastic,
  fetchElasticTelemetry,
  ElasticSearchHit,
  ElasticTelemetry,
} from "@/lib/api-client";

interface ElasticWorkspaceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
  onSelectHit?: (hit: ElasticSearchHit) => void;
}

export const ElasticWorkspaceSearchModal: React.FC<ElasticWorkspaceSearchModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName = "Active Project",
  onSelectHit,
}) => {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<ElasticSearchHit[]>([]);
  const [provider, setProvider] = useState<"ELASTICSEARCH" | "POSTGRES_FALLBACK">("POSTGRES_FALLBACK");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "MESSAGE" | "DECISION" | "AUDIT_EVENT">("ALL");
  const [telemetry, setTelemetry] = useState<ElasticTelemetry | null>(null);
  const [isPending, startTransition] = useTransition();

  // Load telemetry when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchElasticTelemetry().then((res) => {
        if (res.success && res.telemetry) {
          setTelemetry(res.telemetry);
          if (res.telemetry.elasticsearchConnected) {
            setProvider("ELASTICSEARCH");
          }
        }
      });
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setHits([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      const res = await searchWorkspaceElastic(projectId, trimmed, 30);
      startTransition(() => {
        setIsLoading(false);
        if (res.success) {
          setHits(res.hits || []);
          setProvider(res.provider);
        } else {
          setHits([]);
        }
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [query, projectId]);

  if (!isOpen) return null;

  const filteredHits = hits.filter((h) => {
    if (activeTab === "ALL") return true;
    return h.type === activeTab;
  });

  const messageCount = hits.filter((h) => h.type === "MESSAGE").length;
  const decisionCount = hits.filter((h) => h.type === "DECISION").length;
  const auditCount = hits.filter((h) => h.type === "AUDIT_EVENT").length;

  const quickPrompts = ["agreement", "escrow", "milestone", "payout", "deliverable", "dual-seal"];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
            <Search className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search messages, ADR decisions, and audit events in ${projectName}...`}
              className="w-full bg-transparent border-none text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded border border-slate-200 bg-white font-mono text-[10px] text-slate-400 shadow-2xs">
            ESC
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Telemetry & Filter Bar */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Tabs */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                activeTab === "ALL"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              All ({hits.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("MESSAGE")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                activeTab === "MESSAGE"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              Messages ({messageCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("DECISION")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                activeTab === "DECISION"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              Decisions ({decisionCount})
            </button>
            {auditCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("AUDIT_EVENT")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  activeTab === "AUDIT_EVENT"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                Audit ({auditCount})
              </button>
            )}
          </div>

          {/* Engine indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                provider === "ELASTICSEARCH"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              <Database className="w-3 h-3" />
              <span>{provider === "ELASTICSEARCH" ? "Elasticsearch Engine" : "PostgreSQL Fallback"}</span>
            </div>
            {telemetry?.apmConfigured && (
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                APM Active
              </span>
            )}
          </div>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs font-medium">Searching workspace index...</p>
            </div>
          )}

          {!isLoading && query && filteredHits.length === 0 && (
            <div className="py-12 text-center">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No matching records found</p>
              <p className="text-xs text-slate-400 mt-1">
                No messages, decisions, or events match &ldquo;{query}&rdquo;.
              </p>
            </div>
          )}

          {!isLoading && !query && (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Instant Full-Text Workspace Search</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
                Powered by Elastic with seamless PostgreSQL fallback. Search bilateral chats, architectural decisions (ADRs), and tamper-evident audit logs.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Quick suggestions:</span>
                {quickPrompts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setQuery(p)}
                    className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-[11px] font-semibold transition cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isLoading &&
            filteredHits.map((hit) => {
              const isMessage = hit.type === "MESSAGE";
              const isDecision = hit.type === "DECISION";

              return (
                <div
                  key={hit.id}
                  onClick={() => {
                    if (onSelectHit) onSelectHit(hit);
                    onClose();
                  }}
                  className="p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition cursor-pointer group flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {isMessage && (
                        <span className="flex items-center gap-1 font-bold text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          <MessageSquare className="w-3 h-3" />
                          Chat Message
                        </span>
                      )}
                      {isDecision && (
                        <span className="flex items-center gap-1 font-bold text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                          <FileCheck className="w-3 h-3" />
                          ADR Decision
                        </span>
                      )}
                      {!isMessage && !isDecision && (
                        <span className="flex items-center gap-1 font-bold text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          <ShieldAlert className="w-3 h-3" />
                          Audit Event
                        </span>
                      )}
                      {hit.title && (
                        <span className="font-bold text-slate-800 truncate max-w-xs">{hit.title}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(hit.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-sans pl-1 border-l-2 border-slate-200 group-hover:border-indigo-400">
                    {hit.snippet || hit.content}
                  </p>

                  <div className="flex items-center justify-end text-[11px] text-indigo-600 font-semibold opacity-0 group-hover:opacity-100 transition">
                    <span>Jump to record</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 font-semibold text-slate-600">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Elastic Search & Observability Suite
          </span>
          <span className="font-mono text-[10px]">Indexes: 3 Active</span>
        </div>
      </div>
    </div>
  );
};

