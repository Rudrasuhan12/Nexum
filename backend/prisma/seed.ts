import { PrismaClient, Role, AvailabilityStatus, ProjectState, ProposalStatus, PaymentState, ExperienceLevel } from "@prisma/client";
import { hashPassword } from "../src/lib/auth.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting idempotent Nexum database seed...");
  const defaultPasswordHash = await hashPassword("demo1234");

  // 1. Seed Demo Client (Alex Rivera)
  const client = await prisma.user.upsert({
    where: { email: "alex.rivera@nexum.demo" },
    update: {
      name: "Alex Rivera",
      role: Role.CLIENT,
      status: "ACTIVE",
      passwordHash: defaultPasswordHash,
    },
    create: {
      id: "usr_client_alex",
      email: "alex.rivera@nexum.demo",
      name: "Alex Rivera",
      role: Role.CLIENT,
      locale: "en-US",
      timezone: "America/New_York",
      status: "ACTIVE",
      passwordHash: defaultPasswordHash,
    },
  });
  console.log(`✅ Seeded Client: ${client.name} (${client.email})`);

  // 1b. Seed Additional Demo Clients for Phase 3 Variety
  const clientDavid = await prisma.user.upsert({
    where: { email: "david.sterling@fintechlabs.demo" },
    update: {
      name: "David Sterling",
      role: Role.CLIENT,
      status: "ACTIVE",
      passwordHash: defaultPasswordHash,
    },
    create: {
      id: "usr_client_david",
      email: "david.sterling@fintechlabs.demo",
      name: "David Sterling",
      role: Role.CLIENT,
      locale: "en-US",
      timezone: "America/Los_Angeles",
      status: "ACTIVE",
      passwordHash: defaultPasswordHash,
    },
  });

  const clientSarah = await prisma.user.upsert({
    where: { email: "sarah.jenkins@medicaresolutions.demo" },
    update: {
      name: "Sarah Jenkins",
      role: Role.CLIENT,
      status: "ACTIVE",
      passwordHash: defaultPasswordHash,
    },
    create: {
      id: "usr_client_sarah",
      email: "sarah.jenkins@medicaresolutions.demo",
      name: "Sarah Jenkins",
      role: Role.CLIENT,
      locale: "en-US",
      timezone: "America/Chicago",
      status: "ACTIVE",
      passwordHash: defaultPasswordHash,
    },
  });

  // 2. Seed Freelancers (A, B, C)
  const freelancers = [
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
  ];

  for (const f of freelancers) {
    const user = await prisma.user.upsert({
      where: { email: f.email },
      update: {
        name: f.name,
        role: Role.FREELANCER,
        status: "ACTIVE",
        passwordHash: defaultPasswordHash,
      },
      create: {
        id: f.id,
        email: f.email,
        name: f.name,
        role: Role.FREELANCER,
        locale: "en-US",
        timezone: "America/Los_Angeles",
        status: "ACTIVE",
        passwordHash: defaultPasswordHash,
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

  // 3b. Seed Phase 3 Full Spectrum Opportunities (15 total for all 18 test checks)
  const demoOpportunities = [
    {
      id: "opp_1",
      clientId: client.id,
      title: "Let's Collaborate on HAV's Website Redesign",
      description: "We are looking for a creative person who can redesign & build beautiful landing pages in modern responsive frameworks with clean typography.",
      category: "Web Design",
      skills: ["React", "UI Design", "Web Design", "Landing Page", "Web Development", "Figma"],
      experienceLevel: ExperienceLevel.BEGINNER,
      budgetType: "HOURLY",
      budgetCents: 1500,
      location: "Germany",
      visibility: "PUBLIC",
      state: ProjectState.MATCHING,
    },
    {
      id: "opp_2",
      clientId: client.id,
      title: "Build/Edit Landing Page for Online Course",
      description: "Have a current landing page for my online course already. Need a designer to polish the layout, improve conversion flow, and add high-converting CTA sections.",
      category: "Web Design",
      skills: ["Website Redesign", "Web Design", "Landing Page", "Graphic Design", "UI/UX"],
      experienceLevel: ExperienceLevel.JUNIOR,
      budgetType: "HOURLY",
      budgetCents: 2000,
      location: "United States",
      visibility: "PUBLIC",
      state: ProjectState.MATCHING,
    },
    {
      id: "opp_3",
      clientId: client.id,
      title: "Web Designer for E-Commerce Website",
      description: "Install new e-commerce responsive theme, redesign navigation menu, layout product catalog grids, and create custom mobile checkout views.",
      category: "Web Design",
      skills: ["Web Design", "Responsive Design", "Web Development", "Tailwind CSS", "Shopify"],
      experienceLevel: ExperienceLevel.MID,
      budgetType: "HOURLY",
      budgetCents: 2500,
      location: "India",
      visibility: "PUBLIC",
      state: ProjectState.MATCHING,
    },
    {
      id: "opp_4",
      clientId: client.id,
      title: "SaaS Dashboard Redesign & Design System Architect",
      description: "We're looking for a design systems architect who can help us redesign our B2B SaaS analytics portal in Figma and translate tokens to Next.js Tailwind components.",
      category: "Web Design",
      skills: ["Web Design", "Design Systems", "Figma", "Prototyping", "Next.js"],
      experienceLevel: ExperienceLevel.EXPERT,
      budgetType: "HOURLY",
      budgetCents: 5000,
      location: "Canada",
      visibility: "PUBLIC",
      state: ProjectState.MATCHING,
    },
    {
      id: "opp_5",
      clientId: clientDavid.id,
      title: "Enterprise Smart Escrow Integration for Solana Pay",
      description: "Construct cross-border payment settlement rails with dual SHA-256 state consensus, cryptographic signature verification, and automated webhook recovery.",
      category: "Smart Contracts",
      skills: ["TypeScript", "Next.js", "Solana Pay", "PayPal REST v2", "State Machines"],
      experienceLevel: ExperienceLevel.EXPERT,
      budgetType: "FIXED_PRICE",
      budgetCents: 380000,
      location: "United States",
      visibility: "PUBLIC",
      state: ProjectState.MATCHING,
    },
    {
      id: "opp_6",
      clientId: clientSarah.id,
      title: "Autonomous Support Copilot with Streaming SSE",
      description: "Integrate an autonomous multi-turn customer support copilot with streaming SSE events, vector embeddings, and verified milestone deliverable escrow.",
      category: "AI & Machine Learning",
      skills: ["Python", "AI", "LangChain", "Next.js", "Tailwind CSS"],
      experienceLevel: ExperienceLevel.SENIOR,
      budgetType: "FIXED_PRICE",
      budgetCents: 450000,
      location: "Remote",
      visibility: "PUBLIC",
      state: ProjectState.MATCHING,
    },
    {
      id: "opp_7",
      clientId: clientDavid.id,
      title: "High-Throughput Distributed Microservices Gateway",
      description: "Build a resilient high-throughput event routing API gateway in Node.js and PostgreSQL with skip-locked queue semantics.",
      category: "Backend Architecture",
      skills: ["Node.js", "PostgreSQL", "Docker", "TypeScript"],
      experienceLevel: ExperienceLevel.SENIOR,
      budgetType: "HOURLY",
      budgetCents: 9500,
      location: "Remote",
      visibility: "PUBLIC",
      state: ProjectState.MATCHING,
    },
    {
      id: "opp_8",
      clientId: clientDavid.id,
      title: "Kubernetes Multi-Cluster Orchestration & CI/CD",
      description: "Set up multi-cluster fault-tolerant deployment pipelines with automated blue-green rollouts and Prometheus alerts.",
      category: "DevOps & Cloud",
      skills: ["Docker", "CI/CD", "Prometheus", "Kubernetes"],
      experienceLevel: ExperienceLevel.MID,
      budgetType: "FIXED_PRICE",
      budgetCents: 280000,
      location: "Germany",
      visibility: "PUBLIC",
      state: ProjectState.MATCHING,
    },
    {
      id: "opp_9",
      clientId: clientSarah.id,
      title: "Real-Time Fraud Detection & Anomaly Pipeline",
      description: "Construct an incremental streaming data pipeline that flags unusual payment authorization velocities in sub-second latency.",
      category: "Data Engineering",
      skills: ["Python", "Data", "PostgreSQL"],
      experienceLevel: ExperienceLevel.SENIOR,
      budgetType: "FIXED_PRICE",
      budgetCents: 400000,
      budgetMinCents: 300000,
      budgetMaxCents: 500000,
      location: "United States",
      visibility: "PUBLIC",
      state: ProjectState.MATCHING,
    },
    {
      id: "opp_10",
      clientId: clientSarah.id,
      title: "Zero-Trust Penetration Test & Auth Audit",
      description: "Perform comprehensive threat modeling, OAuth token lifecycle audit, and penetration testing on our healthcare staging clusters.",
      category: "Cybersecurity",
      skills: ["Security", "Audit", "OAuth"],
      experienceLevel: ExperienceLevel.EXPERT,
      budgetType: "FIXED_PRICE",
      budgetCents: 0,
      budgetMinCents: null,
      budgetMaxCents: null,
      location: "Remote",
      visibility: "PUBLIC",
      state: ProjectState.MATCHING,
    },
    {
      id: "opp_11",
      clientId: clientDavid.id,
      title: "Confidential Fintech Partnership Rail",
      description: "Private bilateral integration with Tier-1 institutional liquidity provider for instant multi-currency settlement.",
      category: "Fintech",
      skills: ["Solana", "Fintech", "TypeScript"],
      experienceLevel: ExperienceLevel.EXPERT,
      budgetType: "HOURLY",
      budgetCents: 12000,
      location: "Switzerland",
      visibility: "INVITE_ONLY",
      state: ProjectState.MATCHING,
    },
    {
      id: "opp_12",
      clientId: clientDavid.id,
      title: "Exclusive Banking API Core Integration",
      description: "Internal banking interface for high-net-worth treasury management with strict multi-sig approval requirements.",
      category: "Fintech",
      skills: ["Banking", "API", "Rust"],
      experienceLevel: ExperienceLevel.EXPERT,
      budgetType: "FIXED_PRICE",
      budgetCents: 600000,
      location: "United Kingdom",
      visibility: "INVITE_ONLY",
      state: ProjectState.MATCHING,
    },
    {
      id: "opp_13",
      clientId: client.id,
      title: "Internal Proprietary Strategy Whitepaper",
      description: "Confidential research on next-generation decentralized liquidity algorithms and consensus guarantees.",
      category: "Research",
      skills: ["Strategy", "Research"],
      experienceLevel: ExperienceLevel.EXPERT,
      budgetType: "FIXED_PRICE",
      budgetCents: 100000,
      location: "Internal",
      visibility: "PRIVATE",
      state: ProjectState.MATCHING,
    },
    {
      id: "opp_14",
      clientId: clientSarah.id,
      title: "Early Draft Exploratory Mobile App",
      description: "Unpublished preliminary draft for cross-platform patient appointment scheduling interface.",
      category: "Mobile Development",
      skills: ["React Native", "Mobile"],
      experienceLevel: ExperienceLevel.JUNIOR,
      budgetType: "HOURLY",
      budgetCents: 3000,
      location: "Remote",
      visibility: "PUBLIC",
      state: ProjectState.DRAFT,
    },
    {
      id: "opp_15",
      clientId: client.id,
      title: "Closed Bilateral Agreement Project",
      description: "This project has finalized freelancer selection and is in active bilateral negotiation.",
      category: "Web Development",
      skills: ["Web Design", "Next.js"],
      experienceLevel: ExperienceLevel.MID,
      budgetType: "FIXED_PRICE",
      budgetCents: 250000,
      location: "Remote",
      visibility: "PUBLIC",
      state: ProjectState.NEGOTIATION,
    },
  ];

  for (const opp of demoOpportunities) {
    await prisma.project.upsert({
      where: { id: opp.id },
      update: {
        clientId: opp.clientId,
        title: opp.title,
        description: opp.description,
        category: opp.category,
        skills: opp.skills,
        experienceLevel: opp.experienceLevel,
        budgetType: opp.budgetType,
        budgetCents: opp.budgetCents,
        budgetMinCents: (opp as any).budgetMinCents ?? null,
        budgetMaxCents: (opp as any).budgetMaxCents ?? null,
        location: opp.location,
        visibility: opp.visibility,
        state: opp.state,
      },
      create: {
        id: opp.id,
        clientId: opp.clientId,
        title: opp.title,
        description: opp.description,
        category: opp.category,
        skills: opp.skills,
        experienceLevel: opp.experienceLevel,
        budgetType: opp.budgetType,
        budgetCents: opp.budgetCents,
        budgetMinCents: (opp as any).budgetMinCents ?? null,
        budgetMaxCents: (opp as any).budgetMaxCents ?? null,
        location: opp.location,
        visibility: opp.visibility,
        state: opp.state,
      },
    });
  }
  console.log(`✅ Seeded ${demoOpportunities.length} Phase 3 Opportunities across all visibility & state variations.`);

  // 3c. Seed Project Invitation for Elena on opp_11
  await prisma.projectInvitation.upsert({
    where: {
      projectId_freelancerId: {
        projectId: "opp_11",
        freelancerId: "usr_freelancer_elena",
      },
    },
    update: {
      status: "PENDING",
      message: "We would love your high-throughput distributed systems expertise on our confidential fintech partnership rail.",
    },
    create: {
      id: "inv_elena_opp_11",
      projectId: "opp_11",
      freelancerId: "usr_freelancer_elena",
      status: "PENDING",
      message: "We would love your high-throughput distributed systems expertise on our confidential fintech partnership rail.",
    },
  });
  console.log("✅ Seeded Project Invitation for Elena on opp_11 (INVITE_ONLY)");

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

