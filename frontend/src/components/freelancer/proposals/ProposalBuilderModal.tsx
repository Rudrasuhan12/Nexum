"use client";

import React, { useState } from "react";
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import { FreelancerProposalItem } from "@/lib/freelancer-proposals-types";

interface ProposalBuilderModalProps {
  onClose: () => void;
  onSubmitNewProposal: (newProposal: FreelancerProposalItem) => void;
}

export default function ProposalBuilderModal({
  onClose,
  onSubmitNewProposal,
}: ProposalBuilderModalProps) {
  const [step, setStep] = useState<number>(1);
  const [projectTitle, setProjectTitle] = useState(
    "Next.js AI Document Analysis & Extraction Platform"
  );
  const [clientCompany, setClientCompany] = useState("LexiTech Corp.");
  const [budgetRange, setBudgetRange] = useState("₹50,000 – ₹80,000");
  const [coverLetter, setCoverLetter] = useState(
    "Hello LexiTech team,\nI have extensive experience building production document OCR pipelines with Next.js, LangChain, and PostgreSQL."
  );
  const [approach, setApproach] = useState("Modular Next.js 16 + FastAPI OCR microservice");
  const [proposedPrice, setProposedPrice] = useState("₹65,000");
  const [duration, setDuration] = useState("4–5 weeks");
  const [skills, setSkills] = useState("Next.js, Python, OCR, LangChain, PostgreSQL");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleNext = () => {
    if (step === 1 && (!projectTitle.trim() || !clientCompany.trim())) {
      setErrorMsg("Please provide both project title and client company.");
      return;
    }
    if (step === 2 && !coverLetter.trim()) {
      setErrorMsg("Please write a brief cover letter.");
      return;
    }
    setErrorMsg("");
    setStep((s) => s + 1);
  };

  const handlePrev = () => {
    setErrorMsg("");
    setStep((s) => s - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newProposal: FreelancerProposalItem = {
      id: `prop-new-${Date.now()}`,
      projectId: `proj-${Date.now()}`,
      projectTitle,
      categoryIcon: "HEALTH",
      status: "SUBMITTED",
      statusLabel: "Submitted",
      statusBadgeColor: "bg-blue-50 text-blue-700 border-blue-200/80",
      submittedDate: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      submittedTime: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      client: {
        id: `cli-${Date.now()}`,
        name: `${clientCompany} Hiring Manager`,
        companyName: clientCompany,
        verified: true,
        industry: "Enterprise Software",
        companySize: "10–50 employees",
        location: "Bengaluru, India",
        postedDate: "Recent",
        totalHires: 5,
        avatarLetter: clientCompany.charAt(0).toUpperCase(),
        avatarBg: "bg-indigo-600 text-white",
      },
      clientBrief: {
        description: `Project opportunity posted by ${clientCompany}.`,
        category: "AI & Full-Stack",
        budgetRange,
        duration,
        deadline: "Flexible",
        requiredSkills: skills.split(",").map((s) => s.trim()),
        technicalRequirements: ["Full-stack architecture", "Security audit"],
        acceptanceCriteria: ["Passing test suites", "Client staging signoff"],
      },
      offer: {
        summary: `Proposal submitted for ${projectTitle} with guaranteed deliverables.`,
        approach,
        priceDisplay: `${proposedPrice} (fixed)`,
        priceType: "FIXED",
        duration,
        expectedStartDate: "Immediate",
        coverLetter,
        attachments: [],
        milestones: [],
      },
      messagesCount: 0,
      activityTrail: [
        {
          id: `act-${Date.now()}`,
          title: "Proposal Submitted",
          description: `Submitted formal quote of ${proposedPrice}.`,
          actor: "Sambit Mohanty (Freelancer)",
          timestamp: "Just now",
          type: "SUBMITTED",
        },
      ],
      techTags: skills.split(",").map((s) => s.trim()).slice(0, 4),
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onSubmitNewProposal(newProposal);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Create New Proposal
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Step {step} of 4:{" "}
              {step === 1
                ? "Project & Opportunity"
                : step === 2
                ? "Cover Letter & Approach"
                : step === 3
                ? "Pricing & Timeline"
                : "Review & Submit"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* STEP 1: Project & Client */}
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Client / Company Name
                </label>
                <input
                  type="text"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Client Budget Range
                  </label>
                  <input
                    type="text"
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Cover Letter & Approach */}
          {step === 2 && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Technical Approach
                </label>
                <input
                  type="text"
                  value={approach}
                  onChange={(e) => setApproach(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cover Letter & Pitch
                </label>
                <textarea
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
                  required
                />
              </div>
            </div>
          )}

          {/* STEP 3: Pricing & Timeline */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Proposed Price
                  </label>
                  <input
                    type="text"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estimated Duration
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                <p className="font-bold text-slate-900 mb-0.5">Fixed Price Escrow Guarantee</p>
                Funds are protected in Nexum bilateral escrow upon agreement ratification before any work commences.
              </div>
            </div>
          )}

          {/* STEP 4: Review & Submit */}
          {step === 4 && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Project:</span>
                  <span className="font-bold text-slate-900">{projectTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Client:</span>
                  <span className="font-bold text-slate-900">{clientCompany}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Proposed Price:</span>
                  <span className="font-bold text-[#4f46e5]">{proposedPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-bold text-slate-900">{duration}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-[11px] text-indigo-900 flex items-start gap-2">
                <FileCheck className="w-4 h-4 text-[#4f46e5] shrink-0 mt-0.5" />
                <span>
                  By submitting, your proposal is sent to {clientCompany} via Nexum mediation.
                  The client can review, shortlist, or counteroffer.
                </span>
              </div>
            </div>
          )}

          {/* Buttons Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="py-2 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="py-2 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-xs font-bold text-white transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-xs font-bold text-white transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Submitting..." : "Confirm & Send Proposal"}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
