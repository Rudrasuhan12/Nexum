import { PrismaClient, Role, AvailabilityStatus, ProjectState, ProposalStatus, PaymentState } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "backend", ".env") });

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting idempotent Nexum database seed...");

  // 1. Seed Demo Client (Alex Rivera)
  const client = await prisma.user.upsert({
    where: { email: "alex.rivera@nexum.demo" },
    update: {
      name: "Alex Rivera",
      role: Role.CLIENT,
      status: "ACTIVE",
    },
    create: {
      id: "usr_client_alex",
      email: "alex.rivera@nexum.demo",
      name: "Alex Rivera",
      role: Role.CLIENT,
      locale: "en-US",
      timezone: "America/New_York",
      status: "ACTIVE",
    },
  });
  console.log(`✅ Seeded Client: ${client.name} (${client.email})`);

  // 2. Seed Freelancers (A, B, C, Rohan)
  const freelancers = [
    {
      id: "usr_freelancer_rohan",
      email: "rohan.verma@nexum.demo",
      name: "Rohan Verma",
      title: "Senior Full-Stack & Payment Rails Engineer",
      bio: "Direct experience with PayPal REST v2 Orders, webhook signature validation, and dual SHA-256 state machines.",
      skills: ["PayPal v2", "Next.js", "State Machines", "TypeScript", "Node.js", "PostgreSQL"],
      ratePreferences: { minHourlyCents: 6500, preferredHourlyCents: 6500, currency: "USD" },
      portfolio: [
        { title: "Bilateral Payment Rails", year: 2026, impact: "$120K captured via REST v2" },
      ],
      experienceClaims: [
        { org: "TechKart", role: "Lead Payment Architect", years: 4 },
      ],
    },
    {
      id: "usr_freelancer_elena",
      email: "elena.rostova@nexum.demo",
      name: "Elena Rostova",
      title: "Senior Full-Stack & Payment Systems Architect",
      bio: "10+ years architecting zero-trust fintech solutions, high-throughput distributed state machines, and Next.js applications.",
      skills: ["Next.js", "TypeScript", "Node.js", "PostgreSQL", "PayPal Orders v2", "State Machines", "Zod", "Docker"],
      ratePreferences: { minHourlyCents: 9500, preferredHourlyCents: 12000, currency: "USD" },
      portfolio: [
        { title: "Verifiable Escrow Engine", year: 2025, impact: "$40M volume processed" },
        { title: "Deterministic State Machine", year: 2026, impact: "0 unhandled timeout states" },
      ],
      experienceClaims: [
        { org: "GlobalFintech", role: "Principal Engineer", years: 4 },
        { org: "AutonomousWorks", role: "Lead Architect", years: 3 },
      ],
    },
    {
      id: "usr_freelancer_marcus",
      email: "marcus.chen@nexum.demo",
      name: "Marcus Chen",
      title: "Cloud Infrastructure & Fault-Tolerant Systems Engineer",
      bio: "Specializing in resilient backend pipelines, webhook ingestion at scale, and high-availability database orchestration.",
      skills: ["Node.js", "Express", "PostgreSQL", "Prisma", "Redis", "Docker Compose", "CI/CD", "Prometheus"],
      ratePreferences: { minHourlyCents: 8500, preferredHourlyCents: 11000, currency: "USD" },
      portfolio: [
        { title: "Zero-Downtime Webhook Gateway", year: 2025, impact: "99.999% delivery guarantee" },
      ],
      experienceClaims: [
        { org: "ReliableCloud", role: "Staff DevOps Engineer", years: 5 },
      ],
    },
    {
      id: "usr_freelancer_priya",
      email: "priya.patel@nexum.demo",
      name: "Priya Patel",
      title: "AI Integration & Product Verification Specialist",
      bio: "Crafting schema-validated AI workflows that turn unstructured user prompts into verifiable requirements, PRDs, and executable milestones.",
      skills: ["Python", "TypeScript", "LangChain", "OpenAI / Claude / Gemini API", "Next.js", "Tailwind CSS"],
      ratePreferences: { minHourlyCents: 9000, preferredHourlyCents: 11500, currency: "USD" },
      portfolio: [
        { title: "Autonomous PRD Generation", year: 2026, impact: "92% client acceptance rate" },
      ],
      experienceClaims: [
        { org: "AIStudio Labs", role: "Senior AI Engineer", years: 3 },
      ],
    },
    {
      id: "usr_freelancer_sambit",
      email: "sambit.kumar@nexum.demo",
      name: "Sambit Kumar",
      title: "Full-Stack Specialist & E-commerce Architect",
      bio: "Specializing in high-conversion e-commerce web applications, Next.js, and PayPal payment workflows.",
      skills: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Node.js", "PostgreSQL", "PayPal"],
      ratePreferences: { minHourlyCents: 7500, preferredHourlyCents: 9500, currency: "USD" },
      portfolio: [
        { title: "TechKart E-commerce Web", year: 2026, impact: "$500K GMV" },
      ],
      experienceClaims: [
        { org: "TechKart Global", role: "Senior Frontend & Fullstack", years: 5 },
      ],
    },
  ];

  for (const f of freelancers) {
    const user = await prisma.user.upsert({
      where: { id: f.id },
      update: {
        name: f.name,
        email: f.email,
        role: Role.FREELANCER,
        status: "ACTIVE",
      },
      create: {
        id: f.id,
        email: f.email,
        name: f.name,
        role: Role.FREELANCER,
        locale: "en-US",
        timezone: "America/Los_Angeles",
        status: "ACTIVE",
      },
    });

    await prisma.freelancerProfile.upsert({
      where: { userId: user.id },
      update: {
        title: f.title,
        bio: f.bio,
        skills: f.skills,
        portfolio: f.portfolio,
        experienceClaims: f.experienceClaims,
        ratePreferences: f.ratePreferences,
        availability: AvailabilityStatus.AVAILABLE,
        isDemoData: true,
      },
      create: {
        userId: user.id,
        title: f.title,
        bio: f.bio,
        skills: f.skills,
        portfolio: f.portfolio,
        experienceClaims: f.experienceClaims,
        ratePreferences: f.ratePreferences,
        availability: AvailabilityStatus.AVAILABLE,
        isDemoData: true,
      },
    });

    console.log(`✅ Seeded Freelancer: ${f.name} (${f.title})`);
  }

  // 3. Seed Demo Project
  const project = await prisma.project.upsert({
    where: { id: "prj_nexum_core_mvp" },
    update: {
      title: "Nexum Protocol Core MVP",
      state: ProjectState.ACTIVE,
      budgetCents: 1000, // $10.00 USD
    },
    create: {
      id: "prj_nexum_core_mvp",
      clientId: client.id,
      title: "Nexum Protocol Core MVP",
      description: "AI-mediated freelance agreement, deterministic state machine, and PayPal payment verification evidence layer.",
      goals: "Establish verifiable payment evidence chain with reconcile-before-retry fault recovery.",
      budgetCents: 1000, // $10.00 USD
      currency: "USD",
      state: ProjectState.ACTIVE,
      visibility: "INVITE_ONLY",
    },
  });
  console.log(`✅ Seeded Project: ${project.title}`);

  // 4. Seed Canonical Proposal & Milestones (Elena)
  const elenaUser = await prisma.user.findUnique({ where: { email: "elena.rostova@nexum.demo" } });
  if (elenaUser) {
    const proposal = await prisma.proposalVersion.upsert({
      where: { versionHash: "hash_canonical_v1_seed_proofloop_2026" },
      update: {
        status: ProposalStatus.ACCEPTED,
      },
      create: {
        id: "prop_v1_seed",
        projectId: project.id,
        freelancerId: elenaUser.id,
        version: 1,
        versionHash: "hash_canonical_v1_seed_proofloop_2026",
        scope: "Implement Phase 1 core payment state machine, canonical hashing, money math, and Express PostgreSQL backend.",
        amountCents: 1000, // $10.00 USD
        currency: "USD",
        status: ProposalStatus.ACCEPTED,
      },
    });

    // Milestone 1 ($5.00)
    await prisma.milestone.upsert({
      where: {
        proposalVersionId_orderIndex: {
          proposalVersionId: proposal.id,
          orderIndex: 1,
        },
      },
      update: {
        title: "Milestone 1: Pure Core Logic & Unit Tests",
        amountCents: 500,
        state: PaymentState.CAPTURED,
      },
      create: {
        id: "ms_seed_1",
        proposalVersionId: proposal.id,
        orderIndex: 1,
        title: "Milestone 1: Pure Core Logic & Unit Tests",
        deliverables: ["State machine", "Money math minor units", "Canonical hashing", "Diff engine"],
        criteria: ["100% pure unit test coverage with Vitest"],
        amountCents: 500, // $5.00 USD
        currency: "USD",
        state: PaymentState.CAPTURED,
        fundingRule: "PRE_FUNDED_BEFORE_WORK",
      },
    });

    // Milestone 2 ($5.00)
    await prisma.milestone.upsert({
      where: {
        proposalVersionId_orderIndex: {
          proposalVersionId: proposal.id,
          orderIndex: 2,
        },
      },
      update: {
        title: "Milestone 2: Express & Prisma PostgreSQL Backend",
        amountCents: 500,
        state: PaymentState.NOT_STARTED,
      },
      create: {
        id: "ms_seed_2",
        proposalVersionId: proposal.id,
        orderIndex: 2,
        title: "Milestone 2: Express & Prisma PostgreSQL Backend",
        deliverables: ["Express server", "Prisma PostgreSQL schema", "Health check", "Seed script"],
        criteria: ["Clean startup on port 4000, idempotent database seeding"],
        amountCents: 500, // $5.00 USD
        currency: "USD",
        state: PaymentState.NOT_STARTED,
        fundingRule: "PRE_FUNDED_BEFORE_WORK",
      },
    });

    console.log("✅ Seeded Proposal & Milestones (Sum: $10.00 USD / 1000 cents)");
  }

  // 4b. Seed TechKart Project & Proposal (Sambit Kumar)
  const sambitUser = await prisma.user.findUnique({ where: { email: "sambit.kumar@nexum.demo" } });
  if (sambitUser) {
    const techkartProject = await prisma.project.upsert({
      where: { id: "techkart" },
      update: {
        title: "TechKart – E-commerce Website",
        state: ProjectState.ACTIVE,
        budgetCents: 1000000, // $10,000 USD
      },
      create: {
        id: "techkart",
        clientId: client.id,
        title: "TechKart – E-commerce Website",
        description: "Full-stack Next.js e-commerce application with PayPal escrow integration.",
        goals: "Complete UI/UX design, frontend cart/catalog development, and backend payment integration.",
        budgetCents: 1000000,
        currency: "USD",
        state: ProjectState.ACTIVE,
        visibility: "PUBLIC",
      },
    });

    const techkartProposal = await prisma.proposalVersion.upsert({
      where: { versionHash: "hash_canonical_techkart_v3_active_2026" },
      update: {
        status: ProposalStatus.ACCEPTED,
      },
      create: {
        id: "prop_techkart_v3",
        projectId: techkartProject.id,
        freelancerId: sambitUser.id,
        version: 3,
        versionHash: "hash_canonical_techkart_v3_active_2026",
        scope: "Full-stack e-commerce catalog, shopping cart, customer checkout, and PayPal webhook reconciliation.",
        amountCents: 1000000,
        currency: "USD",
        status: ProposalStatus.ACCEPTED,
      },
    });

    // Milestone 1 ($2,000)
    await prisma.milestone.upsert({
      where: {
        proposalVersionId_orderIndex: {
          proposalVersionId: techkartProposal.id,
          orderIndex: 1,
        },
      },
      update: {
        title: "Milestone 1: UI/UX Design & Architecture",
        amountCents: 200000,
        state: PaymentState.CAPTURED,
      },
      create: {
        id: "ms_techkart_1",
        proposalVersionId: techkartProposal.id,
        orderIndex: 1,
        title: "Milestone 1: UI/UX Design & Architecture",
        deliverables: ["Figma prototypes", "Design tokens", "Interactive wireframes"],
        criteria: ["Client approval on high-fidelity designs"],
        amountCents: 200000,
        currency: "USD",
        state: PaymentState.CAPTURED,
        fundingRule: "PRE_FUNDED_BEFORE_WORK",
      },
    });

    // Milestone 2 ($4,000)
    await prisma.milestone.upsert({
      where: {
        proposalVersionId_orderIndex: {
          proposalVersionId: techkartProposal.id,
          orderIndex: 2,
        },
      },
      update: {
        title: "Milestone 2: Frontend Development & Orders Engine",
        amountCents: 400000,
        state: PaymentState.AUTHORIZED,
      },
      create: {
        id: "ms_techkart_2",
        proposalVersionId: techkartProposal.id,
        orderIndex: 2,
        title: "Milestone 2: Frontend Development & Orders Engine",
        deliverables: ["Product catalog", "Shopping cart state", "Checkout forms"],
        criteria: ["Responsive Next.js components tested across mobile and desktop"],
        amountCents: 400000,
        currency: "USD",
        state: PaymentState.AUTHORIZED,
        fundingRule: "PRE_FUNDED_BEFORE_WORK",
      },
    });

    // Milestone 3 ($4,000)
    await prisma.milestone.upsert({
      where: {
        proposalVersionId_orderIndex: {
          proposalVersionId: techkartProposal.id,
          orderIndex: 3,
        },
      },
      update: {
        title: "Milestone 3: Backend Webhook & Idempotency",
        amountCents: 400000,
        state: PaymentState.NOT_STARTED,
      },
      create: {
        id: "ms_techkart_3",
        proposalVersionId: techkartProposal.id,
        orderIndex: 3,
        title: "Milestone 3: Backend Webhook & Idempotency",
        deliverables: ["PayPal webhook listener", "Prisma migrations", "Unit tests"],
        criteria: ["Passes 100% of integration test suites"],
        amountCents: 400000,
        currency: "USD",
        state: PaymentState.NOT_STARTED,
        fundingRule: "PRE_FUNDED_BEFORE_WORK",
      },
    });

    console.log(`✅ Seeded TechKart Project, Proposal, and 3 Milestones ($10,000 USD)`);
  }

  // 5. Append initial Audit Event
  await prisma.auditEvent.create({
    data: {
      action: "DATABASE_INITIALIZED_AND_SEEDED",
      objectType: "SYSTEM",
      objectId: "nexum_core",
      metadata: { seededAt: new Date().toISOString(), environment: "demo" },
    },
  });

  console.log("🎉 Nexum Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

