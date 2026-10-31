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
  ShieldCheck,
  ExternalLink,
  PanelRightClose,
  PanelRightOpen,
  MessageSquare,
} from "lucide-react";
import {
  WorkspaceProject,
  TimelineItem,
} from "@/lib/workspace-types";
import {
  INITIAL_WORKSPACE_PROJECTS,
  INITIAL_TIMELINE_TECHKART,
} from "@/lib/workspace-data";
import ReviewVersionModal from "./ReviewVersionModal";
import ReadOriginalMessageModal from "./ReadOriginalMessageModal";
import ProposeMeetingModal from "./ProposeMeetingModal";

interface WorkspaceChatsModeProps {
  onSwitchToAIMode: (projectScope?: string) => void;
  onOpenMediationHelp: () => void;
  isStandalone?: boolean;
}

export default function WorkspaceChatsMode({
  onSwitchToAIMode,
  onOpenMediationHelp,
  isStandalone = false,
}: WorkspaceChatsModeProps) {
  // Projects & Active Selection
  const [projects] = useState<WorkspaceProject[]>(INITIAL_WORKSPACE_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("techkart");
  const [filterType, setFilterType] = useState<"all" | "unread">("all");
  const [searchFilter, setSearchFilter] = useState("");

  // Timeline & Messages
  const [timeline, setTimeline] = useState<TimelineItem[]>(INITIAL_TIMELINE_TECHKART);
  const [activeTab, setActiveTab] = useState<"chat" | "files" | "tasks" | "milestones" | "decisions" | "meetings">("chat");

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
  const [reviewVersionTarget, setReviewVersionTarget] = useState("Version 4");

  const timelineEndRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const selectedProject =
    projects.find((p) => p.id === selectedProjectId) || projects[0];

  // Auto scroll to latest in timeline
  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [timeline]);

  // Check if input contains scope / price keywords
  const hasScopeOrPriceKeywords =
    /(\$|price|quote|scope|cost|fee|budget|timeline|delay|discount|reduce|counteroffer)/i.test(
      messageInput
    );

  // Send message handler
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = messageInput.trim();
    if (!text || isSending) return;

    if (composerMode === "private_ai") {
      // If user is in private AI mode in this composer, route to AI mode
      onSwitchToAIMode(selectedProject.shortName);
      return;
    }

    setIsSending(true);
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // 1. Add client message
    const clientMsg: TimelineItem = {
      id: `msg_${Date.now()}`,
      type: "client_bubble",
      senderName: "You",
      timestamp: nowTime,
      bubbleText: text,
    };

    setTimeline((prev) => [...prev, clientMsg]);
    setMessageInput("");

    // 2. If it's a scope/price change, Nexum generates a Draft Mediation Card
    setTimeout(() => {
      if (hasScopeOrPriceKeywords) {
        const draftCard: TimelineItem = {
          id: `draft_${Date.now()}`,
          type: "draft_counteroffer_card",
          senderName: "Nexum AI",
          timestamp: nowTime,
          badgeText: "Draft, not sent yet",
          badgeType: "gray",
          summaryText: `Nexum reviewed your message regarding "${text.slice(0, 45)}...". Scope and price adjustments require client verification before being delivered to ${selectedProject.freelancerName}.`,
          counterofferDetails: {
            title: `v${parseInt(selectedProject.agreementVersion.replace(/\D/g, "") || "4") + 1} · Proposed Amendment`,
            priceChange: text.includes("500") ? "+$500" : "Adjusted scope delta",
            schedule: "+4 days, pending freelancer acknowledgment",
            expires: "Nov 5, 2026",
          },
          actions: {
            primaryLabel: `Send to ${selectedProject.freelancerName.split(" ")[0]}`,
            primaryAction: "send_counteroffer",
            secondaryLabel: "Edit",
            secondaryAction: "edit_counteroffer",
            tertiaryLabel: "Approve current version instead",
            tertiaryAction: "approve_current",
          },
        };
        setTimeline((prev) => [...prev, draftCard]);
        showToast("Nexum AI drafted a structured mediation card. Review before delivery.");
      } else {
        // Standard question mediated delivery
        const deliveryNotice: TimelineItem = {
          id: `notice_${Date.now()}`,
          type: "sent_to_freelancer_card",
          senderName: "Nexum AI",
          timestamp: nowTime,
          badgeText: `Sent to ${selectedProject.freelancerName.split(" ")[0]}`,
          badgeType: "green",
          summaryText: `Delivered to ${selectedProject.freelancerName} with linked project brief. Original wording kept intact.`,
          originalMessageLinkText: "View delivery receipt and SHA-256 seal",
        };
        setTimeline((prev) => [...prev, deliveryNotice]);
        showToast(`Message delivered to ${selectedProject.freelancerName}.`);
      }
      setIsSending(false);
    }, 700);
  };

  // Handle counteroffer action (Send to Sambit)
  const handleExecuteCardAction = (item: TimelineItem, actionKey?: string) => {
    if (actionKey === "send_counteroffer") {
      const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setTimeline((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? {
                ...it,
                type: "sent_to_freelancer_card",
                timestamp: nowTime,
                badgeText: `Sent to ${selectedProject.freelancerName.split(" ")[0]}`,
                badgeType: "green",
                summaryText: `Counteroffer sent to ${selectedProject.freelancerName}. Awaiting his mutual verification.`,
                actions: undefined,
              }
            : it
        )
      );
      showToast(`Counteroffer delivered to ${selectedProject.freelancerName}!`);
    } else if (actionKey === "review_v4") {
      setReviewVersionTarget("Version 4");
      setIsReviewModalOpen(true);
    } else if (actionKey === "ask_question") {
      setMessageInput(`Regarding quote v4 for ${selectedProject.freelancerName}: `);
    } else if (actionKey === "approve_v4_instead" || actionKey === "approve_current") {
      setReviewVersionTarget("Version 4");
      setIsReviewModalOpen(true);
    } else if (actionKey === "edit_counteroffer") {
      setMessageInput(`Could we revise the counteroffer to $450 with same delivery timeline?`);
      showToast("Edit text loaded in composer.");
    }
  };

  // Total unread messages across projects
  const totalUnreadCount = projects.reduce((acc, p) => acc + (p.unreadCount || 0), 0);

  // Filter conversations
  const filteredProjects = projects.filter((p) => {
    if (filterType === "unread") {
      if (!p.unreadCount || p.unreadCount === 0) return false;
    }
    if (!searchFilter) return true;
    return (
      p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.freelancerName.toLowerCase().includes(searchFilter.toLowerCase())
    );
  });

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-50/50 select-none">
      {/* ==============================================================
          LEFT COLUMN: CONVERSATION LIST (Approx 280–300px)
         ============================================================== */}
      <aside className="w-[280px] lg:w-[300px] shrink-0 border-r border-slate-200/80 bg-white flex flex-col justify-between h-full overflow-hidden shadow-2xs">
        
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
                      3
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => window.open("/client/workspace?mode=chats&standalone=true", "_blank")}
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

        {/* Conversation List */}
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
                    {p.freelancerName} (Freelancer)
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

        {/* Bottom CTA Button: Ask Nexum AI about all projects */}
        <div className="p-3 border-t border-slate-200/70 bg-white">
          <button
            type="button"
            onClick={() => onSwitchToAIMode("All my projects")}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-50/90 via-white to-purple-50/90 hover:from-indigo-100/70 hover:to-purple-100/70 border border-indigo-200/70 text-indigo-700 text-xs font-bold transition shadow-2xs cursor-pointer group"
          >
            <Sparkles className="w-4 h-4 text-indigo-600 group-hover:rotate-12 transition-transform" />
            <span>Ask Nexum AI about all projects</span>
          </button>
        </div>

      </aside>

      {/* ==============================================================
          CENTRE COLUMN: ACTIVE PROJECT CHAT & TIMELINE
         ============================================================== */}
      <main className="flex-1 flex flex-col min-w-0 border-r border-slate-200/80 bg-slate-50/40 overflow-hidden">
        
        {/* Project Header - Compact & Sleek */}
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

              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight truncate">
                  {selectedProject.name}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Active</span>
                </span>
                <span className="text-slate-300 hidden sm:inline">·</span>
                <span className="text-xs text-slate-500 hidden sm:inline truncate">
                  with {selectedProject.freelancerName}
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

          {/* Subtabs: Chat | Files | Tasks | Milestones | Decisions | Meetings + Mediated by Nexum AI on extreme right */}
          <div className="flex items-center justify-between mt-2 border-t border-slate-100/80 pt-1 text-xs font-semibold">
            <div className="flex items-center gap-5">
              {[
                { id: "chat", label: "Chat" },
                { id: "files", label: "Files" },
                { id: "tasks", label: "Tasks" },
                { id: "milestones", label: "Milestones" },
                { id: "decisions", label: "Decisions" },
                { id: "meetings", label: "Meetings" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`pb-1.5 transition relative cursor-pointer ${
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

            {/* Extreme right of Meetings: Mediated by Nexum AI */}
            <button
              type="button"
              onClick={onOpenMediationHelp}
              className="inline-flex items-center gap-1.5 pb-1.5 text-indigo-600 hover:text-indigo-700 font-semibold text-[11px] transition cursor-pointer hover:underline shrink-0"
              title="Learn how Nexum AI mediates every message"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Mediated by Nexum AI</span>
            </button>
          </div>
        </div>

        {/* Center Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {activeTab === "chat" && (
            <>
              {timeline.map((item) => {
                // CARD TYPE A: Freelancer reply mediation card
                if (item.type === "freelancer_reply_card") {
                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-4 animate-in fade-in duration-200"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Nexum AI · {item.timestamp}</span>
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                          {item.badgeText}
                        </span>
                      </div>

                      <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">
                        {item.summaryText}
                      </p>

                      {/* 3 Metrics Box */}
                      {item.metrics && (
                        <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs">
                          <div>
                            <div className="font-extrabold text-slate-900 text-sm">
                              {item.metrics.priceChange}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                              Price change
                            </div>
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-sm">
                              {item.metrics.scheduleChange}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                              Schedule change
                            </div>
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-sm">
                              {item.metrics.agreementVersion}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                              Agreement version
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
                        {item.actions?.primaryLabel && (
                          <button
                            type="button"
                            onClick={() => handleExecuteCardAction(item, item.actions?.primaryAction)}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                          >
                            {item.actions.primaryLabel}
                          </button>
                        )}
                        {item.actions?.secondaryLabel && (
                          <button
                            type="button"
                            onClick={() => handleExecuteCardAction(item, item.actions?.secondaryAction)}
                            className="px-3.5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
                          >
                            {item.actions.secondaryLabel}
                          </button>
                        )}
                        {item.originalMessageLinkText && (
                          <button
                            type="button"
                            onClick={() => setIsOriginalMsgModalOpen(true)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer pl-1 transition"
                          >
                            {item.originalMessageLinkText}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }

                // CARD TYPE B: Client message bubble
                if (item.type === "client_bubble") {
                  return (
                    <div key={item.id} className="flex flex-col items-end space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium pr-1">
                        You · {item.timestamp}
                      </span>
                      <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-xs bg-indigo-600 text-white text-xs sm:text-[13px] leading-relaxed shadow-xs font-normal">
                        {item.bubbleText}
                      </div>
                    </div>
                  );
                }

                // CARD TYPE C: Draft counteroffer mediation card
                if (item.type === "draft_counteroffer_card") {
                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-3.5 animate-in fade-in duration-200"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Nexum AI · {item.timestamp}</span>
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {item.badgeText}
                        </span>
                      </div>

                      <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">
                        {item.summaryText}
                      </p>

                      {/* Counteroffer Spec Box */}
                      {item.counterofferDetails && (
                        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-2 text-xs">
                          <div className="flex justify-between py-0.5 border-b border-slate-100">
                            <span className="text-slate-400">Counteroffer</span>
                            <span className="font-bold text-slate-900">{item.counterofferDetails.title}</span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-slate-100">
                            <span className="text-slate-400">Price change</span>
                            <span className="font-bold text-indigo-600">{item.counterofferDetails.priceChange}</span>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-slate-100">
                            <span className="text-slate-400">Schedule</span>
                            <span className="text-slate-800 font-medium">{item.counterofferDetails.schedule}</span>
                          </div>
                          <div className="flex justify-between py-0.5">
                            <span className="text-slate-400">Expires</span>
                            <span className="text-slate-800 font-mono">{item.counterofferDetails.expires}</span>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {item.actions?.primaryLabel && (
                          <button
                            type="button"
                            onClick={() => handleExecuteCardAction(item, item.actions?.primaryAction)}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                          >
                            {item.actions.primaryLabel}
                          </button>
                        )}
                        {item.actions?.secondaryLabel && (
                          <button
                            type="button"
                            onClick={() => handleExecuteCardAction(item, item.actions?.secondaryAction)}
                            className="px-3.5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
                          >
                            {item.actions.secondaryLabel}
                          </button>
                        )}
                        {item.actions?.tertiaryLabel && (
                          <button
                            type="button"
                            onClick={() => handleExecuteCardAction(item, item.actions?.tertiaryAction)}
                            className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer pl-1 transition"
                          >
                            {item.actions.tertiaryLabel}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }

                // CARD TYPE D: Sent to freelancer confirmation
                if (item.type === "sent_to_freelancer_card") {
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 text-xs text-slate-800 space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{item.badgeText} · {item.timestamp}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 font-bold bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200/60 shadow-2xs">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>SHA-256 Verified ✓</span>
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed pl-5.5">{item.summaryText}</p>
                    </div>
                  );
                }

                return null;
              })}
              <div ref={timelineEndRef} />
            </>
          )}

          {/* FILES TAB */}
          {activeTab === "files" && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Project Files & Attachments</h3>
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

          {/* TASKS TAB */}
          {activeTab === "tasks" && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Project Tasks</h3>
              <div className="space-y-2">
                {[
                  { title: "Review best-selling product section quote (v4)", due: "Nov 3", done: false },
                  { title: "Complete category indexing for search query", due: "Nov 10", done: false },
                  { title: "Sign agreement v3 canonical hash", due: "Oct 10", done: true },
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

          {/* MILESTONES TAB */}
          {activeTab === "milestones" && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Milestone Breakdown</h3>
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

          {/* DECISIONS TAB */}
          {activeTab === "decisions" && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Mutual Consensus Record</h3>
              <div className="p-4 rounded-2xl border border-slate-200/80 bg-white space-y-3 text-xs shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-800">Agreement v3 (Active)</span>
                  <span className="text-emerald-700 font-mono text-[11px]">hash: 0x9f8c2b7e...</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Dual-approval finalized between Alex Rivera (Client) and Sambit Kumar (Freelancer). Baseline $8,000.
                </p>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-[11px]">
                  Pending Decision: Quote v4 (CR-2) awaiting client approval.
                </div>
              </div>
            </div>
          )}

          {/* MEETINGS TAB */}
          {activeTab === "meetings" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Scheduled Meetings</h3>
                <button
                  type="button"
                  onClick={() => setIsProposeMeetingModalOpen(true)}
                  className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  + Propose Meeting
                </button>
              </div>

              <div className="p-4 rounded-2xl border border-indigo-100 bg-[#fbfbfe] flex items-center justify-between text-xs shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Project review meeting</div>
                    <div className="text-[11px] text-slate-500">Today, 5:00 – 5:30 PM (Google Meet / Zoom)</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => showToast("Opening video conference room...")}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Join
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Message Composer (Bottom) */}
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
                    ? `Message ${selectedProject.freelancerName}... (Nexum AI verifies scope & price before delivery)`
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
                    onClick={() => showToast("Task creation dialog opened.")}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-200/60 transition cursor-pointer shrink-0"
                  >
                    Create task
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
                      title={`Message ${selectedProject.freelancerName} (Mediated via Nexum AI)`}
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
                      title="Ask Nexum AI privately (Freelancers never see this)"
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
          RIGHT COLUMN: PROJECT OVERVIEW PANEL (Approx 290–310px)
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
                <span className="text-slate-400">Freelancer</span>
                <span className="font-semibold text-slate-900">{selectedProject.freelancerName}</span>
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

          {/* 2. Needs Your Decision Card (Amber/Yellow Card) */}
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
                  setReviewVersionTarget(selectedProject.decisionRequired?.version || "Version 4");
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
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Milestones
            </h3>

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

      {/* Review Version Modal */}
      <ReviewVersionModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        versionName={reviewVersionTarget}
        onApproveVersion={(ver) => {
          showToast(`Agreement version ${ver} mutually approved! Hash updated.`);
        }}
        onOpenCounteroffer={() => {
          setMessageInput("I would like to propose a counteroffer of $500 for CR-2.");
          showToast("Counteroffer drafted in composer.");
        }}
      />

      {/* Read Original Message Modal */}
      <ReadOriginalMessageModal
        isOpen={isOriginalMsgModalOpen}
        onClose={() => setIsOriginalMsgModalOpen(false)}
        senderName={selectedProject.freelancerName}
      />

      {/* Propose Meeting Modal */}
      <ProposeMeetingModal
        isOpen={isProposeMeetingModalOpen}
        onClose={() => setIsProposeMeetingModalOpen(false)}
        freelancerName={selectedProject.freelancerName}
        onScheduleMeeting={(m) => {
          showToast(`Meeting proposed to ${selectedProject.freelancerName} for ${m.date} at ${m.time}.`);
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2.5 rounded-full text-xs font-semibold shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
