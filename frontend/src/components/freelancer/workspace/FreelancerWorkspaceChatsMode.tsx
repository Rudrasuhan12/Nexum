"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  ShoppingCart,
  Smartphone,
  BarChart2,
  Sparkles,
  Paperclip,
  ArrowUp,
  CheckCircle2,
  Circle,
  Video,
  AlertCircle,
  ExternalLink,
  PanelRightClose,
  PanelRightOpen,
  Send,
  Clock,
  MessageSquare,
  CreditCard,
  FileText,
  Layers,
  ShieldCheck,
  History,
  Download,
  X,
  ChevronRight,
  ArrowRight,
  Lock,
  UploadCloud,
  FileCheck,
  FileCode,
} from "lucide-react";
import { TimelineItem } from "@/lib/workspace-types";
import {
  FreelancerWorkspaceProject,
  INITIAL_FREELANCER_PROJECTS,
  INITIAL_FREELANCER_TIMELINE_TECHKART,
} from "@/lib/freelancer-workspace-data";
import ReviewVersionModal from "@/components/client/workspace/ReviewVersionModal";
import ReadOriginalMessageModal from "@/components/client/workspace/ReadOriginalMessageModal";
import ProposeMeetingModal from "@/components/client/workspace/ProposeMeetingModal";
import SubmitDeliverableModal from "./SubmitDeliverableModal";

interface FreelancerWorkspaceChatsModeProps {
  onSwitchToAIMode: (projectScope?: string) => void;
  onOpenMediationHelp: () => void;
  isStandalone?: boolean;
}

export default function FreelancerWorkspaceChatsMode({
  onSwitchToAIMode,
  onOpenMediationHelp,
  isStandalone = false,
}: FreelancerWorkspaceChatsModeProps) {
  // Projects & Active Selection
  const [projects] = useState<FreelancerWorkspaceProject[]>(INITIAL_FREELANCER_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("techkart");
  const [filterType, setFilterType] = useState<"all" | "unread">("all");
  const [searchFilter, setSearchFilter] = useState("");

  // Timeline & Messages
  const [timeline, setTimeline] = useState<TimelineItem[]>(INITIAL_FREELANCER_TIMELINE_TECHKART);
  const [activeTab, setActiveTab] = useState<
    | "chat"
    | "overview"
    | "deliverables"
    | "milestones"
    | "tasks"
    | "files"
    | "payments"
    | "decisions"
    | "activity"
    | "meetings"
  >("chat");

  // Proof Modal State
  const [selectedTxForProof, setSelectedTxForProof] = useState<{
    milestoneTitle: string;
    amount: string;
    receiptNumber: string;
    orderId: string;
    captureId: string;
    proofHash: string;
    paymentRail: string;
    status: string;
  } | null>(null);

  // Composer
  const [composerMode, setComposerMode] = useState<"mediated" | "private_ai">("mediated");
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Right Drawer collapsible state
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(true);

  // Modals
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isOriginalMsgModalOpen, setIsOriginalMsgModalOpen] = useState(false);
  const [isProposeMeetingModalOpen, setIsProposeMeetingModalOpen] = useState(false);
  const [isSubmitDeliverableModalOpen, setIsSubmitDeliverableModalOpen] = useState(false);
  const [reviewVersionTarget, setReviewVersionTarget] = useState("Version 5");

  const timelineEndRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const selectedProject =
    projects.find((p) => p.id === selectedProjectId) || projects[0];

  const totalUnreadCount = projects.reduce((acc, p) => acc + p.unreadCount, 0);

  // Auto scroll to latest in timeline
  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [timeline]);

  // Check if input contains scope / price keywords
  const hasScopeOrPriceKeywords =
    /(\$|price|quote|scope|cost|fee|budget|timeline|delay|discount|reduce|counteroffer|hours)/i.test(
      messageInput
    );

  // Send message handler
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = messageInput.trim();
    if (!text || isSending) return;

    if (composerMode === "private_ai") {
      onSwitchToAIMode(selectedProject.shortName);
      return;
    }

    setIsSending(true);
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // 1. Add freelancer message
    const freelancerMsg: TimelineItem = {
      id: `fmsg_${Date.now()}`,
      type: "client_bubble",
      senderName: "You (Freelancer)",
      timestamp: nowTime,
      bubbleText: text,
    };

    setTimeline((prev) => [...prev, freelancerMsg]);
    setMessageInput("");

    // 2. If it's a scope/price change, Nexum generates a structured quote preview
    setTimeout(() => {
      if (hasScopeOrPriceKeywords) {
        const quoteCard: TimelineItem = {
          id: `fquote_${Date.now()}`,
          type: "freelancer_reply_card",
          senderName: "Nexum AI Scope Engine",
          timestamp: nowTime,
          badgeText: "Mediated Scope Amendment Draft",
          badgeType: "purple",
          summaryText:
            "Your message proposes contract adjustments. Nexum AI formulated this as a bilateral change request, ensuring agreement v5 terms are cryptographically anchored.",
          rawMessage: text,
          metrics: {
            priceChange: "+$500",
            scheduleChange: "+4 days",
            agreementVersion: "v4 to v5",
          },
          actions: {
            primaryLabel: "Review Draft Amendment v5",
            primaryAction: "review_v5",
            secondaryLabel: "Ask Nexum AI",
            secondaryAction: "ask_question",
          },
        };
        setTimeline((prev) => [...prev, quoteCard]);
        showToast("Scope adjustment detected: Formatted as Agreement Amendment v5.");
      } else {
        showToast(`Message delivered to ${selectedProject.clientName} via Nexum AI mediation.`);
      }
      setIsSending(false);
    }, 600);
  };

  // Handle action buttons inside timeline cards
  const handleCardAction = (action?: string) => {
    if (!action) return;
    if (action === "review_v4" || action === "review_v5") {
      setReviewVersionTarget(action === "review_v5" ? "Version 5" : "Version 4");
      setIsReviewModalOpen(true);
    } else if (action === "accept_v5") {
      showToast("Acceptance logged to consensus ledger! Dual-signed Agreement v5 is now active.");
      setTimeout(() => {
        const confirmItem: TimelineItem = {
          id: `fconfirm_${Date.now()}`,
          type: "client_bubble",
          senderName: "Nexum Consensus Engine",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          bubbleText: "✓ Counteroffer v5 accepted by Sambit Kumar. Agreement v5 is now canonical on SHA-256 ledger.",
        };
        setTimeline((prev) => [...prev, confirmItem]);
      }, 100);
    } else if (action === "submit_deliverable") {
      setIsSubmitDeliverableModalOpen(true);
    } else if (action === "ask_question") {
      onSwitchToAIMode(selectedProject.shortName);
    } else if (action === "counter_quote") {
      setMessageInput("I can proceed with the $500 budget if we adjust delivery by 2 days.");
      showToast("Drafting counter-proposal...");
    } else if (action === "decline_offer") {
      showToast("Decline notification recorded. Project remains on Agreement v3 baseline.");
    } else if (action === "open_github") {
      window.open("https://github.com/techkart/storefront/pull/42", "_blank");
    }
  };

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    if (filterType === "unread" && p.unreadCount === 0) return false;
    if (
      searchFilter &&
      !p.name.toLowerCase().includes(searchFilter.toLowerCase()) &&
      !p.clientName.toLowerCase().includes(searchFilter.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex-1 flex overflow-hidden bg-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#4f46e5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ==============================================================
          LEFT COLUMN: ACTIVE PROJECTS LIST (Deto Same as Client Sidebar)
         ============================================================== */}
      <aside className="w-72 sm:w-[300px] border-r border-slate-200/80 bg-slate-50/50 flex flex-col shrink-0 overflow-hidden">
        {/* Header & Filter Controls */}
        <div className="p-4 sm:p-4.5 pb-2.5 space-y-3">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Workspace
              </h1>
              {isStandalone ? (
                <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100/90 border border-slate-200/80 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => onSwitchToAIMode()}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold text-slate-600 hover:text-indigo-600 hover:bg-white/60 transition cursor-pointer"
                    title="Switch to Nexum AI"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    <span>AI</span>
                  </button>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-white text-indigo-700 shadow-2xs">
                    <MessageSquare className="w-3 h-3" />
                    <span>Chats</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                      2
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => window.open("/freelancer/workspace?mode=chats&standalone=true", "_blank")}
                  className="p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 border border-slate-200/80 bg-white transition shadow-2xs cursor-pointer flex items-center gap-1 group"
                  title="Open workspace in new tab (larger view)"
                  aria-label="Open workspace in new tab"
                >
                  <ExternalLink className="w-4 h-4 transition-transform group-hover:scale-110" />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-normal">
              Collaborate, approve and get delivery.
            </p>
          </div>

          {/* Segmented Filter: All vs Unread */}
          <div className="p-1 rounded-xl bg-slate-100/90 border border-slate-200/70 flex items-center gap-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer text-center ${
                filterType === "all"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterType("unread")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                filterType === "unread"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Unread</span>
              {totalUnreadCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    filterType === "unread"
                      ? "bg-indigo-600 text-white"
                      : "bg-indigo-100 text-indigo-700"
                  }`}
                >
                  {totalUnreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Search conversations */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8.5 pr-3 py-1.5 rounded-xl border border-slate-200/80 bg-slate-50/70 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100/60 transition shadow-2xs"
            />
          </div>
        </div>

        {/* Conversation List (Clean 2-line layout exactly like client) */}
        <div className="flex-1 overflow-y-auto px-2.5 py-1.5 space-y-1.5">
          {filteredProjects.map((p) => {
            const isSelected = p.id === selectedProjectId;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                className={`p-3 rounded-2xl transition-all duration-150 cursor-pointer border text-left flex items-start gap-3 ${
                  isSelected
                    ? "bg-indigo-50/70 border-indigo-200/90 shadow-xs ring-1 ring-indigo-500/10"
                    : "bg-white hover:bg-slate-50/80 border-transparent hover:border-slate-200/60"
                }`}
              >
                {/* Project Icon */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected
                      ? "bg-white text-indigo-600 shadow-2xs border border-indigo-100"
                      : p.iconType === "cart"
                      ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                      : p.iconType === "mobile"
                      ? "bg-purple-50 text-purple-600 border border-purple-100"
                      : "bg-amber-50 text-amber-600 border border-amber-100"
                  }`}
                >
                  {p.iconType === "cart" && <ShoppingCart className="w-4 h-4" />}
                  {p.iconType === "mobile" && <Smartphone className="w-4 h-4" />}
                  {p.iconType === "chart" && <BarChart2 className="w-4 h-4" />}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                      {p.lastActivityTime}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                    {p.clientName} (Client)
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className="text-[11px] text-slate-500 truncate leading-tight">
                      {p.lastMessagePreview}
                    </p>
                    {p.unreadCount > 0 && (
                      <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-2xs">
                        {p.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Button */}
        <div className="p-3 border-t border-slate-200/70 bg-white">
          <button
            type="button"
            onClick={() => onSwitchToAIMode("All my client contracts")}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-50/90 via-white to-purple-50/90 hover:from-indigo-100/70 hover:to-purple-100/70 border border-indigo-200/70 text-indigo-700 text-xs font-bold transition shadow-2xs cursor-pointer group"
          >
            <Sparkles className="w-4 h-4 text-indigo-600 group-hover:rotate-12 transition-transform" />
            <span>Ask Nexum AI about all contracts</span>
          </button>
        </div>
      </aside>

      {/* ==============================================================
          CENTRE COLUMN: ACTIVE PROJECT CHAT & TIMELINE (Deto Same as Client)
         ============================================================== */}
      <main className="flex-1 flex flex-col min-w-0 border-r border-slate-200/80 bg-slate-50/40 overflow-hidden">
        {/* Project Header - Compact, Sleek, Single Line (Clean like client) */}
        <div className="px-4 sm:px-5 pt-2.5 pb-0 border-b border-slate-200/80 bg-white shrink-0 shadow-2xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-2xs ${
                  selectedProject.iconType === "cart"
                    ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                    : selectedProject.iconType === "mobile"
                    ? "bg-purple-50 text-purple-600 border border-purple-100"
                    : "bg-amber-50 text-amber-600 border border-amber-100"
                }`}
              >
                {selectedProject.iconType === "cart" && <ShoppingCart className="w-3.5 h-3.5" />}
                {selectedProject.iconType === "mobile" && <Smartphone className="w-3.5 h-3.5" />}
                {selectedProject.iconType === "chart" && <BarChart2 className="w-3.5 h-3.5" />}
              </div>

              <div className="flex items-center gap-2 min-w-0 whitespace-nowrap">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight truncate">
                  {selectedProject.name}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/70 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Active</span>
                </span>
                <span className="text-slate-300 hidden sm:inline shrink-0">·</span>
                <span className="text-xs text-slate-500 hidden sm:inline truncate shrink-0">
                  with {selectedProject.clientName}
                </span>
              </div>
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsProposeMeetingModalOpen(true)}
                className="px-2.5 py-1 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <Video className="w-3.5 h-3.5 text-slate-500" />
                <span>Propose meeting</span>
              </button>

              {!isRightDrawerOpen && (
                <button
                  type="button"
                  onClick={() => setIsRightDrawerOpen(true)}
                  className="p-1 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition cursor-pointer shadow-2xs"
                  title="Show project details"
                  aria-label="Show project details"
                >
                  <PanelRightOpen className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Subtabs: Chat | Overview | Deliverables | Milestones | Tasks | Files | Payments | Decisions | Activity | Meetings */}
          <div className="flex items-center justify-between mt-2 border-t border-slate-100/80 pt-1 text-xs font-semibold gap-3">
            <div className="flex items-center gap-4 sm:gap-5 overflow-x-auto scrollbar-none pb-0.5">
              {[
                { id: "chat", label: "Chat" },
                { id: "overview", label: "Overview" },
                { id: "deliverables", label: "Deliverables" },
                { id: "milestones", label: "Milestones" },
                { id: "tasks", label: "Tasks" },
                { id: "files", label: "Files" },
                { id: "payments", label: "Payments & Escrow" },
                { id: "decisions", label: "Decisions" },
                { id: "activity", label: "Activity" },
                { id: "meetings", label: "Meetings" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`pb-1.5 transition relative cursor-pointer shrink-0 whitespace-nowrap ${
                    activeTab === tab.id
                      ? "text-indigo-600 font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Extreme right: Mediated by Nexum AI */}
            <button
              type="button"
              onClick={onOpenMediationHelp}
              className="inline-flex items-center gap-1.5 pb-1.5 text-indigo-600 hover:text-indigo-700 font-semibold text-[11px] transition cursor-pointer hover:underline shrink-0"
              title="Learn how Nexum AI mediates every message"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden md:inline">Mediated by Nexum AI</span>
            </button>
          </div>
        </div>

        {/* Center Main Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: CHAT FEED */}
          {activeTab === "chat" && (
            <>
              {/* Timeline Items */}
              {timeline.map((item) => {
                if (item.type === "client_bubble") {
                  const isYou = item.senderName.includes("You");
                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col ${isYou ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1 text-[11px] font-bold text-slate-400">
                        <span>{item.senderName}</span>
                        <span>•</span>
                        <span>{item.timestamp}</span>
                      </div>
                      <div
                        className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                          isYou
                            ? "bg-[#4f46e5] text-white rounded-br-xs"
                            : "bg-white border border-slate-200/90 text-slate-900 rounded-bl-xs"
                        }`}
                      >
                        {item.bubbleText}
                      </div>
                    </div>
                  );
                }

                if (item.type === "freelancer_reply_card") {
                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 rounded-2xl border border-indigo-200 bg-white shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                          <Sparkles className="w-3 h-3 text-purple-500" />
                          <span>{item.badgeText}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">{item.timestamp}</span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {item.summaryText}
                      </p>

                      {item.rawMessage && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-mono text-slate-600">
                          &ldquo;{item.rawMessage}&rdquo;
                        </div>
                      )}

                      {item.metrics && (
                        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-purple-50/60 border border-purple-100 text-xs text-center font-bold">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-normal">Price</span>
                            <span className="text-purple-700 font-mono">{item.metrics.priceChange}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-normal">Schedule</span>
                            <span className="text-purple-700 font-mono">{item.metrics.scheduleChange}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-normal">Agreement</span>
                            <span className="text-purple-700 font-mono">{item.metrics.agreementVersion}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => setIsOriginalMsgModalOpen(true)}
                          className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                        >
                          {item.originalMessageLinkText || "View canonical record"}
                        </button>

                        <div className="flex items-center gap-2">
                          {item.actions?.secondaryLabel && (
                            <button
                              type="button"
                              onClick={() => handleCardAction(item.actions?.secondaryAction)}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                            >
                              {item.actions.secondaryLabel}
                            </button>
                          )}
                          {item.actions?.primaryLabel && (
                            <button
                              type="button"
                              onClick={() => handleCardAction(item.actions?.primaryAction)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-98"
                            >
                              {item.actions.primaryLabel}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (item.type === "draft_counteroffer_card") {
                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>{item.badgeText}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">{item.timestamp}</span>
                      </div>

                      <p className="text-xs text-slate-800 leading-relaxed font-medium">
                        {item.summaryText}
                      </p>

                      {item.counterofferDetails && (
                        <div className="p-3 rounded-xl bg-white border border-amber-200/80 space-y-1.5 text-xs">
                          <div className="font-bold text-slate-900">
                            {item.counterofferDetails.title}
                          </div>
                          <div className="flex items-center justify-between text-slate-600 text-[11px]">
                            <span>Offered Compensation: <strong className="text-emerald-700">{item.counterofferDetails.priceChange}</strong></span>
                            <span>Extension: <strong className="text-slate-800">{item.counterofferDetails.schedule}</strong></span>
                            <span className="text-rose-600 font-semibold">Expires: {item.counterofferDetails.expires}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-1 flex-wrap">
                        {item.actions?.tertiaryLabel && (
                          <button
                            type="button"
                            onClick={() => handleCardAction(item.actions?.tertiaryAction)}
                            className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
                          >
                            {item.actions.tertiaryLabel}
                          </button>
                        )}
                        {item.actions?.secondaryLabel && (
                          <button
                            type="button"
                            onClick={() => handleCardAction(item.actions?.secondaryAction)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
                          >
                            {item.actions.secondaryLabel}
                          </button>
                        )}
                        {item.actions?.primaryLabel && (
                          <button
                            type="button"
                            onClick={() => handleCardAction(item.actions?.primaryAction)}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-98"
                          >
                            {item.actions.primaryLabel}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }

                if (item.type === "agreement_comparison_card") {
                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{item.badgeText}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">{item.timestamp}</span>
                      </div>

                      <p className="text-xs text-slate-800 leading-relaxed font-medium">
                        {item.summaryText}
                      </p>

                      <div className="p-3 rounded-xl bg-white border border-emerald-200/80 text-xs font-mono text-slate-700 whitespace-pre-line">
                        {item.rawMessage}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        {item.actions?.secondaryLabel && (
                          <button
                            type="button"
                            onClick={() => handleCardAction(item.actions?.secondaryAction)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>{item.actions.secondaryLabel}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </button>
                        )}
                        {item.actions?.primaryLabel && (
                          <button
                            type="button"
                            onClick={() => handleCardAction(item.actions?.primaryAction)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-98"
                          >
                            {item.actions.primaryLabel}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }

                return null;
              })}

              <div ref={timelineEndRef} />
            </>
          )}

          {/* TAB: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* 1. Scope Summary Card */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Scope Summary & Consensus Objectives</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                    Agreement {selectedProject.agreementVersion}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Full-stack e-commerce storefront with dynamic product discovery, PayPal Orders v2 REST integration,
                  and bilateral escrow settlement rails. Dual SHA-256 state machines guarantee agreement stability and prevent unilateral change manipulation.
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["Next.js 16", "TypeScript", "Node.js", "PayPal REST v2", "PostgreSQL", "Tailwind CSS"].map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/80 text-[11px] font-semibold text-slate-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* 2. Key Contract Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Contract</span>
                  <div className="text-base font-black text-slate-900 font-mono">{selectedProject.budget}</div>
                  <span className="text-[10px] text-slate-400 block">100% Fixed Escrow</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Disbursed to You</span>
                  <div className="text-base font-black text-emerald-600 font-mono">$2,000.00 USD</div>
                  <span className="text-[10px] text-emerald-600 font-semibold block">Milestone 1 Released</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Locked in Escrow</span>
                  <div className="text-base font-black text-indigo-600 font-mono">$4,000.00 USD</div>
                  <span className="text-[10px] text-indigo-600 font-semibold block">Milestone 2 In Review</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Progress</span>
                  <div className="text-base font-black text-indigo-600 font-mono">60%</div>
                  <span className="text-[10px] text-slate-400 block">Target: Dec 15, 2026</span>
                </div>
              </div>

              {/* 3. Deliverable Roadmap Steps */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Active Deliverable Roadmap</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("milestones")}
                    className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View all milestones</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-2">
                  {[
                    { title: "Milestone 1: Project Architecture & PRD", status: "Accepted & Released ($2,000)", done: true, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
                    { title: "Milestone 2: Frontend & PayPal Orders Capture", status: "In Client Review ($4,000)", done: false, active: true, color: "text-amber-700 bg-amber-50 border-amber-200" },
                    { title: "Milestone 3: Admin Dashboard & Production Handover", status: "Queued / Upcoming ($4,000)", done: false, color: "text-slate-600 bg-slate-50 border-slate-200" },
                  ].map((step, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        {step.done ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : step.active ? (
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <span className={`font-semibold ${step.done ? "text-slate-700" : step.active ? "text-slate-900 font-bold" : "text-slate-500"}`}>
                          {step.title}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${step.color}`}>
                        {step.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Next Recommended Actions */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Recommended Next Actions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900 text-xs">Counteroffer v5 Pending Review</span>
                      <span className="text-[10px] text-amber-700 font-semibold font-mono">+$500</span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Alex Chen proposed +$500 for the CR-2 carousel component. Review diff against Agreement v3.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setReviewVersionTarget("Version 5");
                        setIsReviewModalOpen(true);
                      }}
                      className="text-xs font-bold text-indigo-700 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Review counteroffer now</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-900 text-xs">Milestone 2 In Review</span>
                      <span className="text-[10px] text-indigo-700 font-semibold font-mono">$4,000 held</span>
                    </div>
                    <p className="text-[11px] text-indigo-800">
                      PR #42 and Loom video submitted. Client has 72 hours for automated acceptance window.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab("deliverables")}
                      className="text-xs font-bold text-indigo-700 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Inspect deliverable status</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DELIVERABLES */}
          {activeTab === "deliverables" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Milestone Deliverables & Submissions
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verifiable work packages anchored to consensus consensus state.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSubmitDeliverableModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  + Submit Deliverable
                </button>
              </div>

              {/* Deliverable Card: Milestone 2 */}
              <div className="p-4 sm:p-5 rounded-2xl border border-indigo-200 bg-white shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-indigo-50 text-[#4f46e5] border border-indigo-100 mb-1">
                      Milestone 2 · $4,000.00 USD
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Frontend Development & PayPal Orders Capture
                    </h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>In Client Review</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GitHub Pull Request</span>
                    <a
                      href="https://github.com/techkart/storefront/pull/42"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-indigo-600 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <span>techkart/storefront#42</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Loom Demonstration</span>
                    <a
                      href="https://www.loom.com/share/techkart-milestone2-demo"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-indigo-600 font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <span>loom.com/share/techkart-milestone2-demo</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FILES */}
          {activeTab === "files" && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Project Files & Attachments
              </h3>
              <div className="space-y-2">
                {[
                  { name: "PRD_Specification_v3.pdf", size: "1.4 MB", date: "Oct 10, 2026", type: "PDF" },
                  { name: "CR-2_Category_Filter_Mockup.png", size: "3.2 MB", date: "Oct 28, 2026", type: "Image" },
                  { name: "Database_Schema_v2.sql", size: "18 KB", date: "Oct 24, 2026", type: "Code" },
                ].map((f, i) => (
                  <div key={i} className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between text-xs hover:border-indigo-500/40 transition shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] border border-indigo-100">
                        {f.type}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{f.name}</div>
                        <div className="text-[10px] text-slate-400">{f.size} · {f.date}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => showToast(`Downloading ${f.name}...`)}
                      className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: TASKS */}
          {activeTab === "tasks" && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Project Tasks
              </h3>
              <div className="space-y-2">
                {[
                  { title: "Review Alex's Counteroffer v5 on CR-2", due: "Nov 3", done: false },
                  { title: "Deliver Milestone 2 frontend integration tests", due: "Nov 15", done: true },
                  { title: "Sign canonical Agreement v3 SHA-256 hash", due: "Oct 10", done: true },
                ].map((t, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between text-xs shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      {t.done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-400" />
                      )}
                      <span className={t.done ? "line-through text-slate-400" : "font-semibold text-slate-800"}>
                        {t.title}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">Due {t.due}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: MILESTONES */}
          {activeTab === "milestones" && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Milestones & Escrow Schedule
              </h3>
              <div className="space-y-2.5">
                {selectedProject.milestones.map((m) => (
                  <div key={m.id} className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-2 text-xs shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{m.number}. {m.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.statusColor}`}>
                        {m.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>Due date: {m.dueDate}</span>
                      <span className="font-bold font-mono text-slate-800 text-xs">{m.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: PAYMENTS & ESCROW */}
          {activeTab === "payments" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Escrow & Payment Tracking</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Bilateral PayPal REST v2 escrow with cryptographic SHA-256 settlement receipts.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Escrow Active</span>
                </div>
              </div>

              {/* Balance Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Contract Escrow</span>
                  <div className="text-lg font-black text-slate-900 font-mono">{selectedProject.budget}</div>
                  <span className="text-[10px] text-slate-500 block">Agreed fixed scope</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Released to PayPal</span>
                  <div className="text-lg font-black text-emerald-600 font-mono">$2,000.00 USD</div>
                  <span className="text-[10px] text-emerald-600 font-semibold block">Milestone 1 Disbursed</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Locked in Escrow</span>
                  <div className="text-lg font-black text-indigo-600 font-mono">$4,000.00 USD</div>
                  <span className="text-[10px] text-indigo-600 font-semibold block">Milestone 2 Verified Capture</span>
                </div>
              </div>

              {/* Milestone Payments Table */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Milestone Disbursement Ledger
                </h4>

                <div className="divide-y divide-slate-100">
                  {/* Milestone 1: Released */}
                  <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">Milestone 1: UI/UX Design & Architecture</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Released
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        PayPal Order #4AB912048C881923K · Released Oct 18, 2026
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono font-bold text-slate-900 text-sm">$2,000.00</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTxForProof({
                            milestoneTitle: "Milestone 1: UI/UX Design & Architecture",
                            amount: "$2,000.00 USD",
                            receiptNumber: "NX-PAY-2026-8912",
                            orderId: "4AB912048C881923K",
                            captureId: "8GH739219K001294A",
                            proofHash: "0x9f8c2b7e53a104bc8d7e6f1a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c",
                            paymentRail: "PayPal Sandbox REST v2 Bilateral Escrow Rail",
                            status: "Released & Disbursed",
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-indigo-600 font-bold text-[11px] transition shadow-2xs cursor-pointer flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3 text-indigo-600" />
                        <span>Proof receipt</span>
                      </button>
                    </div>
                  </div>

                  {/* Milestone 2: Locked */}
                  <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">Milestone 2: Frontend & PayPal Orders Capture</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Locked in Escrow
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        PayPal Order #9XZ410294M771021B · Pre-funded & Locked
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono font-bold text-slate-900 text-sm">$4,000.00</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab("deliverables")}
                        className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/60 text-indigo-700 font-bold text-[11px] transition shadow-2xs cursor-pointer"
                      >
                        View Deliverable
                      </button>
                    </div>
                  </div>

                  {/* Milestone 3: Pending */}
                  <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">Milestone 3: Admin Dashboard & Production Handover</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          Pending Funding
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Due Dec 15, 2026 · Escrow funding required prior to commencement
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono font-bold text-slate-400 text-sm">$4,000.00</span>
                      <span className="text-[11px] text-slate-400">Scheduled</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DECISIONS */}
          {activeTab === "decisions" && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Mutual Consensus Record
              </h3>
              <div className="p-4 rounded-2xl border border-slate-200/80 bg-white space-y-3 text-xs shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-800">Agreement v3 (Active)</span>
                  <span className="text-emerald-700 font-mono text-[11px]">hash: 0x9f8c2b7e...</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Dual-approval finalized between Alex Chen (Client) and Sambit Kumar (Freelancer). Baseline $10,000 USD escrow funded.
                </p>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-[11px] flex items-center justify-between">
                  <span>Pending Decision: Alex Chen Counteroffer v5 (+$500).</span>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewVersionTarget("Version 5");
                      setIsReviewModalOpen(true);
                    }}
                    className="font-bold text-indigo-700 hover:underline cursor-pointer"
                  >
                    Review v5 →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ACTIVITY & AUDIT LOG */}
          {activeTab === "activity" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <History className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Project Audit Log & Consensus Activity</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cryptographic consensus event history, milestone approvals, and state machine transitions.
                  </p>
                </div>
                <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                  LEDGER: 0x9f8c2b7e
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {[
                    {
                      id: "act-1",
                      title: "Counteroffer v5 Received for CR-2",
                      description: "Alex Chen proposed +$500 with unchanged +4 days schedule for carousel feature.",
                      actor: "Alex Chen (Client)",
                      time: "Today, 10:31 AM",
                      icon: MessageSquare,
                      color: "text-indigo-600 bg-indigo-50 border-indigo-200",
                      badge: "Under Review",
                    },
                    {
                      id: "act-2",
                      title: "Milestone 2 Deliverable Submitted",
                      description: "Frontend repository pull request #42 and Loom video walkthrough recorded to consensus.",
                      actor: "Sambit Kumar (Freelancer)",
                      time: "Nov 14, 2026, 2:40 PM",
                      icon: UploadCloud,
                      color: "text-amber-600 bg-amber-50 border-amber-200",
                      badge: "In Client Review",
                    },
                    {
                      id: "act-3",
                      title: "PayPal Escrow Pre-Funding Confirmed",
                      description: "Bilateral escrow capture confirmed for $4,000.00 USD via PayPal Sandbox Orders v2.",
                      actor: "Nexum Automated Settlement",
                      time: "Nov 12, 2026, 9:15 AM",
                      icon: CreditCard,
                      color: "text-indigo-600 bg-indigo-50 border-indigo-200",
                      badge: "Escrow Locked",
                    },
                    {
                      id: "act-4",
                      title: "Milestone 1 Accepted & Released",
                      description: "Alex Chen approved Milestone 1. $2,000.00 USD payout disbursed to freelancer PayPal account.",
                      actor: "Alex Chen (Client)",
                      time: "Oct 18, 2026, 11:30 AM",
                      icon: CheckCircle2,
                      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
                      badge: "Completed",
                    },
                    {
                      id: "act-5",
                      title: "Agreement v3 Canonical Ratification",
                      description: "Dual SHA-256 agreement baseline anchored between Alex Chen and Sambit Kumar for $10,000 USD.",
                      actor: "Consensus Engine",
                      time: "Oct 10, 2026, 10:00 AM",
                      icon: FileCheck,
                      color: "text-purple-600 bg-purple-50 border-purple-200",
                      badge: "Baseline Active",
                    },
                  ].map((ev) => {
                    const Icon = ev.icon;
                    return (
                      <div key={ev.id} className="relative group text-xs">
                        <div className={`absolute -left-6 top-0 w-6 h-6 rounded-full border flex items-center justify-center -translate-x-1/2 ${ev.color} shadow-2xs`}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold text-slate-900">{ev.title}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{ev.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">{ev.description}</p>
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="text-[10px] text-slate-400">Actor: {ev.actor}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] font-bold text-slate-600">{ev.badge}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: MEETINGS */}
          {activeTab === "meetings" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Scheduled Sync Calls</h3>
                <button
                  type="button"
                  onClick={() => setIsProposeMeetingModalOpen(true)}
                  className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  + Propose Meeting
                </button>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200/80 bg-white space-y-2 text-xs shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-900">Sprint Review with Alex Chen</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Confirmed
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Today, 5:00 PM – 5:30 PM (Google Meet) · Discussing Milestone 2 capture & CR-2 approval.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Message Composer (Bottom - Deto Same as Client from Image 2) */}
        <div className="border-t border-slate-200/80 bg-white p-3 sm:p-3.5 shrink-0 shadow-2xs">
          <form onSubmit={handleSendMessage}>
            <div className="relative rounded-2xl border border-slate-200/90 bg-slate-50/60 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 p-2.5 transition-all shadow-2xs">
              <textarea
                rows={2}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  composerMode === "mediated"
                    ? `Message ${selectedProject.clientName}... (Nexum AI verifies scope & price before delivery)`
                    : `Ask Nexum AI privately about ${selectedProject.shortName}... (private to you)`
                }
                className="w-full text-xs sm:text-[13px] text-slate-900 placeholder:text-slate-400 bg-transparent resize-none focus:outline-none p-1 leading-relaxed"
              />

              {/* Bottom bar of input */}
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-100/80 mt-1 gap-2">
                <div className="flex items-center gap-1.5 text-slate-500 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => showToast("File attachment selector opened.")}
                    className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-500 transition cursor-pointer shrink-0"
                    title="Attach file"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => showToast("File share dialog opened.")}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-200/60 transition cursor-pointer shrink-0"
                  >
                    Share file
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSubmitDeliverableModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition cursor-pointer shrink-0 font-bold"
                  >
                    + Submit deliverable
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsProposeMeetingModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-200/60 transition cursor-pointer shrink-0"
                  >
                    Propose meeting
                  </button>

                  {hasScopeOrPriceKeywords && (
                    <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/70 shrink-0">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      <span>Review required</span>
                    </span>
                  )}
                </div>

                {/* Right side: Compact Mode Switcher + Send button */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="p-0.5 rounded-xl bg-slate-100 border border-slate-200/70 inline-flex items-center gap-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setComposerMode("mediated")}
                      title={`Message ${selectedProject.clientName} (Mediated via Nexum AI)`}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1 ${
                        composerMode === "mediated"
                          ? "bg-white text-indigo-700 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <span>Via Nexum</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setComposerMode("private_ai")}
                      title="Ask Nexum AI privately (Clients never see this)"
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1 ${
                        composerMode === "private_ai"
                          ? "bg-white text-indigo-700 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      <span>Private AI</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!messageInput.trim() || isSending}
                    className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition cursor-pointer shadow-xs shrink-0"
                    title={composerMode === "mediated" ? "Send message (Enter)" : "Ask Nexum AI (Enter)"}
                  >
                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* ==============================================================
          RIGHT COLUMN: PROJECT OVERVIEW PANEL (Deto Same as Client)
         ============================================================== */}
      {isRightDrawerOpen ? (
        <aside className="w-[290px] lg:w-[310px] shrink-0 bg-white p-4 sm:p-5 space-y-4 overflow-y-auto shadow-2xs animate-in fade-in slide-in-from-right-3 duration-150">
          {/* Panel Header & Collapse Toggle */}
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Project Details
            </span>
            <button
              type="button"
              onClick={() => setIsRightDrawerOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Hide details (gives chat more space)"
              aria-label="Hide details"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          </div>

          {/* 1. Project Overview Card */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Overview
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 whitespace-nowrap shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>In progress</span>
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Client</span>
                <span className="font-semibold text-slate-900">{selectedProject.clientName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Company</span>
                <span className="font-semibold text-slate-900">{selectedProject.clientCompany}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Budget</span>
                <span className="font-semibold text-slate-900 font-mono">{selectedProject.budget}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Duration</span>
                <span className="font-semibold text-slate-900">{selectedProject.duration}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Start date</span>
                <span className="text-slate-800">{selectedProject.startDate}</span>
              </div>
              <div className="flex justify-between py-1 items-center">
                <span className="text-slate-400">Agreement</span>
                <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 font-mono text-[11px]">
                  {selectedProject.agreementVersion} active
                </span>
              </div>
            </div>
          </div>

          {/* 2. Needs Your Decision Card */}
          {selectedProject.decisionRequired && (
            <div className="p-4.5 rounded-2xl border border-amber-200/90 bg-amber-50/50 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                {selectedProject.decisionRequired.title}
              </h3>
              <p className="text-xs text-amber-900/90 leading-relaxed font-medium">
                {selectedProject.decisionRequired.description}
              </p>
              <button
                type="button"
                onClick={() => {
                  setReviewVersionTarget(selectedProject.decisionRequired?.version || "Version 5");
                  setIsReviewModalOpen(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer text-center"
              >
                {selectedProject.decisionRequired.actionLabel}
              </button>
            </div>
          )}

          {/* 3. Milestones Card */}
          <div className="p-4.5 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Milestones
              </h3>
              <button
                type="button"
                onClick={() => setIsSubmitDeliverableModalOpen(true)}
                className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                + Submit
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {selectedProject.milestones.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-b-0">
                  <div>
                    <div className="font-bold text-slate-900">
                      {m.number}. {m.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {m.amount} · {m.dueDate}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.statusColor}`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>

            {selectedProject.paymentNote && (
              <p className="text-[10px] text-slate-400 leading-relaxed pt-1.5 border-t border-slate-100">
                {selectedProject.paymentNote}
              </p>
            )}
          </div>

          {/* 4. Upcoming Card */}
          {selectedProject.upcomingMeeting && (
            <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-2 text-xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Upcoming
              </h3>
              <div className="flex items-center justify-between gap-2 pt-1">
                <div>
                  <div className="font-bold text-slate-900">{selectedProject.upcomingMeeting.title}</div>
                  <div className="text-[11px] text-slate-500">{selectedProject.upcomingMeeting.time}</div>
                </div>
                <button
                  type="button"
                  onClick={() => showToast("Launching video meeting room...")}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 font-bold text-slate-800 text-xs transition cursor-pointer shadow-2xs"
                >
                  Join
                </button>
              </div>
            </div>
          )}
        </aside>
      ) : (
        <button
          type="button"
          onClick={() => setIsRightDrawerOpen(true)}
          className="w-8 shrink-0 border-l border-slate-200/80 bg-white hover:bg-slate-50 flex flex-col items-center justify-center gap-2.5 text-slate-400 hover:text-indigo-600 transition cursor-pointer shadow-2xs group py-4 select-none"
          title="Show project details"
        >
          <PanelRightOpen className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          <span className="[writing-mode:vertical-rl] text-[10px] font-bold tracking-wider uppercase text-slate-400 group-hover:text-slate-700">
            Details
          </span>
        </button>
      )}

      {/* ==============================================================
          MODALS
         ============================================================== */}
      <ReviewVersionModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        versionName={reviewVersionTarget}
        onApproveVersion={() => {
          showToast(`Agreement ${reviewVersionTarget} approved & sealed on consensus ledger!`);
        }}
      />

      <ReadOriginalMessageModal
        isOpen={isOriginalMsgModalOpen}
        onClose={() => setIsOriginalMsgModalOpen(false)}
        rawMessage="Hey Alex, I checked the request for the best-selling products carousel with dynamic category pills. It requires an additional database query index and 2 custom components. I can do it for an additional $600 and 4 days on the timeline. Let me know if that works for you."
        senderName="Sambit Kumar (You)"
        timestamp="Oct 28, 2026 · 10:24 AM"
      />

      <ProposeMeetingModal
        isOpen={isProposeMeetingModalOpen}
        onClose={() => setIsProposeMeetingModalOpen(false)}
        freelancerName={selectedProject.clientName}
      />

      <SubmitDeliverableModal
        isOpen={isSubmitDeliverableModalOpen}
        onClose={() => setIsSubmitDeliverableModalOpen(false)}
        onSubmitSuccess={({ prUrl }) => {
          showToast("Milestone 2 deliverable logged to consensus!");
          const delivItem: TimelineItem = {
            id: `deliv_${Date.now()}`,
            type: "agreement_comparison_card",
            senderName: "Nexum AI Consensus Engine",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            badgeText: "Deliverable Submitted",
            badgeType: "green",
            summaryText: `You submitted Pull Request: ${prUrl}. Automated SHA-256 pre-checks verified.`,
            actions: {
              primaryLabel: "Update Submission",
              primaryAction: "submit_deliverable",
            },
          };
          setTimeline((prev) => [...prev, delivItem]);
        }}
      />

      {/* Proof of Settlement Receipt Modal */}
      {selectedTxForProof && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 p-6 text-slate-900 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
                  Receipt: {selectedTxForProof.receiptNumber}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  Verifiable Settlement Evidence
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTxForProof(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Payout</span>
                <span className="text-xl font-extrabold text-slate-900 font-mono">
                  {selectedTxForProof.amount}
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {selectedTxForProof.status}
              </span>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">PayPal Order ID</span>
                <span className="font-bold text-slate-900 text-xs mt-0.5 block">{selectedTxForProof.orderId}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">PayPal Capture ID</span>
                <span className="font-bold text-slate-900 text-xs mt-0.5 block">{selectedTxForProof.captureId}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Dual SHA-256 Proof Hash</span>
                <span className="font-bold text-indigo-600 text-[11px] mt-0.5 block break-all">
                  {selectedTxForProof.proofHash}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Payment Rail & Processor</span>
                <span className="font-semibold text-slate-800 text-xs mt-0.5 block">{selectedTxForProof.paymentRail}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  showToast(`Downloaded verifiable PDF receipt for ${selectedTxForProof.receiptNumber}.`);
                  setSelectedTxForProof(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF Receipt</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTxForProof(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
