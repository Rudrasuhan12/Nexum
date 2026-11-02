"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileCheck,
  AlertCircle,
  Briefcase,
  ChevronDown,
} from "lucide-react";
import { FreelancerProposalItem } from "@/lib/freelancer-proposals-types";
import {
  searchFreelancerProjects,
  createDraftProposal,
  updateDraftProposal,
  submitProposal,
} from "@/lib/api-client";

interface ProposalBuilderModalProps {
  onClose: () => void;
  onSubmitNewProposal: (newProposal: FreelancerProposalItem) => void;
}

export default function ProposalBuilderModal({
  onClose,
  onSubmitNewProposal,
}: ProposalBuilderModalProps) {
  const [step, setStep] = useState<number>(1);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  // Form state initialized to neutral empty values
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [projectTitle, setProjectTitle] = useState<string>("");
  const [clientCompany, setClientCompany] = useState<string>("");
  const [budgetRange, setBudgetRange] = useState<string>("");
  const [coverLetter, setCoverLetter] = useState<string>("");
  const [approach, setApproach] = useState<string>("");
  const [proposedPrice, setProposedPrice] = useState<string>("");
  const [duration, setDuration] = useState<string>("4 weeks");
  const [skills, setSkills] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    async function loadOpportunities() {
      try {
        const res = await searchFreelancerProjects({ limit: 50 });
        if (mounted && res.success && res.projects && res.projects.length > 0) {
          setAvailableProjects(res.projects);
          // Set initial default from real database project if available
          const first = res.projects[0];
          setSelectedProjectId(first.id);
          setProjectTitle(first.title);
          setClientCompany(first.client?.name ? `${first.client.name}'s Organization` : "Client Organization");
          const budget = first.budgetCents ? `$${(first.budgetCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })} USD` : "Negotiable";
          setBudgetRange(budget);
          setSkills(Array.isArray(first.skills) ? first.skills.join(", ") : "");
        }
      } catch (err) {
        console.warn("Could not fetch available opportunities", err);
      } finally {
        if (mounted) setIsLoadingProjects(false);
      }
    }
    loadOpportunities();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    const p = availableProjects.find((item) => item.id === projectId);
    if (p) {
      setProjectTitle(p.title);
      setClientCompany(p.client?.name ? `${p.client.name}'s Organization` : "Client Organization");
      const budget = p.budgetCents ? `$${(p.budgetCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })} USD` : "Negotiable";
      setBudgetRange(budget);
      setSkills(Array.isArray(p.skills) ? p.skills.join(", ") : "");
    }
  };

  const handleNext = () => {
    if (step === 1 && (!selectedProjectId.trim() || !projectTitle.trim())) {
      setErrorMsg("Please select a project opportunity.");
      return;
    }
    if (step === 2 && !coverLetter.trim()) {
      setErrorMsg("Please write a brief cover letter.");
      return;
    }
    if (step === 3 && !proposedPrice.trim()) {
      setErrorMsg("Please enter your proposed price.");
      return;
    }
    setErrorMsg("");
    setStep((s) => s + 1);
  };

  const handlePrev = () => {
    setErrorMsg("");
    setStep((s) => s - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const cleanPrice = parseFloat(proposedPrice.replace(/[^0-9.]/g, "")) || 0;
      if (cleanPrice <= 0) {
        setErrorMsg("Please enter a valid price amount greater than 0.");
        setIsSubmitting(false);
        return;
      }
      const priceMinor = Math.round(cleanPrice * 100);
      const weeksNum = parseInt(duration.replace(/[^0-9]/g, ""), 10) || 4;

      // 1. Create draft proposal on the database
      const draftRes = await createDraftProposal(selectedProjectId);
      if (!draftRes.success || !draftRes.proposal) {
        setErrorMsg(draftRes.error || "Failed to create draft proposal on the server.");
        setIsSubmitting(false);
        return;
      }

      const proposalId = draftRes.proposal.id;

      // 2. Persist proposal details
      const updateRes = await updateDraftProposal(proposalId, {
        totalAmountMinor: priceMinor,
        paymentModel: "FIXED_PRICE",
        coverLetter: coverLetter.trim(),
        scopeText: approach.trim() || coverLetter.trim(),
        estimatedDurationWeeks: weeksNum,
        milestones: [
          {
            title: "Project Scope & Verification Delivery",
            amountMinor: priceMinor,
            durationWeeks: weeksNum,
            criteria: ["Full delivery of agreed scope", "Verification and acceptance"],
          },
        ],
      });

      if (!updateRes.success) {
        setErrorMsg(updateRes.error || "Failed to update proposal details on the server.");
        setIsSubmitting(false);
        return;
      }

      // 3. Formally submit proposal
      const submitRes = await submitProposal(proposalId);
      if (!submitRes.success) {
        setErrorMsg(submitRes.error || "Failed to submit proposal to client.");
        setIsSubmitting(false);
        return;
      }

      // Format response into FreelancerProposalItem for list state
      const createdItem: FreelancerProposalItem = {
        id: proposalId,
        projectId: selectedProjectId,
        projectTitle,
        categoryIcon: "GENERIC",
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
          name: clientCompany,
          companyName: clientCompany,
          verified: true,
          industry: "Technology",
          companySize: "10–50 employees",
          location: "Remote",
          postedDate: "Recent",
          totalHires: 1,
          avatarLetter: clientCompany.charAt(0).toUpperCase() || "C",
          avatarBg: "bg-indigo-600 text-white",
        },
        clientBrief: {
          description: `Opportunity: ${projectTitle}`,
          category: "General",
          budgetRange,
          duration,
          deadline: "Flexible",
          requiredSkills: skills.split(",").map((s) => s.trim()).filter(Boolean),
          technicalRequirements: ["Standard production deliverables"],
          acceptanceCriteria: ["Passing verification suite"],
        },
        offer: {
          summary: approach.trim() || coverLetter.trim(),
          approach: approach.trim() || "Milestone-based delivery",
          priceDisplay: `$${cleanPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })} (fixed)`,
          priceType: "FIXED",
          duration,
          expectedStartDate: "Immediate",
          coverLetter,
          attachments: [],
          milestones: [
            {
              id: "m-1",
              orderIndex: 1,
              title: "Project Scope & Verification Delivery",
              amount: `$${cleanPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
              duration,
              acceptanceCriteria: ["Full delivery of agreed scope", "Verification and acceptance"],
            },
          ],
        },
        messagesCount: 0,
        activityTrail: [
          {
            id: `act-${Date.now()}`,
            title: "Proposal Formally Submitted",
            description: `Submitted fixed offer of $${cleanPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}.`,
            actor: "Freelancer",
            timestamp: "Just now",
            type: "SUBMITTED",
          },
        ],
        techTags: skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4),
      };

      onSubmitNewProposal(createdItem);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
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
                  Select Project Opportunity
                </label>
                {isLoadingProjects ? (
                  <div className="py-3 px-3 rounded-xl border border-slate-200 text-xs text-slate-400">
                    Loading open project opportunities...
                  </div>
                ) : availableProjects.length > 0 ? (
                  <div className="relative">
                    <select
                      value={selectedProjectId}
                      onChange={(e) => handleSelectProject(e.target.value)}
                      className="w-full appearance-none px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] pr-8"
                    >
                      {availableProjects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} {p.client?.name ? `(${p.client.name})` : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      placeholder="Enter Project ID or Title"
                      value={selectedProjectId}
                      onChange={(e) => {
                        setSelectedProjectId(e.target.value);
                        setProjectTitle(e.target.value);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
                      required
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. Next.js Enterprise Portal"
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
                  placeholder="e.g. Client Organization"
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
                    placeholder="e.g. $5,000 USD"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Required Skills
                  </label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="e.g. Next.js, TypeScript"
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
                  placeholder="e.g. Next.js app router with Postgres schema and verification suites"
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
                  placeholder="Introduce yourself, outline your experience with similar systems, and describe your delivery roadmap..."
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
                    Proposed Price (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      $
                    </span>
                    <input
                      type="number"
                      step="50"
                      min="50"
                      value={proposedPrice}
                      onChange={(e) => setProposedPrice(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estimated Duration
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 4 weeks"
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
                  <span className="font-bold text-[#4f46e5]">${proposedPrice} USD</span>
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
                className="py-2 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-xs font-bold text-white transition shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
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
