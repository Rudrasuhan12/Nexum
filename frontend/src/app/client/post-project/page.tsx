"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Plus,
  Trash2,
  DollarSign,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Check,
  Edit2,
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopHeader from "@/components/DashboardTopHeader";
import { useAuth } from "@/context/AuthContext";

const PROJECT_CATEGORIES: Record<string, string[]> = {
  "Web Development": ["Full Stack Development", "Frontend / Next.js", "Backend & APIs", "E-Commerce"],
  "AI / Machine Learning": ["LLM & Agent Workflows", "Computer Vision", "NLP & Semantic Search", "Fine-tuning"],
  "Blockchain / Web3": ["Smart Contracts", "DeFi Protocols", "Web3 Ingestion", "Solidity Audits"],
  "Mobile Development": ["React Native", "iOS / Swift", "Android / Kotlin", "Flutter"],
  "UI/UX Design": ["Design Systems", "Figma Prototyping", "User Research", "Wireframing"],
  "DevOps / Cloud": ["Kubernetes", "AWS & GCP Architecture", "CI/CD Pipelines", "Docker"],
};

const SUGGESTED_SKILLS = [
  "React",
  "Next.js",
  "Node.js",
  "TypeScript",
  "PostgreSQL",
  "Python",
  "FastAPI",
  "AI/ML",
  "Data Visualization",
  "Docker",
  "Redis",
];

const MATCHING_FREELANCERS_PREVIEW = [
  {
    name: "Priya Sharma",
    role: "Full-Stack & Design Systems",
    rating: "4.9",
    skills: ["Next.js", "React", "AI/ML"],
    rate: "$55/hr",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&q=80",
  },
  {
    name: "Rohan Verma",
    role: "Payment Rails & Backend",
    rating: "5.0",
    skills: ["Node.js", "PostgreSQL", "Next.js"],
    rate: "$65/hr",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80",
  },
  {
    name: "Marcus Chen",
    role: "Cloud Reliability & DevOps",
    rating: "4.9",
    skills: ["Docker", "Kubernetes", "AWS"],
    rate: "$75/hr",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&q=80",
  },
  {
    name: "Elena Rostova",
    role: "AI Architecture & LLMs",
    rating: "5.0",
    skills: ["Python", "FastAPI", "pgvector"],
    rate: "$80/hr",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80",
  },
];

export default function PostNewProjectPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Wizard Step: 1: Details, 2: Requirements, 3: Budget & Timeline, 4: Preferences, 5: Review & Publish
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Project Details
  const [title, setTitle] = useState("AI-Powered Educational Analytics Dashboard");
  const [category, setCategory] = useState("Web Development");
  const [subcategory, setSubcategory] = useState("Full Stack Development");
  const [overview, setOverview] = useState(
    "We need a full stack developer to build an AI-powered educational analytics dashboard for our platform.\n\nThe system will analyze student performance data, generate insights using AI, and provide interactive dashboards for administrators and teachers."
  );
  const [keyGoals, setKeyGoals] = useState<string[]>(["Build a new product", "Integrate AI/ML"]);
  const [otherGoal, setOtherGoal] = useState("Educator and student analytics platform");

  // Step 2: Requirements & Scope
  const [requiredSkills, setRequiredSkills] = useState<string[]>([
    "React",
    "Next.js",
    "Node.js",
    "TypeScript",
    "PostgreSQL",
  ]);
  const [detailedRequirements, setDetailedRequirements] = useState(
    "• Develop a responsive web application using Next.js and TypeScript\n• Build backend APIs using Node.js and PostgreSQL\n• Integrate AI/ML models for student performance analysis\n• Create interactive dashboards with charts and reports\n• Implement role-based access (admin, teacher, student)\n• Deploy on cloud (Vercel/AWS) with proper CI/CD"
  );
  const [scopeOfWork, setScopeOfWork] = useState<string[]>([
    "Frontend development",
    "Backend development",
    "Database design",
    "AI/ML integration",
    "Dashboard and reports",
    "Testing and deployment",
  ]);

  // Step 3: Budget & Milestones
  const [budgetType, setBudgetType] = useState<"FIXED" | "HOURLY">("FIXED");
  const [budgetAmount, setBudgetAmount] = useState("3500");
  const [timelineDuration, setTimelineDuration] = useState("2 - 3 months");
  const [milestones, setMilestones] = useState([
    { title: "Project Architecture & DB Schema", amount: "1000", days: "14" },
    { title: "Core Dashboard & AI Integration APIs", amount: "1500", days: "30" },
    { title: "Final QA, Testing & Cloud Deployment", amount: "1000", days: "15" },
  ]);

  // Step 4: Hiring Preferences
  const [experienceLevel, setExperienceLevel] = useState<"ENTRY" | "INTERMEDIATE" | "EXPERT">("EXPERT");
  const [englishLevel, setEnglishLevel] = useState<"CONVERSATIONAL" | "FLUENT" | "NATIVE">("FLUENT");
  const [proposalsLimit, setProposalsLimit] = useState<"10_15" | "15_30" | "OPEN">("15_30");
  const [visibility, setVisibility] = useState<"PUBLIC" | "INVITE_ONLY">("PUBLIC");

  // Toast / Publishing State
  const [isPublishing, setIsPublishing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const addSkill = (skill: string) => {
    if (!requiredSkills.includes(skill)) {
      setRequiredSkills([...requiredSkills, skill]);
    }
  };

  const removeSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter((s) => s !== skill));
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    showToast("Generating Dual SHA-256 agreement spec and publishing scope...");

    // Simulate backend / consensus save
    await new Promise((res) => setTimeout(res, 800));
    setIsPublishing(false);
    showToast("Project posted successfully! Redirecting to your projects list...");
    setTimeout(() => {
      router.push("/client/dashboard?tab=projects");
    }, 1000);
  };

  const handleSaveDraft = () => {
    showToast("Draft saved to your workspace.");
    setTimeout(() => {
      router.push("/client/dashboard?tab=projects");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans selection:bg-[#4f46e5] selection:text-white">
      {/* 1. Left Navbar Sidebar */}
      <DashboardSidebar
        currentRole="CLIENT"
        activeTab="projects"
        onTabChange={(tab) => router.push(`/client/dashboard?tab=${tab}`)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopHeader />

        <main className="flex-1 px-4 sm:px-8 py-6 max-w-7xl w-full mx-auto space-y-6">
          
          {/* Top Breadcrumb & Header Action Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <Link
                href="/client/dashboard?tab=projects"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#4f46e5] transition group mb-1"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Projects</span>
              </Link>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-heading">
                Post a New Project
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Describe your project, set your preferences, and get matched with verified talent.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs"
              >
                Save as Draft
              </button>

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.min(prev + 1, 5))}
                  className="px-5 py-2 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold shadow-xs hover:shadow-indigo-500/25 transition cursor-pointer flex items-center gap-1.5 active:scale-98"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="px-5 py-2 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold shadow-xs hover:shadow-indigo-500/25 transition cursor-pointer flex items-center gap-2 active:scale-98 disabled:opacity-50"
                >
                  <span>{isPublishing ? "Publishing..." : "Publish Project"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* ==============================================================
              INTERACTIVE 5-STEP STEPPER BAR
             ============================================================== */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              {[
                { step: 1, title: "Project Details", sub: "Basic information" },
                { step: 2, title: "Requirements", sub: "Skills and scope" },
                { step: 3, title: "Budget & Timeline", sub: "Budget and milestones" },
                { step: 4, title: "Preferences", sub: "Hiring preferences" },
                { step: 5, title: "Review & Publish", sub: "Final review" },
              ].map((s) => {
                const isActive = currentStep === s.step;
                const isPast = currentStep > s.step;
                return (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setCurrentStep(s.step)}
                    className="flex items-center gap-3 text-left group cursor-pointer"
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                        isActive
                          ? "bg-[#4f46e5] text-white ring-4 ring-[#4f46e5]/15"
                          : isPast
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                      }`}
                    >
                      {isPast ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.step}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-bold truncate ${
                          isActive ? "text-[#4f46e5]" : "text-slate-800"
                        }`}
                      >
                        {s.title}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{s.sub}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ==============================================================
              2-COLUMN WIZARD LAYOUT:
              LEFT (8 COLS): Current Active Step Form
              RIGHT (4 COLS): Contextual AI & Live Step Insights
             ============================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ============================================================
                LEFT COLUMN: 8 COLS (DYNAMIC WIZARD STEP VIEW)
               ============================================================ */}
            <div className="lg:col-span-8 space-y-6">

              {/* ----------------------------------------------------------
                  STEP 1: PROJECT DETAILS
                 ---------------------------------------------------------- */}
              {currentStep === 1 && (
                <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-5 animate-in fade-in duration-150">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <div className="w-7 h-7 rounded-full bg-[#4f46e5] text-white flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 leading-tight">
                        Project Details
                      </h2>
                      <p className="text-xs text-slate-500">
                        Give a clear and specific overview of your project.
                      </p>
                    </div>
                  </div>

                  {/* Project Title */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700">Project Title *</label>
                      <span className="text-[10.5px] font-mono text-slate-400">{title.length}/100</span>
                    </div>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={100}
                      placeholder="e.g. AI-Powered Educational Analytics Dashboard"
                      required
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/15 focus:border-[#4f46e5] transition"
                    />
                  </div>

                  {/* Category & Subcategory Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Project Category *
                      </label>
                      <select
                        value={category}
                        onChange={(e) => {
                          const newCat = e.target.value;
                          setCategory(newCat);
                          if (PROJECT_CATEGORIES[newCat]?.length) {
                            setSubcategory(PROJECT_CATEGORIES[newCat][0]);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:border-[#4f46e5] cursor-pointer"
                      >
                        {Object.keys(PROJECT_CATEGORIES).map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Subcategory *
                      </label>
                      <select
                        value={subcategory}
                        onChange={(e) => setSubcategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:border-[#4f46e5] cursor-pointer"
                      >
                        {(PROJECT_CATEGORIES[category] || []).map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Project Overview */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700">Project Overview *</label>
                      <span className="text-[10.5px] font-mono text-slate-400">{overview.length}/2000</span>
                    </div>
                    <textarea
                      rows={5}
                      value={overview}
                      onChange={(e) => setOverview(e.target.value)}
                      maxLength={2000}
                      placeholder="Describe the problem you are solving, core user workflows, and target outcomes..."
                      required
                      className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/15 focus:border-[#4f46e5] transition leading-relaxed"
                    />
                  </div>

                  {/* Key Goals */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Key Goals <span className="text-slate-400 font-normal">(Select up to 3)</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        "Build a new product",
                        "Integrate AI/ML",
                        "Improve existing system",
                        "Fix issues / maintenance",
                      ].map((goal) => {
                        const isSelected = keyGoals.includes(goal);
                        return (
                          <button
                            key={goal}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setKeyGoals(keyGoals.filter((g) => g !== goal));
                              } else if (keyGoals.length < 3) {
                                setKeyGoals([...keyGoals, goal]);
                              }
                            }}
                            className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2.5 text-left transition cursor-pointer ${
                              isSelected
                                ? "bg-[#eef2ff] border-[#4f46e5] text-[#4f46e5] shadow-xs"
                                : "bg-slate-50/70 border-slate-200 hover:bg-slate-100 text-slate-700"
                            }`}
                          >
                            <div
                              className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                                isSelected ? "bg-[#4f46e5] border-[#4f46e5] text-white" : "border-slate-300"
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <span className="truncate">{goal}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-semibold shrink-0">Other:</span>
                      <input
                        type="text"
                        value={otherGoal}
                        onChange={(e) => setOtherGoal(e.target.value)}
                        placeholder="Specify custom goal..."
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-[#4f46e5]"
                      />
                    </div>
                  </div>

                  {/* Step 1 Footer Action Navigation */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Save draft & exit
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-98"
                    >
                      <span>Next: Requirements & Scope</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------
                  STEP 2: REQUIREMENTS & SCOPE
                 ---------------------------------------------------------- */}
              {currentStep === 2 && (
                <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-5 animate-in fade-in duration-150">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <div className="w-7 h-7 rounded-full bg-[#4f46e5] text-white flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 leading-tight">
                        Requirements & Scope
                      </h2>
                      <p className="text-xs text-slate-500">
                        Specify what you need and the exact skills required.
                      </p>
                    </div>
                  </div>

                  {/* Required Skills Tag List */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Required Skills *
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 min-h-[48px] items-center">
                      {requiredSkills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#eef2ff] border border-[#4f46e5]/20 text-[#4f46e5] text-xs font-semibold"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="hover:text-rose-600 font-bold ml-0.5 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Suggested Skills */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[11px] font-bold text-slate-500 mr-1">Suggested:</span>
                      {SUGGESTED_SKILLS.filter((s) => !requiredSkills.includes(s)).map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => addSkill(skill)}
                          className="text-[10.5px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                        >
                          + {skill}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setRequiredSkills([...new Set([...requiredSkills, ...SUGGESTED_SKILLS])])}
                        className="text-[10.5px] font-bold text-[#4f46e5] hover:underline ml-1 cursor-pointer"
                      >
                        + Add All
                      </button>
                    </div>
                  </div>

                  {/* Detailed Requirements & Scope of Work Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    <div className="md:col-span-8 space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Detailed Requirements *</label>
                      <textarea
                        rows={7}
                        value={detailedRequirements}
                        onChange={(e) => setDetailedRequirements(e.target.value)}
                        className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/15 focus:border-[#4f46e5] transition leading-relaxed"
                      />
                    </div>

                    {/* Scope of Work Checkboxes */}
                    <div className="md:col-span-4 space-y-2">
                      <label className="text-xs font-bold text-slate-700">Scope of Work</label>
                      <div className="space-y-1.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                        {[
                          "Frontend development",
                          "Backend development",
                          "Database design",
                          "AI/ML integration",
                          "Dashboard and reports",
                          "Testing and deployment",
                        ].map((item) => {
                          const isChecked = scopeOfWork.includes(item);
                          return (
                            <label
                              key={item}
                              className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() =>
                                  setScopeOfWork((prev) =>
                                    prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
                                  )
                                }
                                className="w-3.5 h-3.5 rounded border-slate-300 accent-[#4f46e5]"
                              />
                              <span className="truncate">{item}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Step 2 Footer Navigation */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Project Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-98"
                    >
                      <span>Next: Budget & Timeline</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------
                  STEP 3: BUDGET & TIMELINE
                 ---------------------------------------------------------- */}
              {currentStep === 3 && (
                <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-5 animate-in fade-in duration-150">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <div className="w-7 h-7 rounded-full bg-[#4f46e5] text-white flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 leading-tight">
                        Budget & Milestones Breakdown
                      </h2>
                      <p className="text-xs text-slate-500">
                        Set funding milestones to protect deliverable verification with PayPal escrow.
                      </p>
                    </div>
                  </div>

                  {/* Budget Type Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Budget Type</label>
                    <div className="grid grid-cols-2 gap-3 max-w-md">
                      <button
                        type="button"
                        onClick={() => setBudgetType("FIXED")}
                        className={`p-3 rounded-xl border text-xs font-bold text-left transition cursor-pointer flex items-center gap-2 ${
                          budgetType === "FIXED"
                            ? "bg-[#eef2ff] border-[#4f46e5] text-[#4f46e5]"
                            : "bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            budgetType === "FIXED" ? "border-[#4f46e5] bg-[#4f46e5]" : "border-slate-300"
                          }`}
                        >
                          {budgetType === "FIXED" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <div>Fixed Price</div>
                          <div className="text-[10px] text-slate-500 font-normal">Milestone-based release</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBudgetType("HOURLY")}
                        className={`p-3 rounded-xl border text-xs font-bold text-left transition cursor-pointer flex items-center gap-2 ${
                          budgetType === "HOURLY"
                            ? "bg-[#eef2ff] border-[#4f46e5] text-[#4f46e5]"
                            : "bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            budgetType === "HOURLY" ? "border-[#4f46e5] bg-[#4f46e5]" : "border-slate-300"
                          }`}
                        >
                          {budgetType === "HOURLY" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <div>Hourly Rate</div>
                          <div className="text-[10px] text-slate-500 font-normal">Tracked sprint intervals</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Total Budget & Timeline Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Estimated Budget (USD) *
                      </label>
                      <div className="relative flex items-center">
                        <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                        <input
                          type="number"
                          value={budgetAmount}
                          onChange={(e) => setBudgetAmount(e.target.value)}
                          placeholder="3500"
                          className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-[#4f46e5]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Expected Timeline *
                      </label>
                      <div className="relative flex items-center">
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                        <input
                          type="text"
                          value={timelineDuration}
                          onChange={(e) => setTimelineDuration(e.target.value)}
                          placeholder="e.g. 2 - 3 months"
                          className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#4f46e5]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Milestone Breakdown Table */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Milestone Schedule Breakdown</span>
                      <button
                        type="button"
                        onClick={() =>
                          setMilestones([
                            ...milestones,
                            { title: `Milestone ${milestones.length + 1}`, amount: "1000", days: "14" },
                          ])
                        }
                        className="text-xs font-bold text-[#4f46e5] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Milestone</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {milestones.map((ms, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="w-5 h-5 rounded-full bg-slate-200 font-bold text-[10px] text-slate-700 flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <input
                              type="text"
                              value={ms.title}
                              onChange={(e) => {
                                const updated = [...milestones];
                                updated[idx].title = e.target.value;
                                setMilestones(updated);
                              }}
                              className="w-full bg-transparent font-semibold text-slate-900 focus:outline-none focus:border-b border-[#4f46e5]"
                            />
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400 font-mono">$</span>
                              <input
                                type="number"
                                value={ms.amount}
                                onChange={(e) => {
                                  const updated = [...milestones];
                                  updated[idx].amount = e.target.value;
                                  setMilestones(updated);
                                }}
                                className="w-20 px-2 py-1 bg-white border border-slate-200 rounded font-mono font-bold text-slate-900"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={ms.days}
                                onChange={(e) => {
                                  const updated = [...milestones];
                                  updated[idx].days = e.target.value;
                                  setMilestones(updated);
                                }}
                                className="w-14 px-2 py-1 bg-white border border-slate-200 rounded font-mono text-slate-900"
                              />
                              <span className="text-slate-400 text-[11px]">days</span>
                            </div>

                            {milestones.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setMilestones(milestones.filter((_, i) => i !== idx))}
                                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Step 3 Footer Navigation */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Requirements</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-98"
                    >
                      <span>Next: Hiring Preferences</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------
                  STEP 4: HIRING PREFERENCES
                 ---------------------------------------------------------- */}
              {currentStep === 4 && (
                <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-5 animate-in fade-in duration-150">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <div className="w-7 h-7 rounded-full bg-[#4f46e5] text-white flex items-center justify-center font-bold text-xs">
                      4
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 leading-tight">
                        Hiring Preferences
                      </h2>
                      <p className="text-xs text-slate-500">
                        Set talent seniority, language fluency, and discovery privacy.
                      </p>
                    </div>
                  </div>

                  {/* Experience Level */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Experience Level Required
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: "ENTRY", label: "Junior / Entry", desc: "1-2 years experience" },
                        { id: "INTERMEDIATE", label: "Intermediate", desc: "3-5 years experience" },
                        { id: "EXPERT", label: "Expert / Senior", desc: "6+ years experience" },
                      ].map((lvl) => (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => setExperienceLevel(lvl.id as "ENTRY" | "INTERMEDIATE" | "EXPERT")}
                          className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                            experienceLevel === lvl.id
                              ? "bg-[#eef2ff] border-[#4f46e5] text-[#4f46e5] shadow-xs"
                              : "bg-slate-50/70 border-slate-200 hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          <div className="font-bold text-xs">{lvl.label}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{lvl.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* English Fluency */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      English Language Proficiency
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: "CONVERSATIONAL", label: "Conversational", desc: "Basic technical chat" },
                        { id: "FLUENT", label: "Fluent (Recommended)", desc: "Clear architectural sync" },
                        { id: "NATIVE", label: "Native / Bilingual", desc: "Flawless written & spoken" },
                      ].map((eng) => (
                        <button
                          key={eng.id}
                          type="button"
                          onClick={() => setEnglishLevel(eng.id as "CONVERSATIONAL" | "FLUENT" | "NATIVE")}
                          className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                            englishLevel === eng.id
                              ? "bg-[#eef2ff] border-[#4f46e5] text-[#4f46e5] shadow-xs"
                              : "bg-slate-50/70 border-slate-200 hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          <div className="font-bold text-xs">{eng.label}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{eng.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Proposal Cap & Visibility */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Proposals Expected
                      </label>
                      <select
                        value={proposalsLimit}
                        onChange={(e) => setProposalsLimit(e.target.value as "10_15" | "15_30" | "OPEN")}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:border-[#4f46e5] cursor-pointer"
                      >
                        <option value="10_15">10 - 15 Proposals</option>
                        <option value="15_30">15 - 30 Proposals (Recommended)</option>
                        <option value="OPEN">Open (Unlimited)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Project Visibility
                      </label>
                      <select
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "INVITE_ONLY")}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:border-[#4f46e5] cursor-pointer"
                      >
                        <option value="PUBLIC">Public (All verified freelancers)</option>
                        <option value="INVITE_ONLY">Invite Only (Private brief)</option>
                      </select>
                    </div>
                  </div>

                  {/* Step 4 Footer Navigation */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Budget & Timeline</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(5)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-98"
                    >
                      <span>Next: Review & Publish</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------
                  STEP 5: REVIEW & PUBLISH
                 ---------------------------------------------------------- */}
              {currentStep === 5 && (
                <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-6 animate-in fade-in duration-150">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                      ✓
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 leading-tight">
                        Review Project & Agreement Seal
                      </h2>
                      <p className="text-xs text-slate-500">
                        Review all details before publishing to verified contractors.
                      </p>
                    </div>
                  </div>

                  {/* Section A: Title & Overview Summary */}
                  <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Project Overview
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-xs font-bold text-[#4f46e5] hover:underline flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                      {overview}
                    </p>
                    <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700">{category}</span>
                      <span>•</span>
                      <span>{subcategory}</span>
                    </div>
                  </div>

                  {/* Section B: Skills & Scope Summary */}
                  <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Skills & Scope
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="text-xs font-bold text-[#4f46e5] hover:underline flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {requiredSkills.map((sk) => (
                        <span
                          key={sk}
                          className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Section C: Budget & Milestones Schedule */}
                  <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Funding & Milestones ({milestones.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="text-xs font-bold text-[#4f46e5] hover:underline flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {milestones.map((ms, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                              {i + 1}
                            </span>
                            <span className="font-semibold text-slate-900">{ms.title}</span>
                          </div>
                          <div className="font-mono font-bold text-slate-900">
                            ${ms.amount}.00 USD ({ms.days}d)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Consensus Security Guarantee Banner */}
                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold text-slate-900">
                        Cryptographically Sealed Agreement
                      </div>
                      <p className="text-slate-600 leading-relaxed text-[11px]">
                        Publishing locks your project scope under a canonical SHA-256 state seal. No unilateral changes can be made without bilateral sign-off (Section 14).
                      </p>
                    </div>
                  </div>

                  {/* Step 5 Footer Actions */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Preferences</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={isPublishing}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold transition shadow-md cursor-pointer active:scale-98 disabled:opacity-50"
                    >
                      <span>{isPublishing ? "Publishing Project..." : "Publish Project & Find Freelancers"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* ============================================================
                RIGHT COLUMN: 4 COLS (CONTEXT-AWARE PER-STEP INSIGHTS)
               ============================================================ */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* Contextual Card 1: AI Assistant (Customized for Steps 1 & 2) */}
              {(currentStep === 1 || currentStep === 2) && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#f8f9ff] via-[#f1f4ff] to-[#eef2ff] border border-[#4f46e5]/20 shadow-xs space-y-3.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#4f46e5] text-white flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-slate-900">Nexum AI Assistant</h3>
                      <span className="font-mono text-[9px] uppercase px-1.5 py-0.2 bg-[#4f46e5] text-white rounded font-bold">
                        Beta
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {currentStep === 1
                      ? "I can analyze your project title and overview to enhance scope clarity and attract senior contractors."
                      : "Recommended skills based on your project title and chosen subcategory."}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setOverview(
                          `${overview}\n\nTechnical Architecture & Standards:\n• Sub-200ms latency for analytics queries\n• Role-based access control with secure JWT/OAuth sessions\n• PostgreSQL database with row-level security`
                        );
                        showToast("Overview enriched with technical benchmarks!");
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-[#4f46e5] text-[#4f46e5] font-bold text-[11px] shadow-2xs transition cursor-pointer text-center"
                    >
                      ✨ Improve Overview
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        addSkill("Data Visualization");
                        addSkill("Docker");
                        addSkill("Redis");
                        showToast("Added top AI-recommended skills!");
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-[#4f46e5] text-[#4f46e5] font-bold text-[11px] shadow-2xs transition cursor-pointer text-center"
                    >
                      💡 Suggest Skills
                    </button>
                  </div>

                  {/* Recommended Skills Pills */}
                  <div className="pt-2 border-t border-[#4f46e5]/10">
                    <span className="text-[10.5px] font-bold text-slate-500 block mb-1.5">
                      Recommended Skills to Add
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {["Data Visualization", "Machine Learning", "AWS", "Docker", "Redis"].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => addSkill(s)}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-[#4f46e5] text-slate-700 transition cursor-pointer"
                        >
                          + {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Contextual Card 2: Matching Talent Preview (Shown on Step 2 & 4) */}
              {(currentStep === 2 || currentStep === 4) && (
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Matching Freelancers</h3>
                      <p className="text-[10.5px] text-slate-400">120+ verified candidates found</p>
                    </div>
                    <Link
                      href="/client/freelancers"
                      className="text-[11px] font-bold text-[#4f46e5] hover:underline"
                    >
                      View All
                    </Link>
                  </div>

                  <div className="space-y-2.5">
                    {MATCHING_FREELANCERS_PREVIEW.map((freelancer) => (
                      <div
                        key={freelancer.name}
                        className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex items-center justify-between gap-2.5 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-200">
                            <Image
                              src={freelancer.avatar}
                              alt={freelancer.name}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {freelancer.name}
                            </p>
                            <p className="text-[10.5px] text-slate-500 truncate">
                              ★ {freelancer.rating} · {freelancer.rate}
                            </p>
                          </div>
                        </div>

                        <Link
                          href="/client/freelancers"
                          className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[#4f46e5] font-bold text-[10px] shrink-0 hover:bg-[#eef2ff]"
                        >
                          Profile
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contextual Card 3: Escrow & Budget Protection (Shown on Step 3) */}
              {currentStep === 3 && (
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-xs font-bold text-slate-900">PayPal Escrow Protection</h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Milestone funding is pre-authorized in PayPal Sandbox Escrow. Your capital is never released until you verify and accept the deliverable test reports.
                  </p>

                  <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Market Avg. for {category}:</span>
                      <span className="font-bold text-slate-900 font-mono">$45 - $75 / hr</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Typical Fixed Scope:</span>
                      <span className="font-bold text-slate-900 font-mono">$3,000 - $6,500</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Contextual Card 4: Consensus Pre-Check (Shown on Step 5) */}
              {currentStep === 5 && (
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 animate-in fade-in duration-200">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Consensus Ready Checklist
                  </h3>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Project Details Validated</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{requiredSkills.length} Skills & Scope Defined</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{milestones.length} Milestones Scheduled</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>SHA-256 Spec Hash Prepared</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Live Project Summary Card (Always Visible & Updating in Real-Time) */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-900">Live Project Summary</h3>
                  <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-[#eef2ff] text-[#4f46e5]">
                    Step {currentStep} of 5
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-slate-400">Title:</span>
                    <span className="font-semibold text-slate-900 text-right truncate max-w-[180px]">
                      {title}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <span className="text-slate-400">Category:</span>
                    <span className="font-semibold text-slate-900 text-right">
                      {category}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <span className="text-slate-400">Skills:</span>
                    <span className="font-semibold text-slate-900 text-right truncate max-w-[180px]">
                      {requiredSkills.slice(0, 3).join(", ")}
                      {requiredSkills.length > 3 && ` (+${requiredSkills.length - 3})`}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <span className="text-slate-400">Budget:</span>
                    <span className="font-mono font-bold text-slate-900 text-right">
                      ${budgetAmount}.00 USD ({budgetType === "FIXED" ? "Fixed" : "Hourly"})
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <span className="text-slate-400">Timeline:</span>
                    <span className="font-semibold text-slate-900 text-right">{timelineDuration}</span>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <span className="text-slate-400">Milestones:</span>
                    <span className="font-semibold text-slate-900 text-right">
                      {milestones.length} Milestones
                    </span>
                  </div>
                </div>

                {/* AI Tip Callout Box */}
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 flex items-start gap-2 pt-2.5">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Tip from Nexum AI:</strong> Projects with detailed requirements and verified milestone acceptance criteria receive 3x more proposals from top 1% talent.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </main>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-xs font-semibold shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 border border-slate-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
