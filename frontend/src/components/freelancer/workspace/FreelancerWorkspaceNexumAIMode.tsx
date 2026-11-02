"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Send,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { PrivateAIChatEntry, BasedOnChip } from "@/lib/workspace-types";
import ReviewVersionModal from "@/components/client/workspace/ReviewVersionModal";
import {
  fetchPrivateAiChats,
  createPrivateAiChat,
  fetchPrivateAiMessages,
  postPrivateAiMessage,
  fetchConversations,
  sendMessage,
} from "@/lib/api-client";

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

interface ProjectScopeOption {
  id: string;
  label: string;
  projectId?: string;
}

export default function FreelancerWorkspaceNexumAIMode({
  onOpenInChats,
  initialScope = "All my client contracts",
  isStandalone = false,
}: FreelancerWorkspaceNexumAIModeProps) {
  void isStandalone;

  // Chat History State
  const [chatHistory, setChatHistory] = useState<PrivateAIChatEntry[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingChats, setIsLoadingChats] = useState(true);

  // Active Scope State
  const [scopes, setScopes] = useState<ProjectScopeOption[]>([
    { id: "all", label: "All my contracts" },
  ]);
  const [activeScope, setActiveScope] = useState<string>(initialScope);

  // Live messages for current conversation session
  const [liveMessages, setLiveMessages] = useState<LiveMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Based-on record detail modal
  const [selectedChip, setSelectedChip] = useState<BasedOnChip | null>(null);

  // Draft promotion modal state
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [draftToPromote, setDraftToPromote] = useState<string>("");
  const [targetConversationId, setTargetConversationId] = useState<string>("");
  const [isPromoting, setIsPromoting] = useState(false);
  const [availableConversations, setAvailableConversations] = useState<any[]>([]);

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

  // 1. Load active project scopes & conversation threads
  useEffect(() => {
    let isMounted = true;
    async function loadScopes() {
      try {
        const res = await fetchConversations();
        if (res.success && res.conversations && res.conversations.length > 0) {
          if (!isMounted) return;
          const mappedScopes: ProjectScopeOption[] = [
            { id: "all", label: `All my contracts (${res.conversations.length})` },
            ...res.conversations.map((c: any) => ({
              id: c.projectId || c.id,
              label: c.title?.split("–")[0]?.trim() || c.title || "Project",
              projectId: c.projectId,
            })),
          ];
          setScopes(mappedScopes);
          setAvailableConversations(res.conversations);
          if (res.conversations.length > 0) {
            setTargetConversationId(res.conversations[0].id);
          }
        }
      } catch (err) {
        console.warn("Could not load project scopes:", err);
      }
    }
    loadScopes();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load private AI chat threads
  const loadChats = useCallback(async () => {
    setIsLoadingChats(true);
    try {
      const res = await fetchPrivateAiChats();
      if (res.success && res.chats) {
        const mapped: PrivateAIChatEntry[] = res.chats.map((c: any) => {
          const isToday =
            new Date(c.updatedAt).toDateString() === new Date().toDateString();
          return {
            id: c.id,
            title: c.title || "Private consultation",
            projectTag: c.projectId ? "Scoped Project" : "General",
            dateGroup: isToday ? "TODAY" : "YESTERDAY",
            messagesCount: 1,
            updatedAt: new Date(c.updatedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
        });
        setChatHistory(mapped);
        if (mapped.length > 0) {
          setSelectedChatId((prev) =>
            mapped.some((item) => item.id === prev) ? prev : mapped[0].id
          );
        }
      } else {
        setChatHistory([]);
      }
    } catch (err) {
      console.warn("Failed to load private AI chats:", err);
      setChatHistory([]);
    } finally {
      setIsLoadingChats(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // 3. Load messages for selected chat
  useEffect(() => {
    if (!selectedChatId) {
      setLiveMessages([]);
      return;
    }
    let isMounted = true;
    setIsLoadingMessages(true);

    async function loadMessages() {
      try {
        const res = await fetchPrivateAiMessages(selectedChatId);
        if (res.success && res.messages) {
          if (!isMounted) return;
          setLiveMessages(
            res.messages.map((m: any) => ({
              id: m.id,
              role: m.role.toLowerCase() as "user" | "assistant",
              content: m.content,
              createdAt: new Date(m.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              model: m.role === "ASSISTANT" ? "Nexum AI (Gemini 2.5 Flash)" : undefined,
            }))
          );
        } else {
          if (!isMounted) return;
          setLiveMessages([]);
        }
      } catch (err) {
        console.warn("Failed to load messages for chat", selectedChatId, err);
        if (isMounted) setLiveMessages([]);
      } finally {
        if (isMounted) setIsLoadingMessages(false);
      }
    }

    loadMessages();
    return () => {
      isMounted = false;
    };
  }, [selectedChatId]);

  const handleSelectChat = (id: string) => {
    setSelectedChatId(id);
  };

  const handleNewChat = async () => {
    try {
      const selectedScopeObj = scopes.find((s) => s.label === activeScope);
      const res = await createPrivateAiChat({
        title: "New private consultation",
        projectId: selectedScopeObj?.projectId,
      });
      if (res.success && res.chat) {
        const newEntry: PrivateAIChatEntry = {
          id: res.chat.id,
          title: res.chat.title,
          projectTag: res.chat.projectId ? "Scoped Project" : "General",
          dateGroup: "TODAY",
          messagesCount: 0,
          updatedAt: "Just now",
        };
        setChatHistory((prev) => [newEntry, ...prev]);
        setSelectedChatId(res.chat.id);
        setLiveMessages([]);
        showToast("Started new private AI consultation session.");
      } else {
        showToast("Could not create new AI chat.");
      }
    } catch {
      showToast("Failed to initialize private AI consultation.");
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputValue.trim();
    if (!query || isGenerating) return;

    let currentChatId = selectedChatId;
    if (!currentChatId) {
      try {
        const selectedScopeObj = scopes.find((s) => s.label === activeScope);
        const newChatRes = await createPrivateAiChat({
          title: query.slice(0, 32),
          projectId: selectedScopeObj?.projectId,
        });
        if (newChatRes.success && newChatRes.chat) {
          currentChatId = newChatRes.chat.id;
          setSelectedChatId(currentChatId);
          setChatHistory((prev) => [
            {
              id: newChatRes.chat.id,
              title: newChatRes.chat.title,
              projectTag: newChatRes.chat.projectId ? "Scoped Project" : "General",
              dateGroup: "TODAY",
              messagesCount: 1,
              updatedAt: "Just now",
            },
            ...prev,
          ]);
        } else {
          showToast("Failed to start session");
          return;
        }
      } catch {
        showToast("Error creating chat session");
        return;
      }
    }

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
      const res = await postPrivateAiMessage(currentChatId, {
        content: query,
      });

      if (res.success && res.message) {
        const aiMsg: LiveMessage = {
          id: res.message.id,
          role: "assistant",
          content: res.message.content,
          createdAt: new Date(res.message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          model: "Nexum AI (Gemini 2.5 Flash)",
        };
        setLiveMessages((prev) => [...prev, aiMsg]);
      } else {
        const errMsg = res.error || "AI service temporarily unavailable";
        showToast(errMsg);
        setLiveMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: "assistant",
            content: `Notice: ${errMsg}`,
            createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            model: "Nexum Guard",
          },
        ]);
      }
    } catch (err: any) {
      const errMsg = err?.message || "Failed to contact Nexum AI";
      showToast(errMsg);
      setLiveMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content: `Notice: ${errMsg}`,
          createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          model: "Nexum Guard",
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenPromoteModal = (content: string) => {
    setDraftToPromote(content);
    setIsPromoteModalOpen(true);
  };

  const handleConfirmPromote = async () => {
    if (!targetConversationId || !draftToPromote.trim() || isPromoting) return;
    setIsPromoting(true);

    try {
      const res = await sendMessage(targetConversationId, draftToPromote.trim());
      if (res.success) {
        showToast("✓ Draft promoted to client thread through mediation pipeline.");
        setIsPromoteModalOpen(false);
        const selectedConv = availableConversations.find(
          (c) => c.id === targetConversationId
        );
        onOpenInChats(selectedConv?.projectId || targetConversationId, draftToPromote);
      } else {
        showToast(res.error || "Failed to promote draft");
      }
    } catch (err: any) {
      showToast(err?.message || "Promotion failed");
    } finally {
      setIsPromoting(false);
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
          LEFT COLUMN: PRIVATE AI HISTORY PANEL
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
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search private sessions..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Middle: Sessions List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4">
          {isLoadingChats ? (
            <div className="p-4 text-center text-xs text-slate-400">Loading sessions...</div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-600">No private AI chats yet</p>
              <p>Click &quot;New chat&quot; to begin a private consultation session.</p>
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
                    Earlier
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
          CENTRE COLUMN: AI CONVERSATION
         ============================================================== */}
      <main className="flex-1 flex flex-col min-w-0 border-r border-slate-200/80 bg-slate-50/40 overflow-hidden">
        {/* Top Scope Pills Bar */}
        <div className="px-4 sm:px-5 py-2.5 border-b border-slate-200/80 bg-white shrink-0 shadow-2xs flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
              Scope
            </span>

            {scopes.map((scope) => {
              const isActive = activeScope.includes(scope.label);
              return (
                <button
                  key={scope.id}
                  type="button"
                  onClick={() => {
                    setActiveScope(scope.label);
                    showToast(`Scope switched to: ${scope.label}`);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs"
                      : "bg-slate-100/70 text-slate-600 hover:bg-slate-200/60 border border-transparent"
                  }`}
                >
                  {scope.label}
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70 shrink-0">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>Cryptographically Isolated</span>
          </div>
        </div>

        {/* Live Message History */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {isLoadingMessages ? (
            <div className="text-center text-xs text-slate-400 py-8">
              Loading consultation messages...
            </div>
          ) : liveMessages.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2 max-w-md mx-auto">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100 shadow-2xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Private Nexum AI Consultation</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ask questions about contractual scope, analyze deliverables, or draft replies. Nothing here is shared with clients unless you explicitly promote a draft.
              </p>
            </div>
          ) : (
            liveMessages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1`}
                >
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1 font-medium">
                    <span>{isUser ? "You (Private)" : msg.model || "Nexum AI"}</span>
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
                    {!isUser && (
                      <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 font-medium">Private advisory</span>
                        <button
                          type="button"
                          onClick={() => handleOpenPromoteModal(msg.content)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Promote to Client Thread</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

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
                  onClick={() => showToast("File attachment ready for consultation.")}
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
                "Is the requested feature scope creep?",
                "Draft a polite quote explanation",
                "Explain PayPal escrow release consensus",
                "Review deliverable acceptance criteria",
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

      {/* Explicit Promotion Confirmation Modal */}
      {isPromoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" />
                <span>Confirm Draft Promotion</span>
              </span>
              <button
                type="button"
                onClick={() => setIsPromoteModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are about to promote this private AI draft into a shared client thread. It will be sent under your identity and enter the standard mediation pipeline.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700">Destination Client Thread:</label>
              <select
                value={targetConversationId}
                onChange={(e) => setTargetConversationId(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
              >
                {availableConversations.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} — {c.counterpartName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700">Message Content to Send:</label>
              <textarea
                rows={3}
                value={draftToPromote}
                onChange={(e) => setDraftToPromote(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>Private advisory logs and hidden prompts remain strictly confidential.</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPromoteModalOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPromoting || !targetConversationId || !draftToPromote.trim()}
                onClick={handleConfirmPromote}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                {isPromoting ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm & Send to Client</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
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
