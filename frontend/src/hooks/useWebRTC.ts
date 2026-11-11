/**
 * useWebRTC - Production-Grade WebRTC Engine
 *
 * Guarantees:
 *  1. Single Offer Initiator (No offer glare/collision)
 *  2. Perfect Negotiation Glare Resolver with rollback fallback
 *  3. Dynamic IP/Host Signaling Resolution (connects correctly across LAN/WAN/production)
 *  4. Native Hardware Audio Pipeline (AEC + NS + AGC) with auto-initialization on room entry
 *  5. Audio & Video Transceivers reserved upfront
 *  6. Buffered ICE Candidate Queue
 *  7. Reliable mute/unmute via track.enabled (never drops connection)
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";

function buildIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: "stun:stun.relay.metered.ca:80" },
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];

  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME || "0f63bbad439c1563dfea1379";
  const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL || "HeTQ52tEAHGgmf4r";

  if (turnUsername && turnCredential) {
    const defaultUrls = [
      "turn:in.relay.metered.ca:80",
      "turn:in.relay.metered.ca:80?transport=tcp",
      "turn:in.relay.metered.ca:443",
      "turns:in.relay.metered.ca:443?transport=tcp",
    ];
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

function createSilentAudioTrack(): MediaStreamTrack | null {
  if (typeof window === "undefined") return null;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const dst = ctx.createMediaStreamDestination();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(dst);
    osc.start();
    const track = dst.stream.getAudioTracks()[0];
    track.enabled = true;
    return track;
  } catch {
    return null;
  }
}

function getAudioSender(pc: RTCPeerConnection): RTCRtpSender | undefined {
  const transceiver = pc.getTransceivers().find(
    (t) => t.sender.track?.kind === "audio" || t.receiver.track?.kind === "audio"
  );
  if (transceiver) return transceiver.sender;
  return pc.getSenders().find((s) => s.track?.kind === "audio");
}

function getVideoSender(pc: RTCPeerConnection): RTCRtpSender | undefined {
  const transceiver = pc.getTransceivers().find(
    (t) => t.sender.track?.kind === "video" || t.receiver.track?.kind === "video"
  );
  if (transceiver) return transceiver.sender;
  return pc.getSenders().find((s) => s.track?.kind === "video");
}

function resolveSignalingUrl(configuredBackendUrl: string): string {
  if (typeof window !== "undefined") {
    const currentHost = window.location.hostname;
    const isHttps = window.location.protocol === "https:";
    const proto = isHttps ? "wss:" : "ws:";

    // If configured as localhost but user is browsing via local network IP (e.g. 192.168.x.x)
    if (configuredBackendUrl.includes("localhost") && currentHost !== "localhost" && currentHost !== "127.0.0.1") {
      return `${proto}//${currentHost}:4000/ws/meeting`;
    }

    // In production where backend is on same domain or custom URL
    if (configuredBackendUrl.startsWith("http")) {
      return configuredBackendUrl.replace(/^http/, "ws") + "/ws/meeting";
    }
  }
  return configuredBackendUrl.replace(/^http/, "ws") + "/ws/meeting";
}

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
  backendUrl?: string;
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
  const remoteUserIdRef = useRef<string | null>(null);
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<Map<string, RemotePeer>>(new Map());
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [captions, setCaptions] = useState<CaptionEntry[]>([]);
  const [liveCaption, setLiveCaption] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSpeakingMe, setIsSpeakingMe] = useState(false);
  const [isSpeakingRemote, setIsSpeakingRemote] = useState(false);

  // Dynamic signaling endpoint
  const signalingUrl = resolveSignalingUrl(backendUrl);

  // Send message over WebSocket
  const sigSend = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // Flush queued ICE candidates after remote description is applied
  const flushIceCandidates = useCallback(async (pc: RTCPeerConnection) => {
    while (iceCandidateQueue.current.length > 0) {
      const candidate = iceCandidateQueue.current.shift();
      if (candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("[WebRTC] Error adding buffered ICE candidate:", err);
        }
      }
    }
  }, []);

  // Create or return RTCPeerConnection
  const createPC = useCallback(() => {
    if (pcRef.current && pcRef.current.signalingState !== "closed") {
      return pcRef.current;
    }

    console.log("[WebRTC] Creating new RTCPeerConnection...");
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;
    if (typeof window !== "undefined") {
      (window as any).__debug_pc = pc;
    }

    const localAudioTrack = localStreamRef.current?.getAudioTracks()[0] || createSilentAudioTrack();
    const localVideoTrack = localStreamRef.current?.getVideoTracks()[0] || null;

    // Upfront transceivers guarantee audio and video m-lines in SDP offer & answer
    try {
      if (localAudioTrack) {
        pc.addTransceiver(localAudioTrack, {
          direction: "sendrecv",
          streams: [localStreamRef.current || new MediaStream([localAudioTrack])],
        });
      } else {
        pc.addTransceiver("audio", { direction: "sendrecv" });
      }

      if (localVideoTrack) {
        pc.addTransceiver(localVideoTrack, {
          direction: "sendrecv",
          streams: localStreamRef.current ? [localStreamRef.current] : [],
        });
      } else {
        pc.addTransceiver("video", { direction: "sendrecv" });
      }
    } catch (e) {
      console.warn("[WebRTC] addTransceiver warning:", e);
    }

    // Relay local ICE candidates
    pc.onicecandidate = ({ candidate }) => {
      if (candidate && remoteUserIdRef.current) {
        sigSend({
          type: "ice_candidate",
          targetUserId: remoteUserIdRef.current,
          candidate: candidate.toJSON(),
        });
      }
    };

    // Receive incoming remote tracks and accumulate them into a unified MediaStream
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote track: ${event.track.kind}, id: ${event.track.id}`);
      event.track.enabled = true;

      setRemoteStream((prev) => {
        const stream = prev ? new MediaStream(prev.getTracks()) : new MediaStream();
        const existing = stream.getTracks().find((t) => t.kind === event.track.kind);
        if (existing) {
          stream.removeTrack(existing);
        }
        stream.addTrack(event.track);
        return new MediaStream(stream.getTracks());
      });
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] Connection state changed to:", pc.connectionState);
    };

    return pc;
  }, [sigSend]);

  // Initiate an offer to target peer
  const initiateOffer = useCallback(async (targetUserId: string) => {
    try {
      const pc = createPC();
      remoteUserIdRef.current = targetUserId;
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      sigSend({
        type: "offer",
        targetUserId,
        sdp: pc.localDescription,
      });
      console.log(`[WebRTC] Sent offer to ${targetUserId}`);
    } catch (err) {
      console.error("[WebRTC] Create offer error:", err);
    }
  }, [createPC, sigSend]);

  // Auto-initialize microphone on room entry (Google Meet default behavior)
  useEffect(() => {
    let active = true;
    async function initAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
            sampleRate: 48000,
          },
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsMicOn(true);

        const pc = pcRef.current;
        if (pc) {
          const track = stream.getAudioTracks()[0];
          const audioSender = getAudioSender(pc);
          if (audioSender) {
            await audioSender.replaceTrack(track);
          } else {
            try {
              pc.addTrack(track, stream);
            } catch {}
          }
        }
      } catch (err) {
        console.warn("[WebRTC] Auto audio acquisition skipped or permission not granted:", err);
        setIsMicOn(false);
      }
    }
    initAudio();
    return () => {
      active = false;
    };
  }, []);

  // Connect WebSocket signaling
  const connectSignaling = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    console.log(`[Signaling] Connecting to: ${signalingUrl}`);
    const ws = new WebSocket(signalingUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log(`[Signaling] Connected. Joining room ${roomId} as ${userName} (${userId})`);
      ws.send(JSON.stringify({
        type: "join",
        roomId,
        userId,
        userName,
        role,
        avatar: avatar || "",
        micOn: isMicOn,
        videoOn: isVideoOn,
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

      // 1. We joined: discover who is in the room
      if (type === "joined") {
        const others = (msg.participants as any[]).filter((p: any) => p.userId !== userId);
        const peerMap = new Map<string, RemotePeer>();
        for (const p of others) {
          peerMap.set(p.userId, {
            ...p,
            micOn: p.micOn !== false,
            videoOn: !!p.videoOn,
          });
          remoteUserIdRef.current = p.userId;
        }
        setRemotePeers(peerMap);

        if (others.length > 0) {
          // Prepare our PeerConnection to receive the offer from the existing peer
          createPC();
          // DO NOT initiate offer here. The existing peer will initiate offer upon receiving peer_joined!
          console.log("[WebRTC] Waiting for offer from existing room host...");
        }
        return;
      }

      // 2. Another peer joined: WE are the existing peer, so WE initiate the offer
      if (type === "peer_joined") {
        const { userId: uid, userName: uName, role: uRole, avatar: uAvatar, micOn: uMic, videoOn: uVid } = msg;
        remoteUserIdRef.current = uid;
        setRemotePeers((prev) => {
          const next = new Map(prev);
          next.set(uid, {
            userId: uid,
            userName: uName,
            role: uRole,
            avatar: uAvatar,
            micOn: uMic !== false,
            videoOn: !!uVid,
          });
          return next;
        });

        console.log(`[WebRTC] Peer joined (${uid}). Initiating offer...`);
        createPC();
        initiateOffer(uid);
        return;
      }

      // 3. Receive SDP offer
      if (type === "offer") {
        const { fromUserId, sdp } = msg;
        remoteUserIdRef.current = fromUserId;
        const pc = createPC();
        try {
          // Perfect negotiation glare resolver:
          // If we are in have-local-offer, polite peer rolls back to accept incoming offer
          if (pc.signalingState !== "stable") {
            const isPolite = String(userId) < String(fromUserId);
            if (!isPolite) {
              console.warn("[WebRTC] Impolite peer ignoring colliding offer from", fromUserId);
              return;
            }
            console.log("[WebRTC] Polite peer rolling back local offer to accept incoming offer");
            await pc.setLocalDescription({ type: "rollback" });
          }

          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          await flushIceCandidates(pc);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sigSend({
            type: "answer",
            targetUserId: fromUserId,
            sdp: pc.localDescription,
          });
          console.log(`[WebRTC] Answered offer from ${fromUserId}`);
        } catch (err) {
          console.error("[WebRTC] Error handling offer:", err);
        }
        return;
      }

      // 4. Receive SDP answer
      if (type === "answer") {
        const { sdp } = msg;
        const pc = pcRef.current;
        if (pc && pc.signalingState === "have-local-offer") {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            await flushIceCandidates(pc);
            console.log("[WebRTC] Set remote answer successfully. Call active!");
          } catch (err) {
            console.error("[WebRTC] Error setting remote answer:", err);
          }
        }
        return;
      }

      // 5. Receive ICE candidate
      if (type === "ice_candidate") {
        const { candidate } = msg;
        const pc = pcRef.current;
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.warn("[WebRTC] Error adding ICE candidate:", err);
          }
        } else {
          iceCandidateQueue.current.push(candidate);
        }
        return;
      }

      // 6. In-call chat
      if (type === "chat") {
        const { fromUserId: fid, fromUserName: fName, text, timestamp } = msg;
        setChatMessages((prev) => [
          ...prev,
          {
            id: `${fid}_${Date.now()}_${Math.random()}`,
            fromUserId: fid,
            fromUserName: fName,
            text,
            timestamp,
            isMe: fid === userId,
          },
        ]);
        return;
      }

      // 7. Live caption
      if (type === "caption") {
        const { fromUserId: fid, fromUserName: fName, text, isFinal, isScopeAlert, isCommitment, timestamp } = msg;
        setLiveCaption(`[${fName}]: "${text}"`);
        if (isFinal) {
          setCaptions((prev) => [
            ...prev,
            {
              id: `${fid}_${Date.now()}_${Math.random()}`,
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

      // 8. Media state updates
      if (type === "media_state") {
        const { fromUserId: fid, micOn, videoOn } = msg;
        setRemotePeers((prev) => {
          const next = new Map(prev);
          const peer = next.get(fid);
          if (peer) next.set(fid, { ...peer, micOn, videoOn });
          return next;
        });
        return;
      }

      // 9. Peer left
      if (type === "peer_left") {
        const { userId: uid } = msg;
        setRemotePeers((prev) => {
          const next = new Map(prev);
          next.delete(uid);
          return next;
        });
        if (uid === remoteUserIdRef.current) {
          remoteUserIdRef.current = null;
          setRemoteStream(null);
        }
        return;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      reconnectTimer.current = setTimeout(() => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          connectSignaling();
        }
      }, 2000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [roomId, userId, userName, role, avatar, signalingUrl, sigSend, createPC, initiateOffer, flushIceCandidates]);

  // ─── Toggle Microphone (Real Audio Stream Management) ──────────────────────
  const toggleMic = useCallback(async () => {
    if (!isMicOn) {
      // Turn mic ON
      try {
        let audioTrack: MediaStreamTrack | null = null;
        if (localStreamRef.current && localStreamRef.current.getAudioTracks().length > 0) {
          audioTrack = localStreamRef.current.getAudioTracks()[0];
          audioTrack.enabled = true;
        } else {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              channelCount: 1,
              sampleRate: 48000,
            },
          });
          audioTrack = stream.getAudioTracks()[0];
          if (!localStreamRef.current) {
            localStreamRef.current = new MediaStream();
          }
          localStreamRef.current.addTrack(audioTrack);
        }

        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

        const pc = pcRef.current;
        if (pc) {
          const audioSender = getAudioSender(pc);
          if (audioSender && audioTrack) {
            if (audioSender.track !== audioTrack) {
              await audioSender.replaceTrack(audioTrack);
            }
          }
        }

        setIsMicOn(true);
        sigSend({ type: "media_state", micOn: true, videoOn: isVideoOn, screenSharing: isScreenSharing });
      } catch (err) {
        console.warn("[WebRTC] Mic access denied:", err);
      }
    } else {
      // Turn mic OFF (mute track so peer connection remains active without drops)
      if (localStreamRef.current) {
        for (const t of localStreamRef.current.getAudioTracks()) {
          t.enabled = false;
        }
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      }
      setIsMicOn(false);
      sigSend({ type: "media_state", micOn: false, videoOn: isVideoOn, screenSharing: isScreenSharing });
    }
  }, [isMicOn, isVideoOn, isScreenSharing, sigSend]);

  // ─── Toggle Camera ────────────────────────────────────────────────────────
  const toggleVideo = useCallback(async () => {
    if (!isVideoOn) {
      // Turn camera ON
      try {
        let videoTrack: MediaStreamTrack | null = null;
        if (localStreamRef.current && localStreamRef.current.getVideoTracks().length > 0) {
          videoTrack = localStreamRef.current.getVideoTracks()[0];
          videoTrack.enabled = true;
        } else {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          });
          videoTrack = stream.getVideoTracks()[0];
          if (!localStreamRef.current) {
            localStreamRef.current = new MediaStream();
          }
          localStreamRef.current.addTrack(videoTrack);
        }

        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

        const pc = pcRef.current || createPC();
        const videoSender = getVideoSender(pc);

        if (videoSender && videoTrack) {
          await videoSender.replaceTrack(videoTrack);
        } else if (videoTrack) {
          try {
            pc.addTrack(videoTrack, localStreamRef.current);
          } catch {}
        }

        setIsVideoOn(true);
        sigSend({ type: "media_state", micOn: isMicOn, videoOn: true, screenSharing: isScreenSharing });
      } catch (err) {
        console.warn("[WebRTC] Camera access denied:", err);
      }
    } else {
      // Turn camera OFF
      if (localStreamRef.current) {
        for (const t of localStreamRef.current.getVideoTracks()) {
          t.enabled = false;
        }
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      }
      setIsVideoOn(false);
      sigSend({ type: "media_state", micOn: isMicOn, videoOn: false, screenSharing: isScreenSharing });
    }
  }, [isVideoOn, isMicOn, isScreenSharing, createPC, sigSend]);

  // ─── Toggle Screen Share ──────────────────────────────────────────────────
  const toggleScreenShare = useCallback(async () => {
    if (!isScreenSharing) {
      try {
        const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = stream;
        const screenTrack = stream.getVideoTracks()[0];

        const pc = pcRef.current || createPC();
        const videoSender = getVideoSender(pc);
        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
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
      const pc = pcRef.current;
      const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
      const videoSender = pc ? getVideoSender(pc) : undefined;
      if (videoSender && cameraTrack) {
        videoSender.replaceTrack(isVideoOn ? cameraTrack : null).catch(console.warn);
      }
      setIsScreenSharing(false);
      sigSend({ type: "media_state", micOn: isMicOn, videoOn: isVideoOn, screenSharing: false });
    }
  }, [isScreenSharing, isMicOn, isVideoOn, createPC, sigSend]);

  // ─── Real-time Local Speaking Detection ────────────────────────────────────
  useEffect(() => {
    if (!localStream || !isMicOn) {
      setIsSpeakingMe(false);
      return;
    }
    const audioTrack = localStream.getAudioTracks()[0];
    if (!audioTrack || !audioTrack.enabled) {
      setIsSpeakingMe(false);
      return;
    }

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(new MediaStream([audioTrack]));
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      let animId: number;

      const check = () => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        setIsSpeakingMe(sum / data.length > 14);
        animId = requestAnimationFrame(check);
      };
      check();

      return () => {
        cancelAnimationFrame(animId);
        audioCtx.close().catch(() => {});
      };
    } catch {
      return () => {};
    }
  }, [localStream, isMicOn]);

  // ─── Native WebRTC Remote Speaking Detection (Zero AudioContext Interference) ─
  useEffect(() => {
    if (!isConnected) {
      setIsSpeakingRemote(false);
      return;
    }

    let intervalId: any;
    const checkStats = async () => {
      const pc = pcRef.current;
      if (!pc || pc.signalingState === "closed" || pc.connectionState === "closed") {
        setIsSpeakingRemote(false);
        return;
      }
      try {
        const report = await pc.getStats();
        let speaking = false;
        report.forEach((stat) => {
          if (stat.type === "inbound-rtp" && stat.kind === "audio") {
            if (typeof stat.audioLevel === "number") {
              speaking = stat.audioLevel > 0.02;
            }
          }
        });
        setIsSpeakingRemote(speaking);
      } catch {}
    };

    intervalId = setInterval(checkStats, 200);
    return () => clearInterval(intervalId);
  }, [isConnected]);

  // ─── Send Chat Message ────────────────────────────────────────────────────
  const sendChat = useCallback((text: string) => {
    if (!text.trim()) return;
    sigSend({ type: "chat", text: text.trim() });
  }, [sigSend]);

  // ─── Send Caption ─────────────────────────────────────────────────────────
  const sendCaption = useCallback(
    (text: string, isFinal: boolean, isScopeAlert?: boolean, isCommitment?: boolean) => {
      if (!text.trim()) return;
      sigSend({ type: "caption", text, isFinal, isScopeAlert, isCommitment });
      setLiveCaption(`[${userName}]: "${text}"`);
      if (isFinal) {
        const entry: CaptionEntry = {
          id: `${userId}_${Date.now()}_${Math.random()}`,
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
      }
    },
    [sigSend, userId, userName]
  );

  // ─── Send Reaction ────────────────────────────────────────────────────────
  const sendReaction = useCallback(
    (emoji: string) => {
      sigSend({ type: "reaction", emoji });
    },
    [sigSend]
  );

  // ─── Hang Up ──────────────────────────────────────────────────────────────
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

  // ─── Lifecycle Mount ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId || !userId) return;
    connectSignaling();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
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
    localStream,
    remoteStream,
    remotePeers,
    isConnected,
    isMicOn,
    isVideoOn,
    isScreenSharing,
    isSpeakingMe,
    isSpeakingRemote,
    toggleMic,
    toggleVideo,
    toggleScreenShare,
    hangUp,
    chatMessages,
    captions,
    liveCaption,
    sendChat,
    sendCaption,
    sendReaction,
  };
}
