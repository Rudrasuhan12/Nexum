import http from "http";
import express from "express";
import { WebSocket } from "ws";
import { attachSignalingServer } from "../src/signaling/rtcSignalingServer.js";

async function runTest() {
  console.log("=== Testing WebRTC Signaling Server ===");

  const app = express();
  const server = http.createServer(app);
  attachSignalingServer(server);

  await new Promise<void>((resolve) => server.listen(4567, resolve));
  console.log("Test signaling server listening on port 4567");

  const url = "ws://localhost:4567/ws/meeting";
  const roomId = "test-room-101";

  // Peer 1 (Client)
  const peer1 = new WebSocket(url);
  const peer2 = new WebSocket(url);

  let peer1ReceivedOffer = false;
  let peer2ReceivedOffer = false;
  let peer1ReceivedAnswer = false;
  let peer2ReceivedJoined = false;
  let peer1ReceivedPeerJoined = false;

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timeout waiting for signaling test")), 8000);

    peer1.on("open", () => {
      console.log("Peer 1 connected. Sending join...");
      peer1.send(JSON.stringify({
        type: "join",
        roomId,
        userId: "user-client-1",
        userName: "Client Alex",
        role: "CLIENT",
      }));
    });

    peer1.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      console.log("[Peer 1 received]:", msg.type);

      if (msg.type === "joined") {
        console.log("Peer 1 joined room successfully.");
        // Now connect Peer 2
      }

      if (msg.type === "peer_joined") {
        console.log("Peer 1 detected Peer 2 joined:", msg.userId);
        peer1ReceivedPeerJoined = true;
        // Peer 1 (existing in room) creates offer and sends to Peer 2
        peer1.send(JSON.stringify({
          type: "offer",
          targetUserId: msg.userId,
          sdp: { type: "offer", sdp: "v=0\r\no=mock 1 1 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n" },
        }));
      }

      if (msg.type === "answer") {
        console.log("Peer 1 received answer from:", msg.fromUserId);
        peer1ReceivedAnswer = true;
        clearTimeout(timer);
        resolve();
      }
    });

    // Connect Peer 2 after Peer 1 joins
    setTimeout(() => {
      peer2.on("open", () => {
        console.log("Peer 2 connected. Sending join...");
        peer2.send(JSON.stringify({
          type: "join",
          roomId,
          userId: "user-freelancer-2",
          userName: "Freelancer Sambit",
          role: "FREELANCER",
        }));
      });

      peer2.on("message", (data) => {
        const msg = JSON.parse(data.toString());
        console.log("[Peer 2 received]:", msg.type);

        if (msg.type === "joined") {
          peer2ReceivedJoined = true;
          console.log("Peer 2 joined. Participants count:", msg.participants.length);
        }

        if (msg.type === "offer") {
          console.log("Peer 2 received offer from:", msg.fromUserId);
          peer2ReceivedOffer = true;
          // Peer 2 sends answer back to Peer 1
          peer2.send(JSON.stringify({
            type: "answer",
            targetUserId: msg.fromUserId,
            sdp: { type: "answer", sdp: "v=0\r\no=mock 2 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n" },
          }));
        }
      });
    }, 500);
  });

  peer1.close();
  peer2.close();
  server.close();

  if (peer1ReceivedPeerJoined && peer2ReceivedOffer && peer1ReceivedAnswer) {
    console.log("SUCCESS: WebRTC Signaling Offer/Answer Relay verified 100%!");
    process.exit(0);
  } else {
    console.error("FAILED: Missing signaling steps");
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});

