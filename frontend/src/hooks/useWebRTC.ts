/**
 * useWebRTC - Production WebRTC hook with signaling via backend WebSocket
 *
 * Responsibilities:
 *  - Connect to the signaling WebSocket at ws://BACKEND/ws/meeting
 *  - Handle join, offer/answer, ICE candidate exchange (SDP mesh)
 *  - Expose localStream, remoteStream, media controls
 *  - Broadcast in-call chat and live captions via the signaling channel
 *  - Manage connection lifecycle (reconnect, cleanup)
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ICE servers: STUN (free, public) + TURN (from env, required for users behind NAT/firewall)
// Set NEXT_PUBLIC_TURN_USERNAME and NEXT_PUBLIC_TURN_CREDENTIAL in .env.local and Vercel.
// Get credentials from: https://dashboard.metered.ca → TURN Server → Credentials → Instructions
function buildIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    // Metered STUN (India region)
    { urls: "stun:stun.relay.metered.ca:80" },
    // Google fallback STUN
    { urls: "stun:stun.l.google.com:19302" },
  ];

  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

  if (turnUsername && turnCredential) {
    // India-region TURN relay — all 4 transport variants for maximum firewall penetration:
    // Port 80 UDP, Port 80 TCP, Port 443 TCP, Port 443 TLS
    const defaultUrls = [
      "turn:in.relay.metered.ca:80",
      "turn:in.relay.metered.ca:80?transport=tcp",
      "turn:in.relay.metered.ca:443",
      "turns:in.relay.metered.ca:443?transport=tcp",
    ];
    // Allow override via env if region changes later
    const customUrls = process.env.NEXT_PUBLIC_TURN_URLS
      ? process.env.NEXT_PUBLIC_TURN_URLS.split(",").map((u) => u.trim()).filter(Boolean)
      : defaultUrls;

    for (const url of customUrls) {
      servers.push({ urls: url, username: turnUsername, credential: turnCredential });
    }
  }

  return servers;
}

const ICE_SERVERS = buildIceServers();

export interface RemotePeer {
  userId: string;
  userName: string;
  role: string;
  avatar?: string;
  stream?: MediaStream;
  micOn?: boolean;
  videoOn?: boolean;
}

export interface ChatMsg {
  id: string;
  fromUserId: string;
  fromUserName: string;
  text: string;
  timestamp: string;
  isMe?: boolean;
}

export interface CaptionEntry {
  id: string;
  fromUserId: string;
  fromUserName: string;
  text: string;
  isFinal: boolean;
  isScopeAlert?: boolean;
  isCommitment?: boolean;
  timestamp: string;
  isMe?: boolean;
}

interface UseWebRTCOptions {
  roomId: string;
  userId: string;
  userName: string;
  role: string;
  avatar?: string;
  backendUrl?: string; // e.g. http://localhost:4000  → ws://localhost:4000
}

export function useWebRTC({
  roomId,
  userId,
  userName,
  role,
  avatar,
  backendUrl = "http://localhost:4000",
}: UseWebRTCOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const makingOffer = useRef(false);
  const ignoreOffer = useRef(false);
  const remoteUserIdRef = useRef<string | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<Map<string, RemotePeer>>(new Map());
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [captions, setCaptions] = useState<CaptionEntry[]>([]);
  const [liveCaption, setLiveCaption] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // ─── WebSocket signaling URL ────────────────────────────────────────────────
  const signalingUrl = backendUrl.replace(/^http/, "ws") + "/ws/meeting";

  // ─── Send a JSON message over the signaling channel ────────────────────────
  const sigSend = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // ─── Create PeerConnection and wire tracks ─────────────────────────────────
  const createPC = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    // Add existing local tracks
    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) {
        pc.addTrack(track, localStreamRef.current);
      }
    }

    // ICE candidates → relay via signaling
    pc.onicecandidate = ({ candidate }) => {
      if (candidate && remoteUserIdRef.current) {
        sigSend({
          type: "ice_candidate",
          targetUserId: remoteUserIdRef.current,
          candidate: candidate.toJSON(),
        });
      }
    };

    // Incoming remote tracks
    const remoteMS = new MediaStream();
    pc.ontrack = ({ track }) => {
      remoteMS.addTrack(track);
      setRemoteStream(new MediaStream(remoteMS.getTracks()));
    };

    pc.onnegotiationneeded = async () => {
      try {
        makingOffer.current = true;
        const offer = await pc.createOffer();
        if (pc.signalingState !== "stable") return;
        await pc.setLocalDescription(offer);
        if (remoteUserIdRef.current) {
          sigSend({
            type: "offer",
            targetUserId: remoteUserIdRef.current,
            sdp: pc.localDescription,
          });
        }
      } catch (err) {
        console.error("[WebRTC] Offer error:", err);
      } finally {
        makingOffer.current = false;
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] Connection state:", pc.connectionState);
    };

    return pc;
  }, [sigSend]);

  // ─── Connect WebSocket signaling ───────────────────────────────────────────
  const connectSignaling = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(signalingUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({
        type: "join",
        roomId,
        userId,
        userName,
        role,
        avatar: avatar || "",
      }));
    };

    ws.onmessage = async (ev) => {
      let msg: any;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }

      const { type } = msg;

      if (type === "joined") {
        // We joined - set initial remote participants
        const others = (msg.participants as any[]).filter((p: any) => p.userId !== userId);
        const peerMap = new Map<string, RemotePeer>();
        for (const p of others) {
          peerMap.set(p.userId, { ...p });
          remoteUserIdRef.current = p.userId; // last peer becomes the call target
        }
        setRemotePeers(peerMap);
        // If there's already someone in the room, initiate the call
        if (others.length > 0) {
          if (!pcRef.current) createPC();
        }
        return;
      }

      if (type === "peer_joined") {
        const { userId: uid, userName: uName, role: uRole, avatar: uAvatar } = msg;
        remoteUserIdRef.current = uid;
        setRemotePeers((prev) => {
          const next = new Map(prev);
          next.set(uid, { userId: uid, userName: uName, role: uRole, avatar: uAvatar });
          return next;
        });
        // Caller (the one who is already in the room) creates the offer
        const pc = createPC();
        // onnegotiationneeded will fire after tracks are added
        return;
      }

      if (type === "peer_left") {
        const { userId: uid } = msg;
        setRemotePeers((prev) => {
          const next = new Map(prev);
          next.delete(uid);
          return next;
        });
        if (uid === remoteUserIdRef.current) {
          pcRef.current?.close();
          pcRef.current = null;
          setRemoteStream(null);
          remoteUserIdRef.current = null;
        }
        return;
      }

      if (type === "offer") {
        const { fromUserId, sdp } = msg;
        remoteUserIdRef.current = fromUserId;
        const pc = pcRef.current || createPC();
        const offerCollision =
          makingOffer.current || pc.signalingState !== "stable";
        ignoreOffer.current = offerCollision;
        if (ignoreOffer.current) return;
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sigSend({
          type: "answer",
          targetUserId: fromUserId,
          sdp: pc.localDescription,
        });
        return;
      }

      if (type === "answer") {
        const { sdp } = msg;
        if (!pcRef.current) return;
        if (pcRef.current.signalingState === "have-local-offer") {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
        }
        return;
      }

      if (type === "ice_candidate") {
        const { candidate } = msg;
        if (!pcRef.current) return;
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          if (!ignoreOffer.current) console.error("[WebRTC] ICE error:", err);
        }
        return;
      }

      if (type === "chat") {
        const { fromUserId: fid, fromUserName: fName, text, timestamp } = msg;
        setChatMessages((prev) => [
          ...prev,
          {
            id: `${fid}_${Date.now()}`,
            fromUserId: fid,
            fromUserName: fName,
            text,
            timestamp,
            isMe: fid === userId,
          },
        ]);
        return;
      }

      if (type === "caption") {
        const { fromUserId: fid, fromUserName: fName, text, isFinal, isScopeAlert, isCommitment, timestamp } = msg;
        setLiveCaption(`[${fName}]: "${text}"`);
        if (isFinal) {
          setCaptions((prev) => [
            ...prev,
            {
              id: `${fid}_${Date.now()}`,
              fromUserId: fid,
              fromUserName: fName,
              text,
              isFinal: true,
              isScopeAlert,
              isCommitment,
              timestamp,
              isMe: false,
            },
          ]);
        }
        return;
      }

      if (type === "media_state") {
        const { fromUserId: fid, micOn, videoOn, screenSharing } = msg;
        setRemotePeers((prev) => {
          const next = new Map(prev);
          const peer = next.get(fid);
          if (peer) next.set(fid, { ...peer, micOn, videoOn });
          return next;
        });
        return;
      }

      if (type === "reaction") {
        // Handled externally if needed
        return;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Auto-reconnect after 2s
      reconnectTimer.current = setTimeout(() => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          connectSignaling();
        }
      }, 2000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [roomId, userId, userName, role, avatar, signalingUrl, sigSend, createPC]);

  // ─── Toggle microphone ─────────────────────────────────────────────────────
  const toggleMic = useCallback(async () => {
    if (!isMicOn) {
      // Turn on mic - add audio track to stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioTrack = stream.getAudioTracks()[0];
        if (localStreamRef.current) {
          localStreamRef.current.addTrack(audioTrack);
          if (pcRef.current) {
            pcRef.current.addTrack(audioTrack, localStreamRef.current);
          }
        } else {
          localStreamRef.current = stream;
          setLocalStream(new MediaStream(stream.getTracks()));
        }
        setIsMicOn(true);
        sigSend({ type: "media_state", micOn: true, videoOn: isVideoOn, screenSharing: isScreenSharing });
      } catch (err) {
        console.warn("[WebRTC] Mic access denied:", err);
      }
    } else {
      // Turn off mic
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((t) => {
          t.stop();
          localStreamRef.current?.removeTrack(t);
        });
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      }
      setIsMicOn(false);
      sigSend({ type: "media_state", micOn: false, videoOn: isVideoOn, screenSharing: isScreenSharing });
    }
  }, [isMicOn, isVideoOn, isScreenSharing, sigSend]);

  // ─── Toggle camera ─────────────────────────────────────────────────────────
  const toggleVideo = useCallback(async () => {
    if (!isVideoOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        });
        const videoTrack = stream.getVideoTracks()[0];
        if (!localStreamRef.current) {
          localStreamRef.current = new MediaStream();
        }
        localStreamRef.current.addTrack(videoTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        if (pcRef.current) {
          pcRef.current.addTrack(videoTrack, localStreamRef.current);
        }
        setIsVideoOn(true);
        sigSend({ type: "media_state", micOn: isMicOn, videoOn: true, screenSharing: isScreenSharing });
      } catch (err) {
        console.warn("[WebRTC] Camera access denied:", err);
      }
    } else {
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t) => {
          t.stop();
          localStreamRef.current?.removeTrack(t);
        });
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      }
      setIsVideoOn(false);
      sigSend({ type: "media_state", micOn: isMicOn, videoOn: false, screenSharing: isScreenSharing });
    }
  }, [isVideoOn, isMicOn, isScreenSharing, sigSend]);

  // ─── Toggle screen share ───────────────────────────────────────────────────
  const toggleScreenShare = useCallback(async () => {
    if (!isScreenSharing) {
      try {
        const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = stream;
        const screenTrack = stream.getVideoTracks()[0];
        if (!localStreamRef.current) {
          localStreamRef.current = new MediaStream();
        }
        localStreamRef.current.addTrack(screenTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        if (pcRef.current) {
          pcRef.current.addTrack(screenTrack, localStreamRef.current);
        }
        screenTrack.onended = () => {
          toggleScreenShare();
        };
        setIsScreenSharing(true);
        sigSend({ type: "media_state", micOn: isMicOn, videoOn: isVideoOn, screenSharing: true });
      } catch (err) {
        console.warn("[WebRTC] Screen share cancelled:", err);
      }
    } else {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      sigSend({ type: "media_state", micOn: isMicOn, videoOn: isVideoOn, screenSharing: false });
    }
  }, [isScreenSharing, isMicOn, isVideoOn, sigSend]);

  // ─── Send in-call chat message ─────────────────────────────────────────────
  const sendChat = useCallback((text: string) => {
    if (!text.trim()) return;
    sigSend({ type: "chat", text: text.trim() });
  }, [sigSend]);

  // ─── Send live caption (from SpeechRecognition) ───────────────────────────
  const sendCaption = useCallback(
    (text: string, isFinal: boolean, isScopeAlert?: boolean, isCommitment?: boolean) => {
      sigSend({ type: "caption", text, isFinal, isScopeAlert, isCommitment });
      // Also add to own captions
      if (isFinal) {
        const entry: CaptionEntry = {
          id: `${userId}_${Date.now()}`,
          fromUserId: userId,
          fromUserName: userName,
          text,
          isFinal: true,
          isScopeAlert,
          isCommitment,
          timestamp: new Date().toISOString(),
          isMe: true,
        };
        setCaptions((prev) => [...prev, entry]);
        setLiveCaption(`[${userName}]: "${text}"`);
      }
    },
    [sigSend, userId, userName]
  );

  // ─── Send reaction emoji ───────────────────────────────────────────────────
  const sendReaction = useCallback(
    (emoji: string) => {
      sigSend({ type: "reaction", emoji });
    },
    [sigSend]
  );

  // ─── Hang up / clean up ────────────────────────────────────────────────────
  const hangUp = useCallback(() => {
    sigSend({ type: "leave" });
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    pcRef.current?.close();
    wsRef.current?.close();
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
  }, [sigSend]);

  // ─── Mount: connect signaling ──────────────────────────────────────────────
  useEffect(() => {
    if (!roomId || !userId) return;
    connectSignaling();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on unmount
        wsRef.current.close();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      pcRef.current?.close();
    };
  }, [roomId, userId, connectSignaling]);

  return {
    // Streams
    localStream,
    remoteStream,
    remotePeers,
    // Connection
    isConnected,
    // Media state
    isMicOn,
    isVideoOn,
    isScreenSharing,
    // Controls
    toggleMic,
    toggleVideo,
    toggleScreenShare,
    hangUp,
    // Chat & Captions
    chatMessages,
    captions,
    liveCaption,
    sendChat,
    sendCaption,
    sendReaction,
    // Refs for video elements
    localStreamRef,
    remoteStreamRef: pcRef,
  };
}

