/**
 * useWebRTC - Production-Grade WebRTC Engine v2
 *
 * Key guarantees:
 *  1. NO silent/dummy tracks — empty transceivers until real mic arrives
 *  2. replaceTrack() hot-swaps real mic into transceiver after getUserMedia
 *  3. Perfect Negotiation pattern (no offer glare)
 *  4. onnegotiationneeded handler for late track additions
 *  5. Local speaking detection uses CLONED track (never steals from WebRTC)
 *  6. Remote speaking detection uses pc.getStats() polling
 *  7. All state synced via refs to prevent stale closures
 *  8. Buffered ICE Candidate Queue
 *  9. Dynamic IP/Host Signaling Resolution
 * 10. Diagnostic stats logging every 5s for debugging
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

// Transceiver-based sender lookup (never uses .kind on sender — uses receiver.track.kind)
async function getAudioMediaStream(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
  } catch (err) {
    console.warn("[WebRTC] Hardware-constrained getUserMedia failed, trying fallback { audio: true }:", err);
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  }
}

function getAudioSender(pc: RTCPeerConnection): RTCRtpSender | undefined {
  const transceiver = pc.getTransceivers().find(
    (t) => t.receiver.track?.kind === "audio" || t.sender.track?.kind === "audio"
  );
  if (transceiver) return transceiver.sender;
  return pc.getSenders().find((s) => s.track?.kind === "audio");
}

function getVideoSender(pc: RTCPeerConnection): RTCRtpSender | undefined {
  const transceiver = pc.getTransceivers().find(
    (t) => t.receiver.track?.kind === "video" || t.sender.track?.kind === "video"
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

  // Refs to avoid stale closures in WebSocket and PeerConnection callbacks
  const isMicOnRef = useRef(true);
  const isVideoOnRef = useRef(false);
  const isScreenSharingRef = useRef(false);
  const makingOfferRef = useRef(false);

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

  // Keep refs in sync with React state (for use inside callbacks)
  useEffect(() => { isMicOnRef.current = isMicOn; }, [isMicOn]);
  useEffect(() => { isVideoOnRef.current = isVideoOn; }, [isVideoOn]);
  useEffect(() => { isScreenSharingRef.current = isScreenSharing; }, [isScreenSharing]);

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

  // ─── Create or return RTCPeerConnection ────────────────────────────────────
  const createPC = useCallback(() => {
    if (pcRef.current && pcRef.current.signalingState !== "closed") {
      return pcRef.current;
    }

    console.log("[WebRTC] Creating new RTCPeerConnection");
    console.log("[WebRTC] ICE servers:", ICE_SERVERS.length, "(TURN configured:", ICE_SERVERS.some((s) => String(s.urls).startsWith("turn")), ")");
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    // Get local tracks IF mic is already ready (may or may not be — getUserMedia is async)
    const localAudioTrack = localStreamRef.current?.getAudioTracks()[0] || null;
    const localVideoTrack = localStreamRef.current?.getVideoTracks()[0] || null;

    // Reserve audio & video transceivers upfront — guarantees m-lines in SDP
    // If real track is ready, bind it directly. If not, empty transceiver (no dummy track).
    try {
      if (localAudioTrack) {
        pc.addTransceiver(localAudioTrack, {
          direction: "sendrecv",
          streams: localStreamRef.current ? [localStreamRef.current] : [],
        });
        console.log("[WebRTC] ✓ Audio transceiver created WITH real mic track");
      } else {
        pc.addTransceiver("audio", { direction: "sendrecv" });
        console.log("[WebRTC] Audio transceiver created empty (mic not ready — will replaceTrack later)");
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
        console.log(`[WebRTC] ICE candidate: type=${candidate.type} protocol=${candidate.protocol} addr=${candidate.address}`);
        sigSend({
          type: "ice_candidate",
          targetUserId: remoteUserIdRef.current,
          candidate: candidate.toJSON(),
        });
      }
    };

    // Diagnostic: ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log("[WebRTC] ICE connection state →", pc.iceConnectionState);
      if (pc.iceConnectionState === "failed") {
        console.error("[WebRTC] ❌ ICE FAILED — TURN relay may not be working");
      }
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        console.log("[WebRTC] ✓ ICE connected — media should be flowing");
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log("[WebRTC] ICE gathering state →", pc.iceGatheringState);
    };

    // Receive incoming remote tracks
    pc.ontrack = (event) => {
      console.log(`[WebRTC] ✓ Remote track received: kind=${event.track.kind} id=${event.track.id} enabled=${event.track.enabled} readyState=${event.track.readyState}`);
      event.track.enabled = true;

      setRemoteStream((prev) => {
        const stream = prev ? new MediaStream(prev.getTracks()) : new MediaStream();
        // Replace existing track of same kind to avoid duplicates
        const existing = stream.getTracks().find((t) => t.kind === event.track.kind);
        if (existing) {
          stream.removeTrack(existing);
        }
        stream.addTrack(event.track);
        return new MediaStream(stream.getTracks());
      });
    };

    // Handle renegotiation (fires when tracks are added/removed after initial SDP exchange)
    pc.onnegotiationneeded = async () => {
      if (!remoteUserIdRef.current) return;
      try {
        makingOfferRef.current = true;
        console.log("[WebRTC] onnegotiationneeded — sending new offer");
        const offer = await pc.createOffer();
        if (pc.signalingState !== "stable") {
          console.log("[WebRTC] onnegotiationneeded — signaling not stable, aborting");
          return;
        }
        await pc.setLocalDescription(offer);
        sigSend({
          type: "offer",
          targetUserId: remoteUserIdRef.current,
          sdp: pc.localDescription,
        });
      } catch (err) {
        console.error("[WebRTC] onnegotiationneeded error:", err);
      } finally {
        makingOfferRef.current = false;
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] Connection state →", pc.connectionState);
    };

    return pc;
  }, [sigSend]);

  // ─── Initiate an offer to target peer ──────────────────────────────────────
  const initiateOffer = useCallback(async (targetUserId: string) => {
    try {
      const pc = createPC();
      remoteUserIdRef.current = targetUserId;
      makingOfferRef.current = true;
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
    } finally {
      makingOfferRef.current = false;
    }
  }, [createPC, sigSend]);

  // ─── Auto-initialize microphone on room entry ─────────────────────────────
  useEffect(() => {
    let active = true;
    async function initAudio() {
      try {
        console.log("[WebRTC] Requesting microphone access...");
        const stream = await getAudioMediaStream();
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        console.log("[WebRTC] ✓ Microphone acquired successfully");
        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsMicOn(true);
        isMicOnRef.current = true;

        // If PeerConnection already exists (signaling connected before mic was ready),
        // hot-swap the real mic track into the audio transceiver via replaceTrack.
        // replaceTrack does NOT require SDP renegotiation — it seamlessly swaps the
        // media source on the existing SRTP stream.
        const pc = pcRef.current;
        if (pc && pc.signalingState !== "closed") {
          const audioTrack = stream.getAudioTracks()[0];
          const audioSender = getAudioSender(pc);
          if (audioSender) {
            console.log("[WebRTC] Hot-swapping real mic into existing transceiver via replaceTrack...");
            await audioSender.replaceTrack(audioTrack);
            console.log("[WebRTC] ✓ replaceTrack completed — real mic now in WebRTC pipeline");
          } else {
            console.warn("[WebRTC] No audio sender found — adding track directly");
            try {
              pc.addTrack(audioTrack, stream);
            } catch (e) {
              console.warn("[WebRTC] addTrack failed:", e);
            }
          }
        } else {
          console.log("[WebRTC] PC not yet created — mic track will be used when createPC() runs");
        }
      } catch (err) {
        console.warn("[WebRTC] Microphone access denied:", err);
        setIsMicOn(false);
        isMicOnRef.current = false;
      }
    }
    initAudio();
    return () => {
      active = false;
    };
  }, []);

  // ─── Connect WebSocket signaling ──────────────────────────────────────────
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
        micOn: isMicOnRef.current,
        videoOn: isVideoOnRef.current,
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
          // We are the new arrival — prepare PC and wait for the existing peer's offer
          createPC();
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

      // 3. Receive SDP offer — Perfect Negotiation pattern
      if (type === "offer") {
        const { fromUserId, sdp } = msg;
        remoteUserIdRef.current = fromUserId;
        const pc = createPC();
        try {
          // Perfect negotiation glare resolution
          const offerCollision = makingOfferRef.current || pc.signalingState !== "stable";
          const isPolite = String(userId) < String(fromUserId);
          const ignoreOffer = !isPolite && offerCollision;

          if (ignoreOffer) {
            console.warn("[WebRTC] Impolite peer ignoring colliding offer from", fromUserId);
            return;
          }

          if (offerCollision) {
            console.log("[WebRTC] Polite peer rolling back to accept incoming offer");
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
            console.log("[WebRTC] ✓ Answer accepted — call is active!");
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

  // ─── Toggle Microphone ────────────────────────────────────────────────────
  const toggleMic = useCallback(async () => {
    if (!isMicOn) {
      // Turn mic ON
      try {
        let audioTrack: MediaStreamTrack | null = null;
        if (localStreamRef.current && localStreamRef.current.getAudioTracks().length > 0) {
          audioTrack = localStreamRef.current.getAudioTracks()[0];
          audioTrack.enabled = true;
        } else {
          const stream = await getAudioMediaStream();
          audioTrack = stream.getAudioTracks()[0];
          if (!localStreamRef.current) {
            localStreamRef.current = new MediaStream();
          }
          localStreamRef.current.addTrack(audioTrack);
        }

        setLocalStream(new MediaStream(localStreamRef.current!.getTracks()));

        const pc = pcRef.current;
        if (pc && audioTrack) {
          const audioSender = getAudioSender(pc);
          if (audioSender) {
            if (audioSender.track !== audioTrack) {
              await audioSender.replaceTrack(audioTrack);
            }
            // Ensure the sender's track is enabled
            if (audioSender.track) {
              audioSender.track.enabled = true;
            }
          }
        }

        setIsMicOn(true);
        sigSend({ type: "media_state", micOn: true, videoOn: isVideoOnRef.current, screenSharing: isScreenSharingRef.current });
      } catch (err) {
        console.warn("[WebRTC] Mic access denied:", err);
      }
    } else {
      // Turn mic OFF (disable track — keeps connection active)
      if (localStreamRef.current) {
        for (const t of localStreamRef.current.getAudioTracks()) {
          t.enabled = false;
        }
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      }
      setIsMicOn(false);
      sigSend({ type: "media_state", micOn: false, videoOn: isVideoOnRef.current, screenSharing: isScreenSharingRef.current });
    }
  }, [isMicOn, sigSend]);

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

        setLocalStream(new MediaStream(localStreamRef.current!.getTracks()));

        const pc = pcRef.current || createPC();
        const videoSender = getVideoSender(pc);

        if (videoSender && videoTrack) {
          await videoSender.replaceTrack(videoTrack);
        } else if (videoTrack) {
          try {
            pc.addTrack(videoTrack, localStreamRef.current!);
          } catch {}
        }

        setIsVideoOn(true);
        sigSend({ type: "media_state", micOn: isMicOnRef.current, videoOn: true, screenSharing: isScreenSharingRef.current });
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
      sigSend({ type: "media_state", micOn: isMicOnRef.current, videoOn: false, screenSharing: isScreenSharingRef.current });
    }
  }, [isVideoOn, createPC, sigSend]);

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
        sigSend({ type: "media_state", micOn: isMicOnRef.current, videoOn: isVideoOnRef.current, screenSharing: true });
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
        videoSender.replaceTrack(isVideoOnRef.current ? cameraTrack : null).catch(console.warn);
      }
      setIsScreenSharing(false);
      sigSend({ type: "media_state", micOn: isMicOnRef.current, videoOn: isVideoOnRef.current, screenSharing: false });
    }
  }, [isScreenSharing, createPC, sigSend]);

  // ─── Local Speaking Detection (CLONED track — never interferes with WebRTC) ─
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
      // CRITICAL: Clone the track so the original stays exclusively in the WebRTC pipeline.
      // createMediaStreamSource on the original track can steal audio data from WebRTC on mobile.
      const clonedTrack = audioTrack.clone();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(new MediaStream([clonedTrack]));
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
        clonedTrack.stop(); // Stop the clone (not the original!)
        audioCtx.close().catch(() => {});
      };
    } catch {
      return () => {};
    }
  }, [localStream, isMicOn]);

  // ─── Remote Speaking Detection (getStats polling — zero AudioContext) ──────
  useEffect(() => {
    if (!isConnected) {
      setIsSpeakingRemote(false);
      return;
    }

    let intervalId: ReturnType<typeof setInterval>;
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

  // ─── Diagnostic: Log WebRTC stats every 5s ────────────────────────────────
  useEffect(() => {
    if (!isConnected) return;

    const logStats = async () => {
      const pc = pcRef.current;
      if (!pc || pc.connectionState === "closed") return;

      try {
        const report = await pc.getStats();
        let audioBytesSent = 0;
        let audioBytesReceived = 0;
        let audioPacketsSent = 0;
        let audioPacketsReceived = 0;
        let audioPacketsLost = 0;
        let localCandidateType = "";
        let remoteCandidateType = "";

        report.forEach((stat) => {
          if (stat.type === "outbound-rtp" && stat.kind === "audio") {
            audioBytesSent = stat.bytesSent || 0;
            audioPacketsSent = stat.packetsSent || 0;
          }
          if (stat.type === "inbound-rtp" && stat.kind === "audio") {
            audioBytesReceived = stat.bytesReceived || 0;
            audioPacketsReceived = stat.packetsReceived || 0;
            audioPacketsLost = stat.packetsLost || 0;
          }
          if (stat.type === "candidate-pair" && stat.state === "succeeded") {
            const localId = stat.localCandidateId;
            const remoteId = stat.remoteCandidateId;
            report.forEach((s) => {
              if (s.id === localId) localCandidateType = s.candidateType || "";
              if (s.id === remoteId) remoteCandidateType = s.candidateType || "";
            });
          }
        });

        console.log(
          `[WebRTC Stats] audio: sent=${audioBytesSent}B/${audioPacketsSent}pkt recv=${audioBytesReceived}B/${audioPacketsReceived}pkt lost=${audioPacketsLost}pkt | ICE=${pc.iceConnectionState} | candidates: local=${localCandidateType} remote=${remoteCandidateType}`
        );

        if (audioBytesSent === 0 && audioPacketsSent === 0) {
          console.warn("[WebRTC] ⚠ Zero audio bytes sent — mic track may not be attached");
        }
        if (audioBytesReceived === 0 && audioPacketsReceived === 0) {
          console.warn("[WebRTC] ⚠ Zero audio bytes received — remote peer may not be sending");
        }
      } catch {}
    };

    const id = setInterval(logStats, 5000);
    return () => clearInterval(id);
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
