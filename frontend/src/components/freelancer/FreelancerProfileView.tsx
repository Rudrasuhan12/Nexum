"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  User,
  Briefcase,
  Globe,
  FolderKanban,
  Building2,
  GraduationCap,
  Award,
  Clock,
  Settings,
  Camera,
  MapPin,
  Download,
  ChevronDown,
  CheckCircle2,
  Circle,
  ExternalLink,
  Star,
  Info,
  Link as LinkIcon,
  X,
  ArrowRight,
  Plus,
  Trash2,
  ShieldCheck,
  DollarSign,
  FileCode,
  Video,
  Upload,
  Pencil,
  ArrowLeft,
  Eye,
  MessageSquare,
  Share2,
  FileText,
  Check,
} from "lucide-react";
import { DemoUser } from "@/lib/auth-types";

interface FreelancerProfileViewProps {
  freelancer: DemoUser;
  showToast: (msg: string) => void;
}

export type ProfileSubTabId =
  | "basic"
  | "professional"
  | "skills"
  | "portfolio"
  | "experience"
  | "education"
  | "certifications"
  | "availability"
  | "preferences";

export interface ServiceOfferingItem {
  id: string;
  title: string;
  active: boolean;
}

export default function FreelancerProfileView({
  freelancer,
  showToast,
}: FreelancerProfileViewProps) {
  // View Mode: "editor" vs. "public_preview" (full dedicated page for clients)
  const [viewMode, setViewMode] = useState<"editor" | "public_preview">("editor");

  // Navigation Sub-Tabs
  const [activeSubTab, setActiveSubTab] = useState<ProfileSubTabId>("basic");

  // Avatar & Banner State
  const [avatarUrl, setAvatarUrl] = useState<string>(
    freelancer.avatar ||
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80"
  );
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);
  const bannerFileInputRef = useRef<HTMLInputElement | null>(null);
  const resumeFileInputRef = useRef<HTMLInputElement | null>(null);

  // Resume State
  const [resumeFile, setResumeFile] = useState<{
    name: string;
    size: string;
    uploadedAt: string;
  } | null>({
    name: `${(freelancer.name || "Sambit_Mohanty").replace(/\s+/g, "_")}_Resume.pdf`,
    size: "1.2 MB",
    uploadedAt: "Oct 15, 2026",
  });

  // 1. Basic Info State
  const [fullName, setFullName] = useState(freelancer.name || "Sambit Kumar Mohanty");
  const [professionalTitle, setProfessionalTitle] = useState(
    freelancer.title || "Full Stack Developer"
  );
  const [headline, setHeadline] = useState(
    "Full Stack Developer | Web, AI & Blockchain Solutions"
  );
  const [location, setLocation] = useState("Bhubaneswar, Odisha, India");
  const [timeZone, setTimeZone] = useState("(GMT+5:30) India Standard Time");
  const [aboutMe, setAboutMe] = useState(
    "I'm a passionate full stack developer with experience in building scalable web applications, AI-powered products and blockchain solutions. I enjoy solving real-world problems and working with clients to turn ideas into high-quality, production-ready products."
  );
  const [linkedinUrl, setLinkedinUrl] = useState("https://linkedin.com/in/sambit-mohanty");
  const [githubUrl, setGithubUrl] = useState("https://github.com/sambit-mohanty");
  const [websiteUrl, setWebsiteUrl] = useState("https://sambitmohanty.dev");
  const [resumeVisibility, setResumeVisibility] = useState<"Visible to clients" | "Hidden">("Visible to clients");

  // 2. Professional Details State
  const [hourlyRate, setHourlyRate] = useState<number>(65);
  const [minFixedRate, setMinFixedRate] = useState<number>(1000);
  const [primaryDomain, setPrimaryDomain] = useState("Fintech, SaaS & High-Concurrency Web");
  const [yearsExperience, setYearsExperience] = useState<number>(6);
  const [englishLevel, setEnglishLevel] = useState("Fluent / Professional Working");
  const [servicesOffered, setServicesOffered] = useState<ServiceOfferingItem[]>([
    { id: "srv_1", title: "Full-Stack Web Applications (Next.js / Node.js)", active: true },
    { id: "srv_2", title: "Bilateral Payment & Escrow Settlement Rails", active: true },
    { id: "srv_3", title: "UI/UX Design Systems & Tailwind CSS Architecture", active: true },
    { id: "srv_4", title: "Cryptographic Consensus State Machines", active: true },
    { id: "srv_5", title: "High-Performance Webhook Ingestion & Worker Pools", active: true },
  ]);
  const [newServiceInput, setNewServiceInput] = useState("");
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingServiceText, setEditingServiceText] = useState("");

  // 3. Skills State
  const [newSkillInput, setNewSkillInput] = useState("");
  const [skillsList, setSkillsList] = useState<Array<{ name: string; level: string; verified: boolean }>>([
    { name: "TypeScript", level: "Expert (5+ yrs)", verified: true },
    { name: "Next.js 15 & React 19", level: "Expert (5+ yrs)", verified: true },
    { name: "Node.js & Express", level: "Advanced (4 yrs)", verified: true },
    { name: "PayPal REST v2 APIs", level: "Specialist", verified: true },
    { name: "Dual SHA-256 State Consensus", level: "Specialist", verified: true },
    { name: "Tailwind CSS", level: "Expert", verified: true },
    { name: "PostgreSQL & Prisma", level: "Advanced (3 yrs)", verified: true },
    { name: "Python & LangChain", level: "Intermediate", verified: true },
    { name: "Docker & AWS S3", level: "Intermediate", verified: true },
    { name: "Solana Pay / Web3", level: "Intermediate", verified: false },
  ]);

  // 4. Portfolio Projects State
  const [portfolioProjects, setPortfolioProjects] = useState<Array<{
    id: string;
    title: string;
    role: string;
    timeline: string;
    description: string;
    prUrl?: string;
    demoUrl?: string;
    tags: string[];
    metrics: string;
  }>>([
    {
      id: "port_1",
      title: "Bilateral E-Commerce Payment Rails & Webhook Ingestion Engine",
      role: "Lead Systems Architect",
      timeline: "Oct 2026 – Present",
      description:
        "High-reliability payment webhook ingestion pipeline integrating PayPal REST Orders v2 with automated signature verification, 30s idempotency caching, and failover recovery.",
      prUrl: "https://github.com/proofloop/gateway/pull/42",
      demoUrl: "https://www.loom.com/share/proofloop-milestone2-demo",
      tags: ["TypeScript", "PayPal REST v2", "Next.js", "Jest"],
      metrics: "5,000+ invoices/hr throughput · 99.98% uptime",
    },
    {
      id: "port_2",
      title: "Nexum Dual SHA-256 Consensus Freelance Escrow Gateway",
      role: "Core Developer",
      timeline: "Aug 2026 – Oct 2026",
      description:
        "Engineered bilateral cryptographic state consensus ensuring milestone funds can only be released upon mutual digital signatures between buyer and seller.",
      tags: ["Cryptography", "SHA-256", "State Machines", "Security"],
      metrics: "Dual-key signature locking · Zero dispute fraud",
    },
    {
      id: "port_3",
      title: "Multi-Tenant PDF Invoice & Billing Generation Cluster",
      role: "Backend Engineer",
      timeline: "Jun 2026 – Aug 2026",
      description:
        "Developed a concurrency-managed headless Chrome worker pool rendering 5,000+ invoices/hour with zero memory leaks and S3 presigned asset distribution.",
      prUrl: "https://github.com/apexretail/invoice-worker",
      tags: ["Puppeteer", "Docker", "Node.js", "AWS S3"],
      metrics: "120,000 PDFs rendered/month without leak",
    },
    {
      id: "port_4",
      title: "AI Customer Support Autonomous Mediation Copilot",
      role: "Full-Stack AI Engineer",
      timeline: "Apr 2026 – Jun 2026",
      description:
        "Autonomous multi-turn customer mediation assistant using LangChain, streaming Server-Sent Events (SSE), and verifiable audit logging.",
      demoUrl: "https://aura-ai-copilot.nexum.dev",
      tags: ["Python", "OpenAI API", "LangChain", "Next.js 15"],
      metrics: "Sub-200ms TTFT streaming response",
    },
  ]);

  // 5. Work Experience State
  const [workExperiences, setWorkExperiences] = useState<Array<{
    id: string;
    role: string;
    company: string;
    location: string;
    duration: string;
    current: boolean;
    bullets: string[];
  }>>([
    {
      id: "exp_1",
      role: "Senior Full Stack Systems Engineer",
      company: "Horizon Commerce LLC",
      location: "San Francisco, CA (Remote)",
      duration: "Jan 2024 – Present",
      current: true,
      bullets: [
        "Architected bilateral escrow state consensus machines handling $300k+ monthly transaction volume.",
        "Engineered idempotent PayPal REST v2 webhook processing relays with automated re-try queues.",
        "Refactored legacy React UI to Next.js 15 App Router, cutting LCP by 68%.",
      ],
    },
    {
      id: "exp_2",
      role: "Lead Backend Developer",
      company: "Apex Retail Group",
      location: "London, UK (Remote)",
      duration: "Mar 2022 – Dec 2023",
      current: false,
      bullets: [
        "Built multi-tenant PDF invoice rendering worker pool processing 120k orders per month.",
        "Implemented AWS S3 signed bucket pipelines and automated ledger reconciliation.",
      ],
    },
    {
      id: "exp_3",
      role: "UI/UX & Frontend Architect",
      company: "FinTech Labs Inc.",
      location: "Bangalore, India",
      duration: "Jan 2020 – Feb 2022",
      current: false,
      bullets: [
        "Constructed design token system in Tailwind CSS adopted by 4 internal SaaS products.",
        "Maintained 95%+ unit test code coverage using Vitest and React Testing Library.",
      ],
    },
  ]);

  // 6. Education State
  const [educationList, setEducationList] = useState<Array<{
    id: string;
    degree: string;
    institution: string;
    year: string;
    gpa: string;
    details: string;
  }>>([
    {
      id: "edu_1",
      degree: "B.Tech in Computer Science & Engineering",
      institution: "National Institute of Technology (NIT)",
      year: "2018 – 2022",
      gpa: "8.7 / 10.0 (Magna Cum Laude)",
      details: "Specialized in Distributed Systems, Cryptography, and Advanced Database Architectures.",
    },
  ]);

  // 7. Certifications State
  const [certificationsList, setCertificationsList] = useState<Array<{
    id: string;
    title: string;
    issuer: string;
    issueDate: string;
    credentialId: string;
    verified: boolean;
  }>>([
    {
      id: "cert_1",
      title: "AWS Certified Solutions Architect – Professional",
      issuer: "Amazon Web Services (AWS)",
      issueDate: "Jan 2025 · Expires Jan 2028",
      credentialId: "AWS-PSA-98241",
      verified: true,
    },
    {
      id: "cert_2",
      title: "Meta Certified Advanced Frontend Engineer",
      issuer: "Meta / Coursera",
      issueDate: "Aug 2024 · No Expiration",
      credentialId: "META-FRONTEND-5510",
      verified: true,
    },
  ]);

  // Modals Open State
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState("");
  const [newProjRole, setNewProjRole] = useState("Lead Developer");
  const [newProjTimeline, setNewProjTimeline] = useState("Oct 2026 – Present");
  const [newProjDescription, setNewProjDescription] = useState("");
  const [newProjGithubUrl, setNewProjGithubUrl] = useState("");
  const [newProjDemoUrl, setNewProjDemoUrl] = useState("");
  const [newProjTags, setNewProjTags] = useState("Next.js, TypeScript, Tailwind CSS");
  const [newProjMetrics, setNewProjMetrics] = useState("99.9% uptime · Dual SHA-256 consensus");

  const [showAddEducationModal, setShowAddEducationModal] = useState(false);
  const [newEduDegree, setNewEduDegree] = useState("");
  const [newEduInstitution, setNewEduInstitution] = useState("");
  const [newEduYear, setNewEduYear] = useState("2020 – 2024");
  const [newEduGpa, setNewEduGpa] = useState("3.9 / 4.0 (First Class with Distinction)");
  const [newEduDetails, setNewEduDetails] = useState("");

  const [showAddCertificationModal, setShowAddCertificationModal] = useState(false);
  const [newCertTitle, setNewCertTitle] = useState("");
  const [newCertIssuer, setNewCertIssuer] = useState("");
  const [newCertIssueDate, setNewCertIssueDate] = useState("Nov 2026 · No Expiration");
  const [newCertCredentialId, setNewCertCredentialId] = useState("");

  const [showAddExperienceModal, setShowAddExperienceModal] = useState(false);
  const [newExpRole, setNewExpRole] = useState("");
  const [newExpCompany, setNewExpCompany] = useState("");
  const [newExpLocation, setNewExpLocation] = useState("Remote");
  const [newExpDuration, setNewExpDuration] = useState("2024 – Present");
  const [newExpBullets, setNewExpBullets] = useState("");

  const handleAddProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle.trim()) return;
    const newProj = {
      id: `port_${Date.now()}`,
      title: newProjTitle.trim(),
      role: newProjRole.trim() || "Lead Developer",
      timeline: newProjTimeline.trim() || "2026",
      description: newProjDescription.trim() || "Full-stack cloud deliverable with cryptographic consensus.",
      prUrl: newProjGithubUrl.trim() || undefined,
      demoUrl: newProjDemoUrl.trim() || undefined,
      tags: newProjTags.split(",").map((t) => t.trim()).filter(Boolean),
      metrics: newProjMetrics.trim() || "Verified milestone deliverable",
    };
    setPortfolioProjects((prev) => [newProj, ...prev]);
    setShowAddProjectModal(false);
    setNewProjTitle("");
    setNewProjDescription("");
    setNewProjGithubUrl("");
    setNewProjDemoUrl("");
    showToast(`Portfolio project "${newProj.title}" added successfully!`);
  };

  const handleAddEducationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEduDegree.trim() || !newEduInstitution.trim()) return;
    const newEdu = {
      id: `edu_${Date.now()}`,
      degree: newEduDegree.trim(),
      institution: newEduInstitution.trim(),
      year: newEduYear.trim() || "2022 – 2026",
      gpa: newEduGpa.trim() || "Distinction Honors",
      details: newEduDetails.trim() || "Advanced coursework in Software Engineering and Distributed Computing.",
    };
    setEducationList((prev) => [newEdu, ...prev]);
    setShowAddEducationModal(false);
    setNewEduDegree("");
    setNewEduInstitution("");
    setNewEduDetails("");
    showToast(`Education credential "${newEdu.degree}" added!`);
  };

  const handleAddCertificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCertTitle.trim() || !newCertIssuer.trim()) return;
    const newCert = {
      id: `cert_${Date.now()}`,
      title: newCertTitle.trim(),
      issuer: newCertIssuer.trim(),
      issueDate: newCertIssueDate.trim() || "2026",
      credentialId: newCertCredentialId.trim() || `NEX-${Math.floor(10000 + Math.random() * 90000)}`,
      verified: true,
    };
    setCertificationsList((prev) => [newCert, ...prev]);
    setShowAddCertificationModal(false);
    setNewCertTitle("");
    setNewCertIssuer("");
    setNewCertCredentialId("");
    showToast(`Certification "${newCert.title}" added with verified badge!`);
  };

  const handleAddExperienceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpRole.trim() || !newExpCompany.trim()) return;
    const bullets = newExpBullets
      .split("\n")
      .map((b) => b.trim())
      .filter(Boolean);
    const newExp = {
      id: `exp_${Date.now()}`,
      role: newExpRole.trim(),
      company: newExpCompany.trim(),
      location: newExpLocation.trim() || "Remote",
      duration: newExpDuration.trim() || "2024 – Present",
      current: newExpDuration.toLowerCase().includes("present"),
      bullets: bullets.length > 0 ? bullets : ["Delivered core client features under bilateral escrow consensus."],
    };
    setWorkExperiences((prev) => [newExp, ...prev]);
    setShowAddExperienceModal(false);
    setNewExpRole("");
    setNewExpCompany("");
    setNewExpBullets("");
    showToast(`Work experience at "${newExp.company}" added!`);
  };

  // 8. Availability State
  const [weeklyHours, setWeeklyHours] = useState<number>(35);
  const [availabilityStatus, setAvailabilityStatus] = useState<"Available" | "Limited" | "Not Available">("Available");
  const [timezoneOverlap, setTimezoneOverlap] = useState("US Eastern (EST) & European (CET)");
  const [noticePeriod, setNoticePeriod] = useState("Immediate Start (Available now)");

  // 9. Preferences State
  const [preferredContractType, setPreferredContractType] = useState<"All" | "Fixed-Price Milestones" | "Hourly">("Fixed-Price Milestones");
  const [minClientRating, setMinClientRating] = useState<number>(4.5);
  const [requireEscrowUpfront, setRequireEscrowUpfront] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [publicIndexed, setPublicIndexed] = useState(true);

  // Sub-tabs metadata
  const subTabs = [
    { id: "basic", label: "Basic Info", icon: User },
    { id: "professional", label: "Professional Details", icon: Briefcase },
    { id: "skills", label: "Skills", icon: Globe },
    { id: "portfolio", label: "Portfolio", icon: FolderKanban },
    { id: "experience", label: "Work Experience", icon: Building2 },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "certifications", label: "Certifications", icon: Award },
    { id: "availability", label: "Availability", icon: Clock },
    { id: "preferences", label: "Preferences", icon: Settings },
  ] as const;

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Profile changes saved successfully! Live preview updated.");
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillInput.trim()) return;
    setSkillsList((prev) => [
      ...prev,
      { name: newSkillInput.trim(), level: "Intermediate", verified: false },
    ]);
    setNewSkillInput("");
    showToast("Skill added to profile!");
  };

  const handleDeleteSkill = (name: string) => {
    setSkillsList((prev) => prev.filter((s) => s.name !== name));
    showToast(`Removed ${name} from skills.`);
  };

  // Photo & Banner Handlers
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
      showToast(`Profile photo updated to "${file.name}"!`);
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBannerUrl(url);
      showToast(`Profile banner updated to "${file.name}"!`);
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80");
    showToast("Profile photo reset to default.");
  };

  // Resume Handlers
  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;
      setResumeFile({
        name: file.name,
        size: sizeStr,
        uploadedAt: "Oct 31, 2026",
      });
      showToast(`Resume "${file.name}" uploaded successfully!`);
    }
  };

  const handleRemoveResume = () => {
    setResumeFile(null);
    showToast("Resume removed from profile.");
  };

  // Service Offerings Handlers
  const handleAddService = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newServiceInput.trim()) return;
    const newSrv: ServiceOfferingItem = {
      id: `srv_${Date.now()}`,
      title: newServiceInput.trim(),
      active: true,
    };
    setServicesOffered((prev) => [...prev, newSrv]);
    setNewServiceInput("");
    showToast(`Service "${newSrv.title}" added!`);
  };

  const handleToggleService = (id: string) => {
    setServicesOffered((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  const handleDeleteService = (id: string) => {
    setServicesOffered((prev) => prev.filter((s) => s.id !== id));
    showToast("Service offering removed.");
  };

  const handleSaveEditService = (id: string) => {
    if (!editingServiceText.trim()) return;
    setServicesOffered((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: editingServiceText.trim() } : s))
    );
    setEditingServiceId(null);
    showToast("Service offering updated.");
  };

  // Deletion Handlers for other sections
  const handleDeleteProject = (id: string) => {
    setPortfolioProjects((prev) => prev.filter((p) => p.id !== id));
    showToast("Portfolio project removed.");
  };

  const handleDeleteExperience = (id: string) => {
    setWorkExperiences((prev) => prev.filter((e) => e.id !== id));
    showToast("Work experience removed.");
  };

  const handleDeleteEducation = (id: string) => {
    setEducationList((prev) => prev.filter((e) => e.id !== id));
    showToast("Education record removed.");
  };

  const handleDeleteCertification = (id: string) => {
    setCertificationsList((prev) => prev.filter((c) => c.id !== id));
    showToast("Certification record removed.");
  };

  if (viewMode === "public_preview") {
    return (
      <div className="space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-slate-50 border border-indigo-100 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setViewMode("editor")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200 shadow-2xs transition active:scale-98 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#4f46e5]" />
              <span>← Back to Profile Editor</span>
            </button>
            <div className="text-xs text-indigo-950 flex items-center gap-1.5 font-semibold">
              <Eye className="w-4 h-4 text-[#4f46e5]" />
              <span>Dedicated Client Perspective (Live Preview)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                showToast("Profile link copied to clipboard!");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Copy Link</span>
            </button>
            <button
              type="button"
              onClick={() => showToast("Opened milestone contract builder for " + fullName)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold shadow-xs transition active:scale-98 cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Hire Freelancer</span>
            </button>
          </div>
        </div>

        {/* Hero Banner & Identity Header */}
        <div className="rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
          {/* Banner */}
          <div
            className="w-full h-44 sm:h-52 bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#4338ca] relative flex items-end p-4 sm:p-6"
            style={
              bannerUrl
                ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                : undefined
            }
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/15 via-transparent to-black/30 pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
          </div>

          {/* Profile Identity Row */}
          <div className="p-5 sm:p-7 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16">
              <div className="flex items-end gap-4">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100 ring-2 ring-slate-200 shrink-0">
                  <Image
                    src={avatarUrl}
                    alt={fullName}
                    width={112}
                    height={112}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      {fullName}
                    </h1>
                    <span className="w-5 h-5 rounded-full bg-[#4f46e5] text-white flex items-center justify-center text-xs font-bold">
                      ✓
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {availabilityStatus === "Available" ? "Available for hire" : availabilityStatus}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">
                    {professionalTitle}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xl">
                    {headline}
                  </p>
                </div>
              </div>

              {/* Rate & Action */}
              <div className="flex items-center gap-3 sm:self-center shrink-0">
                <div className="text-right">
                  <div className="text-lg font-extrabold text-[#4f46e5] font-mono">${hourlyRate}.00/hr</div>
                  <div className="text-[11px] text-slate-400 font-medium">Min milestone ${minFixedRate}</div>
                </div>
                <button
                  type="button"
                  onClick={() => showToast("Opened direct message channel.")}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                  <span>Message</span>
                </button>
                <button
                  type="button"
                  onClick={() => showToast("Initiated milestone contract for " + fullName)}
                  className="px-5 py-2 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs shadow-sm transition active:scale-98 cursor-pointer flex items-center gap-1.5"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Hire Now</span>
                </button>
              </div>
            </div>

            {/* Quick Metadata Strip */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-5 mt-5 border-t border-slate-100 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{location}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>{timeZone}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{weeklyHours} hrs/week capacity</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span>English:</span>
                <span className="text-indigo-600 font-bold">{englishLevel}</span>
              </span>
              {githubUrl && (
                <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#4f46e5] hover:underline font-mono">
                  <span>GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {linkedinUrl && (
                <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#4f46e5] hover:underline">
                  <span>LinkedIn</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* 4 Performance Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-slate-900 font-extrabold text-base">4.9 / 5.0</span>
            </div>
            <div className="text-xs text-slate-500">12 Verified Client Reviews</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <div className="text-base font-extrabold text-slate-900 font-mono">18 / 18</div>
            <div className="text-xs text-slate-500">Milestones Released (100%)</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <div className="text-base font-extrabold text-indigo-600 font-mono">$120,000+</div>
            <div className="text-xs text-slate-500">Total Escrow Transacted</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center gap-1 text-emerald-600 font-extrabold text-base">
              <ShieldCheck className="w-4 h-4" />
              <span>0.0% Disputes</span>
            </div>
            <div className="text-xs text-slate-500">Dual SHA-256 Consensus</div>
          </div>
        </div>

        {/* Main 2-Column Details Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main 8 cols */}
          <div className="lg:col-span-8 space-y-6">
            {/* About Me */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <User className="w-4 h-4 text-[#4f46e5]" />
                <span>About The Professional</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {aboutMe}
              </p>
              <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-500">
                <div><span className="font-bold text-slate-700">Domain Expertise:</span> {primaryDomain}</div>
                <div><span className="font-bold text-slate-700">Experience:</span> {yearsExperience}+ Years</div>
              </div>
            </div>

            {/* Verified Service Offerings */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#4f46e5]" />
                  <span>Verified Service Offerings</span>
                </h3>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {servicesOffered.filter((s) => s.active).length} Active
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {servicesOffered.filter((s) => s.active).map((srv) => (
                  <div key={srv.id} className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 flex items-start gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-semibold text-slate-800">{srv.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Portfolio Projects */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-[#4f46e5]" />
                  <span>Featured Portfolio Projects ({portfolioProjects.length})</span>
                </h3>
                <span className="text-[11px] text-slate-400">Verifiable Code & Loom Walkthroughs</span>
              </div>
              <div className="space-y-4">
                {portfolioProjects.map((proj) => (
                  <div key={proj.id} className="p-4 sm:p-5 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-3 hover:border-indigo-300 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-wider">
                          {proj.role} • {proj.timeline}
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-1">{proj.title}</h4>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {proj.prUrl && (
                          <a href={proj.prUrl} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition">
                            <FileCode className="w-3.5 h-3.5 text-slate-500" />
                            <span>GitHub</span>
                          </a>
                        )}
                        {proj.demoUrl && (
                          <a href={proj.demoUrl} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold text-indigo-700 flex items-center gap-1.5 transition">
                            <Video className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Demo</span>
                          </a>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap gap-1.5">
                        {proj.tags.map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded bg-white text-slate-600 text-[10px] font-medium border border-slate-200">{t}</span>
                        ))}
                      </div>
                      <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 self-start sm:self-auto">{proj.metrics}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Work Experience */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#4f46e5]" />
                <span>Work Experience & Contracts ({workExperiences.length})</span>
              </h3>
              <div className="space-y-5 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {workExperiences.map((exp) => (
                  <div key={exp.id} className="relative pl-9 space-y-1.5 text-xs">
                    <div className="absolute left-1.5 top-1 w-4 h-4 rounded-full bg-white border-4 border-[#4f46e5]" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h4 className="font-bold text-sm text-slate-900">{exp.role} • <span className="text-indigo-600">{exp.company}</span></h4>
                      <span className="font-mono text-slate-400 text-[11px]">{exp.duration}</span>
                    </div>
                    <div className="text-slate-500">{exp.location}</div>
                    <ul className="space-y-1 pt-1 text-slate-600">
                      {exp.bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-indigo-600 font-bold">•</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Education & Certifications Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#4f46e5]" />
                  <span>Education</span>
                </h3>
                {educationList.map((edu) => (
                  <div key={edu.id} className="text-xs space-y-1">
                    <div className="font-bold text-slate-900">{edu.degree}</div>
                    <div className="text-slate-600">{edu.institution} • <span className="font-mono text-slate-400">{edu.year}</span></div>
                    <div className="text-emerald-700 font-semibold">{edu.gpa}</div>
                    <p className="text-slate-500 text-[11px]">{edu.details}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#4f46e5]" />
                  <span>Verified Certifications</span>
                </h3>
                <div className="space-y-2.5">
                  {certificationsList.map((cert) => (
                    <div key={cert.id} className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 text-xs space-y-1">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{cert.title}</span>
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">✓</span>
                      </div>
                      <div className="text-[11px] text-slate-500">{cert.issuer} • {cert.issueDate}</div>
                      <div className="font-mono text-[10px] text-slate-400">ID: {cert.credentialId}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Verified Skills Matrix */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#4f46e5]" />
                <span>Verified Skills & Technologies ({skillsList.length})</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {skillsList.map((skill) => (
                  <span key={skill.name} className="px-3 py-1.5 rounded-xl bg-indigo-50/70 text-[#4f46e5] font-bold text-xs border border-indigo-100 flex items-center gap-1.5">
                    {skill.verified && <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white text-[9px] flex items-center justify-center font-bold">✓</span>}
                    <span>{skill.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({skill.level})</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right 4 cols: Client Actions, Security & Availability */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-6 lg:self-start">
            {/* Action Card */}
            <div className="rounded-2xl border border-indigo-200 bg-gradient-to-b from-indigo-50/70 to-white p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Engagement Rate</span>
                <span className="text-xl font-extrabold text-[#4f46e5] font-mono">${hourlyRate}.00/hr</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Available for hourly retainers and fixed milestone projects with escrow deposit backing.
              </p>
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => showToast("Opened milestone contract builder for " + fullName)}
                  className="w-full py-2.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs shadow-xs transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Hire Freelancer</span>
                </button>
                <button
                  type="button"
                  onClick={() => showToast("Initiated direct client conversation.")}
                  className="w-full py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                  <span>Send Direct Message</span>
                </button>
              </div>
              <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Typical response time: under 1 hour</span>
              </div>
            </div>

            {/* Nexum Escrow Consensus Guarantee */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-[#4f46e5]" />
                <span>Nexum Escrow Guarantee</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Your funds remain safely locked in PayPal Escrow. Work is submitted with dual SHA-256 state consensus and is only released upon your explicit signoff.
              </p>
              <div className="space-y-1.5 pt-1 text-[11px] text-slate-700 font-medium">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 100% Milestone Protection</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Idempotent Settlement Relays</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Cryptographic Signatures</div>
              </div>
            </div>

            {/* Availability & Overlap */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3 text-xs">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#4f46e5]" />
                <span>Availability & Working Hours</span>
              </div>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Weekly Commitment:</span>
                  <span className="font-bold text-slate-900">{weeklyHours} hrs / week</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Timezone Overlap:</span>
                  <span className="font-bold text-slate-900">{timezoneOverlap}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Notice Period:</span>
                  <span className="font-bold text-slate-900">{noticePeriod}</span>
                </div>
              </div>
            </div>

            {/* Resume / CV Download */}
            {resumeFile && resumeVisibility === "Visible to clients" && (
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-500" />
                  <span>Resume & Technical CV</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate text-[11px]">{resumeFile.name}</div>
                    <div className="text-[10px] text-slate-400">{resumeFile.size}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast(`Downloading ${resumeFile.name}...`)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-[#4f46e5] font-bold text-[11px] shadow-2xs transition flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ==============================================================
          1. PAGE HEADER ROW: TITLE, SUBTITLE & TOP-RIGHT ACTION
         ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            My Profile & Portfolio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Showcase your skills, experience and work to attract the right clients.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setViewMode("public_preview")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs shadow-sm transition active:scale-98 cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View Public Profile</span>
        </button>
      </div>

      {/* ==============================================================
          2. HORIZONTAL SUB-TABS NAVIGATION BAR
         ============================================================== */}
      <div className="border-b border-slate-200 overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-1 sm:gap-2 min-w-max">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveSubTab(tab.id);
                  showToast(`Switched to ${tab.label}`);
                }}
                className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold transition-all border-b-2 cursor-pointer ${
                  isActive
                    ? "border-[#4f46e5] text-[#4f46e5] font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#4f46e5]" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ==============================================================
          3. MAIN TWO-COLUMN LAYOUT: DYNAMIC FORM/PAGE + PREVIEW/COMPLETION
         ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================
            LEFT COLUMN (~65% / 8 OF 12 COLS): DYNAMIC SUB-TAB CONTENT
           ============================================================ */}
        <div className="lg:col-span-8 space-y-6">
          {/* ----------------------------------------------------------
              SUB-TAB 1: BASIC INFO
             ---------------------------------------------------------- */}
          {activeSubTab === "basic" && (
            <form onSubmit={handleSaveChanges} className="space-y-6">
              {/* Card 1: Profile Photo & Banner */}
              <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-5">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Profile Photo & Banner
                </h2>

                {/* Hidden File Pickers */}
                <input
                  type="file"
                  ref={bannerFileInputRef}
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={avatarFileInputRef}
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />

                {/* Decorative Wallpaper Banner */}
                <div
                  className="relative w-full h-32 sm:h-36 rounded-2xl overflow-hidden bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#4338ca] shadow-inner border border-slate-200/60 p-3 sm:p-4"
                  style={
                    bannerUrl
                      ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                      : undefined
                  }
                >
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/15 via-transparent to-black/30 pointer-events-none" />
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 flex flex-col items-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => bannerFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold border border-white/25 shadow-xs transition active:scale-98 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Change Banner</span>
                    </button>
                    <span className="text-[10px] text-white/70 font-medium">
                      Recommended size: 1600 × 400 (JPG, PNG up to 5MB)
                    </span>
                  </div>
                </div>

                {/* Avatar + Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 -mt-10 sm:-mt-12 pl-2">
                  <div className="flex items-end gap-4">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-white shadow-md shrink-0 bg-slate-100 ring-2 ring-slate-200/60">
                      <Image
                        src={avatarUrl}
                        alt={fullName}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="pb-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => avatarFileInputRef.current?.click()}
                          className="px-3.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-[#4f46e5] text-xs font-bold transition shadow-2xs cursor-pointer"
                        >
                          Change Photo
                        </button>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="px-3.5 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold transition shadow-2xs cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">JPG, PNG up to 5MB</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Card 2: Basic Information Form */}
              <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Basic Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Professional Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={professionalTitle}
                      onChange={(e) => setProfessionalTitle(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Headline (Visible to clients) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      {headline.length}/120
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={120}
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Location</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Time Zone</label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={timeZone}
                        onChange={(e) => setTimeZone(e.target.value)}
                        className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 appearance-none focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs cursor-pointer"
                      >
                        <option value="(GMT+5:30) India Standard Time">
                          (GMT+5:30) India Standard Time
                        </option>
                        <option value="(GMT-5:00) Eastern Time (US & Canada)">
                          (GMT-5:00) Eastern Time (US & Canada)
                        </option>
                        <option value="(GMT+0:00) Greenwich Mean Time (London)">
                          (GMT+0:00) Greenwich Mean Time (London)
                        </option>
                        <option value="(GMT+1:00) Central European Time (Berlin)">
                          (GMT+1:00) Central European Time (Berlin)
                        </option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      About Me <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      {aboutMe.length}/500
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    maxLength={500}
                    value={aboutMe}
                    onChange={(e) => setAboutMe(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs resize-none leading-relaxed"
                  />
                </div>
              </section>

              {/* Card 3: Account Links */}
              <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Account Links
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">LinkedIn</label>
                    <div className="relative">
                      <span className="w-5 h-5 rounded bg-[#0a66c2] text-white text-[11px] font-bold flex items-center justify-center absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        in
                      </span>
                      <input
                        type="url"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/username"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">GitHub</label>
                    <div className="relative">
                      <span className="w-5 h-5 rounded bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        git
                      </span>
                      <input
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/username"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Website (Optional)</label>
                    <div className="relative">
                      <LinkIcon className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://yourdomain.com"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Card 4: Resume */}
              <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                    Resume & Technical CV
                  </h2>
                  <span className="text-[11px] text-slate-400">PDF, DOC, DOCX up to 5MB</span>
                </div>

                <input
                  type="file"
                  ref={resumeFileInputRef}
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                  className="hidden"
                />

                {resumeFile ? (
                  <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-rose-500 text-white font-black text-[11px] flex items-center justify-center shrink-0 shadow-2xs">
                        PDF
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 truncate">
                          {resumeFile.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Uploaded on {resumeFile.uploadedAt} • {resumeFile.size}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => resumeFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-[#4f46e5] font-bold text-xs shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload New</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => showToast(`Downloading ${resumeFile.name}...`)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRemoveResume}
                        className="p-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 shadow-2xs transition cursor-pointer"
                        title="Remove resume"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="relative">
                        <select
                          value={resumeVisibility}
                          onChange={(e) =>
                            setResumeVisibility(
                              e.target.value as "Visible to clients" | "Hidden"
                            )
                          }
                          className="px-3 py-1.5 pr-7 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition cursor-pointer appearance-none"
                        >
                          <option value="Visible to clients">Visible to clients</option>
                          <option value="Hidden">Hidden</option>
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => resumeFileInputRef.current?.click()}
                    className="p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#4f46e5] bg-slate-50/50 hover:bg-indigo-50/30 text-center transition cursor-pointer space-y-2"
                  >
                    <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Upload your latest CV / Resume
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        PDF, DOC or DOCX up to 5MB. Clients can view or download.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-1.5 rounded-xl bg-[#4f46e5] text-white text-xs font-bold shadow-xs hover:bg-[#4338ca] transition cursor-pointer"
                    >
                      Browse File
                    </button>
                  </div>
                )}
              </section>

              {/* Bottom Save Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
                <div className="flex items-center gap-2 text-xs text-indigo-900">
                  <Info className="w-4 h-4 text-[#4f46e5] shrink-0" />
                  <span>Keep your profile updated to get better project recommendations and attract more clients.</span>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs sm:text-sm shadow-sm transition active:scale-98 cursor-pointer shrink-0"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {/* ----------------------------------------------------------
              SUB-TAB 2: PROFESSIONAL DETAILS
             ---------------------------------------------------------- */}
          {activeSubTab === "professional" && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Professional Details & Pricing
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define your billing rates, domain expertise, and core service offerings.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => showToast("Professional details updated.")}
                  className="px-4 py-2 rounded-xl bg-[#4f46e5] text-white text-xs font-bold shadow-xs hover:bg-[#4338ca] transition cursor-pointer"
                >
                  Save Rates
                </button>
              </div>

              {/* Rates Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Hourly Rate (USD)</span>
                    <span className="font-mono text-indigo-600 font-extrabold text-sm">${hourlyRate}/hr</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">Clients will see ${hourlyRate}.00/hr as your base contract rate.</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Minimum Fixed-Price Milestone</span>
                    <span className="font-mono text-emerald-600 font-extrabold text-sm">${minFixedRate}</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      value={minFixedRate}
                      onChange={(e) => setMinFixedRate(Number(e.target.value))}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">Minimum budget required for fixed-scope milestone escrow contracts.</p>
                </div>
              </div>

              {/* Domain & Languages */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Primary Industry Domain</label>
                  <input
                    type="text"
                    value={primaryDomain}
                    onChange={(e) => setPrimaryDomain(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Years Experience</label>
                  <div className="relative">
                    <select
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 appearance-none focus:bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value={2}>2+ Years (Junior / Mid)</option>
                      <option value={4}>4+ Years (Mid / Senior)</option>
                      <option value={6}>6+ Years (Senior Lead)</option>
                      <option value={10}>10+ Years (Principal / Staff)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">English Proficiency</label>
                  <div className="relative">
                    <select
                      value={englishLevel}
                      onChange={(e) => setEnglishLevel(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 appearance-none focus:bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="Fluent / Professional Working">Fluent / Professional Working</option>
                      <option value="Native / Bilingual">Native / Bilingual</option>
                      <option value="Conversational">Conversational</option>
                      <option value="Basic">Basic</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Service Offerings */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Verified Service Offerings ({servicesOffered.length})
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Add, edit or pause specialized service offerings matched by AI
                    </p>
                  </div>
                </div>

                {/* Add Service Bar */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Bilateral Settlement Rails & Payment Webhooks..."
                    value={newServiceInput}
                    onChange={(e) => setNewServiceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddService();
                      }
                    }}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddService}
                    className="px-4 py-2 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Offering</span>
                  </button>
                </div>

                {/* Service Offerings List */}
                <div className="space-y-2">
                  {servicesOffered.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 text-xs hover:border-[#4f46e5]/30 transition group"
                    >
                      {editingServiceId === service.id ? (
                        <div className="flex items-center gap-2 flex-1 mr-3">
                          <input
                            type="text"
                            value={editingServiceText}
                            onChange={(e) => setEditingServiceText(e.target.value)}
                            className="flex-1 px-3 py-1 rounded-lg border border-indigo-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEditService(service.id);
                              if (e.key === "Escape") setEditingServiceId(null);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditService(service.id)}
                            className="p-1.5 rounded-lg bg-[#4f46e5] text-white hover:bg-[#4338ca] transition cursor-pointer"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingServiceId(null)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 font-semibold text-slate-800">
                          <CheckCircle2
                            className={`w-4 h-4 shrink-0 ${
                              service.active ? "text-emerald-600" : "text-slate-300"
                            }`}
                          />
                          <span
                            className={
                              service.active
                                ? "text-slate-900"
                                : "text-slate-400 line-through"
                            }
                          >
                            {service.title}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleService(service.id)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border transition cursor-pointer ${
                            service.active
                              ? "text-indigo-700 bg-indigo-50 border-indigo-100 hover:bg-indigo-100"
                              : "text-slate-400 bg-slate-100 border-slate-200 hover:bg-slate-200"
                          }`}
                        >
                          {service.active ? "Active Offering" : "Paused"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingServiceId(service.id);
                            setEditingServiceText(service.title);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                          title="Edit offering"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteService(service.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete offering"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------
              SUB-TAB 3: SKILLS
             ---------------------------------------------------------- */}
          {activeSubTab === "skills" && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Technical Skills Matrix
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Skills indexed by our AI matching engine to recommend top contracts.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {skillsList.length} Skills Added
                </span>
              </div>

              {/* Add New Skill Input */}
              <form onSubmit={handleAddSkill} className="flex gap-2">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  placeholder="Type a skill or framework (e.g. GraphQL, Tailwind, Solidity)..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#4f46e5] text-white text-xs font-bold hover:bg-[#4338ca] transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Skill</span>
                </button>
              </form>

              {/* Skills Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {skillsList.map((skill) => (
                  <div
                    key={skill.name}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/80 hover:bg-white hover:border-indigo-300 transition-all flex items-center justify-between gap-3 text-xs group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-[#4f46e5] shrink-0 shadow-2xs">
                        #
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                          <span>{skill.name}</span>
                          {skill.verified && (
                            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">
                              ✓
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">{skill.level}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteSkill(skill.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Remove skill"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------
              SUB-TAB 4: PORTFOLIO
             ---------------------------------------------------------- */}
          {activeSubTab === "portfolio" && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Portfolio Projects ({portfolioProjects.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Showcase verifiable work deliverables with pull requests and live Loom demonstrations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#4f46e5] text-white text-xs font-bold hover:bg-[#4338ca] transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Project</span>
                </button>
              </div>

              <div className="space-y-4">
                {portfolioProjects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-[#4f46e5]/40 hover:shadow-xs transition-all space-y-3.5 group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase tracking-wider">
                          {proj.role} · {proj.timeline}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#4f46e5] transition-colors mt-1">
                          {proj.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        {proj.prUrl && (
                          <a
                            href={proj.prUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition"
                          >
                            <FileCode className="w-3.5 h-3.5 text-slate-500" />
                            <span>GitHub</span>
                          </a>
                        )}
                        {proj.demoUrl && (
                          <a
                            href={proj.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold text-indigo-700 flex items-center gap-1 transition"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Demo</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(proj.id)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="Delete project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {proj.description}
                    </p>

                    <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap gap-1.5">
                        {proj.tags.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 text-[10px] font-medium border border-slate-200"
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {proj.metrics}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------
              SUB-TAB 5: WORK EXPERIENCE
             ---------------------------------------------------------- */}
          {activeSubTab === "experience" && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Work Experience
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verified employment contracts and track record.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddExperienceModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#4f46e5] text-white text-xs font-bold hover:bg-[#4338ca] transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Experience</span>
                </button>
              </div>

              <div className="space-y-6 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {workExperiences.map((exp) => (
                  <div key={exp.id} className="relative pl-9 space-y-2">
                    <div className="absolute left-1.5 top-1 w-4 h-4 rounded-full bg-white border-4 border-[#4f46e5]" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h3 className="font-bold text-sm sm:text-base text-slate-900">
                        {exp.role} · <span className="text-indigo-600">{exp.company}</span>
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-400">{exp.duration}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteExperience(exp.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete work experience"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">{exp.location}</div>
                    <ul className="space-y-1.5 pt-1 text-xs text-slate-600">
                      {exp.bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-indigo-600 font-bold">•</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------
              SUB-TAB 6: EDUCATION
             ---------------------------------------------------------- */}
          {activeSubTab === "education" && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Education & Degrees
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verified university academic background.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddEducationModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#4f46e5] text-white text-xs font-bold hover:bg-[#4338ca] transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Education</span>
                </button>
              </div>

              <div className="space-y-4">
                {educationList.map((edu) => (
                  <div
                    key={edu.id}
                    className="p-4 sm:p-5 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{edu.degree}</h3>
                        <p className="text-slate-600 font-medium mt-0.5">{edu.institution}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500 text-[11px]">{edu.year}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteEducation(edu.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete education record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="font-semibold text-emerald-700">{edu.gpa}</div>
                    <p className="text-slate-500">{edu.details}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------
              SUB-TAB 7: CERTIFICATIONS
             ---------------------------------------------------------- */}
          {activeSubTab === "certifications" && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Certifications & Licenses ({certificationsList.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Credentials validated with cryptographic issuer signatures.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddCertificationModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#4f46e5] text-white text-xs font-bold hover:bg-[#4338ca] transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Certification</span>
                </button>
              </div>

              <div className="space-y-3">
                {certificationsList.map((cert) => (
                  <div
                    key={cert.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-[#4f46e5] flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{cert.title}</span>
                          <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
                            ✓
                          </span>
                        </h3>
                        <p className="text-slate-500 mt-0.5">{cert.issuer} · {cert.issueDate}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <div className="font-mono text-[11px] text-slate-400 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                        ID: {cert.credentialId}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCertification(cert.id)}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Delete certification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------
              SUB-TAB 8: AVAILABILITY
             ---------------------------------------------------------- */}
          {activeSubTab === "availability" && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Work Availability & Working Hours
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Control your capacity and client contract matching status.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => showToast("Availability schedule updated.")}
                  className="px-4 py-2 rounded-xl bg-[#4f46e5] text-white text-xs font-bold hover:bg-[#4338ca] transition cursor-pointer"
                >
                  Save Schedule
                </button>
              </div>

              {/* Status Radio Pills */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Current Work Status</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([
                    { id: "Available", label: "Available for Work", desc: "Actively taking contracts", color: "emerald" },
                    { id: "Limited", label: "Limited Availability", desc: "Part-time only (<15 hrs)", color: "amber" },
                    { id: "Not Available", label: "Busy / Unavailable", desc: "Fully booked right now", color: "rose" },
                  ] as const).map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setAvailabilityStatus(st.id)}
                      className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                        availabilityStatus === st.id
                          ? "border-[#4f46e5] bg-indigo-50/60 ring-2 ring-indigo-100"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                        <span>{st.label}</span>
                        {availabilityStatus === st.id && (
                          <span className="w-2 h-2 rounded-full bg-[#4f46e5]" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">{st.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Capacity Slider */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Weekly Capacity</span>
                  <span className="font-mono text-indigo-700 font-extrabold text-sm">{weeklyHours} hrs / week</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Part-time (10 hrs)</span>
                  <span>Standard (35-40 hrs)</span>
                  <span>Full-time+ (50+ hrs)</span>
                </div>
              </div>

              {/* Overlap & Notice Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Primary Timezone Overlap</label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={timezoneOverlap}
                      onChange={(e) => setTimezoneOverlap(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 appearance-none focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs cursor-pointer"
                    >
                      <option value="US Eastern (EST) & European (CET)">US Eastern (EST) & European (CET)</option>
                      <option value="US Pacific (PST) & Eastern (EST)">US Pacific (PST) & Eastern (EST)</option>
                      <option value="European (GMT / CET) & India (IST)">European (GMT / CET) & India (IST)</option>
                      <option value="Asia-Pacific (AEST / SGT) & India (IST)">Asia-Pacific (AEST / SGT) & India (IST)</option>
                      <option value="Global / Flexible Overlap (24/7 Asynchronous)">Global / Flexible Overlap (24/7 Asynchronous)</option>
                      <option value="US Timezones Only (PST / MST / CST / EST)">US Timezones Only (PST / MST / CST / EST)</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Notice Period for New Milestones</label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={noticePeriod}
                      onChange={(e) => setNoticePeriod(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm text-slate-900 appearance-none focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition shadow-2xs cursor-pointer"
                    >
                      <option value="Immediate Start (Available now)">Immediate Start (Available now)</option>
                      <option value="24 – 48 Hours Notice">24 – 48 Hours Notice</option>
                      <option value="3 – 5 Days Notice">3 – 5 Days Notice</option>
                      <option value="1 – 2 Weeks Notice">1 – 2 Weeks Notice</option>
                      <option value="Flexible / Milestone Dependent">Flexible / Milestone Dependent</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------
              SUB-TAB 9: PREFERENCES
             ---------------------------------------------------------- */}
          {activeSubTab === "preferences" && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Contract & Account Preferences
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Safety rails and escrow requirements for prospective clients.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => showToast("Preferences updated.")}
                  className="px-4 py-2 rounded-xl bg-[#4f46e5] text-white text-xs font-bold hover:bg-[#4338ca] transition cursor-pointer"
                >
                  Save Preferences
                </button>
              </div>

              <div className="space-y-4">
                {/* Contract Structure Preference */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <label className="text-xs font-bold text-slate-700">Preferred Contract Structure</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {([
                      { id: "Fixed-Price Milestones", label: "Fixed Milestones" },
                      { id: "Hourly", label: "Hourly Retainer" },
                      { id: "All", label: "Both (Any)" },
                    ] as const).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPreferredContractType(opt.id)}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition cursor-pointer text-center ${
                          preferredContractType === opt.id
                            ? "bg-[#4f46e5] text-white border-[#4f46e5] shadow-2xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">Nexum will prioritize project recommendations that match this billing format.</p>
                </div>

                {/* Min Client Rating Requirement */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Minimum Client Rating Benchmark</label>
                    <span className="text-xs font-bold font-mono text-amber-600 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {minClientRating.toFixed(1)}+ Stars
                    </span>
                  </div>
                  <input
                    type="range"
                    min={3.5}
                    max={4.9}
                    step={0.1}
                    value={minClientRating}
                    onChange={(e) => setMinClientRating(parseFloat(e.target.value))}
                    className="w-full accent-[#4f46e5] cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-400">Auto-filter inbound client invitations below this threshold.</p>
                </div>

                {/* Escrow Rule */}
                <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/70 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={requireEscrowUpfront}
                    onChange={(e) => setRequireEscrowUpfront(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-[#4f46e5] rounded border-slate-300"
                  />
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#4f46e5]" />
                      <span>Strict PayPal Escrow Milestone Pre-Funding</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Never accept work start until client milestone deposit is cryptographically verified in escrow.
                    </p>
                  </div>
                </label>

                {/* Email Alerts */}
                <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/70 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-[#4f46e5] rounded border-slate-300"
                  />
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900">
                      Real-Time Proposal & Counteroffer Notifications
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Receive immediate webhook emails when clients shortlist, review, or release milestone funds.
                    </p>
                  </div>
                </label>

                {/* Public Indexing */}
                <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/70 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={publicIndexed}
                    onChange={(e) => setPublicIndexed(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-[#4f46e5] rounded border-slate-300"
                  />
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900">
                      Public Search Indexing & Nexum AI Matching
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Allow your verified profile to be matched with high-budget client briefs automatically.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================
            RIGHT COLUMN (~35% / 4 OF 12 COLS): PREVIEW & COMPLETION
           ============================================================ */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-6 lg:self-start">
          {/* Card 1: Public Profile Preview */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Public Profile Preview
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                This is how clients will see your profile on Nexum.
              </p>
            </div>

            {/* Preview Box Container */}
            <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-4 text-xs">
              {/* Avatar + Name + Title */}
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-xs shrink-0 ring-1 ring-slate-200">
                  <Image
                    src={avatarUrl}
                    alt={fullName}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm text-slate-900 truncate">
                      {fullName}
                    </h4>
                    <span className="w-4 h-4 rounded-full bg-[#4f46e5] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      ✓
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {headline}
                  </p>
                </div>
              </div>

              {/* Status & Location */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Available for work</span>
                </span>
                <span className="text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{location.split(",")[0] || "Bhubaneswar"}</span>
                </span>
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Local time 6:15 PM</span>
                </span>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-slate-200/60 text-center">
                <div>
                  <div className="font-extrabold text-sm text-slate-900 flex items-center justify-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>4.9</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">12 reviews</div>
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-900 font-mono">18</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Projects completed</div>
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-900 font-mono">250+</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Hours worked</div>
                </div>
              </div>

              {/* Bio Preview Snippet */}
              <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                {aboutMe}
              </p>

              {/* Skills Tags */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-700 block">Skills</span>
                <div className="flex flex-wrap gap-1.5">
                  {skillsList.slice(0, 10).map((s) => (
                    <span
                      key={s.name}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200/80 text-[10px] font-medium text-slate-700 shadow-2xs"
                    >
                      {s.name}
                    </span>
                  ))}
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-indigo-600 bg-indigo-50">
                    +3 more
                  </span>
                </div>
              </div>

              {/* View Full Profile Button */}
              <button
                type="button"
                onClick={() => setViewMode("public_preview")}
                className="w-full py-2.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs shadow-xs transition active:scale-98 cursor-pointer mt-2 flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Full Profile</span>
              </button>
            </div>
          </section>

          {/* Card 2: Profile Completion Progress */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Profile Completion
              </h3>
              <span className="text-sm font-extrabold text-[#4f46e5] font-mono">85%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-[#4f46e5] w-[85%] transition-all duration-500" />
            </div>

            {/* Checklist */}
            <div className="space-y-2 text-xs pt-1">
              {[
                { tabId: "basic", label: "Basic information", isDone: true },
                { tabId: "skills", label: "Skills (8/10)", isDone: true },
                { tabId: "portfolio", label: "Portfolio projects (3/3)", isDone: true },
                { tabId: "experience", label: "Work experience (2)", isDone: true },
                { tabId: "certifications", label: "Certifications (1/2)", isDone: false },
                { tabId: "availability", label: "Availability & preferences", isDone: true },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between p-1 rounded-lg hover:bg-slate-50 transition"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubTab(item.tabId as ProfileSubTabId);
                      showToast(`Navigated to ${item.label}`);
                    }}
                    className="flex items-center gap-2 cursor-pointer text-left"
                  >
                    {item.isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <span className={item.isDone ? "text-slate-800 font-medium hover:text-[#4f46e5]" : "text-slate-500"}>
                      {item.label}
                    </span>
                  </button>

                  {item.isDone ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      Complete
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSubTab("certifications");
                        showToast("Jumped to Certifications section.");
                      }}
                      className="text-[11px] font-bold text-[#4f46e5] hover:underline cursor-pointer"
                    >
                      + Add
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Lightbulb Standout Callout */}
            <div className="pt-2">
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
                <span className="text-base leading-none">💡</span>
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-amber-950">Make your profile stand out</div>
                  <p className="text-[11px] text-amber-900/80 leading-relaxed">
                    Add more portfolio projects and certifications to increase your chances of getting hired.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubTab("portfolio");
                      showToast("Jumped to Portfolio projects.");
                    }}
                    className="text-[11px] font-bold text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer pt-0.5"
                  >
                    <span>Improve Profile</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* ==============================================================
          5. ADD PORTFOLIO PROJECT MODAL
         ============================================================== */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add Portfolio Project</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showcase verifiable work deliverables to clients.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddProjectModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProjectSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Real-Time Analytics Dashboard & WebSocket Pipeline"
                  value={newProjTitle}
                  onChange={(e) => setNewProjTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Your Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Full-Stack Lead Architect"
                    value={newProjRole}
                    onChange={(e) => setNewProjRole(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Timeline</label>
                  <input
                    type="text"
                    placeholder="e.g. Sep 2026 – Oct 2026"
                    value={newProjTimeline}
                    onChange={(e) => setNewProjTimeline(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Project Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Summarize the core technical problem solved, architecture choices, and deliverables produced..."
                  value={newProjDescription}
                  onChange={(e) => setNewProjDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">GitHub Repository / PR Link</label>
                  <input
                    type="url"
                    placeholder="https://github.com/org/repo"
                    value={newProjGithubUrl}
                    onChange={(e) => setNewProjGithubUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Demo / Walkthrough Video URL</label>
                  <input
                    type="url"
                    placeholder="https://loom.com/share/..."
                    value={newProjDemoUrl}
                    onChange={(e) => setNewProjDemoUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tech Stack Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="React 19, TypeScript, Next.js, Node.js"
                  value={newProjTags}
                  onChange={(e) => setNewProjTags(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Key Metric / Benchmark Pill</label>
                <input
                  type="text"
                  placeholder="e.g. 10k users/day · Sub-50ms latency"
                  value={newProjMetrics}
                  onChange={(e) => setNewProjMetrics(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold shadow-xs cursor-pointer"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          6. ADD EDUCATION MODAL
         ============================================================== */}
      {showAddEducationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add Academic Credential</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add university degrees and academic honors.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddEducationModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEducationSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Degree & Specialization *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master of Science in Distributed Systems"
                  value={newEduDegree}
                  onChange={(e) => setNewEduDegree(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Institution / University *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. University of California, Berkeley"
                  value={newEduInstitution}
                  onChange={(e) => setNewEduInstitution(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Years Attended</label>
                  <input
                    type="text"
                    placeholder="e.g. 2022 – 2024"
                    value={newEduYear}
                    onChange={(e) => setNewEduYear(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Grade / Honors</label>
                  <input
                    type="text"
                    placeholder="e.g. 3.9 / 4.0 (Magna Cum Laude)"
                    value={newEduGpa}
                    onChange={(e) => setNewEduGpa(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Specialization & Coursework Details</label>
                <textarea
                  rows={3}
                  placeholder="Focus areas such as Cryptography, Consensus Algorithms, Cloud Infrastructure, etc."
                  value={newEduDetails}
                  onChange={(e) => setNewEduDetails(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddEducationModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold shadow-xs cursor-pointer"
                >
                  Save Education
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          7. ADD CERTIFICATION MODAL
         ============================================================== */}
      {showAddCertificationModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add Professional Certification</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify specialized technical licenses and credentials.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCertificationModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCertificationSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Certification Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google Cloud Professional Cloud Architect"
                  value={newCertTitle}
                  onChange={(e) => setNewCertTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Issuing Organization *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google Cloud / Coursera"
                  value={newCertIssuer}
                  onChange={(e) => setNewCertIssuer(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Issue Date & Expiration</label>
                  <input
                    type="text"
                    placeholder="e.g. Oct 2026 · Expires Oct 2029"
                    value={newCertIssueDate}
                    onChange={(e) => setNewCertIssueDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Credential ID / Hash</label>
                  <input
                    type="text"
                    placeholder="e.g. GCP-PCA-77891"
                    value={newCertCredentialId}
                    onChange={(e) => setNewCertCredentialId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Nexum automatically checks cryptographic issuer signatures upon save.</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCertificationModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold shadow-xs cursor-pointer"
                >
                  Save Certification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          8. ADD EXPERIENCE MODAL
         ============================================================== */}
      {showAddExperienceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add Work Experience</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record past employment or high-scale freelance contracts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddExperienceModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExperienceSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Role / Position Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Distributed Systems Engineer"
                  value={newExpRole}
                  onChange={(e) => setNewExpRole(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Company / Organization *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CloudScale Technologies"
                  value={newExpCompany}
                  onChange={(e) => setNewExpCompany(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Remote / New York, NY"
                    value={newExpLocation}
                    onChange={(e) => setNewExpLocation(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. Jan 2024 – Present"
                    value={newExpDuration}
                    onChange={(e) => setNewExpDuration(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Key Achievements (One bullet per line)</label>
                <textarea
                  rows={4}
                  placeholder="Built microservices architecture supporting 50k daily active users...&#10;Integrated bilateral cryptographic consensus ledger for automated dispute resolution...&#10;Reduced latency by 45% through Redis caching..."
                  value={newExpBullets}
                  onChange={(e) => setNewExpBullets(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 resize-none font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddExperienceModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold shadow-xs cursor-pointer"
                >
                  Save Experience
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
