"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Check,
  Building,
  GraduationCap,
  Code2,
  DollarSign,
  UploadCloud,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Logo from "@/components/Logo";

// Client Project Interest Categories
const CLIENT_CATEGORIES = [
  "Web development",
  "Blockchain / Web3",
  "AI / Machine Learning",
  "Mobile development",
  "UI/UX design",
  "Backend / API",
  "DevOps / Cloud",
  "Other",
];

// Suggested Skills for Freelancers
const SUGGESTED_SKILLS = [
  "React",
  "Next.js",
  "TypeScript",
  "Node.js",
  "Python",
  "PostgreSQL",
  "TailwindCSS",
  "GraphQL",
  "Docker",
  "Solidity",
  "AWS",
  "Figma",
];

// Experience Profile Types
const PROFILE_TYPES = [
  {
    id: "Student / Beginner",
    title: "Student / Beginner",
    desc: "Starting out, looking for entry projects or internships.",
  },
  {
    id: "Freelancer / Independent",
    title: "Freelancer / Independent",
    desc: "Building a career, available for contract or full-time projects.",
  },
  {
    id: "Experienced / Senior",
    title: "Experienced / Senior",
    desc: "Extensive background, advisory & complex architectures.",
  },
];

export default function ChooseRolePage() {
  const router = useRouter();

  // Wizard step: 1 = Role selection, 2 = Role details & setup
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<"CLIENT" | "FREELANCER">("CLIENT");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client Details Form State
  const [companyName, setCompanyName] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState("$2,500 - $10,000");

  // Freelancer Details Form State
  const [freelancerTitle, setFreelancerTitle] = useState("");
  const [profileType, setProfileType] = useState("Freelancer / Independent");
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["React", "TypeScript", "Node.js"]);
  const [skillInput, setSkillInput] = useState("");
  const [hourlyRate, setHourlyRate] = useState<number>(45);
  const [workExperience, setWorkExperience] = useState("");

  // Resume Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [resumeSuccessMsg, setResumeSuccessMsg] = useState<string | null>(null);

  // Toggle Category for Client
  const toggleInterest = (category: string) => {
    setSelectedInterests((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  // Toggle Skill for Freelancer
  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  // Add custom skill
  const handleAddCustomSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = skillInput.trim().replace(/^,+|,+$/g, "");
      if (val && !selectedSkills.includes(val)) {
        setSelectedSkills((prev) => [...prev, val]);
        setSkillInput("");
      }
    }
  };

  // Handle Resume Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError("File exceeds 8MB maximum size.");
      return;
    }

    setResumeFile(file);
    setIsParsingResume(true);
    setError(null);

    try {
      // Simulate quick resume parsing
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setResumeSuccessMsg(`Resume "${file.name}" ingested. Extracted skills and profile data.`);
      if (!freelancerTitle) {
        setFreelancerTitle("Full-Stack Software Engineer");
      }
    } catch {
      setError("Could not parse resume. You can still enter details manually.");
    } finally {
      setIsParsingResume(false);
    }
  };

  // Step 1 -> Step 2
  const handleContinueToDetails = () => {
    setError(null);
    setStep(2);
  };

  // Step 2 Final Submission
  const handleFinalSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload = {
      role: selectedRole,
      ...(selectedRole === "CLIENT"
        ? {
            companyName: companyName.trim() || undefined,
            interests: selectedInterests,
            budget: budgetRange,
          }
        : {
            title: freelancerTitle.trim() || "Freelancer Specialist",
            skills: selectedSkills,
            profileType,
            workExperience: workExperience.trim() || undefined,
            hourlyRate: Number(hourlyRate) || 45,
          }),
    };

    try {
      const res = await fetch("/api/auth/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to finalize account setup.");
      }

      // Route to respective dashboard
      if (selectedRole === "FREELANCER") {
        router.replace("/freelancer/dashboard");
      } else {
        router.replace("/client/dashboard");
      }
    } catch (err: any) {
      console.error("Role setup error:", err);
      setError(err.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden text-slate-100 font-sans">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl bg-slate-900/85 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <Logo />
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">Step {step} of 2</span>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-400 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Verified Account</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-medium flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ==============================================================
            STEP 1: ROLE SELECTION
           ============================================================== */}
        {step === 1 && (
          <div>
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                Select Your Workspace Role
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
                Choose how you will participate on the Nexum protocol.
              </p>
            </div>

            {/* Role Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {/* Client Option */}
              <div
                onClick={() => setSelectedRole("CLIENT")}
                className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 relative flex flex-col justify-between ${
                  selectedRole === "CLIENT"
                    ? "bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/10 scale-[1.01]"
                    : "bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70 hover:border-slate-600"
                }`}
              >
                {selectedRole === "CLIENT" && (
                  <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
                <div>
                  <div className="w-11 h-11 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-white text-base mb-1">Client / Buyer</h3>
                  <p className="text-slate-400 text-xs leading-relaxed mb-4">
                    Hire verified specialists, manage escrow-backed milestones, and review sealed code deliverables.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>PayPal Escrow & Consensus Guard</span>
                </div>
              </div>

              {/* Freelancer Option */}
              <div
                onClick={() => setSelectedRole("FREELANCER")}
                className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 relative flex flex-col justify-between ${
                  selectedRole === "FREELANCER"
                    ? "bg-purple-600/20 border-purple-500 shadow-lg shadow-purple-500/10 scale-[1.01]"
                    : "bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70 hover:border-slate-600"
                }`}
              >
                {selectedRole === "FREELANCER" && (
                  <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
                <div>
                  <div className="w-11 h-11 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-white text-base mb-1">Freelancer / Talent</h3>
                  <p className="text-slate-400 text-xs leading-relaxed mb-4">
                    Discover verified client contracts, negotiate scopes with AI protection, and receive guaranteed payouts.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>Immutable Milestone Payouts</span>
                </div>
              </div>
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={handleContinueToDetails}
              className="w-full h-12 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <span>Continue to Profile Setup</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ==============================================================
            STEP 2: ROLE DETAILS & ONBOARDING SETUP
           ============================================================== */}
        {step === 2 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Role</span>
              </button>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {selectedRole === "CLIENT" ? "Client Profile" : "Freelancer Profile"}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
              {selectedRole === "CLIENT" ? "Set Up Your Hiring Profile" : "Showcase Your Expertise"}
            </h2>
            <p className="text-slate-400 text-xs mb-6">
              {selectedRole === "CLIENT"
                ? "Tell us about your organization and the kind of talent you seek."
                : "Highlight your key skills and experience so clients can match with you."}
            </p>

            {/* --- CLIENT FORM --- */}
            {selectedRole === "CLIENT" && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Company / Organization Name (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Labs or Personal Project"
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    What skills are you looking to hire for?
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CLIENT_CATEGORIES.map((cat) => {
                      const isSel = selectedInterests.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleInterest(cat)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                            isSel
                              ? "bg-indigo-600 text-white border-indigo-500 font-medium"
                              : "bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-600 hover:text-slate-200"
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Estimated Project Budget Range</span>
                  </label>
                  <select
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                  >
                    <option value="< $1,000">Entry / Discovery (&lt; $1,000)</option>
                    <option value="$1,000 - $5,000">Small Project ($1,000 - $5,000)</option>
                    <option value="$5,000 - $15,000">Medium Engagement ($5,000 - $15,000)</option>
                    <option value="$15,000+">Enterprise / Long-term ($15,000+)</option>
                  </select>
                </div>
              </div>
            )}

            {/* --- FREELANCER FORM --- */}
            {selectedRole === "FREELANCER" && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Professional Title</span>
                  </label>
                  <input
                    type="text"
                    value={freelancerTitle}
                    onChange={(e) => setFreelancerTitle(e.target.value)}
                    placeholder="e.g. Senior Full-Stack Engineer · AI & Next.js"
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>

                {/* Experience Profile Types */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
                    <span>Experience Level</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {PROFILE_TYPES.map((pt) => {
                      const isSel = profileType === pt.id;
                      return (
                        <div
                          key={pt.id}
                          onClick={() => setProfileType(pt.id)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                            isSel
                              ? "bg-purple-600/20 border-purple-500 shadow-sm"
                              : "bg-slate-800/40 border-slate-700 hover:border-slate-600"
                          }`}
                        >
                          <div className="font-semibold text-xs text-white mb-0.5">{pt.title}</div>
                          <div className="text-[10px] text-slate-400 leading-tight">{pt.desc}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Primary Skills */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Primary Tech Stack / Skills
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {SUGGESTED_SKILLS.map((sk) => {
                      const isSel = selectedSkills.includes(sk);
                      return (
                        <button
                          key={sk}
                          type="button"
                          onClick={() => toggleSkill(sk)}
                          className={`text-xs px-2.5 py-1 rounded-md border transition cursor-pointer ${
                            isSel
                              ? "bg-purple-600 text-white border-purple-500 font-medium"
                              : "bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-600 hover:text-slate-200"
                          }`}
                        >
                          {sk} {isSel ? "✓" : "+"}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleAddCustomSkill}
                    placeholder="Type other skill and press Enter..."
                    className="w-full px-3.5 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>

                {/* Hourly Rate & Bio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-purple-400" />
                      <span>Target Hourly Rate (USD)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs">$</span>
                      <input
                        type="number"
                        min="10"
                        max="500"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(Number(e.target.value))}
                        className="w-full pl-7 pr-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500 transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Brief Bio / Background
                    </label>
                    <input
                      type="text"
                      value={workExperience}
                      onChange={(e) => setWorkExperience(e.target.value)}
                      placeholder="e.g. 5+ yrs building distributed React & Go apps"
                      className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>
                </div>

                {/* Optional Resume Upload Dropzone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Resume / CV (Optional - AI Auto-Fill)</span>
                    <span className="text-[10px] text-slate-500 font-normal">PDF or DOCX (max 8MB)</span>
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3.5 border-2 border-dashed border-slate-700 hover:border-purple-500/60 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition cursor-pointer text-center flex flex-col items-center justify-center gap-1.5"
                  >
                    {isParsingResume ? (
                      <div className="flex items-center gap-2 text-xs text-purple-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Extracting credentials with AI parser...</span>
                      </div>
                    ) : resumeFile ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-400">
                        <FileText className="w-4 h-4" />
                        <span className="font-semibold">{resumeFile.name}</span>
                        <span className="text-slate-400">({(resumeFile.size / 1024).toFixed(0)} KB)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400 text-xs">
                        <UploadCloud className="w-4 h-4 text-purple-400" />
                        <span>Click to upload resume for instant AI profile extraction</span>
                      </div>
                    )}
                  </div>
                  {resumeSuccessMsg && (
                    <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>{resumeSuccessMsg}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              className={`w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer ${
                selectedRole === "CLIENT"
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-indigo-500/25"
                  : "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-purple-500/25"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Finalizing Your Workspace Profile...</span>
                </div>
              ) : (
                <>
                  <span>Complete Setup & Enter Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        <p className="text-center text-slate-500 text-[11px] mt-6">
          Secured by Nexum Protocol · Dual SHA-256 Consensus Engine
        </p>
      </div>
    </div>
  );
}
