/**
 * Nexum WebRTC Signaling Server
 * 
 * Production-grade WebSocket signaling for peer-to-peer video calls.
 * Handles SDP offer/answer exchange, ICE candidate relay, 
 * in-call chat messages, and participant lifecycle management.
 * 
 * Architecture:
 *  - Each room has a Map of userId → WebSocket
 *  - SDP and ICE are relayed between the two peers in the room
 *  - Chat messages are broadcast to all participants
 *  - Transcripts are broadcast so both peers display each other's CC
 */

import { WebSocketServer, WebSocket, RawData } from "ws";
import http from "http";
import crypto from "crypto";

interface SignalingPeer {
  ws: WebSocket;
  userId: string;
  userName: string;
  role: string;
  avatar?: string;
  micOn?: boolean;
  videoOn?: boolean;
}

interface Room {
  roomId: string;
  peers: Map<string, SignalingPeer>; // userId → peer
  createdAt: Date;
}

const rooms = new Map<string, Room>();

function getOrCreateRoom(roomId: string): Room {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      roomId,
      peers: new Map(),
      createdAt: new Date(),
    });
  }
  return rooms.get(roomId)!;
}

function broadcast(room: Room, message: object, excludeUserId?: string) {
  const payload = JSON.stringify(message);
  for (const [uid, peer] of room.peers) {
    if (uid !== excludeUserId && peer.ws.readyState === WebSocket.OPEN) {
      peer.ws.send(payload);
    }
  }
}

function sendTo(room: Room, targetUserId: string, message: object) {
  const peer = room.peers.get(targetUserId);
  if (peer && peer.ws.readyState === WebSocket.OPEN) {
    peer.ws.send(JSON.stringify(message));
  }
}

function sendErr(ws: WebSocket, code: string, detail: string) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "error", code, detail }));
  }
}

function cleanupOldRooms() {
  const ONE_HOUR = 60 * 60 * 1000;
  const now = Date.now();
  for (const [roomId, room] of rooms) {
    if (room.peers.size === 0 && now - room.createdAt.getTime() > ONE_HOUR) {
      rooms.delete(roomId);
    }
  }
}

export function attachSignalingServer(server: http.Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/ws/meeting" });

  wss.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      // Ignored: HTTP server error listener handles EADDRINUSE
      return;
    }
    console.warn("[Signaling WebSocket] Notice:", err.message);
  });

  wss.on("connection", (ws: WebSocket) => {
    let currentRoomId: string | null = null;
    let currentUserId: string | null = null;

    ws.on("message", (raw: RawData) => {
      let msg: any;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        sendErr(ws, "INVALID_JSON", "Message must be valid JSON");
        return;
      }

      const { type } = msg;

      // ─── JOIN ───────────────────────────────────────────────────────────────
      if (type === "join") {
        const { roomId, userId, userName, role, avatar, micOn, videoOn } = msg;
        if (!roomId || !userId) {
          sendErr(ws, "JOIN_MISSING_FIELDS", "roomId and userId required");
          return;
        }

        currentRoomId = roomId;
        currentUserId = userId;

        const room = getOrCreateRoom(roomId);

        // Replace any stale connection for same userId
        if (room.peers.has(userId)) {
          const old = room.peers.get(userId)!;
          if (old.ws !== ws && old.ws.readyState === WebSocket.OPEN) {
            old.ws.send(JSON.stringify({ type: "kicked", reason: "New connection opened" }));
            old.ws.close();
          }
        }

        const peer: SignalingPeer = {
          ws,
          userId,
          userName: userName || "Participant",
          role: role || "FREELANCER",
          avatar: avatar || "",
          micOn: micOn !== false,
          videoOn: !!videoOn,
        };
        room.peers.set(userId, peer);

        // Send current participants list back to joiner
        const participants = Array.from(room.peers.values()).map((p) => ({
          userId: p.userId,
          userName: p.userName,
          role: p.role,
          avatar: p.avatar,
          micOn: p.micOn !== false,
          videoOn: !!p.videoOn,
        }));
        ws.send(JSON.stringify({ type: "joined", participants }));

        // Notify existing peers of new arrival
        broadcast(room, {
          type: "peer_joined",
          userId,
          userName: peer.userName,
          role: peer.role,
          avatar: peer.avatar,
          micOn: peer.micOn !== false,
          videoOn: !!peer.videoOn,
        }, userId);

        console.log(`[Signaling] ${userName} (${role}) joined room ${roomId}. Peers: ${room.peers.size}`);
        return;
      }

      // All subsequent messages require an active room
      if (!currentRoomId || !currentUserId) {
        sendErr(ws, "NOT_IN_ROOM", "Send 'join' first");
        return;
      }
      const room = rooms.get(currentRoomId);
      if (!room) {
        sendErr(ws, "ROOM_NOT_FOUND", "Room does not exist");
        return;
      }

      // ─── SDP OFFER ─────────────────────────────────────────────────────────
      if (type === "offer") {
        const { targetUserId, sdp } = msg;
        if (!targetUserId || !sdp) {
          sendErr(ws, "OFFER_MISSING_FIELDS", "targetUserId and sdp required");
          return;
        }
        sendTo(room, targetUserId, {
          type: "offer",
          fromUserId: currentUserId,
          sdp,
        });
        return;
      }

      // ─── SDP ANSWER ────────────────────────────────────────────────────────
      if (type === "answer") {
        const { targetUserId, sdp } = msg;
        if (!targetUserId || !sdp) {
          sendErr(ws, "ANSWER_MISSING_FIELDS", "targetUserId and sdp required");
          return;
        }
        sendTo(room, targetUserId, {
          type: "answer",
          fromUserId: currentUserId,
          sdp,
        });
        return;
      }

      // ─── ICE CANDIDATE ─────────────────────────────────────────────────────
      if (type === "ice_candidate") {
        const { targetUserId, candidate } = msg;
        if (!targetUserId || !candidate) {
          sendErr(ws, "ICE_MISSING_FIELDS", "targetUserId and candidate required");
          return;
        }
        sendTo(room, targetUserId, {
          type: "ice_candidate",
          fromUserId: currentUserId,
          candidate,
        });
        return;
      }

      // ─── IN-CALL CHAT MESSAGE ───────────────────────────────────────────────
      if (type === "chat") {
        const { text } = msg;
        if (!text || typeof text !== "string") {
          sendErr(ws, "CHAT_MISSING_TEXT", "text required");
          return;
        }
        const peer = room.peers.get(currentUserId);
        const payload = {
          type: "chat",
          fromUserId: currentUserId,
          fromUserName: peer?.userName || "Participant",
          text: text.slice(0, 2000),
          timestamp: new Date().toISOString(),
        };
        // Send to everyone including sender (so sender sees their own message confirmed)
        for (const p of room.peers.values()) {
          if (p.ws.readyState === WebSocket.OPEN) {
            p.ws.send(JSON.stringify(payload));
          }
        }
        return;
      }

      // ─── LIVE CAPTION / TRANSCRIPT ─────────────────────────────────────────
      if (type === "caption") {
        const { text, isFinal, isScopeAlert, isCommitment } = msg;
        if (typeof text !== "string") return;
        const peer = room.peers.get(currentUserId);
        broadcast(room, {
          type: "caption",
          fromUserId: currentUserId,
          fromUserName: peer?.userName || "Participant",
          text: text.slice(0, 500),
          isFinal: !!isFinal,
          isScopeAlert: !!isScopeAlert,
          isCommitment: !!isCommitment,
          timestamp: new Date().toISOString(),
        }, currentUserId);
        return;
      }

      // ─── MEDIA STATE NOTIFICATION ──────────────────────────────────────────
      if (type === "media_state") {
        const { micOn, videoOn, screenSharing } = msg;
        const peer = room.peers.get(currentUserId);
        if (peer) {
          if (micOn !== undefined) peer.micOn = !!micOn;
          if (videoOn !== undefined) peer.videoOn = !!videoOn;
        }
        broadcast(room, {
          type: "media_state",
          fromUserId: currentUserId,
          micOn: !!micOn,
          videoOn: !!videoOn,
          screenSharing: !!screenSharing,
        }, currentUserId);
        return;
      }

      // ─── EMOJI REACTION ────────────────────────────────────────────────────
      if (type === "reaction") {
        const { emoji } = msg;
        const peer = room.peers.get(currentUserId);
        broadcast(room, {
          type: "reaction",
          fromUserId: currentUserId,
          fromUserName: peer?.userName || "Participant",
          emoji,
        }, currentUserId);
        return;
      }

      // ─── LEAVE ─────────────────────────────────────────────────────────────
      if (type === "leave") {
        room.peers.delete(currentUserId);
        broadcast(room, {
          type: "peer_left",
          userId: currentUserId,
        });
        currentRoomId = null;
        currentUserId = null;
        ws.close();
        return;
      }

      sendErr(ws, "UNKNOWN_TYPE", `Unknown message type: ${type}`);
    });

    ws.on("close", () => {
      if (currentRoomId && currentUserId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          room.peers.delete(currentUserId);
          broadcast(room, {
            type: "peer_left",
            userId: currentUserId,
          });
        }
      }
    });

    ws.on("error", (err: Error) => {
      console.error("[Signaling] WebSocket error:", err.message);
    });
  });

  // Clean up stale empty rooms every 15 minutes
  setInterval(cleanupOldRooms, 15 * 60 * 1000);

  console.log("🔗 WebRTC Signaling Server attached at ws://[host]/ws/meeting");
  return wss;
}

