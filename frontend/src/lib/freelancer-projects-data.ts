/**
 * Nexum Freelancer Projects & Milestones Data
 * Initial dataset strictly matching the reference screenshot and schema specifications.
 */

import {
  FreelancerProjectItem,
  ProjectSummaryKPIs,
  MilestoneWorkStatus,
  MilestonePaymentStatus,
} from "./freelancer-projects-types";

export const INITIAL_FREELANCER_PROJECTS: FreelancerProjectItem[] = [
  {
    id: "proj-ecommerce-shopkart",
    title: "E-commerce Website Development",
    description: "Build a modern, responsive e-commerce platform with admin dashboard.",
    state: "ACTIVE",
    statusLabel: "In Progress",
    statusBadgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    client: {
      id: "cli-shopkart",
      name: "ShopKart Pvt. Ltd.",
      companyName: "ShopKart Pvt. Ltd.",
      verified: true,
      avatarLetter: "S",
      avatarBg: "bg-blue-600 text-white",
      email: "billing@shopkart.in",
    },
    startDate: "Oct 10, 2026",
    dueDate: "Dec 15, 2026",
    totalBudgetCents: 8000000,
    totalBudgetDisplay: "₹80,000",
    currency: "INR",
    pricingType: "FIXED_PRICE",
    agreementVersion: "v1.4 Active",
    progressPercent: 60,
    techTags: ["Next.js", "TypeScript", "Node.js", "PostgreSQL"],
    thumbnailType: "IMAGE_MOCK",
    progressSteps: [
      { id: "ps-1", title: "Requirements discussion", status: "COMPLETED" },
      { id: "ps-2", title: "UI/UX design and layout", status: "COMPLETED" },
      { id: "ps-3", title: "Backend development", status: "CURRENT" },
      { id: "ps-4", title: "Testing and bug fixes", status: "PENDING" },
      { id: "ps-5", title: "Deployment and handover", status: "PENDING" },
    ],
    nextActions: [
      {
        id: "na-1",
        title: "Follow up on milestone review",
        description: "Milestone 2 submitted 1 day ago",
        actionLabel: "Send Message",
        actionType: "MESSAGE",
        iconType: "MESSAGE",
      },
      {
        id: "na-2",
        title: "Prepare documentation",
        description: "Start working on user documentation",
        actionLabel: "Set Reminder",
        actionType: "REMINDER",
        iconType: "DOCUMENT",
      },
      {
        id: "na-3",
        title: "Schedule review meeting",
        description: "Discuss final deployment plan with client",
        actionLabel: "Propose Meeting",
        actionType: "MEETING",
        iconType: "CALENDAR",
      },
    ],
    milestones: [
      {
        id: "ms-shopkart-1",
        number: 1,
        title: "Milestone 1: UI/UX Design & Frontend Development",
        description: "Complete responsive UI with product pages, cart and checkout flow.",
        deliverablesSummary: "Responsive Figma designs, Next.js Tailwind components, catalog browse and cart store state.",
        acceptanceCriteria: [
          "Responsive mobile & desktop catalog layouts matching approved Figma",
          "Zustand cart state with persistent localStorage drawer",
          "Stripe & PayPal SDK checkout preview components",
          "Lighthouse accessibility score >= 92",
        ],
        amountCents: 2000000,
        amountDisplay: "₹20,000",
        currency: "INR",
        dueDate: "Oct 25, 2026",
        submittedAt: "Oct 22, 2026",
        approvedAt: "Oct 24, 2026",
        workStatus: "ACCEPTED",
        paymentStatus: "PAYOUT_COMPLETED",
        paypalOrderId: "PAYID-MN6819204A-ESCROW",
        paypalCaptureId: "CAP-91823901-NX",
        fundingRule: "PRE_FUNDED_BEFORE_WORK",
        submissions: [
          {
            id: "sub-1-1",
            submissionDate: "Oct 22, 2026, 4:15 PM",
            versionNumber: 1,
            completionNote: "Frontend UI components and checkout flow are fully implemented and integrated with mock data.",
            deliverableDescription: "PR #14 with responsive views, storybook catalog, and passing vitest specs.",
            githubPrUrl: "https://github.com/shopkart/storefront/pull/14",
            demoUrl: "https://shopkart-staging.nexum.dev",
            attachmentName: "shopkart-ui-v1.zip",
            attachmentSize: "14.2 MB",
            criteriaChecked: [
              "Responsive mobile & desktop catalog layouts matching approved Figma",
              "Zustand cart state with persistent localStorage drawer",
              "Stripe & PayPal SDK checkout preview components",
              "Lighthouse accessibility score >= 92",
            ],
            clientFeedback: {
              decision: "ACCEPTED",
              feedbackMessage: "Excellent work on the cart animation and mobile checkout responsiveness. Verified and approved.",
              reviewedAt: "Oct 24, 2026, 11:30 AM",
              reviewedByName: "Rajesh Sharma (ShopKart)",
            },
          },
        ],
      },
      {
        id: "ms-shopkart-2",
        number: 2,
        title: "Milestone 2: Backend Development & API Integration",
        description: "Implement product, order, and payment APIs with database setup.",
        deliverablesSummary: "Express/PostgreSQL schema, Prisma migrations, PayPal REST v2 webhook validation and JWT auth.",
        acceptanceCriteria: [
          "PostgreSQL migrations with Prisma ORM for Users, Orders and Products",
          "PayPal Orders v2 capture API endpoint with idempotency checks",
          "Role-based authentication middleware (Admin vs Customer)",
          "100% passing test suite for order state transitions",
        ],
        amountCents: 3000000,
        amountDisplay: "₹30,000",
        currency: "INR",
        dueDate: "Nov 15, 2026",
        submittedAt: "Nov 14, 2026",
        workStatus: "AWAITING_CLIENT_REVIEW",
        paymentStatus: "SANDBOX_CAPTURE_CONFIRMED",
        paypalOrderId: "PAYID-MN7719409B-ESCROW",
        fundingRule: "PRE_FUNDED_BEFORE_WORK",
        submissions: [
          {
            id: "sub-2-1",
            submissionDate: "Nov 14, 2026, 2:40 PM",
            versionNumber: 1,
            completionNote: "All order and payment APIs are deployed to staging. PayPal sandbox order capture webhook verified with zero dropped payloads.",
            deliverableDescription: "Backend API routes with JWT auth, PostgreSQL schema migrations, and Postman collection.",
            githubPrUrl: "https://github.com/shopkart/api-gateway/pull/31",
            demoUrl: "https://api.shopkart-staging.nexum.dev/health",
            attachmentName: "api-postman-collection.json",
            attachmentSize: "2.8 MB",
            criteriaChecked: [
              "PostgreSQL migrations with Prisma ORM for Users, Orders and Products",
              "PayPal Orders v2 capture API endpoint with idempotency checks",
              "Role-based authentication middleware (Admin vs Customer)",
              "100% passing test suite for order state transitions",
            ],
          },
        ],
      },
      {
        id: "ms-shopkart-3",
        number: 3,
        title: "Milestone 3: Testing, Deployment & Documentation",
        description: "Final testing, bug fixes, deployment and user documentation.",
        deliverablesSummary: "E2E Playwright test suite, multi-region CI/CD deployment on Vercel/Railway, and operations handbook.",
        acceptanceCriteria: [
          "Automated E2E checkout smoke test running in GitHub Actions",
          "Zero critical vulnerabilities in npm audit",
          "Admin dashboard documentation with order refund workflow",
          "DNS handover and production SSL cert configuration",
        ],
        amountCents: 3000000,
        amountDisplay: "₹30,000",
        currency: "INR",
        dueDate: "Dec 15, 2026",
        workStatus: "READY_TO_SUBMIT",
        paymentStatus: "FUNDING_PENDING",
        fundingRule: "PRE_FUNDED_BEFORE_WORK",
        submissions: [],
      },
    ],
    tasks: [
      {
        id: "t-1",
        title: "Audit PayPal webhook idempotency cache",
        description: "Ensure Redis lock deduplicates duplicate webhook events within 30 seconds.",
        status: "COMPLETED",
        priority: "HIGH",
        dueDate: "Nov 12, 2026",
        relatedMilestoneId: "ms-shopkart-2",
        milestoneTitle: "Milestone 2: Backend Development",
        completed: true,
      },
      {
        id: "t-2",
        title: "Review client feedback on Milestone 2",
        description: "Coordinate with Rajesh regarding staging environment credentials.",
        status: "UNDER_REVIEW",
        priority: "MEDIUM",
        dueDate: "Nov 18, 2026",
        relatedMilestoneId: "ms-shopkart-2",
        milestoneTitle: "Milestone 2: Backend Development",
        completed: false,
      },
      {
        id: "t-3",
        title: "Draft user manual for admin dashboard",
        description: "Step-by-step PDF guide showing inventory updates and discount code creation.",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        dueDate: "Dec 05, 2026",
        relatedMilestoneId: "ms-shopkart-3",
        milestoneTitle: "Milestone 3: Testing & Documentation",
        completed: false,
      },
      {
        id: "t-4",
        title: "Configure custom domain and SSL certificates",
        description: "Set up Cloudflare DNS records and strict HTTPS redirection.",
        status: "TO_DO",
        priority: "LOW",
        dueDate: "Dec 10, 2026",
        relatedMilestoneId: "ms-shopkart-3",
        milestoneTitle: "Milestone 3: Testing & Documentation",
        completed: false,
      },
    ],
    files: [
      {
        id: "f-1",
        name: "ShopKart_PRD_v1.4_Signed.pdf",
        fileType: "PDF Document",
        fileSize: "2.4 MB",
        uploadedBy: "CLIENT",
        uploadedByName: "Rajesh Sharma",
        uploadDate: "Oct 10, 2026",
        relatedMilestoneTitle: "Project Setup",
      },
      {
        id: "f-2",
        name: "Design_System_Tokens.json",
        fileType: "JSON Code",
        fileSize: "450 KB",
        uploadedBy: "FREELANCER",
        uploadedByName: "Sambit Mohanty",
        uploadDate: "Oct 20, 2026",
        relatedMilestoneTitle: "Milestone 1: UI/UX",
      },
      {
        id: "f-3",
        name: "PostgreSQL_Database_Schema.sql",
        fileType: "SQL Script",
        fileSize: "85 KB",
        uploadedBy: "FREELANCER",
        uploadedByName: "Sambit Mohanty",
        uploadDate: "Nov 14, 2026",
        relatedMilestoneTitle: "Milestone 2: Backend Development",
      },
    ],
  },
  {
    id: "proj-ai-medicare",
    title: "AI Chatbot Integration",
    description: "Build an HIPAA-compliant patient triage AI assistant with OpenAI and FastAPI.",
    state: "AWAITING_APPROVAL",
    statusLabel: "Awaiting Approval",
    statusBadgeColor: "bg-amber-50 text-amber-700 border-amber-200/80",
    client: {
      id: "cli-medicare",
      name: "MediCare Solutions",
      companyName: "MediCare Solutions",
      verified: true,
      avatarLetter: "M",
      avatarBg: "bg-purple-600 text-white",
      email: "tech@medicaresolutions.com",
    },
    startDate: "Oct 5, 2026",
    dueDate: "Nov 10, 2026",
    totalBudgetCents: 5000000,
    totalBudgetDisplay: "₹50,000",
    currency: "INR",
    pricingType: "FIXED_PRICE",
    agreementVersion: "v2.0 Under Review",
    progressPercent: 80,
    techTags: ["Python", "FastAPI", "OpenAI", "Docker"],
    thumbnailType: "AI_ICON",
    progressSteps: [
      { id: "ps-m1", title: "API integration architecture", status: "COMPLETED" },
      { id: "ps-m2", title: "Prompt tuning & guardrails", status: "COMPLETED" },
      { id: "ps-m3", title: "Docker deployment & load test", status: "COMPLETED" },
      { id: "ps-m4", title: "Client security sign-off", status: "CURRENT" },
    ],
    nextActions: [
      {
        id: "na-m1",
        title: "Awaiting client contract approval",
        description: "Counteroffer v2 submitted for final sign-off",
        actionLabel: "View Proposal",
        actionType: "SUBMIT",
        iconType: "DOCUMENT",
      },
    ],
    milestones: [
      {
        id: "ms-med-1",
        number: 1,
        title: "Milestone 1: FastAPI RAG Engine & Embedding Index",
        description: "Set up vector search with pgvector and OpenAI embeddings.",
        deliverablesSummary: "FastAPI endpoints with semantic medical document search.",
        acceptanceCriteria: ["P95 latency < 400ms for semantic retrieval", "Zero PHI stored in plain text"],
        amountCents: 2500000,
        amountDisplay: "₹25,000",
        currency: "INR",
        dueDate: "Oct 20, 2026",
        submittedAt: "Oct 19, 2026",
        approvedAt: "Oct 21, 2026",
        workStatus: "ACCEPTED",
        paymentStatus: "PAYOUT_COMPLETED",
        submissions: [],
      },
      {
        id: "ms-med-2",
        number: 2,
        title: "Milestone 2: Security Audit & Production Containerization",
        description: "Docker compose deployment with automated guardrail tests.",
        deliverablesSummary: "Containerized service passing OWASP Top 10 automated vulnerability scanning.",
        acceptanceCriteria: ["Docker container boot time < 5 seconds", "Audit log encryption"],
        amountCents: 2500000,
        amountDisplay: "₹25,000",
        currency: "INR",
        dueDate: "Nov 10, 2026",
        submittedAt: "Nov 08, 2026",
        workStatus: "AWAITING_CLIENT_REVIEW",
        paymentStatus: "SANDBOX_CAPTURE_CONFIRMED",
        submissions: [],
      },
    ],
    tasks: [],
    files: [],
  },
  {
    id: "proj-fitness-fitlife",
    title: "Fitness Tracking Mobile App",
    description: "Cross-platform mobile application with workout tracker and calorie calculation.",
    state: "ACTIVE",
    statusLabel: "In Progress",
    statusBadgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    client: {
      id: "cli-fitlife",
      name: "FitLife",
      companyName: "FitLife Technologies",
      verified: true,
      avatarLetter: "F",
      avatarBg: "bg-indigo-600 text-white",
      email: "product@fitlife.app",
    },
    startDate: "Sep 20, 2026",
    dueDate: "Nov 30, 2026",
    totalBudgetCents: 9000000,
    totalBudgetDisplay: "₹90,000",
    currency: "INR",
    pricingType: "FIXED_PRICE",
    agreementVersion: "v1.1 Active",
    progressPercent: 40,
    techTags: ["React Native", "Firebase", "Node.js", "MongoDB"],
    thumbnailType: "IMAGE_MOCK",
    progressSteps: [
      { id: "ps-f1", title: "User authentication & profile", status: "COMPLETED" },
      { id: "ps-f2", title: "Workout logger & charts", status: "CURRENT" },
      { id: "ps-f3", title: "Push notification engine", status: "PENDING" },
      { id: "ps-f4", title: "App Store & Play Store upload", status: "PENDING" },
    ],
    nextActions: [
      {
        id: "na-f1",
        title: "Milestone 2 in progress",
        description: "Connect health sensor sync to React Native",
        actionLabel: "View Tasks",
        actionType: "REMINDER",
        iconType: "DOCUMENT",
      },
    ],
    milestones: [
      {
        id: "ms-fit-1",
        number: 1,
        title: "Milestone 1: Authentication & Onboarding",
        description: "Social login and initial health questionnaire setup.",
        deliverablesSummary: "React Native screens with Firebase Auth and onboarding stepper.",
        acceptanceCriteria: ["Google and Apple sign in tested on iOS & Android simulators"],
        amountCents: 3500000,
        amountDisplay: "₹35,000",
        currency: "INR",
        dueDate: "Oct 15, 2026",
        submittedAt: "Oct 14, 2026",
        approvedAt: "Oct 16, 2026",
        workStatus: "ACCEPTED",
        paymentStatus: "PAYOUT_COMPLETED",
        submissions: [],
      },
      {
        id: "ms-fit-2",
        number: 2,
        title: "Milestone 2: Activity Log & Calorie Computation",
        description: "Real-time chart visualization of weekly exercise intervals.",
        deliverablesSummary: "Custom SVG charts with offline AsyncStorage caching.",
        acceptanceCriteria: ["60fps smooth scrolling with 500+ workout records cached locally"],
        amountCents: 5500000,
        amountDisplay: "₹55,000",
        currency: "INR",
        dueDate: "Nov 30, 2026",
        workStatus: "IN_PROGRESS",
        paymentStatus: "SANDBOX_CAPTURE_CONFIRMED",
        submissions: [],
      },
    ],
    tasks: [],
    files: [],
  },
  {
    id: "proj-analytics-educare",
    title: "Data Analytics Dashboard",
    description: "Interactive data visualization dashboard for school performance metrics.",
    state: "COMPLETED",
    statusLabel: "Completed",
    statusBadgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    client: {
      id: "cli-educare",
      name: "EduCare Foundation",
      companyName: "EduCare Foundation",
      verified: true,
      avatarLetter: "E",
      avatarBg: "bg-emerald-600 text-white",
      email: "contact@educare.org",
    },
    startDate: "Aug 15, 2026",
    dueDate: "Sep 30, 2026",
    completedDate: "Sep 30, 2026",
    totalBudgetCents: 4500000,
    totalBudgetDisplay: "₹45,000",
    currency: "INR",
    pricingType: "FIXED_PRICE",
    agreementVersion: "v1.0 Fulfilled",
    progressPercent: 100,
    techTags: ["React", "Python", "Data Visualization"],
    thumbnailType: "IMAGE_MOCK",
    progressSteps: [
      { id: "ps-e1", title: "CSV Data Pipeline", status: "COMPLETED" },
      { id: "ps-e2", title: "Interactive Dashboards", status: "COMPLETED" },
      { id: "ps-e3", title: "Automated Weekly Report Generator", status: "COMPLETED" },
    ],
    nextActions: [],
    milestones: [
      {
        id: "ms-edu-1",
        number: 1,
        title: "Full Project Delivery & Deployment",
        description: "All charts, export filters, and client training completed.",
        deliverablesSummary: "Production app with 100% test pass rate and full documentation.",
        acceptanceCriteria: ["Export to PDF and Excel working without server crash"],
        amountCents: 4500000,
        amountDisplay: "₹45,000",
        currency: "INR",
        dueDate: "Sep 30, 2026",
        submittedAt: "Sep 28, 2026",
        approvedAt: "Sep 30, 2026",
        workStatus: "ACCEPTED",
        paymentStatus: "PAYOUT_COMPLETED",
        submissions: [],
      },
    ],
    tasks: [],
    files: [],
  },
  {
    id: "proj-cert-skillverify",
    title: "Blockchain-based Certificate Verification",
    description: "Decentralized document validation on Ethereum with IPFS pinning.",
    state: "ACTIVE",
    statusLabel: "In Progress",
    statusBadgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    client: {
      id: "cli-skillverify",
      name: "SkillVerify",
      companyName: "SkillVerify Tech",
      verified: false,
      avatarLetter: "S",
      avatarBg: "bg-violet-600 text-white",
      email: "ops@skillverify.io",
    },
    startDate: "Jul 01, 2026",
    dueDate: "Aug 30, 2026",
    totalBudgetCents: 7000000,
    totalBudgetDisplay: "₹70,000",
    currency: "INR",
    pricingType: "FIXED_PRICE",
    agreementVersion: "v1.3 Active",
    progressPercent: 70,
    techTags: ["Solidity", "Next.js", "AWS", "Blockchain"],
    thumbnailType: "CERT_ICON",
    progressSteps: [
      { id: "ps-s1", title: "Smart contract audit", status: "COMPLETED" },
      { id: "ps-s2", title: "IPFS pinning microservice", status: "COMPLETED" },
      { id: "ps-s3", title: "Frontend certificate verifier", status: "CURRENT" },
      { id: "ps-s4", title: "Mainnet deploy", status: "PENDING" },
    ],
    nextActions: [
      {
        id: "na-s1",
        title: "Milestone 3 submission pending",
        description: "Deploy certificate issuer frontend demo",
        actionLabel: "Submit Work",
        actionType: "SUBMIT",
        iconType: "DOCUMENT",
      },
    ],
    milestones: [
      {
        id: "ms-sv-1",
        number: 1,
        title: "Milestone 1: ERC-721 Smart Contract & Gas Optimization",
        description: "Hardhat contract suite with signature verification.",
        deliverablesSummary: "Solidity smart contract with 100% branch test coverage.",
        acceptanceCriteria: ["Passes Slither automated static security analysis"],
        amountCents: 3500000,
        amountDisplay: "₹35,000",
        currency: "INR",
        dueDate: "Jul 25, 2026",
        submittedAt: "Jul 24, 2026",
        approvedAt: "Jul 26, 2026",
        workStatus: "ACCEPTED",
        paymentStatus: "PAYOUT_COMPLETED",
        submissions: [],
      },
      {
        id: "ms-sv-2",
        number: 2,
        title: "Milestone 2: IPFS Pinning & QR Code Scanner",
        description: "Frontend verification portal with mobile camera QR scanning.",
        deliverablesSummary: "Next.js verification page with instant verification seal.",
        acceptanceCriteria: ["Scan and verify within 1.5 seconds on mobile browser"],
        amountCents: 3500000,
        amountDisplay: "₹35,000",
        currency: "INR",
        dueDate: "Aug 30, 2026",
        workStatus: "IN_PROGRESS",
        paymentStatus: "SANDBOX_CAPTURE_CONFIRMED",
        submissions: [],
      },
    ],
    tasks: [],
    files: [],
  },
];

export function calculateSummaryKPIs(projects: FreelancerProjectItem[]): ProjectSummaryKPIs {
  let active = 0;
  let awaiting = 0;
  let completed = 0;
  let cancelled = 0;

  for (const p of projects) {
    if (p.state === "ACTIVE") active++;
    else if (p.state === "AWAITING_APPROVAL") awaiting++;
    else if (p.state === "COMPLETED") completed++;
    else if (p.state === "CANCELLED") cancelled++;
  }

  return {
    totalProjects: projects.length,
    activeProjects: active,
    awaitingApproval: awaiting,
    completedProjects: completed,
    cancelledProjects: cancelled,
  };
}

export function getWorkStatusConfig(status: MilestoneWorkStatus): {
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  switch (status) {
    case "ACCEPTED":
      return {
        label: "Completed",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
        dotClass: "bg-emerald-500",
      };
    case "AWAITING_CLIENT_REVIEW":
      return {
        label: "In Review",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80",
        dotClass: "bg-amber-500",
      };
    case "READY_TO_SUBMIT":
      return {
        label: "Pending",
        badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
        dotClass: "bg-slate-400",
      };
    case "IN_PROGRESS":
      return {
        label: "In Progress",
        badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
        dotClass: "bg-[#4f46e5]",
      };
    case "REVISIONS_REQUESTED":
      return {
        label: "Revisions Requested",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200/80",
        dotClass: "bg-rose-500",
      };
    case "DISPUTED":
      return {
        label: "Disputed",
        badgeClass: "bg-red-50 text-red-700 border-red-200/80",
        dotClass: "bg-red-500",
      };
    case "OVERDUE":
      return {
        label: "Overdue",
        badgeClass: "bg-orange-50 text-orange-700 border-orange-200/80",
        dotClass: "bg-orange-500",
      };
    case "UPCOMING":
    default:
      return {
        label: "Upcoming",
        badgeClass: "bg-slate-50 text-slate-600 border-slate-200",
        dotClass: "bg-slate-300",
      };
  }
}

export function getPaymentStatusConfig(status: MilestonePaymentStatus): {
  label: string;
  badgeClass: string;
} {
  switch (status) {
    case "PAYOUT_COMPLETED":
      return {
        label: "Payout Completed",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "ELIGIBLE_FOR_PAYOUT":
      return {
        label: "Eligible for Payout",
        badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
      };
    case "SANDBOX_CAPTURE_CONFIRMED":
      return {
        label: "Sandbox Capture Confirmed",
        badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
      };
    case "PAYMENT_PROCESSING":
      return {
        label: "Payment Processing",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      };
    case "FUNDING_PENDING":
      return {
        label: "Funding Pending",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      };
    case "AWAITING_PAYMENT":
      return {
        label: "Awaiting Payment",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      };
    case "ON_HOLD":
      return {
        label: "Escrow On Hold",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
      };
    case "FAILED":
      return {
        label: "Payment Failed",
        badgeClass: "bg-red-50 text-red-700 border-red-200",
      };
    case "NOT_FUNDED":
    default:
      return {
        label: "Not Funded",
        badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
      };
  }
}

