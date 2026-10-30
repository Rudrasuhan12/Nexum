"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  UploadCloud,
  FileText,
  Briefcase,
  User as UserIcon,
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Building,
  GraduationCap,
  Code2,
} from "lucide-react";
import Logo from "@/components/Logo";
import { useAuth, SignupPayload } from "@/context/AuthContext";

// Client Freelancer Interest Categories
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

// Freelancer Experience Profile Types
const PROFILE_TYPES = [
  {
    id: "Student / Beginner",
    title: "Student / Beginner",
    desc: "Starting out, looking for entry projects or internships.",
    icon: GraduationCap,
  },
  {
    id: "Freelancer",
    title: "Freelancer",
    desc: "Independent contractor delivering high-impact client milestones.",
    icon: UserIcon,
  },
  {
    id: "Experienced professional",
    title: "Experienced professional",
    desc: "5+ years of production experience, technical architecture & leadership.",
    icon: Briefcase,
  },
  {
    id: "Agency",
    title: "Agency",
    desc: "Studio or multidisciplinary team delivering end-to-end deliverables.",
    icon: Building,
  },
];

// Freelancer Skills
const FREELANCER_SKILLS = [
  "Web development",
  "Blockchain / Web3",
  "AI / Machine Learning",
  "Mobile development",
  "UI/UX design",
  "Backend / API development",
  "DevOps / Cloud",
  "Other",
];

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  // Wizard Step: 1 = Account, 2 = Role, 3 = Profile Completion (3A or 3B)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Account credentials
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Role selection ("CLIENT" | "FREELANCER")
  const [role, setRole] = useState<"CLIENT" | "FREELANCER">("CLIENT");

  // Step 3A: Client profile
  const [clientName, setClientName] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Step 3B: Freelancer profile
  const [freelancerName, setFreelancerName] = useState("");
  const [freelancerEmail, setFreelancerEmail] = useState("");
  const [workExperience, setWorkExperience] = useState("");
  const [profileType, setProfileType] = useState<string>("Freelancer");
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["Web development"]);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [hasExtracted, setHasExtracted] = useState(false);

  // Form Submission & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // --- Step 1 Handler ---
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 4) {
      setErrorMessage("Password must be at least 4 characters.");
      return;
    }

    // Prefill freelancer email if empty
    if (!freelancerEmail) {
      setFreelancerEmail(email.trim());
    }

    setStep(2);
  };

  // --- Step 2 Handler ---
  const handleStep2Continue = () => {
    setErrorMessage(null);
    setStep(3);
  };

  // --- Toggle Category / Skill ---
  const toggleInterest = (category: string) => {
    setSelectedInterests((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  // --- Resume Upload & Parser ---
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeFileName(file.name);
    setIsParsingResume(true);
    setErrorMessage(null);

    // Initial intelligent name inference from filename (e.g. Sambit_Resume(3).pdf -> "Sambit")
    const cleanFileName = file.name.replace(/\.[^/.]+$/, "").replace(/\(\d+\)/g, "").trim();
    const nameFromFileName = cleanFileName
      .split(/[-_\s]+/)
      .filter((p) => !/^(resume|cv|pdf|doc|profile|file)$/i.test(p))
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const res = await fetch("/api/auth/parse-resume", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        // Prioritize extracted name from PDF text, fallback to filename
        const rawExtractedName = json.data.fullName?.trim();
        if (rawExtractedName && rawExtractedName !== "Candidate" && rawExtractedName !== "Alex Rivera") {
          setFreelancerName(rawExtractedName);
        } else if (nameFromFileName) {
          setFreelancerName(nameFromFileName);
        } else if (rawExtractedName) {
          setFreelancerName(rawExtractedName);
        }

        if (json.data.email) {
          setFreelancerEmail(json.data.email);
        }
        if (json.data.workExperience) {
          setWorkExperience(json.data.workExperience);
        }
        if (Array.isArray(json.data.suggestedSkills) && json.data.suggestedSkills.length > 0) {
          setSelectedSkills(json.data.suggestedSkills);
        }
        if (json.data.suggestedProfileType) {
          setProfileType(json.data.suggestedProfileType);
        }
        setHasExtracted(true);
        showToast("Resume details extracted! Please review and edit below.");
      } else {
        throw new Error(json.error || "Extraction failed");
      }
    } catch {
      // Fallback extraction from file name and structure
      if (nameFromFileName) {
        setFreelancerName(nameFromFileName);
      }
      setHasExtracted(true);
      showToast("Resume parsed with filename heuristics. Please review details below.");
    } finally {
      setIsParsingResume(false);
    }
  };

  // --- Final Profile Completion Submission ---
  const handleFinalSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const name = role === "CLIENT" ? clientName.trim() : freelancerName.trim();
    if (!name) {
      setErrorMessage(role === "CLIENT" ? "Please enter your name." : "Please enter your full name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: SignupPayload = {
        email: email.trim().toLowerCase(),
        password,
        role,
        name,
        ...(role === "CLIENT"
          ? { preferences: selectedInterests }
          : {
              skills: selectedSkills,
              profileType,
              workExperience: workExperience.trim(),
            }),
      };

      const result = await signup(payload);

      if (!result.success) {
        setErrorMessage(result.error || "Failed to create account. Please try again.");
        return;
      }

      showToast(`Welcome to Nexum, ${name}! Redirecting...`);

      // Redirect to respective dashboard
      setTimeout(() => {
        if (role === "CLIENT") {
          router.push("/client/dashboard");
        } else {
          router.push("/freelancer/dashboard");
        }
      }, 600);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred during signup.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`min-h-screen w-full bg-white flex flex-col lg:grid lg:grid-cols-2 selection:bg-indigo-500 selection:text-white ${
        step === 3 ? "lg:h-screen lg:max-h-screen lg:overflow-hidden" : ""
      }`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-slate-900 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-full shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ==============================================================
          LEFT COLUMN: MULTI-STEP SIGNUP WIZARD
         ============================================================== */}
      <div
        className={`w-full flex flex-col justify-between px-6 sm:px-12 lg:px-16 xl:px-20 py-8 lg:py-12 ${
          step === 3 ? "lg:h-screen lg:max-h-screen lg:overflow-y-auto" : "overflow-y-auto"
        }`}
      >
        {/* Top Header & Breadcrumb Navigation */}
        <div className="flex items-center justify-between mb-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev === 3 ? 2 : 1))}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back</span>
            </button>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Nexum</span>
            </Link>
          )}

          {/* Stepper Dots & Label */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>
              Step {step} of 3:{" "}
              <strong className="text-slate-700">
                {step === 1 ? "Account" : step === 2 ? "Role" : role === "CLIENT" ? "Client Profile" : "Freelancer Profile"}
              </strong>
            </span>
            <div className="flex items-center gap-1.5 ml-2">
              <span className={`w-2 h-2 rounded-full transition-all ${step === 1 ? "w-5 bg-indigo-600" : "bg-slate-300"}`} />
              <span className={`w-2 h-2 rounded-full transition-all ${step === 2 ? "w-5 bg-indigo-600" : "bg-slate-300"}`} />
              <span className={`w-2 h-2 rounded-full transition-all ${step === 3 ? "w-5 bg-indigo-600" : "bg-slate-300"}`} />
            </div>
          </div>
        </div>

        {/* Center Content Box */}
        <div className={`max-w-[440px] w-full mx-auto ${step === 3 ? "my-4 sm:my-6" : "my-auto"}`}>
          {/* Brand Logo & Heading */}
          <div className="flex flex-col items-center text-center mb-7">
            <Link href="/" className="mb-4 transition-transform hover:scale-105 duration-200">
              <Logo surface="light" className="h-11 w-11 object-contain" />
            </Link>

            {step === 1 && (
              <>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
                  Create your Nexum account
                </h1>
                <p className="text-xs sm:text-[13px] text-slate-500 mt-1.5">
                  Join the verifiable freelance protocol with PayPal payment evidence.
                </p>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
                  How will you use Nexum?
                </h1>
                <p className="text-xs sm:text-[13px] text-slate-500 mt-1.5">
                  Select your primary role. You can collaborate as either anytime.
                </p>
              </>
            )}

            {step === 3 && role === "CLIENT" && (
              <>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
                  Set up your client profile
                </h1>
                <p className="text-xs sm:text-[13px] text-slate-500 mt-1.5">
                  Tell us who you are and what talent you are looking to hire.
                </p>
              </>
            )}

            {step === 3 && role === "FREELANCER" && (
              <>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
                  Build your freelancer profile
                </h1>
                <p className="text-xs sm:text-[13px] text-slate-500 mt-1.5">
                  Upload your resume to prefill your skills or fill out your details manually.
                </p>
              </>
            )}
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-xs text-rose-900 shadow-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* ==========================================================
              STEP 1: COMMON SIGNUP (EMAIL & PASSWORD)
             ========================================================== */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 4 characters"
                    required
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] shadow-sm hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Create account</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Sign in Link */}
              <div className="text-center pt-3 text-xs text-slate-500">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                  Sign in
                </Link>
              </div>
            </form>
          )}

          {/* ==========================================================
              STEP 2: CHOOSE YOUR ROLE
             ========================================================== */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Option 1: Client */}
              <div
                onClick={() => setRole("CLIENT")}
                className={`relative flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  role === "CLIENT"
                    ? "border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    role === "CLIENT" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 font-heading">I&apos;m a Client</h3>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                        role === "CLIENT" ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300"
                      }`}
                    >
                      {role === "CLIENT" && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    I want to hire freelancers for my projects, define PRD milestones, and approve payments.
                  </p>
                </div>
              </div>

              {/* Option 2: Freelancer */}
              <div
                onClick={() => setRole("FREELANCER")}
                className={`relative flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  role === "FREELANCER"
                    ? "border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    role === "FREELANCER" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Code2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 font-heading">I&apos;m a Freelancer</h3>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                        role === "FREELANCER" ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300"
                      }`}
                    >
                      {role === "FREELANCER" && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    I want to showcase my skills, negotiate canonical agreements, and receive verified PayPal payouts.
                  </p>
                </div>
              </div>

              {/* Continue Button */}
              <button
                type="button"
                onClick={handleStep2Continue}
                className="w-full mt-4 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] shadow-sm hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue as {role === "CLIENT" ? "Client" : "Freelancer"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ==========================================================
              STEP 3A: CLIENT PROFILE COMPLETION
             ========================================================== */}
          {step === 3 && role === "CLIENT" && (
            <form onSubmit={handleFinalSubmit} className="space-y-5">
              {/* Client Name (Required) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  What should we call you? <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Alex Rivera or Rivera Studios"
                  required
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>

              {/* Freelancer Categories Multi-Select (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    What types of freelancers are you interested in?
                  </label>
                  <span className="text-[11px] font-medium text-slate-400">Optional</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2.5">
                  Choose any that interest you. You can change these preferences later.
                </p>
                <div className="flex flex-wrap gap-2">
                  {CLIENT_CATEGORIES.map((cat) => {
                    const isSelected = selectedInterests.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleInterest(cat)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-indigo-600 border-indigo-600 text-white font-semibold shadow-xs"
                            : "bg-slate-50/80 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] shadow-sm hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Completing profile...</span>
                  </>
                ) : (
                  <>
                    <span>Complete profile</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ==========================================================
              STEP 3B: FREELANCER PROFILE COMPLETION
             ========================================================== */}
          {step === 3 && role === "FREELANCER" && (
            <form onSubmit={handleFinalSubmit} className="space-y-5">
              {/* Resume Upload Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload your resume
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Upload a PDF resume. Nexum will extract your profile details for you.
                </p>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleResumeUpload}
                  accept=".pdf,.txt,.doc,.docx"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                    resumeFileName
                      ? "border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50"
                      : "border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/20"
                  }`}
                >
                  {isParsingResume ? (
                    <div className="flex flex-col items-center justify-center py-2">
                      <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mb-1.5" />
                      <span className="text-xs font-semibold text-indigo-900">Parsing resume details...</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">Extracting name, experience & skills</span>
                    </div>
                  ) : resumeFileName ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-800">
                      <FileText className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs font-bold truncate max-w-[240px]">{resumeFileName}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                        Uploaded
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-1">
                      <UploadCloud className="w-7 h-7 text-indigo-500 mb-1" />
                      <div className="text-xs font-bold text-slate-800">
                        Drop your PDF resume here or <span className="text-indigo-600 underline">browse</span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5">Supports PDF up to 10MB</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Extracted Details Notification */}
              {hasExtracted && (
                <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-xl text-[11px] text-indigo-900">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    Details auto-extracted! Displayed for review and correction before finalizing.
                  </span>
                </div>
              )}

              {/* Full Name (Editable, Auto-extracted) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Full name <span className="text-rose-500">*</span>
                  </label>
                  {hasExtracted && (
                    <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      Auto-extracted
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={freelancerName}
                  onChange={(e) => setFreelancerName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  required
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
              </div>

              {/* Work Experience (Editable, Auto-extracted) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Work experience</label>
                  {hasExtracted && (
                    <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      Auto-extracted
                    </span>
                  )}
                </div>
                <textarea
                  value={workExperience}
                  onChange={(e) => setWorkExperience(e.target.value)}
                  placeholder="Summary of your background, internships, years in industry, or past projects..."
                  rows={5}
                  className="w-full px-3.5 py-2.5 text-xs font-mono leading-relaxed rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-y min-h-[120px]"
                />
                {hasExtracted && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Extracted all internships & roles with bullet points. You can review or modify above.
                  </p>
                )}
              </div>

              {/* What best describes you? */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  What best describes you?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PROFILE_TYPES.map((pt) => {
                    const isSelected = profileType === pt.id;
                    const IconComp = pt.icon;
                    return (
                      <div
                        key={pt.id}
                        onClick={() => setProfileType(pt.id)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500/20 shadow-xs"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <IconComp className={`w-3.5 h-3.5 ${isSelected ? "text-indigo-600" : "text-slate-500"}`} />
                          <div
                            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${
                              isSelected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300"
                            }`}
                          >
                            {isSelected && <Check className="w-2 h-2 stroke-[3]" />}
                          </div>
                        </div>
                        <div className="text-[11px] font-bold text-slate-900 leading-tight">{pt.title}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* What skills do you offer? Multi-select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  What skills do you offer?
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {FREELANCER_SKILLS.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? "bg-indigo-600 border-indigo-600 text-white font-semibold shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        <span>{skill}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Complete Profile Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] shadow-sm hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Completing profile...</span>
                  </>
                ) : (
                  <>
                    <span>Complete profile</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-[11px] text-slate-400 font-mono">
          <span>Nexum Protocol · AI drafts, humans approve, PayPal proves.</span>
        </div>
      </div>

      {/* ==============================================================
          RIGHT COLUMN: VIBRANT PERIWINKLE/INDIGO GLASS SHOWCASE
          Featuring the reversed 3D developer character & to-and-fro lamp
         ============================================================== */}
      <div
        className={`hidden lg:flex flex-col items-center justify-center p-8 xl:p-12 bg-gradient-to-br from-[#5b52f0] via-[#4f46e5] to-[#3730a3] relative overflow-hidden select-none ${
          step === 3 ? "lg:h-screen lg:max-h-screen lg:sticky lg:top-0 lg:overflow-hidden" : ""
        }`}
      >
        {/* Keyframe animations */}
        <style jsx global>{`
          @keyframes toAndFroLamp {
            0% {
              transform: translateX(-50%) rotate(-8deg);
            }
            50% {
              transform: translateX(-50%) rotate(8deg);
            }
            100% {
              transform: translateX(-50%) rotate(-8deg);
            }
          }
          @keyframes gentleFloat {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-6px);
            }
          }
        `}</style>

        {/* Ambient Grids */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/15 via-transparent to-black/25 pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none" />

        {/* Showcase Glass Card */}
        <div
          className={`relative w-full max-w-[500px] aspect-[4/5] rounded-[36px] border border-white/25 bg-white/10 backdrop-blur-xl shadow-[0_30px_70px_rgba(0,0,0,0.25)] flex flex-col justify-between p-8 sm:p-10 overflow-hidden text-white ${
            step === 3 ? "max-h-[calc(100vh-3.5rem)]" : ""
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

          {/* Swinging Lamp */}
          <div
            className="absolute top-0 left-1/2 flex flex-col items-center pointer-events-none z-20 [animation:toAndFroLamp_4.5s_cubic-bezier(0.45,0.05,0.55,0.95)_infinite]"
            style={{ transformOrigin: "top center" }}
          >
            <div className="w-4 h-1.5 rounded-full bg-white/70 shadow-sm" />
            <div className="w-[1.5px] h-7 bg-gradient-to-b from-white/80 via-white/50 to-slate-300" />
            <div className="w-22 h-10 rounded-t-full bg-gradient-to-b from-slate-200 via-slate-400 to-slate-800 shadow-[0_8px_20px_rgba(0,0,0,0.35)] relative overflow-hidden">
              <div className="absolute -bottom-0.5 inset-x-0 h-1 rounded-full bg-gradient-to-r from-slate-300 via-white to-slate-300 shadow-inner" />
              <div className="absolute bottom-0 inset-x-2 h-1.5 bg-white/40 blur-xs rounded-full" />
            </div>
            <div
              className="w-64 h-72 bg-gradient-to-b from-white/20 via-white/5 to-transparent blur-md pointer-events-none -mt-1"
              style={{ clipPath: "polygon(36% 0%, 64% 0%, 100% 100%, 0% 100%)" }}
            />
          </div>

          {/* Reversed 3D Character (Shifted 2cm down) */}
          <div className="relative z-10 my-auto flex flex-col items-center justify-center translate-y-7 sm:translate-y-8 py-2">
            <div className="relative w-72 h-64 sm:w-80 sm:h-72 flex items-center justify-center [animation:gentleFloat_5s_ease-in-out_infinite]">
              <div className="absolute bottom-2 w-60 h-10 bg-black/40 rounded-full blur-xl" />
              <div className="absolute bottom-3 w-48 h-6 bg-[#1e1b4b]/60 rounded-full blur-md" />

              <Image
                src="/developer-3d-v3.png"
                alt="3D Freelance Developer in beanbag chair working on laptop"
                width={380}
                height={380}
                className="relative z-10 w-full h-full object-contain drop-shadow-[0_16px_28px_rgba(0,0,0,0.4)] select-none pointer-events-none"
                priority
              />
            </div>
          </div>

          {/* Bottom Value Prop */}
          <div className="relative z-20 pt-4 pb-2 sm:pb-3">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2 font-heading">
              {role === "CLIENT" ? "Hire with Proof" : "Get Paid with Proof"}
            </h2>
            <p className="text-xs sm:text-[13px] text-white/80 leading-relaxed font-normal max-w-sm">
              {role === "CLIENT"
                ? "Every milestone is pre-funded and locked by canonical version hash. No disputes, no escrow friction."
                : "AI-drafted PRDs, dual human approval, and PayPal Orders v2 captures backed by cryptographic proof."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

