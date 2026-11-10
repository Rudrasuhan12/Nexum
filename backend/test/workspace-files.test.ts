import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient, Role, ProjectState } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "path";
import http from "http";
import { app } from "../src/index.js";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
neonConfig.webSocketConstructor = ws;

describe("Workspace File Attachment & Sharing Protocol", () => {
  let prisma: PrismaClient;
  let server: http.Server;
  let baseUrl: string;
  const testSuffix = Date.now().toString().slice(-6);
  let clientId: string;
  let freelancerId: string;
  let projectId: string;

  beforeAll(async () => {
    const poolConfig = {
      host: new URL(process.env.DATABASE_URL!).hostname,
      user: new URL(process.env.DATABASE_URL!).username,
      password: new URL(process.env.DATABASE_URL!).password,
      database: new URL(process.env.DATABASE_URL!).pathname.slice(1),
      ssl: true,
    };
    prisma = new PrismaClient({ adapter: new PrismaNeon(poolConfig) });

    // Create test Client & Freelancer
    const client = await prisma.user.create({
      data: {
        email: `file_client_${testSuffix}@example.com`,
        name: `Client FileTest ${testSuffix}`,
        role: Role.CLIENT,
      },
    });
    clientId = client.id;

    const freelancer = await prisma.user.create({
      data: {
        email: `file_freelancer_${testSuffix}@example.com`,
        name: `Freelancer FileTest ${testSuffix}`,
        role: Role.FREELANCER,
      },
    });
    freelancerId = freelancer.id;

    // Create a project in ACTIVE state
    const project = await prisma.project.create({
      data: {
        title: `Project Files Protocol ${testSuffix}`,
        description: "Test workspace project for file sharing and attachments",
        clientId,
        state: ProjectState.ACTIVE,
        currency: "USD",
        budgetCents: 500000,
      },
    });
    projectId = project.id;

    // Start ephemeral server
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    if (projectId) {
      await prisma.projectFile.deleteMany({ where: { projectId } }).catch(() => {});
      await prisma.workspaceMessage.deleteMany({
        where: { conversation: { projectId } },
      }).catch(() => {});
      await prisma.workspaceConversation.deleteMany({ where: { projectId } }).catch(() => {});
      await prisma.project.delete({ where: { id: projectId } }).catch(() => {});
    }
    if (clientId) {
      await prisma.file.deleteMany({ where: { ownerId: clientId } }).catch(() => {});
      await prisma.user.delete({ where: { id: clientId } }).catch(() => {});
    }
    if (freelancerId) {
      await prisma.file.deleteMany({ where: { ownerId: freelancerId } }).catch(() => {});
      await prisma.user.delete({ where: { id: freelancerId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it("should upload a file to workspace project and post a file_card message into timeline", async () => {
    const fileContent = "Architecture Specification: Nexum Microservices\nAuthor: Freelancer";
    const blob = new Blob([fileContent], { type: "text/markdown" });
    const formData = new FormData();
    formData.append("file", blob, "Architecture_Specification.md");
    formData.append("senderId", freelancerId);
    formData.append("senderRole", "FREELANCER");
    formData.append("note", "Please review the updated architecture spec.");

    const res = await fetch(`${baseUrl}/api/workspace/projects/${projectId}/files`, {
      method: "POST",
      headers: {
        "x-nexum-internal": "true",
        "x-user-id": freelancerId,
      },
      body: formData,
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.file).toBeDefined();
    expect(json.data.file.name).toBe("Architecture_Specification.md");
    expect(json.data.file.type).toBe("MD");
    expect(json.data.file.sha256).toBeDefined();
    expect(json.data.message).toBeDefined();
    expect(json.data.message.type).toBe("file_card");
    expect(json.data.message.metadata.fileName).toBe("Architecture_Specification.md");
    expect(json.data.message.metadata.note).toBe("Please review the updated architecture spec.");

    // Verify file record in database
    const dbFile = await prisma.file.findUnique({
      where: { id: json.data.file.fileId },
    });
    expect(dbFile).not.toBeNull();
    expect(dbFile?.originalName).toBe("Architecture_Specification.md");

    // Verify projectFile record in database
    const dbProjectFile = await prisma.projectFile.findUnique({
      where: { id: json.data.file.id },
    });
    expect(dbProjectFile).not.toBeNull();
    expect(dbProjectFile?.projectId).toBe(projectId);

    // Verify file streaming download endpoint
    const downloadRes = await fetch(`${baseUrl}/api/files/${json.data.file.fileId}?download=1`, {
      headers: {
        "x-nexum-internal": "true",
      },
    });
    expect(downloadRes.status).toBe(200);
    const downloadedText = await downloadRes.text();
    expect(downloadedText).toBe(fileContent);
    expect(downloadRes.headers.get("content-disposition")).toContain("attachment");
  });

  it("should reflect the shared file in the workspace timeline and files list", async () => {
    const res = await fetch(`${baseUrl}/api/workspace/projects/${projectId}/timeline`, {
      headers: {
        "x-nexum-internal": "true",
        "x-user-id": clientId,
      },
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    // Verify messages contains file_card
    const fileCardMsg = json.data.messages.find((m: any) => m.type === "file_card");
    expect(fileCardMsg).toBeDefined();
    expect(fileCardMsg.metadata.fileName).toBe("Architecture_Specification.md");

    // Verify project files contains the uploaded file
    const vaultFiles = json.data.files || json.data.project?.projectFiles;
    expect(vaultFiles).toBeDefined();
    expect(vaultFiles.length).toBeGreaterThan(0);
  });
});
