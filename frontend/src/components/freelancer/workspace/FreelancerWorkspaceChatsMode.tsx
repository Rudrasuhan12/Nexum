"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Search,
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
  MessageSquare,
  CreditCard,
  FileText,
  ShieldCheck,
  History,
  Download,
  X,
  Plus,
} from "lucide-react";
import { TimelineItem } from "@/lib/workspace-types";
import { FreelancerWorkspaceProject } from "@/lib/freelancer-workspace-data";
import { useAuth } from "@/context/AuthContext";
import ReviewVersionModal from "@/components/client/workspace/ReviewVersionModal";
import ReadOriginalMessageModal from "@/components/client/workspace/ReadOriginalMessageModal";
import ProposeMeetingModal from "@/components/client/workspace/ProposeMeetingModal";
import SubmitDeliverableModal from "./SubmitDeliverableModal";
import {
  fetchConversations,
  fetchConversationMessages,
  sendMessage,
  confirmMessage,
  fetchOriginalMessage,
  fetchConversationContext,
  updateProjectTask,
  createProjectTask,
  proposeProjectMeeting,
  respondMeeting,
  fetchProjectActivity,
} from "@/lib/api-client";

interface FreelancerWorkspaceChatsModeProps {
  onSwitchToAIMode: (projectScope?: string) => void;
  onOpenMediationHelp: () => void;
  isStandalone?: boolean;
}

function mapApiMessageToTimelineItem(
  m: any,
  currentUserId?: string,
  defaultClientName?: string
): TimelineItem {
  const timeStr = m.createdAt
    ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Just now";

  // 1. Scope change / price amendment / quote card
  if (
    m.cardType === "SCOPE_CHANGE" ||
    m.messageClass === "SCOPE_CHANGE" ||
    m.requiresConfirmation
  ) {
    const payload = m.cardPayload || {};
    return {
      id: m.id,
      type: "freelancer_reply_card",
      senderName: "Nexum AI Scope Engine",
      timestamp: timeStr,
      badgeText: payload.badgeText || "Mediated Scope Amendment Draft",
      badgeType: "purple",
      summaryText:
        m.summaryText ||
        payload.summary ||
        m.originalBody ||
        "Scope adjustment detected: Formatted as Agreement Amendment.",
      rawMessage: m.originalBody,
      metrics: {
        priceChange:
          payload.priceChange ||
          (payload.priceChangeMinor ? `+$${(payload.priceChangeMinor / 100).toFixed(0)}` : "+$0"),
        scheduleChange:
          payload.scheduleChange ||
          (payload.scheduleChangeDays ? `+${payload.scheduleChangeDays} days` : "+0 days"),
        agreementVersion: payload.agreementVersion || "Amendment Draft",
      },
      actions: {
        primaryLabel: m.requiresConfirmation ? "Confirm & Send to Client" : "Review Draft Amendment",
        primaryAction: m.requiresConfirmation ? `confirm_${m.id}` : "review_version",
        secondaryLabel: "Ask Nexum AI",
        secondaryAction: "ask_question",
      },
      originalMessageLinkText: "View canonical record",
    };
  }

  // 2. Client Counteroffer
  if (m.cardType === "COUNTEROFFER" || m.messageClass === "COUNTEROFFER") {
    const payload = m.cardPayload || {};
    return {
      id: m.id,
      type: "draft_counteroffer_card",
      senderName: "Nexum Consensus Engine",
      timestamp: timeStr,
      badgeText: "Client Counteroffer Pending",
      badgeType: "amber",
      summaryText: m.summaryText || m.originalBody,
      counterofferDetails: {
        title: payload.title || "Client Counteroffer Pending",
        priceChange: payload.priceChange || "+$0",
        schedule: payload.schedule || "+0 days",
        expires: payload.expires || "Open for review",
      },
      actions: {
        primaryLabel: "Review Counteroffer",
        primaryAction: "review_version",
        secondaryLabel: "Draft Counter-Quote",
        secondaryAction: "counter_quote",
        tertiaryLabel: "Decline",
        tertiaryAction: "decline_offer",
      },
    };
  }

  // 3. Regular chat bubble
  const isFromSelf = (currentUserId && m.senderId === currentUserId) || m.isSelf;

  return {
    id: m.id,
    type: "client_bubble",
    senderName: isFromSelf ? "You (Freelancer)" : (m.senderName || defaultClientName || "Client"),
    timestamp: timeStr,
    bubbleText: m.summaryText || m.originalBody,
  };
}

export default function FreelancerWorkspaceChatsMode({
  onSwitchToAIMode,
  onOpenMediationHelp,
  isStandalone = false,
}: FreelancerWorkspaceChatsModeProps) {
  const { user } = useAuth();

  // Projects & Active Selection
  const [projects, setProjects] = useState<FreelancerWorkspaceProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [filterType, setFilterType] = useState<"all" | "unread">("all");
  const [searchFilter, setSearchFilter] = useState("");

  // Timeline & Messages
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
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

  // Context sub-lists from database
  const [contextData, setContextData] = useState<any>(null);
  const [milestonesList, setMilestonesList] = useState<any[]>([]);
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [filesList, setFilesList] = useState<any[]>([]);
  const [meetingsList, setMeetingsList] = useState<any[]>([]);
  const [decisionsList, setDecisionsList] = useState<any[]>([]);
  const [activityList, setActivityList] = useState<any[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  // New task inline input state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Original Message Modal State
  const [originalMsgData, setOriginalMsgData] = useState<{
    rawMessage: string;
    senderName: string;
    timestamp: string;
  }>({
    rawMessage: "",
    senderName: "",
    timestamp: "",
  });

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

  // Composer State
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
  const [reviewVersionTarget, setReviewVersionTarget] = useState("Active Version");

  const timelineEndRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const selectedProject =
    projects.find((p) => p.id === selectedProjectId) || projects[0];

  const totalUnreadCount = projects.reduce((acc, p) => acc + (p.unreadCount || 0), 0);

  // Auto scroll to latest in timeline
  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [timeline]);

  // 1. Fetch real conversation threads from database
  const loadThreads = useCallback(async () => {
    setIsLoadingProjects(true);
    try {
      const res = await fetchConversations();
      if (res.success && res.conversations) {
        const mappedProjects: FreelancerWorkspaceProject[] = res.conversations.map((c: any) => ({
          id: c.id,
          name: c.title || "Project Workspace",
          shortName: c.title?.split("–")[0]?.trim() || c.title || "Project",
          iconType: "cart",
          freelancerName: user?.name || "Freelancer",
          freelancerAvatar:
            user?.avatar ||
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80",
          clientName: c.counterpartName || "Client",
          clientCompany: `${c.counterpartName || "Client"} Org`,
          clientAvatar:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80",
          escrowFundedAmount: "Bilateral Consensus Escrow",
          status: c.projectStatus === "IN_PROGRESS" ? "Active project" : c.projectStatus || "Active",
          statusColor:
            c.projectStatus === "IN_PROGRESS"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
              : "bg-blue-50 text-blue-700 border-blue-200/80",
          budget: "Fixed Scope",
          duration: "In Progress",
          startDate: "Recent",
          agreementVersion: "v1 active",
          unreadCount: c.unreadCount || 0,
          lastMessagePreview: c.lastPreview || "No messages yet",
          lastActivityTime: c.lastMessageAt
            ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Active",
          canSee: true,
          paymentNote: "Secured via Nexum PayPal consensus ledger.",
          milestones: [],
        }));

        setProjects(mappedProjects);
        if (mappedProjects.length > 0) {
          setSelectedProjectId((prev) =>
            mappedProjects.some((p) => p.id === prev) ? prev : mappedProjects[0].id
          );
        } else {
          setSelectedProjectId("");
        }
      } else {
        setProjects([]);
        setSelectedProjectId("");
      }
    } catch (err) {
      console.warn("Failed to load workspace threads from backend", err);
      setProjects([]);
      setSelectedProjectId("");
    } finally {
      setIsLoadingProjects(false);
    }
  }, [user?.name, user?.avatar]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // 2. Fetch messages & context when selectedProjectId changes
  useEffect(() => {
    if (!selectedProjectId) {
      setTimeline([]);
      setContextData(null);
      setMilestonesList([]);
      setTasksList([]);
      setFilesList([]);
      setMeetingsList([]);
      setDecisionsList([]);
      return;
    }

    let isMounted = true;
    setIsLoadingMessages(true);

    async function loadData() {
      try {
        const [msgRes, ctxRes] = await Promise.all([
          fetchConversationMessages(selectedProjectId),
          fetchConversationContext(selectedProjectId),
        ]);

        if (!isMounted) return;

        if (msgRes.success && msgRes.messages) {
          const mapped = msgRes.messages.map((m: any) =>
            mapApiMessageToTimelineItem(m, user?.id, selectedProject?.clientName)
          );
          setTimeline(mapped);
        } else {
          setTimeline([]);
        }

        if (ctxRes.success && ctxRes.context) {
          const ctx = ctxRes.context;
          setContextData(ctx);
          setMilestonesList(
            (ctx.milestones || []).map((m: any) => ({
              id: m.id,
              number: m.number,
              title: m.title,
              amount: `$${((m.amountMinor || 0) / 100).toLocaleString()}`,
              amountMinor: m.amountMinor || 0,
              dueDate: m.dueDate
                ? new Date(m.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "Not set",
              status: m.workStatus === "ACCEPTED" ? "Accepted" : m.workStatus === "IN_PROGRESS" ? "In progress" : "Upcoming",
              statusColor:
                m.workStatus === "ACCEPTED"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                  : m.workStatus === "IN_PROGRESS"
                  ? "bg-blue-50 text-blue-700 border-blue-200/80"
                  : "bg-zinc-100 text-zinc-600 border-zinc-200",
            }))
          );
          setTasksList(ctx.tasks || []);
          setFilesList(ctx.recentFiles || []);
          setMeetingsList(ctx.upcomingMeetings || []);
          setDecisionsList(ctx.decisions || []);
        }
      } catch (err) {
        console.warn("Failed to load conversation messages & context:", err);
      } finally {
        if (isMounted) setIsLoadingMessages(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [selectedProjectId, user?.id, selectedProject?.clientName]);

  // 3. Load activity log when activity tab is opened
  useEffect(() => {
    if (activeTab !== "activity" || !selectedProjectId) return;
    let isMounted = true;
    setIsLoadingActivity(true);

    async function loadActivity() {
      try {
        const targetProjectId = selectedProject?.id || selectedProjectId;
        const res = await fetchProjectActivity(targetProjectId);
        if (isMounted && res.success && res.activity) {
          setActivityList(res.activity);
        } else if (isMounted) {
          setActivityList([]);
        }
      } catch (err) {
        console.warn("Could not load project activity:", err);
        if (isMounted) setActivityList([]);
      } finally {
        if (isMounted) setIsLoadingActivity(false);
      }
    }

    loadActivity();
    return () => {
      isMounted = false;
    };
  }, [activeTab, selectedProjectId, selectedProject?.id]);

  // Check if input contains scope / price keywords
  const hasScopeOrPriceKeywords =
    /(\$|price|quote|scope|cost|fee|budget|timeline|delay|discount|reduce|counteroffer|hours)/i.test(
      messageInput
    );

  // Send message handler via live backend mediation pipeline
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = messageInput.trim();
    if (!text || isSending || !selectedProjectId) return;

    if (composerMode === "private_ai") {
      onSwitchToAIMode(selectedProject?.shortName);
      return;
    }

    setIsSending(true);
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // 1. Optimistic freelancer bubble
    const freelancerMsg: TimelineItem = {
      id: `fmsg_${Date.now()}`,
      type: "client_bubble",
      senderName: "You (Freelancer)",
      timestamp: nowTime,
      bubbleText: text,
    };

    setTimeline((prev) => [...prev, freelancerMsg]);
    setMessageInput("");

    // 2. Call live backend API
    try {
      const res = await sendMessage(selectedProjectId, text);
      if (res.success) {
        showToast("Message submitted to Nexum AI mediation pipeline.");
        setTimeout(async () => {
          try {
            const refreshed = await fetchConversationMessages(selectedProjectId);
            if (refreshed.success && refreshed.messages) {
              const mapped = refreshed.messages.map((m: any) =>
                mapApiMessageToTimelineItem(m, user?.id, selectedProject?.clientName)
              );
              setTimeline(mapped);
            }
          } catch {
            // retain optimistic state
          }
          setIsSending(false);
        }, 1200);
      } else {
        // Rollback optimistic message on failure
        setTimeline((prev) => prev.filter((m) => m.id !== freelancerMsg.id));
        showToast(res.error || "Failed to send message.");
        setIsSending(false);
      }
    } catch (err: any) {
      setTimeline((prev) => prev.filter((m) => m.id !== freelancerMsg.id));
      showToast(err?.message || "Failed to send message.");
      setIsSending(false);
    }
  };

  // Handle original message modal
  const handleOpenOriginalMessage = async (item: TimelineItem) => {
    if (item.rawMessage) {
      setOriginalMsgData({
        rawMessage: item.rawMessage,
        senderName: item.senderName,
        timestamp: item.timestamp,
      });
      setIsOriginalMsgModalOpen(true);
      return;
    }
    if (item.id && !item.id.startsWith("fmsg_")) {
      try {
        const res = await fetchOriginalMessage(item.id);
        if (res.success && res.originalBody) {
          setOriginalMsgData({
            rawMessage: res.originalBody,
            senderName: item.senderName,
            timestamp: item.timestamp,
          });
        } else {
          setOriginalMsgData({
            rawMessage: item.bubbleText || item.summaryText || "No text available.",
            senderName: item.senderName,
            timestamp: item.timestamp,
          });
        }
      } catch {
        setOriginalMsgData({
          rawMessage: item.bubbleText || item.summaryText || "No text available.",
          senderName: item.senderName,
          timestamp: item.timestamp,
        });
      }
    }
    setIsOriginalMsgModalOpen(true);
  };

  // Handle action buttons inside timeline cards
  const handleCardAction = async (action?: string) => {
    if (!action) return;
    if (action.startsWith("confirm_")) {
      const msgId = action.replace("confirm_", "");
      showToast("Confirming message with Nexum AI consensus engine...");
      try {
        const confirmRes = await confirmMessage(msgId);
        if (confirmRes.success) {
          showToast("✓ Message confirmed and delivered to client.");
          const refreshed = await fetchConversationMessages(selectedProjectId);
          if (refreshed.success && refreshed.messages) {
            const mapped = refreshed.messages.map((m: any) =>
              mapApiMessageToTimelineItem(m, user?.id, selectedProject?.clientName)
            );
            setTimeline(mapped);
          }
        } else {
          showToast(confirmRes.error || "Confirmation failed");
        }
      } catch (err: any) {
        showToast(err?.message || "Confirmation failed");
      }
      return;
    }
    if (action === "review_version") {
      setReviewVersionTarget(contextData?.project?.activeAgreementVersion ? `Version ${contextData.project.activeAgreementVersion}` : "Active Version");
      setIsReviewModalOpen(true);
    } else if (action === "submit_deliverable") {
      setIsSubmitDeliverableModalOpen(true);
    } else if (action === "ask_question") {
      onSwitchToAIMode(selectedProject?.shortName);
    } else if (action === "counter_quote") {
      setMessageInput("I can proceed with the proposed scope if we adjust delivery by 2 days.");
      showToast("Drafting counter-proposal...");
    } else if (action === "decline_offer") {
      showToast("Decline notification submitted to mediation engine.");
    }
  };

  // Task Checkbox Toggle
  const handleToggleTask = async (task: any) => {
    const nextStatus = task.status === "DONE" ? "TODO" : "DONE";
    try {
      const res = await updateProjectTask(task.id, { status: nextStatus });
      if (res.success) {
        setTasksList((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
        );
        showToast(`Task marked as ${nextStatus.toLowerCase()}`);
      } else {
        showToast(res.error || "Failed to update task");
      }
    } catch {
      showToast("Failed to update task");
    }
  };

  // Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || isCreatingTask || !selectedProjectId) return;
    setIsCreatingTask(true);
    try {
      const targetProjectId = contextData?.project?.id || selectedProject?.id || selectedProjectId;
      const res = await createProjectTask(targetProjectId, {
        title: newTaskTitle.trim(),
        status: "TODO",
      });
      if (res.success && res.task) {
        setTasksList((prev) => [res.task, ...prev]);
        setNewTaskTitle("");
        showToast("✓ Task added to workspace");
      } else {
        showToast(res.error || "Failed to add task");
      }
    } catch (err: any) {
      showToast(err?.message || "Failed to add task");
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Meeting Response
  const handleRespondMeeting = async (meetingId: string, response: "ACCEPTED" | "DECLINED") => {
    try {
      const res = await respondMeeting(meetingId, response);
      if (res.success) {
        setMeetingsList((prev) =>
          prev.map((m) => (m.id === meetingId ? { ...m, status: response } : m))
        );
        showToast(`Meeting ${response.toLowerCase()} successfully`);
      } else {
        showToast(res.error || "Failed to update meeting");
      }
    } catch {
      showToast("Failed to respond to meeting");
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

  // Calculate real balances from milestones
  const totalBudgetMinor = milestonesList.reduce((sum, m) => sum + (m.amountMinor || 0), 0);
  const totalReleasedMinor = milestonesList
    .filter((m) => m.status === "Accepted")
    .reduce((sum, m) => sum + (m.amountMinor || 0), 0);
  const totalEscrowMinor = milestonesList
    .filter((m) => m.status === "In progress")
    .reduce((sum, m) => sum + (m.amountMinor || 0), 0);

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
          LEFT COLUMN: ACTIVE PROJECTS LIST
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
                    {totalUnreadCount > 0 && (
                      <span className="w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                        {totalUnreadCount}
                      </span>
                    )}
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

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-1.5 space-y-1.5">
          {isLoadingProjects ? (
            <div className="p-4 text-center text-xs text-slate-400">Loading conversations...</div>
          ) : filteredProjects.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-600">No active conversations</p>
              <p>Active project threads will appear here once proposals or contracts are finalized.</p>
            </div>
          ) : (
            filteredProjects.map((p) => {
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
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <MessageSquare className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {p.lastActivityTime}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] text-slate-500 truncate block">
                        {p.clientName}
                      </span>
                      {p.unreadCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                          {p.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ==============================================================
          CENTER COLUMN: CONVERSATION / ACTIVE TAB
         ============================================================== */}
      <main className="flex-1 flex flex-col min-w-0 border-r border-slate-200/80 bg-slate-50/30 overflow-hidden">
        {!selectedProject ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-800">No Conversation Selected</h2>
            <p className="text-xs text-slate-500 max-w-sm">
              Select a project from the workspace sidebar to collaborate, review deliverables, and coordinate with clients.
            </p>
          </div>
        ) : (
          <>
            {/* Project Header Bar */}
            <div className="px-5 py-3 border-b border-slate-200/80 bg-white shrink-0 shadow-2xs">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900 truncate tracking-tight">
                      {selectedProject.name}
                    </h2>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${selectedProject.statusColor}`}>
                      {selectedProject.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    Client: <strong className="text-slate-800 font-semibold">{selectedProject.clientName}</strong> ·{" "}
                    {contextData?.project?.activeAgreementVersion ? `Agreement v${contextData.project.activeAgreementVersion} Active` : "Contract Active"}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
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

              {/* Subtabs Bar */}
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

            {/* Central View Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* TAB 1: CHAT FEED */}
              {activeTab === "chat" && (
                <div className="space-y-4">
                  {isLoadingMessages ? (
                    <div className="text-center text-xs text-slate-400 py-8">
                      Loading conversation messages...
                    </div>
                  ) : timeline.length === 0 ? (
                    <div className="text-center py-12 px-4 space-y-2">
                      <p className="font-semibold text-slate-700 text-sm">No messages yet</p>
                      <p className="text-xs text-slate-500">
                        Send a message below. Nexum AI verifies agreement terms, scope boundaries, and price integrity.
                      </p>
                    </div>
                  ) : (
                    timeline.map((item) => {
                      if (item.type === "freelancer_reply_card") {
                        return (
                          <div
                            key={item.id}
                            className="p-4 rounded-2xl border border-purple-200/90 bg-purple-50/40 text-xs space-y-2.5 shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-purple-900 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                <span>{item.badgeText}</span>
                              </span>
                              <span className="text-[10px] text-purple-600 font-medium">{item.timestamp}</span>
                            </div>
                            <p className="text-slate-800 leading-relaxed">{item.summaryText}</p>
                            {item.metrics && (
                              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-600 bg-white/70 p-2 rounded-xl border border-purple-100">
                                <span>Price: <strong>{item.metrics.priceChange}</strong></span>
                                <span>Schedule: <strong>{item.metrics.scheduleChange}</strong></span>
                                <span>Version: <strong>{item.metrics.agreementVersion}</strong></span>
                              </div>
                            )}
                            <div className="flex items-center justify-between pt-1">
                              <button
                                type="button"
                                onClick={() => handleOpenOriginalMessage(item)}
                                className="text-[11px] text-purple-700 hover:underline font-semibold cursor-pointer"
                              >
                                View unredacted text →
                              </button>
                              {item.actions && (
                                <button
                                  type="button"
                                  onClick={() => handleCardAction(item.actions?.primaryAction)}
                                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shadow-xs cursor-pointer"
                                >
                                  {item.actions.primaryLabel}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      }

                      if (item.type === "draft_counteroffer_card") {
                        return (
                          <div
                            key={item.id}
                            className="p-4 rounded-2xl border border-amber-200/90 bg-amber-50/40 text-xs space-y-2.5 shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-amber-900">{item.badgeText}</span>
                              <span className="text-[10px] text-amber-600 font-medium">{item.timestamp}</span>
                            </div>
                            <p className="text-slate-800 leading-relaxed">{item.summaryText}</p>
                            <div className="flex items-center justify-between pt-1">
                              <button
                                type="button"
                                onClick={() => handleOpenOriginalMessage(item)}
                                className="text-[11px] text-amber-800 hover:underline font-semibold cursor-pointer"
                              >
                                View canonical details →
                              </button>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleCardAction("counter_quote")}
                                  className="px-2.5 py-1 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold text-xs hover:bg-amber-50 cursor-pointer"
                                >
                                  Counter back
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCardAction("review_version")}
                                  className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-xs cursor-pointer"
                                >
                                  Review terms
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Default chat bubble
                      const isSelf = item.senderName.includes("You");
                      return (
                        <div
                          key={item.id}
                          className={`flex flex-col ${isSelf ? "items-end" : "items-start"} space-y-1`}
                        >
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1 font-medium">
                            <span>{item.senderName}</span>
                            <span>•</span>
                            <span>{item.timestamp}</span>
                          </div>
                          <div
                            className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs whitespace-pre-line ${
                              isSelf
                                ? "bg-[#4f46e5] text-white rounded-br-xs"
                                : "bg-white border border-slate-200/90 text-slate-900 rounded-bl-xs"
                            }`}
                          >
                            {item.bubbleText}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={timelineEndRef} />
                </div>
              )}

              {/* TAB 2: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl border border-slate-200/80 bg-white space-y-3 shadow-2xs">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Project Contract Overview
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Title</span>
                        <span className="font-bold text-slate-800">{selectedProject.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Client Organization</span>
                        <span className="font-bold text-slate-800">{selectedProject.clientCompany}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Total Budget</span>
                        <span className="font-bold font-mono text-slate-800">
                          ${(totalBudgetMinor / 100).toLocaleString()} USD
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Agreement Lifecycle</span>
                        <span className="font-bold text-emerald-700">
                          {contextData?.project?.activeAgreementVersion ? `Version ${contextData.project.activeAgreementVersion} Active` : "Active"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: DELIVERABLES */}
              {activeTab === "deliverables" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Contract Deliverables
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsSubmitDeliverableModalOpen(true)}
                      className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer"
                    >
                      + Submit Deliverable
                    </button>
                  </div>
                  {milestonesList.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                      No deliverables recorded for this project yet.
                    </div>
                  ) : (
                    milestonesList.map((m) => (
                      <div key={m.id} className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-2 text-xs shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{m.number}. {m.title}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.statusColor}`}>
                            {m.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                          <span>Due date: {m.dueDate}</span>
                          <span className="font-bold font-mono text-slate-800">{m.amount}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: MILESTONES */}
              {activeTab === "milestones" && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Milestones & Escrow Schedule
                  </h3>
                  <div className="space-y-2.5">
                    {milestonesList.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                        No milestones recorded for this project yet.
                      </div>
                    ) : (
                      milestonesList.map((m) => (
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
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: TASKS */}
              {activeTab === "tasks" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Workspace Tasks
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {tasksList.filter((t) => t.status === "DONE").length} of {tasksList.length} completed
                    </span>
                  </div>

                  <form onSubmit={handleCreateTask} className="flex gap-2">
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Add a new task..."
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={!newTaskTitle.trim() || isCreatingTask}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </form>

                  <div className="space-y-2">
                    {tasksList.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                        No tasks created for this workspace yet. Add one above.
                      </div>
                    ) : (
                      tasksList.map((t) => {
                        const isDone = t.status === "DONE";
                        return (
                          <div
                            key={t.id}
                            className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between text-xs shadow-2xs hover:border-slate-300 transition"
                          >
                            <div
                              onClick={() => handleToggleTask(t)}
                              className="flex items-center gap-2.5 cursor-pointer select-none flex-1 min-w-0"
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <span className={isDone ? "line-through text-slate-400 truncate" : "font-semibold text-slate-800 truncate"}>
                                {t.title}
                              </span>
                            </div>
                            {t.dueDate && (
                              <span className="text-[11px] text-slate-400 font-medium shrink-0 ml-2">
                                Due {new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: FILES */}
              {activeTab === "files" && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Project Files & Attachments
                  </h3>
                  <div className="space-y-2">
                    {filesList.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                        No files shared in this workspace yet. Attachments sent in messages or deliverables will appear here.
                      </div>
                    ) : (
                      filesList.map((f) => (
                        <div
                          key={f.id}
                          className="p-3.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between text-xs hover:border-indigo-500/40 transition shadow-2xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] border border-indigo-100 shrink-0">
                              {f.category?.slice(0, 3) || "DOC"}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-800 truncate">{f.name}</div>
                              <div className="text-[10px] text-slate-400">
                                {f.sizeBytes ? `${Math.round(f.sizeBytes / 1024)} KB` : "Document"} · {new Date(f.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => window.open(`/api/freelancer/project-files/${f.id}/download`, "_blank")}
                            className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer shrink-0 ml-2"
                          >
                            Download
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: PAYMENTS & ESCROW */}
              {activeTab === "payments" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Escrow & Payment Tracking</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Secured through Nexum consensus engine and milestone release protocol.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Escrow Guarded</span>
                    </div>
                  </div>

                  {/* Dynamic Balance Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Contract</span>
                      <div className="text-lg font-black text-slate-900 font-mono">
                        ${(totalBudgetMinor / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-slate-500 block">Agreed fixed scope</span>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Released</span>
                      <div className="text-lg font-black text-emerald-600 font-mono">
                        ${(totalReleasedMinor / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-emerald-600 font-semibold block">Accepted Milestones</span>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">In Progress</span>
                      <div className="text-lg font-black text-indigo-600 font-mono">
                        ${(totalEscrowMinor / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-indigo-600 font-semibold block">Current Milestone Scope</span>
                    </div>
                  </div>

                  {/* Milestone Payments Table */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Milestone Disbursement Schedule
                    </h4>
                    <div className="divide-y divide-slate-100">
                      {milestonesList.length === 0 ? (
                        <div className="py-4 text-center text-xs text-slate-400">
                          No milestone payments scheduled.
                        </div>
                      ) : (
                        milestonesList.map((m) => (
                          <div key={m.id} className="py-3 flex items-center justify-between text-xs">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{m.number}. {m.title}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.statusColor}`}>
                                  {m.status}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                Due: {m.dueDate}
                              </div>
                            </div>
                            <span className="font-mono font-bold text-slate-800 text-sm">{m.amount}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 8: DECISIONS */}
              {activeTab === "decisions" && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Mutual Consensus Record
                  </h3>
                  <div className="p-4 rounded-2xl border border-slate-200/80 bg-white space-y-3 text-xs shadow-2xs">
                    {decisionsList.length === 0 ? (
                      <p className="text-slate-500 text-xs">
                        No bilateral amendments or decisions recorded yet. Approved change requests will be anchored here.
                      </p>
                    ) : (
                      decisionsList.map((d) => (
                        <div key={d.id} className="border-b border-slate-100 pb-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{d.title}</span>
                            <span className="text-slate-400 text-[10px]">{new Date(d.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-600 text-[11px]">{d.description || d.title}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 9: ACTIVITY */}
              {activeTab === "activity" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <History className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Project Audit Log & Consensus Activity</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Chronological record of verified transitions, approvals, and messages.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                    {isLoadingActivity ? (
                      <div className="text-center text-xs text-slate-400 py-4">Loading audit trail...</div>
                    ) : activityList.length === 0 ? (
                      <div className="text-center text-xs text-slate-400 py-4">No audit events recorded for this project yet.</div>
                    ) : (
                      <div className="space-y-3 divide-y divide-slate-100">
                        {activityList.map((ev) => (
                          <div key={ev.id} className="pt-2.5 first:pt-0 text-xs flex items-start justify-between gap-3">
                            <div>
                              <div className="font-bold text-slate-900">{ev.action}</div>
                              <div className="text-[11px] text-slate-500">
                                {ev.objectType} · Actor: {ev.actor} ({ev.actorRole})
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium shrink-0">
                              {new Date(ev.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 10: MEETINGS */}
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

                  <div className="space-y-2">
                    {meetingsList.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                        No upcoming meetings scheduled. Click &quot;+ Propose Meeting&quot; to coordinate a call.
                      </div>
                    ) : (
                      meetingsList.map((m) => (
                        <div key={m.id} className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-2 text-xs shadow-2xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Video className="w-4 h-4 text-indigo-600" />
                              <span className="font-bold text-slate-900">{m.title}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {m.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {new Date(m.startsAt).toLocaleString()} · {m.joinUrl ? <a href={m.joinUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">Join Link</a> : "Link to be provided"}
                          </p>
                          {m.status === "PROPOSED" && (
                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleRespondMeeting(m.id, "ACCEPTED")}
                                className="px-2.5 py-1 rounded bg-indigo-600 text-white font-bold text-[10px] hover:bg-indigo-700"
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRespondMeeting(m.id, "DECLINED")}
                                className="px-2.5 py-1 rounded border border-slate-200 text-slate-600 font-bold text-[10px] hover:bg-slate-50"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Message Composer */}
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

                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100/80 mt-1 gap-2">
                    <div className="flex items-center gap-1.5 text-slate-500 overflow-x-auto">
                      <button
                        type="button"
                        onClick={() => setIsSubmitDeliverableModalOpen(true)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition cursor-pointer shrink-0"
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

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="p-0.5 rounded-xl bg-slate-100 border border-slate-200/70 inline-flex items-center gap-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setComposerMode("mediated")}
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
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1 ${
                            composerMode === "private_ai"
                              ? "bg-white text-indigo-700 shadow-xs"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          <span>Private AI</span>
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={!messageInput.trim() || isSending}
                        className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition cursor-pointer shadow-xs shrink-0"
                        title="Send message"
                      >
                        <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </>
        )}
      </main>

      {/* Right Drawer */}
      {isRightDrawerOpen && selectedProject && (
        <aside className="w-72 sm:w-80 shrink-0 bg-white p-4 sm:p-5 border-l border-slate-200/80 space-y-4 overflow-y-auto shadow-2xs animate-in fade-in slide-in-from-right-3 duration-150">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Contract Details
            </span>
            <button
              type="button"
              onClick={() => setIsRightDrawerOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Hide details"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/80 bg-white space-y-3 shadow-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Scope</span>
              <h4 className="text-xs font-bold text-slate-900 leading-snug">{selectedProject.name}</h4>
              <p className="text-[11px] text-slate-500">Client: {selectedProject.clientName}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Contract Total</span>
                <span className="font-mono font-bold text-slate-800">
                  ${(totalBudgetMinor / 100).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Milestones</span>
                <span className="font-bold text-slate-800">{milestonesList.length} scheduled</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Open Tasks</span>
                <span className="font-bold text-slate-800">
                  {tasksList.filter((t) => t.status !== "DONE").length} pending
                </span>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Modals */}
      <ReadOriginalMessageModal
        isOpen={isOriginalMsgModalOpen}
        onClose={() => setIsOriginalMsgModalOpen(false)}
        rawMessage={originalMsgData.rawMessage}
        senderName={originalMsgData.senderName}
        timestamp={originalMsgData.timestamp}
      />

      <ProposeMeetingModal
        isOpen={isProposeMeetingModalOpen}
        onClose={() => setIsProposeMeetingModalOpen(false)}
        freelancerName={user?.name || "Freelancer"}
        onScheduleMeeting={(details) => {
          const targetProjectId = contextData?.project?.id || selectedProject?.id || selectedProjectId;
          const startsAt = new Date(`${details.date}T${details.time}:00Z`).toISOString();
          const endsAt = new Date(new Date(startsAt).getTime() + 30 * 60 * 1000).toISOString();
          proposeProjectMeeting(targetProjectId, {
            title: details.topic,
            startsAt,
            endsAt,
          }).then((res: any) => {
            if (res.success) {
              showToast("Meeting proposal sent to client.");
              if (selectedProjectId) {
                fetchConversationContext(selectedProjectId).then((ctxRes: any) => {
                  if (ctxRes.success && ctxRes.context) {
                    setMeetingsList(ctxRes.context.upcomingMeetings || []);
                  }
                });
              }
            } else {
              showToast(res.error || "Failed to propose meeting");
            }
          });
        }}
      />

      <SubmitDeliverableModal
        isOpen={isSubmitDeliverableModalOpen}
        onClose={() => setIsSubmitDeliverableModalOpen(false)}
        defaultMilestone={milestonesList[0]?.title || "Milestone Deliverable"}
        defaultAmount={milestonesList[0]?.amount || "$1,000.00 USD"}
        onSubmitSuccess={(details) => {
          showToast("Deliverable submitted for client review.");
          if (selectedProjectId) {
            sendMessage(selectedProjectId, `Deliverable Submitted: PR: ${details.prUrl}\nNotes: ${details.notes}`).then(() => {
              fetchConversationMessages(selectedProjectId).then((msgRes: any) => {
                if (msgRes.success && msgRes.messages) {
                  setTimeline(msgRes.messages.map((m: any) => mapApiMessageToTimelineItem(m, user?.id, selectedProject?.clientName)));
                }
              });
            });
          }
        }}
      />

      <ReviewVersionModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        versionName={reviewVersionTarget}
      />
    </div>
  );
}
