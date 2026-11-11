import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getProjectsStore } from "@/lib/projects-store";
import { getBackendUrl } from "@/lib/backend-url";

const BACKEND_URL = getBackendUrl();

const DEFAULT_RECOMMENDED_FREELANCERS = [
  {
    id: "usr_freelancer_rohan",
    name: "Rohan Verma",
    role: "Senior Full-Stack & Payment Rails Engineer",
    skills: ["PayPal Orders v2", "Next.js", "PostgreSQL", "State Machines"],
    rate: "$65/hr",
    rating: "5.0 (28 jobs)",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    availability: "Available now",
  },
  {
    id: "cmvuanz4u0000vgtkuq294rn2",
    name: "Sambit Kumar Mohanty",
    role: "Full-Stack Specialist & Escrow Engineer",
    skills: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
    rate: "$60/hr",
    rating: "5.0 (15 jobs)",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    availability: "Available now",
  },
  {
    id: "cmw0u242a0003fb2d7z55d4zv",
    name: "Chandrasekhar",
    role: "Freelancer Specialist",
    skills: ["Web development", "Backend / API development", "TypeScript"],
    rate: "$60/hr",
    rating: "5.0 (12 jobs)",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    availability: "Available now",
  },
];

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId") || user?.id || "usr_client_alex";

    // Attempt to proxy to Express backend
    try {
      const res = await fetch(`${BACKEND_URL}/api/client/overview?clientId=${clientId}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Backend not reachable: compute live from projects store
    }

    const projects = getProjectsStore(clientId);

    // Map projects into ActiveProjectItem format
    const activeProjects = projects.map((p) => {
      const isDraft = p.status === "DRAFT";
      return {
        id: p.id,
        name: p.name,
        stage: isDraft
          ? "Draft spec saved · Ready to publish"
          : p.stageSummary || "Milestone in active engineering progress",
        status: isDraft ? "DRAFT" : "IN_PROGRESS",
        freelancer: p.freelancer?.name || (isDraft ? "Draft spec (no contractor)" : "Verified Candidate"),
        avatar:
          p.freelancer?.avatar ||
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80",
        progress: isDraft ? 0 : 50,
        budget: p.totalBudget || "$0.00",
        nextDeadline: "Scheduled",
        actionUrl: isDraft ? `/client/post-project?draftId=${p.id}` : `/client/projects/${p.id}`,
      };
    });

    const activeCount = projects.filter((p) => p.status !== "DRAFT" && p.status !== "COMPLETED").length;
    const draftCount = projects.filter((p) => p.status === "DRAFT").length;
    const attentionCount = projects.filter((p) => p.needsAction).length;

    return NextResponse.json({
      success: true,
      data: {
        summaryCards: [
          {
            id: "active_projects",
            title: "Active Projects",
            value: String(activeCount + draftCount),
            trend: `${activeCount} active · ${draftCount} draft`,
            trendPositive: true,
            tab: "projects",
          },
          {
            id: "pending_approvals",
            title: "Pending Approvals",
            value: String(attentionCount),
            trend: attentionCount > 0 ? "Needs your review" : "All caught up",
            trendPositive: attentionCount === 0,
            tab: "milestones",
          },
          {
            id: "funded_escrow",
            title: "Funds in Escrow",
            value: "$3,000",
            trend: "PayPal Orders v2 backed",
            trendPositive: true,
            tab: "payments",
          },
          {
            id: "milestones_done",
            title: "Milestones Done",
            value: "1 / 5",
            trend: "20% total progress",
            trendPositive: true,
            tab: "milestones",
          },
          {
            id: "active_talent",
            title: "Active Talent",
            value: "2",
            trend: "Verified freelancers",
            trendPositive: true,
            tab: "freelancers",
          },
          {
            id: "consensus_health",
            title: "Consensus Status",
            value: "100%",
            trend: "Dual SHA-256 locked",
            trendPositive: true,
            tab: "workspace",
          },
        ],
        attentionItems: [
          {
            id: "att_m2",
            title: "PayPal Webhook Ingestion Engine Review",
            project: "Bilateral E-Commerce Payment Rails",
            projectId: "proj_1",
            freelancer: "Rohan Verma",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80",
            type: "DELIVERABLE_SUBMISSION",
            amount: "$1,500.00",
            dueNotice: "Pending client sign-off · PayPal funds locked in escrow",
            actionText: "Review & Release Funds",
            actionType: "PRIMARY",
            actionUrl: "/client/projects/proj_1?tab=milestones",
            milestoneId: "ms_proj_1_2",
          },
        ],
        activeProjects,
        upcomingMilestones: [
          {
            id: "ms_proj_1_2",
            title: "M2: PayPal Webhook Ingestion Engine",
            project: "Bilateral E-Commerce Payment Rails",
            projectId: "proj_1",
            freelancer: "Rohan Verma",
            dueDate: "Tomorrow",
            amount: "$1,500.00",
            state: "SUBMITTED",
            stateColor: "bg-amber-50 text-amber-700 border-amber-200",
          },
          {
            id: "ms_proj_2_1",
            title: "M1: AI Provider Gateway Isolation",
            project: "CloudMesh AI Gateway Unification",
            projectId: "proj_2",
            freelancer: "Elena Rostova",
            dueDate: "In 3 days",
            amount: "$1,200.00",
            state: "IN_PROGRESS",
            stateColor: "bg-blue-50 text-blue-700 border-blue-200",
          },
        ],
        recommendedFreelancers: DEFAULT_RECOMMENDED_FREELANCERS,
        recentActivities: [
          {
            id: "act_1",
            actor: "Rohan Verma",
            action: "submitted deliverable package for",
            target: "M2: PayPal Webhook Ingestion Engine",
            time: "2 hours ago",
            type: "SUBMISSION",
          },
        ],
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch overview";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
