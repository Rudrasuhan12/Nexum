export type ExperienceLevel = "BEGINNER" | "JUNIOR" | "MID_LEVEL" | "SENIOR" | "EXPERT";
export type FreelancerType = "INDIVIDUAL" | "AGENCY";
export type AvailabilityStatus = "AVAILABLE" | "ACTIVE_CONTRACTOR" | "LIMITED";

export interface PortfolioHighlight {
  title: string;
  client: string;
  outcome: string;
  year: string;
  verifiedOnLedger?: boolean;
}

export interface WorkHistoryItem {
  role: string;
  company: string;
  duration: string;
  description: string;
}

export interface FreelancerProfile {
  id: string;
  name: string;
  avatar: string;
  title: string;
  type: FreelancerType;
  experienceLevel: ExperienceLevel;
  experienceYears: number;
  bio: string;
  fullBio: string;
  skills: string[];
  location: string;
  timezone: string;
  hourlyRateCents?: number;
  hourlyRateDisplay?: string;
  availability?: AvailabilityStatus;
  recommendationReason: string;
  recommendedForProjectId?: string;
  fitScore: number;
  portfolioHighlights: PortfolioHighlight[];
  workHistory: WorkHistoryItem[];
  verifiedCredentials: string[];
  githubUrl?: string;
  linkedinUrl?: string;
  isSaved?: boolean;
}

export interface FreelancerInvitation {
  id: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar: string;
  freelancerTitle: string;
  projectId: string;
  projectName: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";
  sentDate: string;
  proposedRate: string;
  customNote: string;
}

export const INITIAL_FREELANCERS: FreelancerProfile[] = [
  {
    id: "usr_rohan",
    name: "Rohan Verma",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    title: "Senior Full-Stack & Payment Rails Engineer",
    type: "INDIVIDUAL",
    experienceLevel: "SENIOR",
    experienceYears: 7,
    bio: "Full-stack engineer specializing in Next.js, state machines, API idempotency, and PayPal Orders v2 integration with zero-drop webhook processing.",
    fullBio: "Over 7 years of full-stack engineering expertise with high-reliability payment gateways, bilateral consensus state machines, and cryptographically verified escrow release rails. Certified PayPal REST v2 integrator with deep domain knowledge in webhook signature verification and idempotent order orchestration.",
    skills: ["PayPal v2", "Next.js", "State Machines", "TypeScript", "Node.js", "PostgreSQL", "TailwindCSS"],
    location: "Bengaluru, India",
    timezone: "Asia/Kolkata (UTC+5:30)",
    hourlyRateCents: 6500,
    hourlyRateDisplay: "$65.00/hr",
    availability: "ACTIVE_CONTRACTOR",
    recommendationReason: "Direct experience with PayPal REST v2 Orders, webhook signature validation, and dual SHA-256 state machines.",
    recommendedForProjectId: "proj_1",
    fitScore: 98,
    portfolioHighlights: [
      {
        title: "Bilateral E-Commerce Payment Rails",
        client: "Horizon Commerce LLC",
        outcome: "Delivered 14 milestones with automated SHA-256 state hashing and sandbox PayPal Orders capture.",
        year: "2026",
        verifiedOnLedger: true,
      },
      {
        title: "High-Throughput Webhook Ingestion Engine",
        client: "FinTech ScaleUp",
        outcome: "Processed 4.2M events/day with 0 duplicate captures and sub-30ms replay tolerance.",
        year: "2025",
        verifiedOnLedger: true,
      },
    ],
    workHistory: [
      {
        role: "Lead Payment Architect",
        company: "PayLedger Systems",
        duration: "2023 - Present",
        description: "Architected multi-party escrow release pipelines and integrated PayPal and Stripe webhook dispatchers.",
      },
      {
        role: "Senior Backend Engineer",
        company: "Nova Commerce",
        duration: "2020 - 2023",
        description: "Built microservices handling transactional workflows and audit trails for cross-border merchants.",
      },
    ],
    verifiedCredentials: [
      "PayPal Sandbox Verified Partner",
      "Next.js Certified Enterprise Developer",
      "Level 3 Consensus Ledger Contributor",
    ],
    githubUrl: "https://github.com/rohan-v-payments",
    linkedinUrl: "https://linkedin.com/in/rohanverma-dev",
    isSaved: false,
  },
  {
    id: "usr_priya",
    name: "Priya Sharma",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
    title: "UI/UX & Design Systems Architect",
    type: "INDIVIDUAL",
    experienceLevel: "SENIOR",
    experienceYears: 6,
    bio: "Design systems expert crafting high-conversion checkout flows, accessible buyer workspaces, and verifiable milestone prototypes.",
    fullBio: "Senior product designer and frontend systems architect with 6 years experience building modern enterprise SaaS applications. Specializes in WCAG AAA accessibility, Figma token-to-code pipelines, and transparent, trust-inducing payment checkout interfaces.",
    skills: ["Design Systems", "Figma", "TailwindCSS", "Accessibility", "React", "Next.js", "Design Tokens"],
    location: "Mumbai, India",
    timezone: "Asia/Kolkata (UTC+5:30)",
    hourlyRateCents: 5500,
    hourlyRateDisplay: "$55.00/hr",
    availability: "AVAILABLE",
    recommendationReason: "Specialized in accessible checkout flows, clear payment disclosures, and verifiable milestone UX.",
    recommendedForProjectId: "proj_2",
    fitScore: 95,
    portfolioHighlights: [
      {
        title: "AI Educational Analytics Dashboard UI",
        client: "EduCore Systems",
        outcome: "Engineered 18 modular analytics cards and reduced user onboarding drop-off by 42%.",
        year: "2026",
        verifiedOnLedger: true,
      },
      {
        title: "Enterprise Design Token Framework",
        client: "FinGrid Global",
        outcome: "Created unified design language shared across 4 web apps and 2 mobile products.",
        year: "2025",
        verifiedOnLedger: true,
      },
    ],
    workHistory: [
      {
        role: "Staff UI/UX Architect",
        company: "DesignScale Studio",
        duration: "2022 - Present",
        description: "Lead design engineer for fintech, billing, and trust-and-safety client portals.",
      },
      {
        role: "Product Designer & UI Dev",
        company: "CloudInterface Labs",
        duration: "2019 - 2022",
        description: "Maintained React and Figma design systems and conducted user research testing sessions.",
      },
    ],
    verifiedCredentials: [
      "Figma Community Advocate",
      "IAAP Certified Web Accessibility Specialist",
      "Nexum Top Rated Design Consultant",
    ],
    githubUrl: "https://github.com/priyasharma-design",
    linkedinUrl: "https://linkedin.com/in/priyasharma-ui",
    isSaved: true,
  },
  {
    id: "usr_marcus",
    name: "Marcus Chen",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
    title: "Cloud Infrastructure & Reliability Engineer",
    type: "INDIVIDUAL",
    experienceLevel: "EXPERT",
    experienceYears: 8,
    bio: "DevOps specialist building resilient cloud infrastructure, zero-downtime containerized CI/CD pipelines, and high-availability database clusters.",
    fullBio: "Cloud infrastructure architect and SRE with 8 years of production experience in Docker containerization, Kubernetes failover automation, and real-time observability telemetry. Deep experience deploying immutable ledger nodes and high-throughput API gateways.",
    skills: ["Docker", "PostgreSQL", "CI/CD", "Prometheus", "Kubernetes", "AWS", "Terraform", "Node.js"],
    location: "Singapore",
    timezone: "Asia/Singapore (UTC+8)",
    hourlyRateCents: 7500,
    hourlyRateDisplay: "$75.00/hr",
    availability: "AVAILABLE",
    recommendationReason: "Expertise in high-throughput webhook ingress and containerized failover simulators.",
    recommendedForProjectId: "proj_1",
    fitScore: 92,
    portfolioHighlights: [
      {
        title: "Zero-Downtime Payment Gateway Cluster",
        client: "Aura Payments APAC",
        outcome: "Achieved 99.995% uptime through automated multi-region PostgreSQL failover replicas.",
        year: "2025",
        verifiedOnLedger: true,
      },
      {
        title: "Dockerized State Machine Ingress Harness",
        client: "ConsensusTech Ltd",
        outcome: "Built CI pipeline executing 400+ deterministic replay tests in under 90 seconds.",
        year: "2026",
        verifiedOnLedger: true,
      },
    ],
    workHistory: [
      {
        role: "Principal Infrastructure Engineer",
        company: "SingaCloud Networks",
        duration: "2021 - Present",
        description: "Directed Kubernetes and Terraform deployments across AWS and GCP multi-region zones.",
      },
      {
        role: "Senior Systems Engineer",
        company: "Stratos DevOps",
        duration: "2018 - 2021",
        description: "Configured PostgreSQL replication, Redis clusters, and Prometheus metrics alerting.",
      },
    ],
    verifiedCredentials: [
      "AWS Solutions Architect Professional",
      "Certified Kubernetes Administrator (CKA)",
      "HashiCorp Certified Terraform Associate",
    ],
    githubUrl: "https://github.com/marcuschen-ops",
    linkedinUrl: "https://linkedin.com/in/marcuschen-cloud",
    isSaved: false,
  },
  {
    id: "usr_elena",
    name: "Elena Rostova",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    title: "Financial Cryptography & Audit Ledger Engineer",
    type: "INDIVIDUAL",
    experienceLevel: "EXPERT",
    experienceYears: 9,
    bio: "Applied cryptographer and backend developer specializing in Merkle trees, SHA-256 state chains, and tamper-evident compliance audit trails.",
    fullBio: "Applied mathematician and backend engineer with 9 years specializing in immutable state chains, hash-linked audit structures, and financial contract verification protocols. Principal author of multi-party non-repudiation modules.",
    skills: ["State Machines", "TypeScript", "PostgreSQL", "Node.js", "Docker", "Go", "Security Auditing"],
    location: "Berlin, Germany",
    timezone: "Europe/Berlin (UTC+1)",
    hourlyRateCents: 9000,
    hourlyRateDisplay: "$90.00/hr",
    availability: "LIMITED",
    recommendationReason: "Deep cryptography background perfectly suited for Cryptographic Audit Trail Viewer.",
    recommendedForProjectId: "proj_5",
    fitScore: 97,
    portfolioHighlights: [
      {
        title: "Cryptographic Audit Trail Engine",
        client: "Veritas Ledger AG",
        outcome: "Implemented dual-hash tree verifying 100,000+ transitions per second with tamper detection.",
        year: "2026",
        verifiedOnLedger: true,
      },
    ],
    workHistory: [
      {
        role: "Chief Cryptographic Engineer",
        company: "HashGuard Labs",
        duration: "2021 - Present",
        description: "Created verifiable audit ledgers and SHA-256 state commitments for regulated institutions.",
      },
    ],
    verifiedCredentials: [
      "Certified Information Systems Security Professional (CISSP)",
      "Nexum Protocol Security Auditor",
    ],
    githubUrl: "https://github.com/elena-rostova-crypto",
    linkedinUrl: "https://linkedin.com/in/elenarostova",
    isSaved: false,
  },
  {
    id: "usr_nexus_labs",
    name: "Nexus Engineering Studio",
    avatar: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=256&q=80",
    title: "Full-Cycle Product & Cross-Platform Mobile Agency",
    type: "AGENCY",
    experienceLevel: "EXPERT",
    experienceYears: 10,
    bio: "Boutique software agency of 12 senior engineers delivering React Native, Swift, and web payment SDKs with dedicated QA.",
    fullBio: "Nexus Studio is an elite team of 12 product engineers, mobile developers, and QA leads. We specialize in cross-platform checkout SDKs, payment tokenization, and enterprise mobile applications with 100% test coverage.",
    skills: ["React Native", "TypeScript", "Next.js", "Node.js", "PayPal v2", "PostgreSQL", "CI/CD"],
    location: "London, UK",
    timezone: "Europe/London (UTC+0)",
    hourlyRateCents: 11000,
    hourlyRateDisplay: "$110.00/hr",
    availability: "AVAILABLE",
    recommendationReason: "Experienced team with proven track record in Cross-Platform Mobile Checkout SDKs.",
    recommendedForProjectId: "proj_3",
    fitScore: 94,
    portfolioHighlights: [
      {
        title: "Mobile Cross-Platform Checkout SDK",
        client: "Veloce Payments",
        outcome: "Engineered unified iOS/Android SDK with PayPal and Apple Pay integrations; 500k+ MAU.",
        year: "2025",
        verifiedOnLedger: true,
      },
    ],
    workHistory: [
      {
        role: "Engineering Agency Partner",
        company: "Nexus Labs Global",
        duration: "2018 - Present",
        description: "Delivered 40+ production applications with guaranteed milestone SLA and code review.",
      },
    ],
    verifiedCredentials: [
      "ISO 27001 Certified Engineering Organization",
      "Verified Nexum Agency Partner",
    ],
    githubUrl: "https://github.com/nexus-engineering-studio",
    linkedinUrl: "https://linkedin.com/company/nexus-engineering-studio",
    isSaved: false,
  },
  {
    id: "usr_devendra",
    name: "Devendra Patel",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80",
    title: "Backend & PDF Generation Pipeline Engineer",
    type: "INDIVIDUAL",
    experienceLevel: "MID_LEVEL",
    experienceYears: 4,
    bio: "Node.js and PostgreSQL developer specializing in asynchronous queue workers, invoice PDF generation, and automated tax calculations.",
    fullBio: "Focused backend engineer with 4 years experience building high-volume document generation systems, background queue workers using BullMQ/Redis, and PostgreSQL database queries with automated test coverage.",
    skills: ["Node.js", "PostgreSQL", "TypeScript", "Docker", "TailwindCSS"],
    location: "Ahmedabad, India",
    timezone: "Asia/Kolkata (UTC+5:30)",
    hourlyRateCents: 4500,
    hourlyRateDisplay: "$45.00/hr",
    availability: "AVAILABLE",
    recommendationReason: "Direct experience with automated PDF rendering pipelines and PostgreSQL invoice indexing.",
    recommendedForProjectId: "proj_4",
    fitScore: 90,
    portfolioHighlights: [
      {
        title: "Multi-Tenant PDF Invoice Engine",
        client: "Invoicely SaaS",
        outcome: "Reduced PDF rendering latency from 1.8s to 240ms with Puppeteer headless worker pool.",
        year: "2025",
        verifiedOnLedger: true,
      },
    ],
    workHistory: [
      {
        role: "Backend Software Engineer",
        company: "DocuFast Technologies",
        duration: "2022 - Present",
        description: "Implemented asynchronous document processing queues and data export pipelines.",
      },
    ],
    verifiedCredentials: [
      "Node.js Certified Developer",
      "PostgreSQL Associate Administrator",
    ],
    githubUrl: "https://github.com/devendra-backend",
    linkedinUrl: "https://linkedin.com/in/devendra-patel-dev",
    isSaved: false,
  },
  {
    id: "usr_sofia",
    name: "Sofia Gutierrez",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80",
    title: "Full-Stack TypeScript & Next.js Engineer",
    type: "INDIVIDUAL",
    experienceLevel: "MID_LEVEL",
    experienceYears: 4,
    bio: "Full-stack engineer passionate about responsive UI, server components, and relational data modeling with Prisma and PostgreSQL.",
    fullBio: "Dedicated full-stack engineer with 4 years building reactive, cleanly typed web applications in React and Next.js. Strong eye for clean code, end-to-end testing with Vitest/Playwright, and transparent communication.",
    skills: ["Next.js", "TypeScript", "React", "TailwindCSS", "PostgreSQL", "Node.js"],
    location: "Barcelona, Spain",
    timezone: "Europe/Madrid (UTC+1)",
    hourlyRateCents: 5000,
    hourlyRateDisplay: "$50.00/hr",
    availability: "AVAILABLE",
    recommendationReason: "Proficient in Next.js 15+ App Router, TypeScript, and interactive data visualization.",
    recommendedForProjectId: "proj_2",
    fitScore: 89,
    portfolioHighlights: [
      {
        title: "Student Progress Analytics Portal",
        client: "LearnMetrics",
        outcome: "Created real-time charts with Recharts and Next.js server actions; 99.8% test coverage.",
        year: "2025",
        verifiedOnLedger: true,
      },
    ],
    workHistory: [
      {
        role: "Full-Stack Developer",
        company: "NovaSpark Software",
        duration: "2022 - Present",
        description: "Developed customer dashboards and administrative portals in Next.js and TailwindCSS.",
      },
    ],
    verifiedCredentials: [
      "TypeScript Professional Certification",
      "Nexum Verified Developer",
    ],
    githubUrl: "https://github.com/sofiagutierrez-code",
    linkedinUrl: "https://linkedin.com/in/sofia-gutierrez-dev",
    isSaved: false,
  },
  {
    id: "usr_cloudsprint",
    name: "CloudSprint Solutions",
    avatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=256&q=80",
    title: "DevOps & Cloud Architecture Studio",
    type: "AGENCY",
    experienceLevel: "SENIOR",
    experienceYears: 6,
    bio: "Infrastructure studio providing automated CI/CD pipelines, Docker containerization, and AWS serverless migrations.",
    fullBio: "CloudSprint is a 6-person boutique DevOps agency helping fast-growing platforms establish reliable deployments, infrastructure as code, automated testing harnesses, and monitoring dashboards.",
    skills: ["Docker", "CI/CD", "AWS", "Kubernetes", "PostgreSQL", "Prometheus"],
    location: "Austin, TX, USA",
    timezone: "America/Chicago (UTC-6)",
    hourlyRateCents: 9500,
    hourlyRateDisplay: "$95.00/hr",
    availability: "ACTIVE_CONTRACTOR",
    recommendationReason: "Strong team capability for continuous delivery, containerization, and automated test runners.",
    recommendedForProjectId: "proj_4",
    fitScore: 87,
    portfolioHighlights: [
      {
        title: "Automated Microservice Deployment Pipeline",
        client: "SaaS Scale Engine",
        outcome: "Reduced deploy cycle from 45 minutes to 4 minutes with zero downtime.",
        year: "2025",
        verifiedOnLedger: true,
      },
    ],
    workHistory: [
      {
        role: "DevOps Agency Lead",
        company: "CloudSprint Solutions",
        duration: "2020 - Present",
        description: "Managed 30+ cloud migration and reliability engineering contracts.",
      },
    ],
    verifiedCredentials: [
      "AWS Advanced Consulting Partner",
      "Kubernetes Certified Service Provider",
    ],
    githubUrl: "https://github.com/cloudsprint-studio",
    linkedinUrl: "https://linkedin.com/company/cloudsprint-solutions",
    isSaved: false,
  },
  {
    id: "usr_lucas",
    name: "Lucas Becker",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80",
    title: "Junior Frontend & React Developer",
    type: "INDIVIDUAL",
    experienceLevel: "JUNIOR",
    experienceYears: 2,
    bio: "Motivated frontend developer with 2 years of experience crafting modern, responsive web pages using React, Next.js, and TailwindCSS.",
    fullBio: "Enthusiastic frontend specialist focused on clean component structuring, pixel-perfect layout implementation, and responsive interfaces. Quick learner with high code-review responsiveness.",
    skills: ["React", "TypeScript", "TailwindCSS", "Next.js"],
    location: "Vienna, Austria",
    timezone: "Europe/Vienna (UTC+1)",
    hourlyRateCents: 3200,
    hourlyRateDisplay: "$32.00/hr",
    availability: "AVAILABLE",
    recommendationReason: "Cost-effective, detail-oriented frontend developer for component refactoring and styling.",
    fitScore: 82,
    portfolioHighlights: [
      {
        title: "Component Library Implementation",
        client: "Alpine Web Studio",
        outcome: "Implemented 30+ reusable React components adhering strictly to design tokens.",
        year: "2025",
        verifiedOnLedger: false,
      },
    ],
    workHistory: [
      {
        role: "Junior Web Developer",
        company: "Viennese Digital",
        duration: "2024 - Present",
        description: "Built marketing pages and component UI prototypes.",
      },
    ],
    verifiedCredentials: [
      "Meta Frontend Developer Certificate",
    ],
    githubUrl: "https://github.com/lucasbecker-dev",
    linkedinUrl: "https://linkedin.com/in/lucas-becker-frontend",
    isSaved: false,
  },
];

export const INITIAL_INVITATIONS: FreelancerInvitation[] = [
  {
    id: "inv_1",
    freelancerId: "usr_rohan",
    freelancerName: "Rohan Verma",
    freelancerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    freelancerTitle: "Senior Full-Stack & Payment Rails Engineer",
    projectId: "proj_1",
    projectName: "Bilateral E-Commerce Payment Rails",
    status: "ACCEPTED",
    sentDate: "Oct 24, 2026",
    proposedRate: "$65.00/hr ($4,500 milestone budget)",
    customNote: "Hi Rohan, we reviewed your PayPal REST v2 work and would like to formally invite you to lead Milestone 2 webhook processing.",
  },
  {
    id: "inv_2",
    freelancerId: "usr_priya",
    freelancerName: "Priya Sharma",
    freelancerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
    freelancerTitle: "UI/UX & Design Systems Architect",
    projectId: "proj_2",
    projectName: "AI Educational Analytics Dashboard",
    status: "PENDING",
    sentDate: "Oct 29, 2026",
    proposedRate: "$55.00/hr ($8,200 milestone budget)",
    customNote: "Hi Priya, we love your design token architecture. Would you be open to architecting our 18 analytics dashboard views?",
  },
];

export const AVAILABLE_SKILLS_FILTER: string[] = [
  "PayPal v2",
  "Next.js",
  "TypeScript",
  "State Machines",
  "Node.js",
  "PostgreSQL",
  "TailwindCSS",
  "Figma",
  "Design Systems",
  "Docker",
  "CI/CD",
  "React Native",
  "Kubernetes",
  "AWS",
];

