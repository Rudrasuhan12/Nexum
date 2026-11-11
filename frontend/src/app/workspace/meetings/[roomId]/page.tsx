"use client";

import React, { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Mic, MicOff, Video, VideoOff, ScreenShare, PhoneOff,
  MessageSquare, Users, CheckCircle2, AlertCircle, Copy,
  Check, Send, ArrowLeft, Info, Hand, Smile, X,
  ShieldCheck, Bot, Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWebRTC } from "@/hooks/useWebRTC";
import { submitMeetingNotetakerSynthesis } from "@/lib/api-client";

// ─── Real-Time Caption Lexicon Polisher ──────────────────────────────────────
// Normalizes technical terms, currency, and capitalization with sub-millisecond latency.
function polishTranscript(raw: string): string {
  if (!raw) return "";
  let text = raw.trim();
  text = text.charAt(0).toUpperCase() + text.slice(1);
  const replacements: [RegExp, string][] = [
    [/\bpay\s*pal\b/gi, "PayPal"],
    [/\bgit\s*hub\b/gi, "GitHub"],
    [/\bsha\s*256\b/gi, "SHA-256"],
    [/\bnext\s*js\b/gi, "Next.js"],
    [/\bweb\s*rtc\b/gi, "WebRTC"],
    [/\bweb\s*hook(s?)\b/gi, "webhook$1"],
    [/\bui\b/gi, "UI"],
    [/\bapi\b/gi, "API"],
    [/\bapis\b/gi, "APIs"],
    [/\bprd\b/gi, "PRD"],
    [/\bpull\s*request\b/gi, "Pull Request"],
    [/\bescrow\b/gi, "Escrow"],
  ];
  for (const [pattern, rep] of replacements) {
    text = text.replace(pattern, rep);
  }
  return text;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "??";
}

function AvatarCircle({
  name, src, size = "lg", speaking = false,
}: {
  name: string; src?: string; size?: "sm" | "md" | "lg"; speaking?: boolean;
}) {
  const dim = size === "sm" ? "w-9 h-9 text-xs" : size === "md" ? "w-14 h-14 text-base" : "w-24 h-24 text-3xl";
  return (
    <div className={`relative ${dim}`}>
      {speaking && (
        <div className={`absolute inset-0 rounded-full bg-white/20 animate-ping`} />
      )}
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${dim} rounded-full object-cover ring-2 ${speaking ? "ring-white" : "ring-transparent"} transition-all`}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <div
          className={`${dim} rounded-full bg-[#444746] flex items-center justify-center font-semibold text-[#e3e3e3] ring-2 ${speaking ? "ring-white" : "ring-transparent"} transition-all`}
        >
          {initials(name)}
        </div>
      )}
    </div>
  );
}

function NexumAIOrb({ speaking }: { speaking?: boolean }) {
  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      {speaking && <div className="absolute inset-0 rounded-full bg-[#8ab4f8]/20 animate-ping" />}
      <img src="/logo.png" alt="Nexum AI" className="w-20 h-20 rounded-full object-cover ring-2 ring-[#8ab4f8]/60" />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

function MeetingRoomContent() {
  const { roomId: rawRoomId } = useParams() as { roomId: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const roomId = rawRoomId || "room-default";
  const projectId = searchParams.get("projectId") || "";
  const meetingId = searchParams.get("meetingId") || roomId;
  const myRole = (user?.role || searchParams.get("role") || "FREELANCER").toUpperCase();
  const myName = user?.name || (myRole === "CLIENT" ? "Client" : "Freelancer");
  const myAvatar = user?.avatar || "";
  const myId = user?.id || `${myRole}_${Date.now()}`;
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

  // ─── WebRTC hook ─────────────────────────────────────────────────────────────
  const {
    localStream, remoteStream, remotePeers, isConnected,
    isMicOn, isVideoOn, isScreenSharing,
    isSpeakingMe, isSpeakingRemote,
    toggleMic, toggleVideo, toggleScreenShare, hangUp,
    chatMessages, captions, liveCaption,
    sendChat, sendCaption, sendReaction,
  } = useWebRTC({
    roomId, userId: myId, userName: myName, role: myRole, avatar: myAvatar, backendUrl,
  });

  // ─── Media Element refs ──────────────────────────────────────────────────────
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const captionsEndRef = useRef<HTMLDivElement>(null);

  // ─── UI State ────────────────────────────────────────────────────────────────
  const [sidePanel, setSidePanel] = useState<"none" | "people" | "chat" | "ai">("none");
  const [chatInput, setChatInput] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const [isCCOn, setIsCCOn] = useState(true);
  const [isEndingMeeting, setIsEndingMeeting] = useState(false);
  const [clockStr, setClockStr] = useState("");
  const [projectTitle, setProjectTitle] = useState("Bilateral Sync Call");
  const [counterpartName, setCounterpartName] = useState("Waiting for other participant...");
  const [audioAutoplayBlocked, setAudioAutoplayBlocked] = useState(false);

  const unlockAudio = useCallback(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = 1.0;
      remoteAudioRef.current
        .play()
        .then(() => {
          setAudioAutoplayBlocked(false);
        })
        .catch(() => {});
    }
  }, []);

  // ─── Auto-unlock audio on any first user interaction (Google Meet standard) ─
  useEffect(() => {
    const handleFirstInteraction = () => {
      unlockAudio();
    };
    window.addEventListener("click", handleFirstInteraction, { once: true });
    window.addEventListener("keydown", handleFirstInteraction, { once: true });
    window.addEventListener("touchstart", handleFirstInteraction, { once: true });
    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, [unlockAudio]);

  // ─── Clock ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => setClockStr(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ─── Load project metadata ────────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/workspace/projects?role=${myRole}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          const p = json.data.find((x: any) => x.id === projectId) || json.data[0];
          if (p) {
            setProjectTitle(p.name || "Bilateral Sync Call");
            setCounterpartName(
              myRole === "CLIENT" ? p.freelancerName : p.clientName
            );
          }
        }
      })
      .catch(() => {});
  }, [projectId, myRole]);

  // ─── Update counterpart name from live WebRTC peers ─────────────────────────
  useEffect(() => {
    if (remotePeers.size > 0) {
      const first = Array.from(remotePeers.values())[0];
      if (first.userName) setCounterpartName(first.userName);
    }
  }, [remotePeers]);

  // ─── Wire local stream to <video> ────────────────────────────────────────────
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
    }
  }, [localStream, isVideoOn]);

  // ─── Wire remote stream to <video> and dedicated <audio> ─────────────────────
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      if (remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    }
    if (remoteAudioRef.current && remoteStream) {
      if (remoteAudioRef.current.srcObject !== remoteStream) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = 1.0;
      const playPromise = remoteAudioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setAudioAutoplayBlocked(false);
          })
          .catch((err) => {
            console.warn("[MeetingRoom] Remote audio play blocked by browser autoplay policy:", err);
            setAudioAutoplayBlocked(true);
          });
      }
    }
  }, [remoteStream]);

  // ─── Auto-scroll chat and captions ───────────────────────────────────────────
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);
  useEffect(() => { captionsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [captions]);

  // ─── Continuous High-Accuracy Web Speech Recognition for live CC ──────────────
  const isMicOnRef = useRef(isMicOn);
  useEffect(() => {
    isMicOnRef.current = isMicOn;
  }, [isMicOn]);

  useEffect(() => {
    if (!isMicOn || typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    let recognition: any;
    let isStoppedManually = false;

    const startRecognizer = () => {
      try {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        // Prioritize global English acoustic model for highest technical & conversational accuracy
        recognition.lang = "en-US";
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const raw = event.results[i][0].transcript;
            const polished = polishTranscript(raw);
            const isFinal = event.results[i].isFinal;
            const lower = raw.toLowerCase();
            const isScope = /\$|\b(cost|price|dollar|usd|amend|amendment|extra|add feature|out of scope|change scope)\b/i.test(lower);
            const isCommit = /\b(commit|agree|agreed|will deliver|by monday|by tuesday|by wednesday|by thursday|by friday|by next week|tomorrow)\b/i.test(lower);
            sendCaption(polished, isFinal, isScope, isCommit);
          }
        };

        recognition.onerror = (e: any) => {
          if (e.error === "not-allowed") {
            console.warn("[CC] Speech recognition: microphone permission required");
          }
        };

        // Auto-restart on natural pause so live captions never stop mid-meeting
        recognition.onend = () => {
          if (!isStoppedManually && isMicOnRef.current) {
            try {
              recognition.start();
            } catch {}
          }
        };

        recognition.start();
      } catch (err) {
        console.warn("[CC] Speech recognition init failed:", err);
      }
    };

    startRecognizer();

    return () => {
      isStoppedManually = true;
      try { recognition?.stop(); } catch {}
    };
  }, [isMicOn, sendCaption]);

  // ─── Floating emoji ───────────────────────────────────────────────────────────
  const triggerEmoji = (emoji: string) => {
    const id = Date.now();
    const x = 20 + Math.random() * 60;
    setFloatingEmojis((prev) => [...prev, { id, emoji, x }]);
    sendReaction(emoji);
    setShowEmoji(false);
    setTimeout(() => setFloatingEmojis((prev) => prev.filter((e) => e.id !== id)), 2500);
  };

  // ─── Copy invite link ─────────────────────────────────────────────────────────
  const copyInvite = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // ─── End call ────────────────────────────────────────────────────────────────
  const endCall = async () => {
    setIsEndingMeeting(true);
    hangUp();
    if (projectId && meetingId) {
      try {
        await submitMeetingNotetakerSynthesis(projectId, meetingId, {
          executiveSummary: `Bilateral sync call between ${myName} and ${counterpartName} for project: ${projectTitle}.`,
          actionItems: captions
            .filter((c) => c.isCommitment)
            .map((c) => ({ task: c.text, dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0] })),
          decisions: captions
            .filter((c) => c.isScopeAlert)
            .map((c) => ({ title: "Scope Discussion", description: c.text })),
          transcriptSegments: captions.map((c) => ({
            speaker: c.fromUserName,
            timestamp: new Date(c.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            text: c.text,
          })),
          verbalScopeAlert: {
            detected: captions.some((c) => c.isScopeAlert),
            verbalAgreementSnippet: captions.find((c) => c.isScopeAlert)?.text || "No verbal scope changes detected.",
            suggestedDeltaCents: 0,
          },
        });
      } catch (err) {
        console.warn("Post-call synthesis:", err);
      }
    }
    setTimeout(() => {
      router.push(myRole === "FREELANCER" ? "/freelancer/workspace?tab=meetings" : "/client/workspace?tab=meetings");
    }, 800);
  };

  // ─── Remote participant info ──────────────────────────────────────────────────
  const remotePeerArr = Array.from(remotePeers.values());
  const remotePeer = remotePeerArr[0] ?? null;

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      onClick={unlockAudio}
      className="h-screen w-screen bg-[#202124] text-[#e3e3e3] flex flex-col overflow-hidden font-sans select-none"
    >
      {/* ── Dedicated Remote Audio Sink (Always mounted, sr-only, NEVER display:none) ── */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        controls={false}
        style={{
          position: "fixed",
          top: "-9999px",
          left: "-9999px",
          width: "1px",
          height: "1px",
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      {/* ── Browser Autoplay Audio Unlock Banner ────────────────────────────── */}
      {audioAutoplayBlocked && (
        <div
          onClick={unlockAudio}
          className="bg-[#ea4335] text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer z-50 animate-pulse hover:bg-[#d93025] transition"
        >
          <span>🔇 Incoming audio is paused by your browser. Click anywhere on this screen to enable audio.</span>
        </div>
      )}

      {/* ── Floating Emoji Reactions ─────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingEmojis.map((item) => (
          <span
            key={item.id}
            style={{ left: `${item.x}%` }}
            className="absolute bottom-28 text-4xl animate-bounce pointer-events-none"
          >
            {item.emoji}
          </span>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TOP BAR
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="h-14 px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(myRole === "FREELANCER" ? "/freelancer/workspace" : "/client/workspace")}
            className="p-2 rounded-full hover:bg-[#3c4043] text-[#9aa0a6] hover:text-white transition cursor-pointer"
            title="Return to workspace"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-medium text-sm text-white truncate max-w-xs md:max-w-md">
            {projectTitle}
          </span>
          <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono text-[#9aa0a6] bg-[#3c4043]/50 border border-[#3c4043]">
            <Lock className="w-3 h-3" />
            {roomId}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Connection indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3c4043]/40 text-xs font-medium">
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-[#81c995]" : "bg-[#f28b82]"} animate-pulse`} />
            <span className="text-[#9aa0a6]">{isConnected ? "Connected" : "Connecting..."}</span>
          </div>

          <button
            type="button"
            onClick={copyInvite}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] text-sm font-medium transition cursor-pointer"
          >
            {copiedLink ? <Check className="w-4 h-4 text-[#81c995]" /> : <Copy className="w-4 h-4" />}
            <span className="hidden sm:inline text-sm">{copiedLink ? "Copied" : "Copy invite"}</span>
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          VIDEO STAGE
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col p-2 md:p-4 gap-2 md:gap-3 overflow-hidden">

          {/* ── Three-tile grid: Me | Counterpart | Nexum AI ──────────────────── */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 min-h-0">

            {/* TILE 1: Me ───────────────────────────────────────────────────── */}
            <div className={`relative rounded-2xl bg-[#282a2d] overflow-hidden flex flex-col border ${isSpeakingMe ? "border-[#8ab4f8] ring-2 ring-[#8ab4f8]/30" : isMicOn ? "border-[#8ab4f8]/40" : "border-[#3c4043]"} transition-all duration-200`}>
              {isVideoOn && localStream ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <AvatarCircle name={myName} src={myAvatar} size="lg" speaking={isSpeakingMe} />
                </div>
              )}

              {/* Bottom name pill */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm text-xs font-medium text-white">
                  {!isMicOn && <MicOff className="w-3 h-3 text-[#f28b82]" />}
                  <span>{myName} (You)</span>
                </div>
                {isHandRaised && (
                  <span className="px-2 py-0.5 rounded-full bg-[#f29900] text-black text-xs font-semibold">
                    ✋ Raised
                  </span>
                )}
              </div>
            </div>

            {/* TILE 2: Remote Participant ────────────────────────────────────── */}
            <div className={`relative rounded-2xl bg-[#282a2d] overflow-hidden flex flex-col border ${isSpeakingRemote ? "border-[#81c995] ring-2 ring-[#81c995]/40" : remotePeer?.micOn ? "border-white/30" : "border-[#3c4043]"} transition-all duration-200`}>
              {remoteStream && remoteStream.getVideoTracks().some((t) => t.enabled && t.readyState === "live") ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  muted={true}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex-1 flex items-center justify-center flex-col gap-3">
                  <AvatarCircle
                    name={remotePeer?.userName || counterpartName}
                    src={remotePeer?.avatar}
                    size="lg"
                    speaking={isSpeakingRemote || !!remotePeer?.micOn}
                  />
                  {!remotePeer && (
                    <span className="text-xs text-[#9aa0a6] text-center px-4">
                      Waiting for {counterpartName === "Waiting for other participant..." ? "other participant" : counterpartName} to join...
                    </span>
                  )}
                </div>
              )}

              {/* Bottom name pill */}
              <div className="absolute bottom-3 left-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm text-xs font-medium text-white">
                  {remotePeer && !remotePeer.micOn && <MicOff className="w-3 h-3 text-[#f28b82]" />}
                  <span>{remotePeer?.userName || counterpartName}</span>
                </div>
              </div>
            </div>

            {/* TILE 3: Nexum AI Notetaker ────────────────────────────────────── */}
            <div className="relative rounded-2xl bg-[#282a2d] overflow-hidden flex flex-col border border-[#3c4043] transition-all duration-200">
              <div className="flex-1 flex items-center justify-center flex-col gap-3 p-4">
                <NexumAIOrb speaking={!!liveCaption} />
                {/* Live Transcript Subtitle inside AI tile */}
                {liveCaption && (
                  <div className="max-w-full px-3 py-2 rounded-xl bg-black/60 text-[11px] text-[#e3e3e3] text-center leading-snug line-clamp-3">
                    {liveCaption}
                  </div>
                )}
                {!liveCaption && (
                  <div className="flex items-center gap-1 opacity-60">
                    <span className="w-1 h-2 bg-[#8ab4f8] rounded-full animate-bounce" />
                    <span className="w-1 h-4 bg-[#8ab4f8] rounded-full animate-bounce [animation-delay:0.1s]" />
                    <span className="w-1 h-6 bg-[#8ab4f8] rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1 h-4 bg-[#8ab4f8] rounded-full animate-bounce [animation-delay:0.3s]" />
                    <span className="w-1 h-2 bg-[#8ab4f8] rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}
              </div>

              {/* Bottom pill */}
              <div className="absolute bottom-3 left-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm text-xs font-medium text-[#8ab4f8]">
                  <ShieldCheck className="w-3 h-3 text-[#81c995]" />
                  <span>Nexum AI Notetaker</span>
                </div>
              </div>
              <div className="absolute bottom-3 right-3 text-[10px] text-[#9aa0a6] font-mono bg-black/60 px-2 py-0.5 rounded-full">
                ADR Guard Active
              </div>
            </div>
          </div>

          {/* ── Closed Captions Banner ─────────────────────────────────────────── */}
          {isCCOn && liveCaption && (
            <div className="text-center px-4 animate-in fade-in duration-150 shrink-0">
              <div className="inline-block max-w-2xl px-4 py-2 rounded-xl bg-black/80 text-sm text-white font-medium backdrop-blur-md">
                {liveCaption}
              </div>
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            SIDE PANEL
        ════════════════════════════════════════════════════════════════════ */}
        {sidePanel !== "none" && (
          <aside className="w-80 bg-[#202124] border-l border-[#3c4043] flex flex-col shrink-0 z-20 animate-in slide-in-from-right duration-150">
            {/* Panel Header */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-[#3c4043] shrink-0">
              <span className="font-semibold text-sm text-white">
                {sidePanel === "people" && `People (${remotePeers.size + 1 + 1})`}
                {sidePanel === "chat" && "In-call messages"}
                {sidePanel === "ai" && "AI Notetaker"}
              </span>
              <button
                type="button"
                onClick={() => setSidePanel("none")}
                className="p-1.5 rounded-full hover:bg-[#3c4043] text-[#9aa0a6] hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── People ─────────────────────────────────────────────────────── */}
            {sidePanel === "people" && (
              <div className="flex-1 p-3 overflow-y-auto space-y-2">
                {/* Me */}
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#282a2d] transition">
                  <AvatarCircle name={myName} src={myAvatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{myName} (You)</div>
                    <div className="text-xs text-[#9aa0a6]">{myRole}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isMicOn ? <Mic className="w-4 h-4 text-[#81c995]" /> : <MicOff className="w-4 h-4 text-[#f28b82]" />}
                  </div>
                </div>

                {/* Remote peers */}
                {Array.from(remotePeers.values()).map((p) => (
                  <div key={p.userId} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#282a2d] transition">
                    <AvatarCircle name={p.userName} src={p.avatar} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{p.userName}</div>
                      <div className="text-xs text-[#9aa0a6]">{p.role}</div>
                    </div>
                    {p.micOn !== undefined && (
                      p.micOn ? <Mic className="w-4 h-4 text-[#81c995]" /> : <MicOff className="w-4 h-4 text-[#f28b82]" />
                    )}
                  </div>
                ))}

                {/* Nexum AI */}
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#282a2d] transition">
                  <img src="/logo.png" alt="Nexum AI" className="w-9 h-9 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#8ab4f8] truncate">Nexum AI Notetaker</div>
                    <div className="text-xs text-[#9aa0a6]">AI Observer</div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-[#81c995] animate-pulse" />
                </div>
              </div>
            )}

            {/* ── Chat ───────────────────────────────────────────────────────── */}
            {sidePanel === "chat" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-3 overflow-y-auto space-y-2">
                  {chatMessages.length === 0 && (
                    <div className="flex items-center justify-center h-full text-[#9aa0a6] text-sm text-center px-4">
                      No messages yet. Send a message to everyone in the call.
                    </div>
                  )}
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}>
                      <span className="text-[11px] text-[#9aa0a6] mb-0.5 px-1">
                        {msg.isMe ? "You" : msg.fromUserName} · {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <div
                        className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                          msg.isMe
                            ? "bg-[#8ab4f8] text-[#202124] font-medium rounded-br-sm"
                            : "bg-[#3c4043] text-[#e3e3e3] rounded-bl-sm"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendChat(chatInput);
                    setChatInput("");
                  }}
                  className="p-3 border-t border-[#3c4043] flex items-center gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Send a message to everyone"
                    className="flex-1 px-4 py-2 rounded-full bg-[#3c4043] border border-[#4a4d51] text-sm text-white placeholder:text-[#9aa0a6] focus:outline-none focus:border-[#8ab4f8] transition"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="p-2 rounded-full bg-[#8ab4f8] hover:bg-[#aecbfa] disabled:opacity-40 text-[#202124] transition cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* ── AI Notetaker ────────────────────────────────────────────────── */}
            {sidePanel === "ai" && (
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {/* Status badge */}
                <div className="p-3 rounded-xl bg-[#282a2d] border border-[#3c4043] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#81c995]" />
                    <span className="text-xs font-semibold text-[#e3e3e3]">Scope Guard Active</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#81c995]/20 text-[#81c995]">
                    Live
                  </span>
                </div>

                {/* Transcripts */}
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-[#9aa0a6]">
                    Live Transcript
                  </div>
                  {captions.length === 0 && (
                    <div className="text-xs text-[#9aa0a6] text-center py-6">
                      Captions will appear here as participants speak.
                    </div>
                  )}
                  {captions.map((c) => (
                    <div
                      key={c.id}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        c.isScopeAlert
                          ? "bg-[#3e2c14]/60 border-[#f29900]/40"
                          : c.isCommitment
                          ? "bg-[#1e3a1e]/60 border-[#81c995]/40"
                          : "bg-[#282a2d] border-[#3c4043]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-[#9aa0a6]">
                        <span className="font-semibold">{c.isMe ? `${c.fromUserName} (You)` : c.fromUserName}</span>
                        <span>{new Date(c.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="text-[#e3e3e3] leading-relaxed">{c.text}</p>
                      {c.isScopeAlert && (
                        <div className="flex items-center gap-1 text-[10px] text-[#f29900] font-medium">
                          <AlertCircle className="w-3 h-3" />
                          <span>Verbal scope discussion detected</span>
                        </div>
                      )}
                      {c.isCommitment && (
                        <div className="flex items-center gap-1 text-[10px] text-[#81c995] font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Action item extracted</span>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={captionsEndRef} />
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          BOTTOM CONTROL DOCK  — Google Meet style
      ══════════════════════════════════════════════════════════════════════ */}
      <footer className="h-20 px-4 md:px-8 flex items-center justify-between shrink-0 z-20">
        {/* Left: Clock + Room ID */}
        <div className="hidden md:flex items-center gap-3 text-sm text-[#9aa0a6]">
          <span>{clockStr}</span>
          <span className="text-[#3c4043]">·</span>
          <span className="font-mono text-xs">{roomId}</span>
        </div>

        {/* Center: Controls */}
        <div className="flex items-center gap-2 md:gap-3 mx-auto md:mx-0">

          {/* Mic */}
          <button
            type="button"
            onClick={async () => {
              unlockAudio();
              await toggleMic();
            }}
            title={isMicOn ? "Turn off mic (Ctrl+D)" : "Turn on mic (Ctrl+D)"}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition cursor-pointer ${
              isMicOn ? "bg-[#3c4043] hover:bg-[#4a4d51] text-white" : "bg-[#f28b82]/20 hover:bg-[#f28b82]/30 text-[#f28b82] border border-[#f28b82]/40"
            }`}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Camera */}
          <button
            type="button"
            onClick={async () => {
              unlockAudio();
              await toggleVideo();
            }}
            title={isVideoOn ? "Turn off camera (Ctrl+E)" : "Turn on camera (Ctrl+E)"}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition cursor-pointer ${
              isVideoOn ? "bg-[#3c4043] hover:bg-[#4a4d51] text-white" : "bg-[#f28b82]/20 hover:bg-[#f28b82]/30 text-[#f28b82] border border-[#f28b82]/40"
            }`}
          >
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* CC */}
          <button
            type="button"
            onClick={() => {
              unlockAudio();
              setIsCCOn(!isCCOn);
            }}
            title="Toggle closed captions"
            className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold transition cursor-pointer ${
              isCCOn ? "bg-[#8ab4f8] text-[#202124]" : "bg-[#3c4043] hover:bg-[#4a4d51] text-[#9aa0a6]"
            }`}
          >
            CC
          </button>

          {/* Screen share */}
          <button
            type="button"
            onClick={toggleScreenShare}
            title="Present your screen"
            className={`w-12 h-12 rounded-full flex items-center justify-center transition cursor-pointer ${
              isScreenSharing ? "bg-[#8ab4f8] text-[#202124]" : "bg-[#3c4043] hover:bg-[#4a4d51] text-white"
            }`}
          >
            <ScreenShare className="w-5 h-5" />
          </button>

          {/* Raise hand */}
          <button
            type="button"
            onClick={() => setIsHandRaised(!isHandRaised)}
            title="Raise or lower your hand"
            className={`w-12 h-12 rounded-full flex items-center justify-center transition cursor-pointer ${
              isHandRaised ? "bg-[#f29900] text-[#202124]" : "bg-[#3c4043] hover:bg-[#4a4d51] text-white"
            }`}
          >
            <Hand className="w-5 h-5" />
          </button>

          {/* Reactions */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmoji(!showEmoji)}
              title="Send a reaction"
              className="w-12 h-12 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] text-white flex items-center justify-center transition cursor-pointer"
            >
              <Smile className="w-5 h-5" />
            </button>
            {showEmoji && (
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 p-2 rounded-2xl bg-[#282a2d] border border-[#3c4043] flex items-center gap-1 shadow-2xl animate-in fade-in zoom-in-95 duration-100 z-50">
                {["👍", "❤️", "😄", "👏", "🎉", "🙌"].map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => triggerEmoji(e)}
                    className="w-10 h-10 rounded-full hover:bg-[#3c4043] text-xl flex items-center justify-center transition cursor-pointer"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* End Call */}
          <button
            type="button"
            onClick={endCall}
            disabled={isEndingMeeting}
            className="px-5 h-12 rounded-full bg-[#ea4335] hover:bg-[#d93025] disabled:opacity-50 text-white text-sm font-semibold flex items-center gap-2 transition cursor-pointer ml-2"
            title="Leave call"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="hidden md:inline">{isEndingMeeting ? "Ending..." : "Leave"}</span>
          </button>
        </div>

        {/* Right: Drawer toggles */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSidePanel(sidePanel === "people" ? "none" : "people")}
            title="People"
            className={`relative w-10 h-10 rounded-full flex items-center justify-center transition cursor-pointer ${
              sidePanel === "people" ? "bg-[#8ab4f8] text-[#202124]" : "hover:bg-[#3c4043] text-[#9aa0a6] hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#3c4043] border border-[#202124] text-[9px] font-bold text-white flex items-center justify-center">
              {remotePeers.size + 2}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSidePanel(sidePanel === "chat" ? "none" : "chat")}
            title="In-call messages"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition cursor-pointer ${
              sidePanel === "chat" ? "bg-[#8ab4f8] text-[#202124]" : "hover:bg-[#3c4043] text-[#9aa0a6] hover:text-white"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setSidePanel(sidePanel === "ai" ? "none" : "ai")}
            title="AI Notetaker"
            className={`relative w-10 h-10 rounded-full flex items-center justify-center transition cursor-pointer ${
              sidePanel === "ai" ? "bg-[#8ab4f8] text-[#202124]" : "hover:bg-[#3c4043] text-[#9aa0a6] hover:text-white"
            }`}
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
          Loading meeting room...
        </div>
      }
    >
      <MeetingRoomContent />
    </Suspense>
  );
}
