/**
 * useWebRTC - Production WebRTC hook with Signaling & MediaStream Lifecycle
 *
 * Fixes for Audio & Calling:
 *  - Transceivers (audio & video) created upfront with { direction: 'sendrecv' }
 *  - offerToReceiveAudio / offerToReceiveVideo guaranteed in SDP
 *  - ICE candidate queue: candidates arriving before setRemoteDescription are buffered and processed
 *  - Dedicated audio track management: toggleMic uses track.enabled (standard WebRTC mute/unmute)
 *    and replaces track in existing audio sender so renegotiation is not broken
 *  - Audio meter / analyser for real speaking detection on both local and remote streams
 *  - WebSocket signaling on ws://[host]/ws/meeting
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";

function buildIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: "stun:stun.relay.metered.ca:80" },
    { urls: "stun:stun.l.google.com:19302" },
  ];

  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

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

// ─── Studio Voice DSP & Gain Booster ──────────────────────────────────────────
// Applies Web Audio API High-Pass filter, Dynamics Compressor & Gain Booster (+5dB)
// to dramatically increase vocal clarity, remove fan/room rumble, and boost audible power.
function createStudioVoiceTrack(rawStream: MediaStream): { track: MediaStreamTrack; ctx: AudioContext } | null {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    const ctx = new AudioCtx();
    const source = ctx.createMediaStreamSource(rawStream);

    // 1. High-Pass Filter: strips low-frequency mechanical rumble, desk bumps, AC hum below 85Hz
    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 85;

    // 2. Dynamics Compressor: boosts quiet whispers, prevents loud distortion, gives studio presence
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    // 3. Vocal Gain Booster (+5 dB clean boost / ~1.8x volume multiplier)
    const gainNode = ctx.createGain();
    gainNode.gain.value = 1.8;

    const destination = ctx.createMediaStreamDestination();
    source.connect(highpass);
    highpass.connect(compressor);
    compressor.connect(gainNode);
    gainNode.connect(destination);

    const enhancedTrack = destination.stream.getAudioTracks()[0];
    return { track: enhancedTrack, ctx };
  } catch (err) {
    console.warn("[WebRTC] Studio Voice DSP fallback to raw track:", err);
    return null;
  }
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
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSpeakingMe, setIsSpeakingMe] = useState(false);
  const [isSpeakingRemote, setIsSpeakingRemote] = useState(false);

  // Signaling URL
  const signalingUrl = backendUrl.replace(/^http/, "ws") + "/ws/meeting";

  // Send message over WebSocket
  const sigSend = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // Flush queued ICE candidates after remote description is set
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

  // Create PeerConnection with Audio/Video transceivers
  const createPC = useCallback(() => {
    if (pcRef.current && pcRef.current.signalingState !== "closed") {
      return pcRef.current;
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    // Upfront transceivers ensure SDP offer/answer always contains audio and video media lines
    try {
      pc.addTransceiver("audio", { direction: "sendrecv" });
      pc.addTransceiver("video", { direction: "sendrecv" });
    } catch (e) {
      console.warn("[WebRTC] addTransceiver warning:", e);
    }

    // Attach local tracks if already available
    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) {
        const sender = pc.getSenders().find((s) => s.track?.kind === track.kind || s.track === track);
        if (sender) {
          sender.replaceTrack(track).catch(console.warn);
        } else {
          try {
            pc.addTrack(track, localStreamRef.current);
          } catch {}
        }
      }
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

    // Handle incoming remote media tracks (Audio & Video)
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote track: ${event.track.kind}`);
      const incomingStream = event.streams[0] || new MediaStream([event.track]);
      setRemoteStream((prev) => {
        if (!prev) return incomingStream;
        // Merge track into existing stream
        if (!prev.getTracks().some((t) => t.id === event.track.id)) {
          prev.addTrack(event.track);
        }
        return new MediaStream(prev.getTracks());
      });
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] Connection state:", pc.connectionState);
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        console.warn("[WebRTC] PeerConnection disconnected/failed, preparing reconnect.");
      }
    };

    return pc;
  }, [sigSend]);

  // Initiate an offer to the target peer
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

  // Connect WebSocket signaling
  const connectSignaling = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

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

      // When we join, discover participants already in the room
      if (type === "joined") {
        const others = (msg.participants as any[]).filter((p: any) => p.userId !== userId);
        const peerMap = new Map<string, RemotePeer>();
        for (const p of others) {
          peerMap.set(p.userId, { ...p });
          remoteUserIdRef.current = p.userId;
        }
        setRemotePeers(peerMap);

        // If an existing peer is present, create PC and wait or initiate
        if (others.length > 0) {
          createPC();
          // Caller initiates call to the first peer in room
          initiateOffer(others[0].userId);
        }
        return;
      }

      // When another peer joins after us
      if (type === "peer_joined") {
        const { userId: uid, userName: uName, role: uRole, avatar: uAvatar } = msg;
        remoteUserIdRef.current = uid;
        setRemotePeers((prev) => {
          const next = new Map(prev);
          next.set(uid, { userId: uid, userName: uName, role: uRole, avatar: uAvatar });
          return next;
        });
        // We are already in the room, initiate call to the newcomer
        createPC();
        initiateOffer(uid);
        return;
      }

      // Handle incoming SDP offer
      if (type === "offer") {
        const { fromUserId, sdp } = msg;
        remoteUserIdRef.current = fromUserId;
        const pc = createPC();
        try {
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

      // Handle incoming SDP answer
      if (type === "answer") {
        const { sdp } = msg;
        const pc = pcRef.current;
        if (pc && pc.signalingState === "have-local-offer") {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            await flushIceCandidates(pc);
            console.log("[WebRTC] Set remote answer successfully");
          } catch (err) {
            console.error("[WebRTC] Error setting remote answer:", err);
          }
        }
        return;
      }

      // Handle incoming ICE candidate
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
          // Buffer candidate until remote description is applied
          iceCandidateQueue.current.push(candidate);
        }
        return;
      }

      // Handle chat messages
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

      // Handle captions
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

      // Handle media state (remote peer mic / camera toggles)
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

      // Peer left
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
          // Request high-fidelity audio hardware
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 48000,
              channelCount: 1,
            },
          });
          // Pass through Studio Voice DSP graph (+5dB volume booster & rumble filter)
          const dsp = createStudioVoiceTrack(stream);
          audioTrack = dsp ? dsp.track : stream.getAudioTracks()[0];
          if (!localStreamRef.current) {
            localStreamRef.current = new MediaStream();
          }
          localStreamRef.current.addTrack(audioTrack);
        }

        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

        // Wire into PeerConnection
        const pc = pcRef.current || createPC();
        const audioSender = pc.getSenders().find(
          (s) => s.track?.kind === "audio" || (s as any).kind === "audio"
        );

        if (audioSender && audioTrack) {
          await audioSender.replaceTrack(audioTrack);
        } else if (audioTrack) {
          try {
            pc.addTrack(audioTrack, localStreamRef.current);
          } catch {}
        }

        setIsMicOn(true);
        sigSend({ type: "media_state", micOn: true, videoOn: isVideoOn, screenSharing: isScreenSharing });
      } catch (err) {
        console.warn("[WebRTC] Mic access denied:", err);
      }
    } else {
      // Turn mic OFF (disable track so peer receives silence without tearing down WebRTC)
      if (localStreamRef.current) {
        for (const t of localStreamRef.current.getAudioTracks()) {
          t.enabled = false;
        }
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      }
      setIsMicOn(false);
      sigSend({ type: "media_state", micOn: false, videoOn: isVideoOn, screenSharing: isScreenSharing });
    }
  }, [isMicOn, isVideoOn, isScreenSharing, createPC, sigSend]);

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
        const videoSender = pc.getSenders().find(
          (s) => s.track?.kind === "video" || (s as any).kind === "video"
        );

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
        const videoSender = pc.getSenders().find(
          (s) => s.track?.kind === "video" || (s as any).kind === "video"
        );
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
      // Revert to camera track if video was on
      const pc = pcRef.current;
      const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
      const videoSender = pc?.getSenders().find(
        (s) => s.track?.kind === "video" || (s as any).kind === "video"
      );
      if (videoSender && cameraTrack) {
        videoSender.replaceTrack(isVideoOn ? cameraTrack : null).catch(console.warn);
      }
      setIsScreenSharing(false);
      sigSend({ type: "media_state", micOn: isMicOn, videoOn: isVideoOn, screenSharing: false });
    }
  }, [isScreenSharing, isMicOn, isVideoOn, createPC, sigSend]);

  // ─── Real-time Local & Remote Audio Level Detection ────────────────────────
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

  useEffect(() => {
    if (!remoteStream) {
      setIsSpeakingRemote(false);
      return;
    }
    const audioTrack = remoteStream.getAudioTracks()[0];
    if (!audioTrack) {
      setIsSpeakingRemote(false);
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
        setIsSpeakingRemote(sum / data.length > 12);
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
  }, [remoteStream]);

  // ─── Send Chat Message ────────────────────────────────────────────────────
  const sendChat = useCallback((text: string) => {
    if (!text.trim()) return;
    sigSend({ type: "chat", text: text.trim() });
  }, [sigSend]);

  // ─── Send Caption ─────────────────────────────────────────────────────────
  const sendCaption = useCallback(
    (text: string, isFinal: boolean, isScopeAlert?: boolean, isCommitment?: boolean) => {
      sigSend({ type: "caption", text, isFinal, isScopeAlert, isCommitment });
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
        setLiveCaption(`[${userName}]: "${text}"`);
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
