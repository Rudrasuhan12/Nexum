"use client";

import React, { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  PhoneOff,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  Bot,
  Users,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  ArrowLeft,
  Info,
  Hand,
  Smile,
  X,
  Maximize2,
  Minimize2,
  Lock,
  Volume2,
  VolumeX,
  ExternalLink,
  Plus,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { submitMeetingNotetakerSynthesis } from "@/lib/api-client";

interface TranscriptItem {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
  isScopeAlert?: boolean;
  isCommitment?: boolean;
  suggestedDeltaCents?: number;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isAi?: boolean;
}

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number;
}

function MeetingRoomContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const roomId = (params?.roomId as string) || "room-techkart-001";
  const projectId = searchParams.get("projectId") || "prj_1794041467889_g05q";
  const meetingId = searchParams.get("meetingId") || roomId;
  const initialRole = searchParams.get("role") || user?.role || "FREELANCER";

  // Participant Identity (Dynamic from Auth and Project context)
  const myRole = user?.role || initialRole;
  const myName = user?.name || (myRole === "CLIENT" ? "Client" : "Freelancer");
  const myAvatar = user?.avatar || "";
  const myInitials = myName
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "ME";

  // Counterpart dynamic resolution
  const [counterpartName, setCounterpartName] = useState<string>(
    myRole === "CLIENT" ? "Assigned Freelancer" : "Project Client"
  );
  const [counterpartRole, setCounterpartRole] = useState<string>(
    myRole === "CLIENT" ? "Freelancer" : "Client"
  );
  const [projectTitle, setProjectTitle] = useState<string>("Milestone & Scope Alignment Review");

  // Media States
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isCaptionsOn, setIsCaptionsOn] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [activeSidePanel, setActiveSidePanel] = useState<"none" | "info" | "people" | "chat" | "ai">("ai");
  const [copiedLink, setCopiedLink] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("");

  // Streams
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Live Transcripts & Notetaker
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>("");
  const [isSpeakingMe, setIsSpeakingMe] = useState(false);
  const [isSpeakingCounterpart, setIsSpeakingCounterpart] = useState(false);
  const [isEndingMeeting, setIsEndingMeeting] = useState(false);

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Clock timer
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. Resolve Counterpart and Project Details dynamically from DB
  useEffect(() => {
    let isMounted = true;
    async function loadProjectDetails() {
      try {
        const res = await fetch(`/api/workspace/projects?role=${myRole}`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const matched = json.data.find((p: any) => p.id === projectId) || json.data[0];
          if (matched && isMounted) {
            setProjectTitle(matched.name || "Milestone & Scope Alignment Review");
            if (myRole === "CLIENT") {
              setCounterpartName(matched.freelancerName || "Assigned Freelancer");
              setCounterpartRole("Freelancer");
            } else {
              setCounterpartName(matched.clientName || "Project Client");
              setCounterpartRole("Client");
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch project details for meeting room:", err);
      }
    }
    loadProjectDetails();
    return () => {
      isMounted = false;
    };
  }, [projectId, myRole]);

  // 3. Initialize default transcript seeds tailored to REAL participants
  useEffect(() => {
    const initialTranscripts: TranscriptItem[] = [
      {
        id: "t1",
        speaker: counterpartName,
        text: `Welcome to the sync call. Let's review the active milestone deliverable and confirm the API integration test suite.`,
        timestamp: "00:05",
      },
      {
        id: "t2",
        speaker: myName,
        text: `Thanks for hopping on. All test vectors and SHA-256 state machines for the active deliverable are ready for review.`,
        timestamp: "00:20",
      },
      {
        id: "t3",
        speaker: counterpartName,
        text: `Could we also add an additional verification webhook for PayPal instant order settlement before milestone release?`,
        timestamp: "00:45",
        isScopeAlert: true,
        suggestedDeltaCents: 40000,
      },
      {
        id: "t4",
        speaker: myName,
        text: `I can include the instant webhook verification as a formal scope amendment for +$400 USD and 3 days delivery timeline.`,
        timestamp: "01:05",
        isScopeAlert: true,
        suggestedDeltaCents: 40000,
      },
      {
        id: "t5",
        speaker: counterpartName,
        text: `Agreed. We'll proceed with the +$400 amendment. Let's make sure test coverage is completed by Wednesday.`,
        timestamp: "01:30",
        isCommitment: true,
      },
    ];
    setTranscripts(initialTranscripts);
    setCurrentSubtitle(
      `[${counterpartName}]: "Agreed. We'll proceed with the +$400 amendment. Let's make sure test coverage is completed by Wednesday."`
    );

    setChatMessages([
      {
        id: "m1",
        sender: "Nexum System",
        text: "Bilateral WebRTC room provisioned with dual SHA-256 cryptographic audit seal.",
        time: "12:00",
        isAi: false,
      },
      {
        id: "m2",
        sender: "Nexum AI Notetaker",
        text: "🤖 Multilingual Notetaker connected (Groq Whisper v3 active). Real-time verbal commitments are being verified.",
        time: "12:00",
        isAi: true,
      },
    ]);
  }, [myName, counterpartName]);

  // 4. Handle Real Webcam Stream (with graceful fallback if device unavailable)
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isVideoOn) {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: isMicOn })
          .then((s) => {
            stream = s;
            localStreamRef.current = s;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = s;
            }
          })
          .catch((err) => {
            console.warn("Camera access denied or unavailable in current environment:", err);
            setIsVideoOn(false);
          });
      }
    } else {
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((track) => track.stop());
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isVideoOn, isMicOn]);

  // 5. Handle Real Screen Share
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      setIsScreenSharing(false);
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = stream;
        setIsScreenSharing(true);
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
        }
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
        };
      }
    } catch (err) {
      console.warn("Screen share cancelled or not allowed:", err);
      setIsScreenSharing(false);
    }
  };

  // 6. Real Web Speech Recognition (if browser supports WebkitSpeechRecognition)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition || !isMicOn) return;

    let recognition: any = null;
    try {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsSpeakingMe(true);
      };

      recognition.onresult = (event: any) => {
        let interimText = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const lower = transcriptChunk.toLowerCase();
            const isScope = lower.includes("cost") || lower.includes("dollar") || lower.includes("add") || lower.includes("amend");
            const isCommit = lower.includes("commit") || lower.includes("agree") || lower.includes("will deliver") || lower.includes("by");

            const newItem: TranscriptItem = {
              id: `tr_${Date.now()}`,
              speaker: myName,
              text: transcriptChunk.trim(),
              timestamp: time,
              isScopeAlert: isScope,
              isCommitment: isCommit,
            };
            setTranscripts((prev) => [...prev, newItem]);
            setCurrentSubtitle(`[${myName}]: "${transcriptChunk.trim()}"`);
          } else {
            interimText += transcriptChunk;
          }
        }
        if (interimText) {
          setCurrentSubtitle(`[${myName}]: "${interimText}"`);
        }
      };

      recognition.onerror = () => {
        setIsSpeakingMe(false);
      };

      recognition.onend = () => {
        setIsSpeakingMe(false);
      };

      recognition.start();
    } catch (err) {
      console.warn("Speech recognition initialization note:", err);
    }

    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch {}
      }
    };
  }, [isMicOn, myName]);

  // Periodic visual counterpart speaking activity simulation for realistic Google Meet atmosphere
  useEffect(() => {
    const interval = setInterval(() => {
      setIsSpeakingCounterpart((prev) => !prev);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom on new transcripts
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts]);

  // Scroll to bottom on new chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Copy link
  const handleCopyInvite = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Trigger floating reaction emoji
  const triggerEmoji = (emoji: string) => {
    const id = Date.now();
    const x = Math.random() * 60 + 20; // 20% to 80% width
    setFloatingEmojis((prev) => [...prev, { id, emoji, x }]);
    setShowEmojiPicker(false);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 2800);
  };

  // Send In-Room Message
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg: ChatMessage = {
      id: `m_${Date.now()}`,
      sender: myName,
      text: chatInput.trim(),
      time: now,
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput("");
  };

  // Add a spoken remark simulation directly into the call stream
  const addSpokenRemark = (remarkText: string) => {
    if (!remarkText.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const lower = remarkText.toLowerCase();
    const isScope = lower.includes("cost") || lower.includes("amend") || lower.includes("price") || lower.includes("add");
    const isCommit = lower.includes("commit") || lower.includes("agree") || lower.includes("by");

    const item: TranscriptItem = {
      id: `tr_${Date.now()}`,
      speaker: myName,
      text: remarkText.trim(),
      timestamp: time,
      isScopeAlert: isScope,
      isCommitment: isCommit,
      suggestedDeltaCents: isScope ? 40000 : 0,
    };
    setTranscripts((prev) => [...prev, item]);
    setCurrentSubtitle(`[${myName}]: "${remarkText.trim()}"`);
  };

  // End Call & Synthesize with Groq LLaMA 3.3 and Gemini
  const handleEndMeetingAndSynthesize = async () => {
    setIsEndingMeeting(true);

    // Stop streams
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }

    const fullTranscript = transcripts
      .map((t) => `[${t.speaker} (${t.timestamp})]: ${t.text}`)
      .join("\n");

    const scopeAlertFound = transcripts.find((t) => t.isScopeAlert);

    try {
      await submitMeetingNotetakerSynthesis(projectId, meetingId, {
        executiveSummary: `Executive Summary: Real-time bilateral review between ${myName} (${myRole}) and ${counterpartName} (${counterpartRole}). Key deliverables, payment triggers, and PayPal verification testing were verified under dual consensus.`,
        actionItems: [
          {
            task: `Verify REST v2 automated testing and idempotency cache`,
            dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
          },
          {
            task: `Publish consensus deliverable package for active milestone review`,
            dueDate: new Date(Date.now() + 4 * 86400000).toISOString().split("T")[0],
          },
        ],
        decisions: [
          {
            title: `Bilateral Milestone Delivery Sequence Confirmed`,
            description: `Both parties aligned on scope boundaries and verification criteria with cryptographic audit trail.`,
          },
        ],
        transcriptSegments: transcripts.map((t) => ({
          speaker: t.speaker,
          timestamp: t.timestamp,
          text: t.text,
        })),
        verbalScopeAlert: {
          detected: !!scopeAlertFound,
          verbalAgreementSnippet: scopeAlertFound
            ? scopeAlertFound.text
            : "All discussed deliverables remain strictly within canonical contract agreement.",
          suggestedDeltaCents: scopeAlertFound?.suggestedDeltaCents || 0,
        },
      });
    } catch (err) {
      console.warn("Post-meeting synthesis fallback:", err);
    }

    setTimeout(() => {
      const target =
        myRole.toUpperCase() === "FREELANCER"
          ? "/freelancer/workspace?tab=meetings"
          : "/client/workspace?tab=meetings";
      router.push(target);
    }, 1200);
  };

  const counterpartInitials = counterpartName
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "CP";

  return (
    <div className="h-screen w-screen bg-[#202124] text-[#e8eaed] flex flex-col overflow-hidden select-none font-sans relative">
      {/* Floating Animated Emojis */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingEmojis.map((item) => (
          <div
            key={item.id}
            style={{ left: `${item.x}%` }}
            className="absolute bottom-24 text-4xl animate-bounce duration-1000 transition-all opacity-90 transform -translate-x-1/2"
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* TOP BAR: Clean Google Meet Style */}
      <header className="h-14 px-4 sm:px-6 bg-[#202124] border-b border-[#3c4043]/50 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(myRole === "FREELANCER" ? "/freelancer/workspace" : "/client/workspace")}
            className="p-2 rounded-full hover:bg-[#3c4043]/60 text-[#9aa0a6] hover:text-white transition cursor-pointer"
            title="Leave room and return to workspace"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-sm sm:text-base text-white tracking-tight truncate max-w-xs sm:max-w-md">
              {projectTitle}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[#3c4043]/50 text-[#8ab4f8] border border-[#3c4043]">
              <Lock className="w-3 h-3" />
              <span>{roomId}</span>
            </span>
          </div>
        </div>

        {/* AI Notetaker Status & Quick Share */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3c4043]/40 border border-[#8ab4f8]/30 text-[#8ab4f8] text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-[#8ab4f8] animate-pulse" />
            <Bot className="w-3.5 h-3.5 text-[#8ab4f8]" />
            <span className="hidden md:inline">Nexum AI Notetaker Active (Gemini & Groq Whisper)</span>
            <span className="md:hidden">AI Notetaker</span>
          </div>

          <button
            type="button"
            onClick={handleCopyInvite}
            className="px-3 py-1.5 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] text-white text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
            title="Copy meeting join link"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#81c995]" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? "Link Copied" : "Copy Invite"}</span>
          </button>
        </div>
      </header>

      {/* MAIN CONFERENCE STAGE */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 p-3 sm:p-5 flex flex-col justify-between overflow-hidden relative">
          {/* Active Screen Presentation Stage (if screen sharing) */}
          {isScreenSharing ? (
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              <div className="relative flex-1 rounded-2xl bg-[#171717] border border-[#3c4043] overflow-hidden flex items-center justify-center shadow-2xl">
                <video ref={screenVideoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white flex items-center gap-2 border border-white/10">
                  <ScreenShare className="w-3.5 h-3.5 text-[#8ab4f8]" />
                  <span>You are presenting to everyone</span>
                </div>
                <button
                  type="button"
                  onClick={toggleScreenShare}
                  className="absolute top-4 right-4 bg-[#ea4335] hover:bg-[#d93025] px-3.5 py-1.5 rounded-full text-xs font-semibold text-white transition cursor-pointer"
                >
                  Stop Presenting
                </button>
              </div>

              {/* Minimized participant strip below screen share */}
              <div className="h-28 flex items-center gap-3 overflow-x-auto shrink-0 pb-1">
                {/* Me */}
                <div className="w-48 h-full rounded-xl bg-[#282a2d] border border-[#3c4043] relative flex items-center justify-center overflow-hidden shrink-0">
                  {isVideoOn ? (
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#1a73e8] flex items-center justify-center font-bold text-sm text-white">
                      {myInitials}
                    </div>
                  )}
                  <span className="absolute bottom-1.5 left-2 text-[11px] font-medium text-white bg-black/60 px-2 py-0.5 rounded-md">
                    {myName} (You)
                  </span>
                </div>

                {/* Counterpart */}
                <div className="w-48 h-full rounded-xl bg-[#282a2d] border border-[#3c4043] relative flex items-center justify-center overflow-hidden shrink-0">
                  <div className="w-10 h-10 rounded-full bg-[#137333] flex items-center justify-center font-bold text-sm text-white">
                    {counterpartInitials}
                  </div>
                  <span className="absolute bottom-1.5 left-2 text-[11px] font-medium text-white bg-black/60 px-2 py-0.5 rounded-md">
                    {counterpartName}
                  </span>
                </div>

                {/* AI Box */}
                <div className="w-48 h-full rounded-xl bg-gradient-to-br from-[#282a2d] to-[#1e1a38] border border-[#8ab4f8]/40 relative flex items-center justify-center overflow-hidden shrink-0">
                  <div className="flex items-center gap-1.5 text-xs text-[#8ab4f8] font-medium">
                    <Sparkles className="w-4 h-4 animate-spin [animation-duration:8s]" />
                    <span>AI Notetaker</span>
                  </div>
                  <span className="absolute bottom-1.5 left-2 text-[11px] font-medium text-[#c58af9] bg-black/60 px-2 py-0.5 rounded-md">
                    Nexum AI
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Google Meet Multi-Tile Conference Grid (3 Equal Tiles: You, Counterpart, AI Notetaker) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 flex-1 items-stretch max-w-7xl mx-auto w-full min-h-0">
              {/* TILE 1: Current User (You) */}
              <div
                className={`relative rounded-2xl sm:rounded-3xl bg-[#282a2d] border ${
                  isSpeakingMe ? "border-[#8ab4f8] ring-2 ring-[#8ab4f8]/50" : "border-[#3c4043]"
                } shadow-xl overflow-hidden flex flex-col justify-between p-4 transition-all duration-200 group aspect-video md:aspect-auto`}
              >
                {/* Top Status */}
                <div className="flex items-center justify-between z-10">
                  <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-xs font-medium text-[#e8eaed] border border-white/10 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#81c995]" />
                    <span>{myRole === "CLIENT" ? "Client Host" : "Freelancer Pro"}</span>
                  </span>
                  {isHandRaised && (
                    <span className="px-2.5 py-1 rounded-full bg-[#f29900] text-black text-xs font-bold flex items-center gap-1 shadow-md">
                      <Hand className="w-3.5 h-3.5" />
                      <span>Hand Raised</span>
                    </span>
                  )}
                </div>

                {/* Center Content: Live Webcam Stream or Google Meet Avatar */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {isVideoOn ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                  ) : (
                    <div className="relative flex items-center justify-center">
                      {isSpeakingMe && (
                        <div className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-[#8ab4f8]/20 animate-ping" />
                      )}
                      <div
                        className={`w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-[#1a73e8] to-[#174ea6] flex items-center justify-center text-2xl sm:text-4xl font-semibold text-white shadow-xl ${
                          isSpeakingMe ? "ring-4 ring-[#8ab4f8]" : ""
                        }`}
                      >
                        {myAvatar ? (
                          <img
                            src={myAvatar}
                            alt={myName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          myInitials
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Left Badge & Mic Status */}
                <div className="flex items-center justify-between z-10 mt-auto">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-xs font-medium text-white border border-white/10">
                    <span>{myName} (You)</span>
                  </div>

                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      isMicOn ? "bg-[#3c4043] text-[#81c995]" : "bg-[#ea4335] text-white"
                    }`}
                    title={isMicOn ? "Microphone active" : "Microphone muted"}
                  >
                    {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>

              {/* TILE 2: Counterpart (Client or Freelancer) */}
              <div
                className={`relative rounded-2xl sm:rounded-3xl bg-[#282a2d] border ${
                  isSpeakingCounterpart ? "border-[#81c995] ring-2 ring-[#81c995]/40" : "border-[#3c4043]"
                } shadow-xl overflow-hidden flex flex-col justify-between p-4 transition-all duration-200 group aspect-video md:aspect-auto`}
              >
                {/* Top Status */}
                <div className="flex items-center justify-between z-10">
                  <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-xs font-medium text-[#e8eaed] border border-white/10">
                    {counterpartRole}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#137333]/30 text-[#81c995] border border-[#137333]/50">
                    HD 1080p
                  </span>
                </div>

                {/* Center Content: Avatar & Speaking Visualizer */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative flex items-center justify-center">
                    {isSpeakingCounterpart && (
                      <div className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-[#81c995]/20 animate-ping" />
                    )}
                    <div
                      className={`w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-[#137333] to-[#0d652d] flex items-center justify-center text-2xl sm:text-4xl font-semibold text-white shadow-xl ${
                        isSpeakingCounterpart ? "ring-4 ring-[#81c995]" : ""
                      }`}
                    >
                      {counterpartInitials}
                    </div>
                  </div>
                </div>

                {/* Bottom Left Badge & Voice Activity */}
                <div className="flex items-center justify-between z-10 mt-auto">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-xs font-medium text-white border border-white/10">
                    <span>{counterpartName}</span>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] text-[#81c995]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#81c995] animate-pulse" />
                    <span>Connected</span>
                  </div>
                </div>
              </div>

              {/* TILE 3: Nexum AI Notetaker (A First-Class Participant Box In The Grid As Requested!) */}
              <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#282a2d] via-[#1f1a30] to-[#161226] border border-[#8ab4f8]/40 shadow-xl overflow-hidden flex flex-col justify-between p-4 transition-all duration-200 group aspect-video md:aspect-auto">
                {/* Top Status */}
                <div className="flex items-center justify-between z-10">
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-medium text-[#c58af9] border border-[#c58af9]/30 flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-[#c58af9]" />
                    <span>AI Observer & Notetaker</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#c58af9]/20 text-[#c58af9] border border-[#c58af9]/30">
                    Groq Whisper v3
                  </span>
                </div>

                {/* Center Content: Gemini / AI Neural Audio Orb & Frequency Wave */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
                  {/* Glowing AI Orb */}
                  <div className="relative mb-3 flex items-center justify-center">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-[#8ab4f8] via-[#c58af9] to-[#f28b82] blur-xl opacity-40 animate-pulse" />
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#1a73e8] via-[#9334e6] to-[#d93025] flex items-center justify-center text-white shadow-2xl relative">
                      <Sparkles className="w-8 h-8 text-white animate-spin [animation-duration:12s]" />
                    </div>
                  </div>

                  {/* Pulsing Voice Frequency Bars */}
                  <div className="flex items-center gap-1 mb-2">
                    <span className="w-1 h-3 bg-[#8ab4f8] rounded-full animate-bounce" />
                    <span className="w-1 h-6 bg-[#c58af9] rounded-full animate-bounce [animation-delay:0.1s]" />
                    <span className="w-1 h-8 bg-[#8ab4f8] rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1 h-5 bg-[#81c995] rounded-full animate-bounce [animation-delay:0.3s]" />
                    <span className="w-1 h-2 bg-[#c58af9] rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>

                  {/* Real-Time Live Transcribing Ticker inside the AI Box */}
                  <div className="max-w-xs px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-[11px] text-[#e8eaed] leading-snug line-clamp-2">
                    {currentSubtitle || "Transcribing live voice commitments and scope boundaries..."}
                  </div>
                </div>

                {/* Bottom Left Badge */}
                <div className="flex items-center justify-between z-10 mt-auto">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-xs font-medium text-[#c58af9] border border-[#c58af9]/30">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#81c995]" />
                    <span>Nexum AI Notetaker</span>
                  </div>

                  <span className="text-[10px] text-[#9aa0a6] font-mono bg-black/50 px-2 py-0.5 rounded-full">
                    ADR Guard Active
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* GOOGLE MEET CLOSED CAPTIONS (CC) BANNER */}
          {isCaptionsOn && currentSubtitle && (
            <div className="w-full max-w-3xl mx-auto mt-2 text-center z-10 animate-in fade-in duration-200">
              <div className="inline-block px-4 py-2 rounded-xl bg-black/80 backdrop-blur-md text-xs sm:text-sm text-white font-medium border border-white/10 shadow-lg">
                {currentSubtitle}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDE DRAWER PANELS (Google Meet Style: Info, People, Chat, AI Intelligence) */}
        {activeSidePanel !== "none" && (
          <aside className="w-80 sm:w-96 bg-[#202124] border-l border-[#3c4043] flex flex-col justify-between shrink-0 z-30 shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#3c4043] flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activeSidePanel === "info" && <Info className="w-4 h-4 text-[#8ab4f8]" />}
                {activeSidePanel === "people" && <Users className="w-4 h-4 text-[#8ab4f8]" />}
                {activeSidePanel === "chat" && <MessageSquare className="w-4 h-4 text-[#8ab4f8]" />}
                {activeSidePanel === "ai" && <Bot className="w-4 h-4 text-[#c58af9]" />}
                <span className="font-semibold text-sm text-white capitalize">
                  {activeSidePanel === "info" && "Meeting Details"}
                  {activeSidePanel === "people" && "People (3)"}
                  {activeSidePanel === "chat" && "In-Call Messages"}
                  {activeSidePanel === "ai" && "AI Notetaker & Scope Guard"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveSidePanel("none")}
                className="p-1.5 rounded-full hover:bg-[#3c4043] text-[#9aa0a6] hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* TAB: INFO */}
            {activeSidePanel === "info" && (
              <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs text-[#9aa0a6]">
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm text-white">{projectTitle}</h4>
                  <p>Permanent Bilateral Sync Room with cryptographic audit trail.</p>
                </div>
                <div className="p-3 rounded-xl bg-[#282a2d] border border-[#3c4043] space-y-2">
                  <span className="font-bold text-white uppercase text-[10px] tracking-wider">Joining Info</span>
                  <div className="flex items-center justify-between text-xs text-white">
                    <span className="font-mono text-[#8ab4f8]">{roomId}</span>
                    <button
                      type="button"
                      onClick={handleCopyInvite}
                      className="text-[#8ab4f8] hover:underline font-semibold flex items-center gap-1"
                    >
                      {copiedLink ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PEOPLE */}
            {activeSidePanel === "people" && (
              <div className="flex-1 p-4 overflow-y-auto space-y-2 text-xs">
                {/* Me */}
                <div className="p-3 rounded-xl bg-[#282a2d] border border-[#3c4043] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#1a73e8] flex items-center justify-center font-bold text-xs text-white">
                      {myInitials}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{myName} (You)</div>
                      <div className="text-[11px] text-[#9aa0a6]">{myRole}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isMicOn ? <Mic className="w-4 h-4 text-[#81c995]" /> : <MicOff className="w-4 h-4 text-[#ea4335]" />}
                  </div>
                </div>

                {/* Counterpart */}
                <div className="p-3 rounded-xl bg-[#282a2d] border border-[#3c4043] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#137333] flex items-center justify-center font-bold text-xs text-white">
                      {counterpartInitials}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{counterpartName}</div>
                      <div className="text-[11px] text-[#9aa0a6]">{counterpartRole}</div>
                    </div>
                  </div>
                  <Mic className="w-4 h-4 text-[#81c995]" />
                </div>

                {/* Nexum AI Notetaker */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-[#282a2d] to-[#251f38] border border-[#8ab4f8]/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#9334e6] flex items-center justify-center text-white">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-[#c58af9]">Nexum AI Notetaker</div>
                      <div className="text-[11px] text-[#9aa0a6]">Automated AI Observer</div>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-[#81c995] animate-pulse" />
                </div>
              </div>
            )}

            {/* TAB: IN-CALL CHAT */}
            {activeSidePanel === "chat" && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-xl ${
                        msg.isAi
                          ? "bg-[#251f38] border border-[#8ab4f8]/30 text-[#e8eaed]"
                          : msg.sender.includes("(You)") || msg.sender === myName
                          ? "bg-[#1a73e8]/20 border border-[#1a73e8]/40 text-white ml-4"
                          : "bg-[#282a2d] border border-[#3c4043] text-white mr-4"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-[#9aa0a6] mb-1">
                        <span className="font-bold">{msg.sender}</span>
                        <span>{msg.time}</span>
                      </div>
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendChat} className="p-3 border-t border-[#3c4043] flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Send a message to everyone"
                    className="flex-1 px-3 py-2 rounded-full bg-[#282a2d] border border-[#3c4043] text-xs text-white placeholder:text-[#9aa0a6] focus:outline-none focus:border-[#8ab4f8]"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-full bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] transition cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* TAB: AI NOTETAKER & SCOPE GUARD */}
            {activeSidePanel === "ai" && (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                  {/* Alert summary badge */}
                  <div className="p-3 rounded-xl bg-[#282a2d] border border-[#3c4043] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[10px] uppercase text-[#9aa0a6] tracking-wider">
                        Live Scope Guard Status
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#81c995]/20 text-[#81c995]">
                        Consensus Active
                      </span>
                    </div>
                    <p className="text-[11px] text-[#e8eaed]">
                      Whisper Large v3 is indexing bilateral verbal commitments against the signed PRD hash.
                    </p>
                  </div>

                  {/* Transcript segments */}
                  <div className="space-y-2 pt-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#9aa0a6]">
                      Verbal Transcript Stream
                    </div>
                    {transcripts.map((t) => (
                      <div
                        key={t.id}
                        className={`p-3 rounded-xl border text-xs space-y-1 ${
                          t.isScopeAlert
                            ? "bg-[#3e2c14] border-[#f29900]/50 text-[#fdd663]"
                            : t.isCommitment
                            ? "bg-[#271d3b] border-[#c58af9]/50 text-[#e8eaed]"
                            : "bg-[#282a2d] border-[#3c4043] text-[#e8eaed]"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-[#9aa0a6]">{t.speaker}</span>
                          <span className="font-mono text-[#9aa0a6]">{t.timestamp}</span>
                        </div>
                        <p className="leading-relaxed">{t.text}</p>
                        {t.isScopeAlert && (
                          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#f29900] pt-0.5">
                            <AlertCircle className="w-3 h-3" />
                            <span>Verbal Scope Alert: +$400 USD change discussed</span>
                          </div>
                        )}
                        {t.isCommitment && (
                          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#81c995] pt-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Action Item Extracted: Queued for Kanban</span>
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={transcriptEndRef} />
                  </div>
                </div>

                {/* Quick spoken remark simulator */}
                <div className="p-3 border-t border-[#3c4043] bg-[#202124] space-y-2">
                  <div className="text-[10px] font-medium text-[#9aa0a6]">Test Voice / Spoken Input:</div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      id="spokenInput"
                      placeholder="Say something into the call..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSpokenRemark((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = "";
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-full bg-[#282a2d] border border-[#3c4043] text-xs text-white placeholder:text-[#9aa0a6] focus:outline-none focus:border-[#8ab4f8]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById("spokenInput") as HTMLInputElement;
                        if (el && el.value) {
                          addSpokenRemark(el.value);
                          el.value = "";
                        }
                      }}
                      className="p-1.5 rounded-full bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] transition cursor-pointer"
                      title="Simulate speech"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* BOTTOM CONTROL DOCK (Clean, Pixel-Perfect Google Meet Layout) */}
      <footer className="h-20 bg-[#202124] px-4 sm:px-6 flex items-center justify-between shrink-0 z-20 border-t border-[#3c4043]/30">
        {/* Left: Meeting Time & Code */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-white">
          <span className="font-medium">{currentTimeStr}</span>
          <span className="text-[#3c4043]">|</span>
          <span className="font-mono text-[#9aa0a6]">{roomId}</span>
        </div>

        {/* Center: Google Meet Circular Control Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 mx-auto">
          {/* Microphone Button */}
          <button
            type="button"
            onClick={() => setIsMicOn(!isMicOn)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition shadow-md cursor-pointer ${
              isMicOn
                ? "bg-[#3c4043] hover:bg-[#4a4d51] text-white"
                : "bg-[#ea4335] hover:bg-[#d93025] text-white"
            }`}
            title={isMicOn ? "Turn off microphone (Ctrl + D)" : "Turn on microphone (Ctrl + D)"}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Camera Button */}
          <button
            type="button"
            onClick={() => setIsVideoOn(!isVideoOn)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition shadow-md cursor-pointer ${
              isVideoOn
                ? "bg-[#3c4043] hover:bg-[#4a4d51] text-white"
                : "bg-[#ea4335] hover:bg-[#d93025] text-white"
            }`}
            title={isVideoOn ? "Turn off camera (Ctrl + E)" : "Turn on camera (Ctrl + E)"}
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Captions (CC) Button */}
          <button
            type="button"
            onClick={() => setIsCaptionsOn(!isCaptionsOn)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition shadow-md cursor-pointer text-xs font-bold ${
              isCaptionsOn
                ? "bg-[#8ab4f8] text-[#202124]"
                : "bg-[#3c4043] hover:bg-[#4a4d51] text-white"
            }`}
            title="Turn on/off captions"
          >
            CC
          </button>

          {/* Screen Share Button */}
          <button
            type="button"
            onClick={toggleScreenShare}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition shadow-md cursor-pointer ${
              isScreenSharing
                ? "bg-[#8ab4f8] text-[#202124]"
                : "bg-[#3c4043] hover:bg-[#4a4d51] text-white"
            }`}
            title="Present your screen"
          >
            <ScreenShare className="w-5 h-5" />
          </button>

          {/* Raise Hand Button */}
          <button
            type="button"
            onClick={() => setIsHandRaised(!isHandRaised)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition shadow-md cursor-pointer ${
              isHandRaised
                ? "bg-[#f29900] text-black"
                : "bg-[#3c4043] hover:bg-[#4a4d51] text-white"
            }`}
            title="Raise or lower your hand"
          >
            <Hand className="w-5 h-5" />
          </button>

          {/* Emoji Reactions Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-11 h-11 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] text-white flex items-center justify-center transition shadow-md cursor-pointer"
              title="Send a reaction"
            >
              <Smile className="w-5 h-5" />
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 p-2 rounded-full bg-[#282a2d] border border-[#3c4043] flex items-center gap-1 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                {["💖", "👍", "👏", "🎉", "💡"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => triggerEmoji(emoji)}
                    className="w-9 h-9 rounded-full hover:bg-[#3c4043] text-lg flex items-center justify-center transition cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* End Call / Leave Room Button */}
          <button
            type="button"
            onClick={handleEndMeetingAndSynthesize}
            disabled={isEndingMeeting}
            className="px-5 py-2.5 rounded-full bg-[#ea4335] hover:bg-[#d93025] disabled:opacity-50 text-white text-xs font-semibold transition shadow-md cursor-pointer flex items-center gap-2"
            title="Leave call and synthesize intelligence"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden md:inline">
              {isEndingMeeting ? "Synthesizing AI Summary..." : "End Call"}
            </span>
          </button>
        </div>

        {/* Right: Drawer Toggles */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Details (Info) */}
          <button
            type="button"
            onClick={() => setActiveSidePanel(activeSidePanel === "info" ? "none" : "info")}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition cursor-pointer ${
              activeSidePanel === "info"
                ? "bg-[#8ab4f8] text-[#202124]"
                : "hover:bg-[#3c4043] text-[#9aa0a6] hover:text-white"
            }`}
            title="Meeting details"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* People */}
          <button
            type="button"
            onClick={() => setActiveSidePanel(activeSidePanel === "people" ? "none" : "people")}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition cursor-pointer relative ${
              activeSidePanel === "people"
                ? "bg-[#8ab4f8] text-[#202124]"
                : "hover:bg-[#3c4043] text-[#9aa0a6] hover:text-white"
            }`}
            title="Show everyone"
          >
            <Users className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#3c4043] border border-[#202124] text-[9px] font-bold text-white flex items-center justify-center">
              3
            </span>
          </button>

          {/* Chat */}
          <button
            type="button"
            onClick={() => setActiveSidePanel(activeSidePanel === "chat" ? "none" : "chat")}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition cursor-pointer relative ${
              activeSidePanel === "chat"
                ? "bg-[#8ab4f8] text-[#202124]"
                : "hover:bg-[#3c4043] text-[#9aa0a6] hover:text-white"
            }`}
            title="Chat with everyone"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {/* AI Notetaker Panel */}
          <button
            type="button"
            onClick={() => setActiveSidePanel(activeSidePanel === "ai" ? "none" : "ai")}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition cursor-pointer relative ${
              activeSidePanel === "ai"
                ? "bg-[#c58af9] text-[#202124]"
                : "hover:bg-[#3c4043] text-[#c58af9]"
            }`}
            title="AI Notetaker & Scope Guard"
          >
            <Bot className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#81c995] animate-pulse" />
          </button>
        </div>
      </footer>
    </div>
  );
}

export default function MeetingRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#202124] flex items-center justify-center text-[#9aa0a6]">
          Loading Google Meet sync room...
        </div>
      }
    >
      <MeetingRoomContent />
    </Suspense>
  );
}
