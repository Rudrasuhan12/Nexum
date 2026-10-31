"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Search,
  Plus,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Layers,
  Camera,
  Check,
  AlertCircle,
  UploadCloud,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface ClientOverviewHeaderProps {
  clientName: string;
  companyName: string;
  projectName?: string;
  agreementHash?: string;
  readinessPercentage?: number;
  onFindFreelancer?: () => void;
  onCreateProject?: () => void;
  onViewMilestones?: () => void;
}

export default function ClientOverviewHeader({
  clientName,
  companyName,
  projectName = "Bilateral E-Commerce Payment Rails",
  agreementHash = "canonical_v1.2_#9f8c2b7e",
  readinessPercentage = 85,
  onFindFreelancer,
  onCreateProject,
  onViewMilestones,
}: ClientOverviewHeaderProps) {
  const { user, updateAvatar, updateHiringStatus } = useAuth();
  
  // Hiring Status state synced with user.statusBadge
  const [hiringStatus, setHiringStatus] = useState<"Actively hiring" | "Fully staffed" | "Reviewing proposals">(() => {
    if (user?.statusBadge === "Reviewing proposals" || user?.statusBadge === "Fully staffed") {
      return user.statusBadge;
    }
    return "Actively hiring";
  });
  
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload feedback state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Photo Upload (< 2MB)
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(false);

    // Validate 2MB limit
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      const actualMb = (file.size / (1024 * 1024)).toFixed(1);
      setUploadError(`Photo must be less than 2MB (selected file is ${actualMb}MB).`);
      setTimeout(() => setUploadError(null), 5000);
      return;
    }

    // Validate type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file (PNG, JPG, WEBP).");
      setTimeout(() => setUploadError(null), 5000);
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const ok = await updateAvatar(base64Data);
        if (ok) {
          setUploadSuccess(true);
          setTimeout(() => setUploadSuccess(false), 3000);
        } else {
          setUploadError("Failed to save avatar image. Please try again.");
          setTimeout(() => setUploadError(null), 5000);
        }
        setIsUploading(false);
      };
      reader.onerror = () => {
        setUploadError("Error reading image file.");
        setIsUploading(false);
        setTimeout(() => setUploadError(null), 5000);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadError("Upload failed. Please try again.");
      setIsUploading(false);
      setTimeout(() => setUploadError(null), 5000);
    }
  };

  const handleSelectStatus = async (status: "Actively hiring" | "Fully staffed" | "Reviewing proposals") => {
    setHiringStatus(status);
    setIsStatusDropdownOpen(false);
    if (updateHiringStatus) {
      await updateHiringStatus(status);
    }
  };

  const avatarUrl = user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80";

  return (
    <div className="relative w-full rounded-[24px] sm:rounded-[28px] bg-gradient-to-r from-[#4338ca] via-[#4f46e5] to-[#6366f1] text-white p-5 sm:p-7 shadow-[0_12px_32px_rgba(79,70,229,0.22)] border border-white/15 select-none">
      {/* Background ambient lighting and subtle decorative grid - clipped cleanly inside without cutting off dropdowns */}
      <div className="absolute inset-0 rounded-[24px] sm:rounded-[28px] overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-black/10" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_60%,transparent_100%)]" />
      </div>

      {/* Main Content Layout */}
      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        
        {/* ==============================================================
            LEFT: CLIENT AVATAR (CLICK TO UPLOAD <2MB) + GREETING + STATUS PILL
           ============================================================== */}
        <div className="flex items-center gap-4">
          
          {/* Avatar with Camera upload trigger */}
          <div className="relative group shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden shrink-0 border-2 border-white/80 shadow-md ring-4 ring-white/20 cursor-pointer group-hover:ring-white/40 transition-all"
              title="Click to upload profile photo (< 2MB)"
            >
              <Image
                src={avatarUrl}
                alt={clientName}
                width={64}
                height={64}
                className="w-full h-full object-cover"
                unoptimized={avatarUrl.startsWith("data:")}
              />

              {/* Hover Dark Overlay with Camera Icon */}
              <div className="absolute inset-0 bg-black/45 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                <Camera className="w-4 h-4" />
                <span className="text-[9px] font-bold mt-0.5">Edit</span>
              </div>
            </div>

            {/* Camera badge bottom-right */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white text-indigo-600 shadow-md border border-white flex items-center justify-center hover:bg-slate-100 hover:scale-110 active:scale-95 transition-all cursor-pointer"
              title="Upload photo (< 2MB)"
            >
              <Camera className="w-3 h-3 stroke-[2.5]" />
            </button>
          </div>

          {/* Heading & Subtitle & Status Pill */}
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-heading leading-tight flex items-center gap-2">
              <span>Welcome back, {clientName.split(" ")[0]}!</span>
            </h1>

            <p className="text-xs sm:text-[13px] text-white/85 font-normal leading-relaxed">
              Let&apos;s build and fund verified milestones today.
            </p>

            {/* Hiring Status Pill (Unclipped Dropdown) */}
            <div className="relative inline-block pt-0.5" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 text-[11px] font-semibold text-white transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    hiringStatus === "Actively hiring"
                      ? "bg-emerald-400 animate-pulse"
                      : hiringStatus === "Reviewing proposals"
                      ? "bg-amber-400"
                      : "bg-slate-300"
                  }`}
                />
                <span>{hiringStatus}</span>
                <ChevronDown
                  className={`w-3 h-3 text-white/80 transition-transform ${
                    isStatusDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Status Dropdown - fully unclipped with high z-index */}
              {isStatusDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-48 rounded-xl border border-slate-700/80 bg-slate-900/98 backdrop-blur-xl p-1.5 shadow-2xl z-50 text-white animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                    Client Hiring Status
                  </div>
                  {(["Actively hiring", "Reviewing proposals", "Fully staffed"] as const).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleSelectStatus(st)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                          hiringStatus === st
                            ? "bg-indigo-600/60 text-white font-bold"
                            : "hover:bg-white/10 text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              st === "Actively hiring"
                                ? "bg-emerald-400"
                                : st === "Reviewing proposals"
                                ? "bg-amber-400"
                                : "bg-slate-400"
                            }`}
                          />
                          <span>{st}</span>
                        </div>
                        {hiringStatus === st && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Error or Success notification strip for photo upload */}
            {uploadError && (
              <div className="flex items-center gap-1.5 text-[11px] text-rose-200 bg-rose-950/50 border border-rose-500/40 px-2 py-0.5 rounded-md mt-1 animate-in fade-in">
                <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
            {uploadSuccess && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-200 bg-emerald-950/50 border border-emerald-500/40 px-2 py-0.5 rounded-md mt-1 animate-in fade-in">
                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Photo updated everywhere!</span>
              </div>
            )}
          </div>
        </div>

        {/* ==============================================================
            CENTER: DYNAMIC CLIENT WORKSPACE READINESS CARD
           ============================================================== */}
        <div
          onClick={onCreateProject}
          className="w-full lg:w-auto min-w-[240px] max-w-[290px] rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 p-3.5 space-y-2.5 shadow-inner cursor-pointer transition group"
          title="Click to view workspace setup"
        >
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span className="text-white/80 font-medium">Workspace Readiness</span>
            <span className="font-mono text-white text-[13px] font-black">{readinessPercentage}%</span>
          </div>

          {/* Dynamic Progress Bar with vibrant emerald fill */}
          <div className="w-full h-2 rounded-full bg-black/25 overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-all duration-500 shadow-sm"
              style={{ width: `${Math.min(100, Math.max(5, readinessPercentage))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] pt-0.5">
            <span className="inline-flex items-center gap-1 font-semibold text-white/95 group-hover:text-white group-hover:underline">
              <span>{readinessPercentage >= 100 ? "Setup Complete" : "Post a New Project"}</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
            <span className="text-[10px] font-mono text-emerald-300 font-semibold bg-emerald-950/40 px-1.5 py-0.5 rounded">
              {readinessPercentage >= 100 ? "Active" : "Ready"}
            </span>
          </div>
        </div>

        {/* ==============================================================
            RIGHT: 3 ACTION BUTTONS (ALL FULLY WIRED & WORKING)
           ============================================================== */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
          
          {/* Button 1: Find Freelancers */}
          <button
            type="button"
            onClick={onFindFreelancer}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-98 backdrop-blur-md border border-white/25 text-white font-semibold text-xs transition shadow-xs cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Search className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            </div>
            <span>Find Freelancers</span>
          </button>

          {/* Button 2: Milestones */}
          <button
            type="button"
            onClick={onViewMilestones}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-98 backdrop-blur-md border border-white/25 text-white font-semibold text-xs transition shadow-xs cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <Layers className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            </div>
            <span>Milestones</span>
          </button>

          {/* Button 3: Post a New Project (Solid White Button) */}
          <button
            type="button"
            onClick={onCreateProject}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#4f46e5] font-bold text-xs shadow-md hover:shadow-lg transition cursor-pointer active:scale-98"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Post a New Project</span>
          </button>

        </div>

      </div>
    </div>
  );
}
