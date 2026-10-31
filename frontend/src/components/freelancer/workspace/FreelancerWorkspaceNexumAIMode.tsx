"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Search,
  Lock,
  Sparkles,
  Paperclip,
  ArrowUp,
  PanelRightClose,
  PanelRightOpen,
  MessageSquare,
  FileText,
} from "lucide-react";
import { PrivateAIChatEntry, BasedOnChip } from "@/lib/workspace-types";
import {
  INITIAL_FREELANCER_AI_CHAT_HISTORY,
  FREELANCER_BASED_ON_CHIPS,
} from "@/lib/freelancer-workspace-data";
import ReviewVersionModal from "@/components/client/workspace/ReviewVersionModal";

interface FreelancerWorkspaceNexumAIModeProps {
  onOpenInChats: (projectId: string, draftMessage?: string) => void;
  initialScope?: string;
  isStandalone?: boolean;
}

interface LiveMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  model?: string;
}

export default function FreelancerWorkspaceNexumAIMode({
  onOpenInChats,
  initialScope = "All my client contracts",
  isStandalone = false,
}: FreelancerWorkspaceNexumAIModeProps) {
  void isStandalone;

  // Chat History State
  const [chatHistory, setChatHistory] = useState<PrivateAIChatEntry[]>(INITIAL_FREELANCER_AI_CHAT_HISTORY);
  const [selectedChatId, setSelectedChatId] = useState<string>("fchat_scope_cr2");
  const [searchQuery, setSearchQuery] = useState("");

  // Active Scope State
  const [activeScope, setActiveScope] = useState<string>(initialScope);

  // Live messages for current conversation session
  const [liveMessages, setLiveMessages] = useState<LiveMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Based-on record detail modal
  const [selectedChip, setSelectedChip] = useState<BasedOnChip | null>(null);

  // Draft editing state
  const [draftMessage, setDraftMessage] = useState(
    "Hi Alex, I reviewed the dynamic category pills request. While it falls outside Milestone 2 baseline scope, I am happy to incorporate it under CR-2 for +$500 and +4 days delivery extension. Let's seal Agreement v5."
  );
  const [isEditingDraft, setIsEditingDraft] = useState(false);

  // AI Composer
  const [inputValue, setInputValue] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Review modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Right Drawer collapsible state
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectChat = (id: string) => {
    setSelectedChatId(id);
    if (!id || id.startsWith("fchat_")) {
      setLiveMessages([]);
    }
  };

  const handleNewChat = () => {
    const newId = `fchat_new_${Date.now()}`;
    const newEntry: PrivateAIChatEntry = {
      id: newId,
      title: "New private consultation",
      projectTag: activeScope.includes("TechKart") ? "TechKart" : "General",
      dateGroup: "TODAY",
      messagesCount: 0,
      updatedAt: "Just now",
    };
    setChatHistory([newEntry, ...chatHistory]);
    setSelectedChatId(newId);
    setLiveMessages([]);
    showToast("Started new private AI consultation session.");
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputValue.trim();
    if (!query || isGenerating) return;

    const userMsg: LiveMessage = {
      id: `um_${Date.now()}`,
      role: "user",
      content: query,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setLiveMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsGenerating(true);

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `[Context: Freelancer consulting on ${activeScope}] ${query}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: LiveMessage = {
          id: `am_${Date.now()}`,
          role: "assistant",
          content: data.message?.content || data.reply || "I have analyzed your request against the contract baseline.",
          createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          model: data.model || "Gemini 2.5 Pro",
        };
        setLiveMessages((prev) => [...prev, aiMsg]);
      } else {
        setTimeout(() => {
          const aiMsg: LiveMessage = {
            id: `am_${Date.now()}`,
            role: "assistant",
            content: `Based on Agreement v3 canonical hash (0x9f8c2b7e) and your milestones for ${activeScope}: \n\n1. **Scope Assessment**: The requested work constitutes an architectural addition beyond the agreed acceptance criteria.\n2. **Recommendation**: Alex's $500 counteroffer represents fair compensation for ~8-10 developer hours. Accept with the +4 days extension to ensure test coverage.\n3. **Consensus Protection**: Ensure dual signatures are sealed before delivering code.`,
            createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            model: "Nexum Scope Mediation Engine",
          };
          setLiveMessages((prev) => [...prev, aiMsg]);
        }, 800);
      }
    } catch {
      setTimeout(() => {
        const aiMsg: LiveMessage = {
          id: `am_${Date.now()}`,
          role: "assistant",
          content: `Analysis complete: Your current milestone 2 delivery meets all cryptographic checks. If Alex Chen approves the counteroffer, Agreement v5 will anchor automatically.`,
          createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setLiveMessages((prev) => [...prev, aiMsg]);
      }, 700);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveMessages]);

  const filteredHistory = chatHistory.filter((item) => {
    if (!searchQuery) return true;
    return (
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.projectTag.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const todayChats = filteredHistory.filter((c) => c.dateGroup === "TODAY");
  const yesterdayChats = filteredHistory.filter((c) => c.dateGroup === "YESTERDAY");

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-50/50 select-none w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#4f46e5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ==============================================================
          LEFT COLUMN: PRIVATE AI HISTORY PANEL (Deto Same as Client)
         ============================================================== */}
      <aside className="w-[280px] lg:w-[300px] shrink-0 border-r border-slate-200/80 bg-white flex flex-col justify-between h-full overflow-hidden shadow-2xs">
        {/* Top: + New Chat & Search */}
        <div className="p-4 sm:p-4.5 pb-2.5 space-y-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNewChat}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New chat</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenInChats("techkart")}
              className="p-2.5 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 border border-slate-200/80 bg-white transition shadow-2xs cursor-pointer flex items-center gap-1 font-bold text-xs"
              title="Switch to Chats"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chats</span>
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center ml-0.5">2</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-8.5 pr-3 py-1.5 rounded-xl border border-slate-200/80 bg-slate-50/70 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100/60 transition shadow-2xs"
            />
          </div>
        </div>

        {/* History Stream grouped by TODAY / YESTERDAY */}
        <div className="flex-1 overflow-y-auto px-2.5 py-1.5 space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              Start a new conversation with Nexum AI.
            </div>
          ) : (
            <>
              {/* TODAY Group */}
              {todayChats.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Today
                  </div>
                  {todayChats.map((c) => {
                    const isSelected = c.id === selectedChatId;
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleSelectChat(c.id)}
                        className={`p-2.5 rounded-xl transition cursor-pointer text-left border ${
                          isSelected
                            ? "bg-indigo-50/70 border-indigo-200/90 text-indigo-900 font-semibold shadow-2xs"
                            : "bg-white hover:bg-slate-50 border-transparent text-slate-700"
                        }`}
                      >
                        <div className="text-xs font-bold truncate leading-snug">
                          {c.title}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {c.projectTag}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* YESTERDAY Group */}
              {yesterdayChats.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Yesterday
                  </div>
                  {yesterdayChats.map((c) => {
                    const isSelected = c.id === selectedChatId;
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleSelectChat(c.id)}
                        className={`p-2.5 rounded-xl transition cursor-pointer text-left border ${
                          isSelected
                            ? "bg-indigo-50/70 border-indigo-200/90 text-indigo-900 font-semibold shadow-2xs"
                            : "bg-white hover:bg-slate-50 border-transparent text-slate-700"
                        }`}
                      >
                        <div className="text-xs font-bold truncate leading-snug">
                          {c.title}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {c.projectTag}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Privacy Notice */}
        <div className="p-3.5 border-t border-slate-200/80 bg-slate-50/70 text-[11px] text-slate-500 flex items-start gap-2">
          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <p className="leading-tight">
            These chats are private to you. Clients never see them.
          </p>
        </div>
      </aside>

      {/* ==============================================================
          CENTRE COLUMN: AI CONVERSATION (Deto Same as Client)
         ============================================================== */}
      <main className="flex-1 flex flex-col min-w-0 border-r border-slate-200/80 bg-slate-50/40 overflow-hidden">
        {/* Top Scope Pills Bar - Compact & Sleek */}
        <div className="px-4 sm:px-5 py-2.5 border-b border-slate-200/80 bg-white shrink-0 shadow-2xs flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
              Scope
            </span>

            {[
              { id: "all", label: "All my contracts (3)", match: "All my client contracts" },
              { id: "techkart", label: "TechKart", match: "TechKart" },
              { id: "fitlife", label: "FitLife", match: "FitLife" },
              { id: "nexa_ai", label: "NexaAI", match: "NexaAI" },
            ].map((scope) => {
              const isActive = activeScope.includes(scope.match);
              return (
                <button
                  key={scope.id}
                  type="button"
                  onClick={() => {
                    setActiveScope(scope.match);
                    showToast(`Scope switched to: ${scope.label}`);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap border ${
                    isActive
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {scope.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isRightDrawerOpen && (
              <button
                type="button"
                onClick={() => setIsRightDrawerOpen(true)}
                className="p-1 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition cursor-pointer shadow-2xs"
                title="Show project details"
              >
                <PanelRightOpen className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Center Scrollable Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Default Consultation Thread */}
          {liveMessages.length === 0 && (
            <div className="space-y-4 max-w-3xl mx-auto">
              {/* User Question */}
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 mb-1 px-1 text-[11px] font-bold text-slate-400">
                  <span>You (Freelancer)</span>
                  <span>•</span>
                  <span>10:45 AM</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#4f46e5] text-white text-xs leading-relaxed max-w-xl shadow-2xs rounded-br-xs">
                  Is Alex&apos;s request for dynamic category pills and best-selling carousel considered out of scope for Milestone 2? Should I accept his $500 counteroffer?
                </div>
              </div>

              {/* AI Analysis Response Card */}
              <div className="flex flex-col items-start space-y-3">
                <div className="flex items-center gap-2 px-1 text-[11px] font-bold text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-[#4f46e5]" />
                  <span>Nexum Scope Engine</span>
                  <span>•</span>
                  <span>10:46 AM</span>
                </div>

                <div className="w-full p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4 text-xs">
                  <div className="space-y-2 leading-relaxed text-slate-700">
                    <p>
                      <strong>Scope Analysis for TechKart Agreement v3:</strong>
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                      <li>
                        <strong>Agreement Baseline:</strong> Milestone 2 strictly covers the core e-commerce catalog, shopping cart state machine, and PayPal REST v2 order capture.
                      </li>
                      <li>
                        <strong>Out of Scope:</strong> Dynamic category query indexing and personalized carousels were not specified in the original PRD. This constitutes a valid Change Request (CR-2).
                      </li>
                      <li>
                        <strong>Counteroffer Assessment:</strong> Alex&apos;s counteroffer of <strong>+$500.00 USD</strong> (down from your quote of $600) with <strong>+4 days</strong> delivery schedule is within market standards for 8–10 development hours.
                      </li>
                    </ul>
                  </div>

                  {/* Based-on Record Chips */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Based on Verified Records
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {FREELANCER_BASED_ON_CHIPS.map((chip) => (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => setSelectedChip(chip)}
                          className="px-2.5 py-1 rounded-lg border border-indigo-100 bg-indigo-50/70 hover:bg-indigo-100 text-[#4f46e5] text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>{chip.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Draft Reply for Client */}
                  <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-purple-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>Recommended Client Response (Agreement v5)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingDraft(!isEditingDraft)}
                        className="text-[10px] font-bold text-[#4f46e5] hover:underline cursor-pointer"
                      >
                        {isEditingDraft ? "Done Editing" : "Edit Draft"}
                      </button>
                    </div>

                    {isEditingDraft ? (
                      <textarea
                        rows={3}
                        value={draftMessage}
                        onChange={(e) => setDraftMessage(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-purple-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none leading-relaxed"
                      />
                    ) : (
                      <p className="text-xs text-slate-800 leading-relaxed font-medium">
                        &ldquo;{draftMessage}&rdquo;
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onOpenInChats("techkart", draftMessage);
                          showToast("Inserted draft response into client chat!");
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-98 flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Insert Draft into Client Chat</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Live Dynamic Messages */}
          {liveMessages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-2 mb-1 px-1 text-[11px] font-bold text-slate-400">
                  <span>{isUser ? "You (Freelancer)" : "Nexum AI"}</span>
                  <span>•</span>
                  <span>{msg.createdAt}</span>
                </div>
                <div
                  className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs whitespace-pre-line ${
                    isUser
                      ? "bg-[#4f46e5] text-white rounded-br-xs"
                      : "bg-white border border-slate-200/90 text-slate-900 rounded-bl-xs"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}

          {isGenerating && (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 p-2">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
              <span>Analyzing contract consensus and clauses...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom AI Composer */}
        <div className="border-t border-slate-200/80 bg-white p-3 sm:p-3.5 shrink-0 shadow-2xs">
          <form onSubmit={handleSendMessage}>
            <div className="relative rounded-2xl border border-slate-200/90 bg-slate-50/60 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 p-2.5 transition-all shadow-2xs">
              <textarea
                rows={2}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={`Ask Nexum AI anything privately about ${activeScope}...`}
                className="w-full text-xs sm:text-[13px] text-slate-900 placeholder:text-slate-400 bg-transparent resize-none focus:outline-none p-1 leading-relaxed"
              />

              <div className="flex items-center justify-between pt-1.5 border-t border-slate-100/80 mt-1 gap-2">
                <button
                  type="button"
                  onClick={() => showToast("Attaching specification for AI analysis...")}
                  className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-500 transition cursor-pointer shrink-0"
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <button
                  type="submit"
                  disabled={!inputValue.trim() || isGenerating}
                  className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition cursor-pointer shadow-xs shrink-0"
                  title="Send inquiry"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* ==============================================================
          RIGHT COLUMN: CONTRACT KNOWLEDGE BASE DRAWER
         ============================================================== */}
      {isRightDrawerOpen ? (
        <aside className="w-[290px] lg:w-[310px] shrink-0 bg-white p-4 sm:p-5 space-y-4 overflow-y-auto shadow-2xs animate-in fade-in slide-in-from-right-3 duration-150">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Contract Knowledge
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
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Suggested Inquiries
            </h3>
            <div className="space-y-1.5">
              {[
                "Is Alex's carousel request scope creep?",
                "Draft a polite CR-2 quote explanation",
                "Explain PayPal escrow release consensus",
                "Review Milestone 2 deliverable requirements",
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputValue(prompt);
                  }}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200/60 bg-slate-50/70 hover:bg-indigo-50/70 hover:border-indigo-200 text-xs text-slate-700 hover:text-indigo-900 font-medium transition cursor-pointer"
                >
                  {prompt} →
                </button>
              ))}
            </div>
          </div>
        </aside>
      ) : (
        <button
          type="button"
          onClick={() => setIsRightDrawerOpen(true)}
          className="w-8 shrink-0 border-l border-slate-200/80 bg-white hover:bg-slate-50 flex flex-col items-center justify-center gap-2.5 text-slate-400 hover:text-indigo-600 transition cursor-pointer shadow-2xs group py-4 select-none"
          title="Show contract details"
        >
          <PanelRightOpen className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          <span className="[writing-mode:vertical-rl] text-[10px] font-bold tracking-wider uppercase text-slate-400 group-hover:text-slate-700">
            Details
          </span>
        </button>
      )}

      {/* Chip Detail Modal */}
      {selectedChip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-[#4f46e5] uppercase tracking-wider">
                Canonical Record Citation
              </span>
              <button
                type="button"
                onClick={() => setSelectedChip(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <h4 className="font-bold text-sm text-slate-900">{selectedChip.label}</h4>
            <p className="text-xs text-slate-600 leading-relaxed">{selectedChip.detail}</p>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <ReviewVersionModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        versionName="Version 5"
      />
    </div>
  );
}
