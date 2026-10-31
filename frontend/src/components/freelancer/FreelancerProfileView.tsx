"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  User,
  DollarSign,
  Clock,
  CheckCircle2,
  ExternalLink,
  Download,
  Briefcase,
  GraduationCap,
  Sparkles,
  Eye,
  FileCode,
  Video,
} from "lucide-react";
import { DemoUser } from "@/lib/auth-types";

interface FreelancerProfileViewProps {
  freelancer: DemoUser;
  showToast: (msg: string) => void;
}

export default function FreelancerProfileView({
  freelancer,
  showToast,
}: FreelancerProfileViewProps) {
  const [isAvailable, setIsAvailable] = useState(true);
  const [showPublicPreview, setShowPublicPreview] = useState(false);

  const skills = [
    { name: "TypeScript", level: "Expert · 5+ yrs" },
    { name: "Next.js & React 19", level: "Expert · 5+ yrs" },
    { name: "PayPal REST v2 APIs", level: "Specialist · 3 yrs" },
    { name: "Dual SHA-256 State Consensus", level: "Specialist" },
    { name: "Node.js & Express", level: "Advanced · 4 yrs" },
    { name: "Tailwind CSS & SaaS UI", level: "Expert" },
    { name: "PostgreSQL & Prisma", level: "Advanced · 3 yrs" },
    { name: "Solana Pay / Smart Escrow", level: "Intermediate" },
  ];

  const portfolioProjects = [
    {
      title: "Bilateral E-Commerce Payment Rails & Webhook Ingestion Engine",
      role: "Lead Systems Architect",
      timeline: "Oct 2026 – Present (In Development)",
      description:
        "High-reliability payment webhook ingestion pipeline integrating PayPal REST Orders v2 with automated signature verification, 30s idempotency caching, and failover self-recovery.",
      prUrl: "https://github.com/proofloop/gateway/pull/42",
      demoUrl: "https://www.loom.com/share/proofloop-milestone2-demo",
      tags: ["TypeScript", "PayPal REST v2", "Next.js", "Jest"],
    },
    {
      title: "Nexum Dual SHA-256 Consensus Freelance Escrow Gateway",
      role: "Core Developer",
      timeline: "Aug 2026 – Oct 2026",
      description:
        "Engineered bilateral cryptographic state consensus ensuring milestone funds can only be released upon mutual digital signatures between buyer and seller.",
      tags: ["Cryptography", "SHA-256", "State Machines", "Security"],
    },
    {
      title: "Multi-Tenant PDF Invoice & Billing Generation Cluster",
      role: "Backend Engineer",
      timeline: "Jun 2026 – Aug 2026",
      description:
        "Developed a concurrency-managed headless Chrome pool rendering 5,000+ invoices/hour with zero memory leaks and S3 presigned asset distribution.",
      tags: ["Puppeteer", "Docker", "Node.js", "AWS S3"],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Profile Header Banner */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-slate-200 shadow-xs shrink-0">
              <Image
                src={freelancer.avatar}
                alt={freelancer.name}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {freelancer.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200">
                  {freelancer.companyOrHandle || "@sambit_dev"}
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Level 3 Verified</span>
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 mb-2 font-medium">
                {freelancer.title || "Senior Full Stack & Escrow Systems Engineer"} · Bangalore, India (UTC+5:30)
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-indigo-700 font-bold">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>$65.00 USD/hr</span>
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-600">Fixed-price milestones from $1,000 USD</span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>35 hrs/wk Available</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap lg:flex-col items-start lg:items-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsAvailable((prev) => !prev);
                showToast(`Availability set to: ${!isAvailable ? "Available for new projects" : "Not looking for work"}`);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 shadow-2xs ${
                isAvailable
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isAvailable ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
              <span>{isAvailable ? "Available for New Work" : "Busy / Unavailable"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPublicPreview(true)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Preview Public Profile</span>
            </button>
          </div>
        </div>
      </section>

      {/* Professional Bio & About */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-3">
        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-600" />
          <span>Professional Bio & Summary</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Senior Full-Stack & Payment Systems Engineer with over 6 years of experience building mission-critical fintech infrastructure, bilateral escrow state machines, and resilient SaaS web applications. Proven track record deploying zero-downtime webhook relays, PayPal REST v2 order capture, SHA-256 state consensus pipelines, and Next.js 15 architectures.
        </p>
      </section>

      {/* Verified Resume & Parsed Credentials */}
      <section className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/20 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">
                Verified Credentials & Resume
              </span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                AI Parsed & Certified
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Sambit_Resume.pdf (Verified Candidate Profile)
            </h3>
          </div>

          <button
            type="button"
            onClick={() => showToast("Downloading verified resume PDF...")}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Verified Resume</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>Education & Degree</span>
            </div>
            <p className="text-slate-600">
              B.Tech in Computer Science & Engineering · GPA 8.7/10
            </p>
            <div className="text-[11px] text-slate-400">Graduation Year: 2024 · Verified Credentials</div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              <span>Industry Experience</span>
            </div>
            <p className="text-slate-600">
              6+ Years Full-Stack Development · 18 Verified Contracts Delivered
            </p>
            <div className="text-[11px] text-emerald-700 font-semibold">100% On-Time Acceptance Record</div>
          </div>
        </div>
      </section>

      {/* Skills Matrix */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Verified Technical Skills
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {skills.map((s, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 shadow-2xs space-y-1"
            >
              <div className="font-bold text-slate-900 text-xs">{s.name}</div>
              <div className="text-[11px] text-indigo-600 font-semibold">{s.level}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Portfolio Projects Showcase */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Featured Portfolio Projects
        </h2>

        <div className="space-y-4">
          {portfolioProjects.map((p, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{p.title}</h3>
                  <div className="text-xs text-slate-500">{p.role} · {p.timeline}</div>
                </div>

                <div className="flex items-center gap-2">
                  {p.prUrl && (
                    <a
                      href={p.prUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-indigo-600 transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>PR #42</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  )}
                  {p.demoUrl && (
                    <a
                      href={p.demoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-purple-600 transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Loom Demo</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  )}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {p.description}
              </p>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {p.tags.map((t, tidx) => (
                  <span
                    key={tidx}
                    className="px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-slate-100 text-slate-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Public Profile Preview Modal */}
      {showPublicPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-lg font-bold text-slate-900">Public Profile Preview</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPublicPreview(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3">
              <p>Clients see your profile at: <strong className="text-indigo-600 font-mono">nexum.dev/@sambit_dev</strong></p>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900">{freelancer.name}</div>
                <div>{freelancer.title} · Rate: $65.00 USD/hr</div>
                <div className="text-emerald-700 font-semibold">✓ Verified PayPal Escrow Developer · 100% Rating</div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowPublicPreview(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
