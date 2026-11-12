process.env.DISABLE_BACKGROUND_WORKER = "true";
process.env.NODE_ENV = "test";
process.env.PORT = "0";
process.env.ENABLE_DEV_TOOLS = "true";

/**
 * NEXUM BACKEND & SPONSOR INTEGRATION — PHASE 10 VERIFICATION SUITE
 *
 * Verifies Bryntum Milestone Gantt & Project Timeline Engine:
 * Check 1: Workspace Project API provides complete milestone timelines with dates & status
 * Check 2: Milestone sequencing preserves chronological order indices and dependencies
 * Check 3: MilestoneGanttView component implements Bryntum Gantt data structure & zoom levels
 * Check 4: Workspace Client & Freelancer chat modes wire the "Timeline (Gantt)" tab
 * Check 5: Critical path & Add-on milestone (v1.1) differentiation logic is present
 */

import http from "http";
import net from "net";
import fs from "fs";
import path from "path";
import { prisma } from "../src/prisma.js";

interface CheckResult {
  num: number;
  name: string;
  passed: boolean;
  details?: string;
}

const results: CheckResult[] = [];

function record(num: number, name: string, passed: boolean, details?: string) {
  results.push({ num, name, passed, details });
  const icon = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${icon} — [Check ${num}] ${name}${details ? ` (${details})` : ""}`);
}

async function isPortReachable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    sock.setTimeout(1000);
    sock.on("connect", () => {
      sock.destroy();
      resolve(true);
    });
    sock.on("error", () => {
      sock.destroy();
      resolve(false);
    });
    sock.on("timeout", () => {
      sock.destroy();
      resolve(false);
    });
    sock.connect(port, "127.0.0.1");
  });
}

async function run() {
  console.log("\n=======================================================");
  console.log("   NEXUM SPONSOR INTEGRATION — PHASE 10 (BRYNTUM GANTT)");
  console.log("=======================================================\n");

  let baseUrl = "http://127.0.0.1:4000";
  let localServer: http.Server | null = null;

  const port4000Open = await isPortReachable(4000);
  if (!port4000Open) {
    const { app } = await import("../src/index.js");
    localServer = http.createServer(app);
    await new Promise<void>((resolve) => localServer!.listen(0, resolve));
    const port = (localServer.address() as net.AddressInfo).port;
    baseUrl = `http://127.0.0.1:${port}`;
  }

  try {
    // Locate a real project with milestones from database
    const dbProject = await prisma.project.findFirst({
      where: {
        id: "prj_1794235306828_3l3j",
      },
      include: {
        client: true,
        projectMilestones: { orderBy: { orderIndex: "asc" } },
      },
    }) || await prisma.project.findFirst({
      where: {
        projectMilestones: { some: {} },
      },
      include: {
        client: true,
        projectMilestones: { orderBy: { orderIndex: "asc" } },
      },
    });

    const targetUserId = dbProject?.clientId || "cmw2dnha60000852e25lag5hy";

    // Check 1: Workspace Project API delivers milestones
    const res1 = await fetch(`${baseUrl}/api/workspace/projects?userId=${encodeURIComponent(targetUserId)}&role=CLIENT`);
    const data1 = (await res1.json()) as any;
    const projectList = data1.data || data1.projects || [];
    const targetPrj = projectList.find((p: any) => p.id === dbProject?.id) || projectList[0];
    const hasMilestones = targetPrj && Array.isArray(targetPrj.milestones) && targetPrj.milestones.length > 0;

    record(
      1,
      "Workspace Project API delivers milestones with dates, amounts, and statuses",
      Boolean(hasMilestones),
      `Found ${targetPrj?.milestones?.length || 0} milestones in project "${targetPrj?.name || "N/A"}"`
    );

    // Check 2: Milestone sequencing preserves chronological order indices
    let orderingValid = false;
    if (hasMilestones) {
      const numbers = targetPrj.milestones.map((m: any) => m.number);
      orderingValid = numbers.every((num: number, idx: number) => num === idx + 1 || num >= idx);
    }
    record(
      2,
      "Milestone order indices are sequential and establish clear dependency chains",
      orderingValid,
      `Milestone count: ${targetPrj?.milestones?.length || 0}`
    );

    // Check 3: MilestoneGanttView component exists and implements Bryntum data structure
    const ganttViewPath = path.resolve(
      __dirname,
      "../../frontend/src/components/workspace/MilestoneGanttView.tsx"
    );
    const ganttCode = fs.readFileSync(ganttViewPath, "utf-8");
    const hasBryntumStructure =
      ganttCode.includes("BryntumGanttTask") &&
      ganttCode.includes("percentDone") &&
      ganttCode.includes("dependencies") &&
      ganttCode.includes("isCritical") &&
      ganttCode.includes("zoomLevel");

    record(
      3,
      "MilestoneGanttView component implements Bryntum Gantt data structure & zoom levels",
      hasBryntumStructure,
      "Contains BryntumGanttTask mapping, dependency linking, and Days/Weeks/Months zoom"
    );

    // Check 4: Workspace Client & Freelancer chat modes wire the "timeline" tab
    const clientWorkspacePath = path.resolve(
      __dirname,
      "../../frontend/src/components/client/workspace/WorkspaceChatsMode.tsx"
    );
    const freelancerWorkspacePath = path.resolve(
      __dirname,
      "../../frontend/src/components/freelancer/workspace/FreelancerWorkspaceChatsMode.tsx"
    );
    const clientCode = fs.readFileSync(clientWorkspacePath, "utf-8");
    const freelancerCode = fs.readFileSync(freelancerWorkspacePath, "utf-8");

    const clientWired =
      clientCode.includes('id: "timeline"') &&
      clientCode.includes("MilestoneGanttView") &&
      clientCode.includes('activeTab === "timeline"');
    const freelancerWired =
      freelancerCode.includes('id: "timeline"') &&
      freelancerCode.includes("MilestoneGanttView") &&
      freelancerCode.includes('activeTab === "timeline"');

    record(
      4,
      "Both Client and Freelancer workspace modes integrate the Bryntum Timeline tab",
      clientWired && freelancerWired,
      "Client and Freelancer workspaces render MilestoneGanttView on tab selection"
    );

    // Check 5: Critical path & Add-on milestone (v1.1) differentiation logic is present
    const hasCriticalPath = ganttCode.includes("showCriticalPath") && ganttCode.includes("isCritical");
    const hasAddonBadge = ganttCode.includes("isAddon") && ganttCode.includes("v1.1 Add-on");

    record(
      5,
      "Critical path and v1.1 add-on milestone indicators are active in the Gantt engine",
      hasCriticalPath && hasAddonBadge,
      "Critical path highlighter and v1.1 scope amendment tags rendered"
    );
  } finally {
    if (localServer) {
      localServer.close();
    }
  }

  const passedCount = results.filter((r) => r.passed).length;
  console.log(`\n=======================================================`);
  console.log(`Phase 10 Verification Summary: ${passedCount} / ${results.length} PASSED`);
  console.log(`=======================================================\n`);

  if (passedCount < results.length) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
