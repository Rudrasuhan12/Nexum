"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  GitBranch,
  FileText,
  Server,
  Key,
  ShieldCheck,
  Award,
  Plus,
  Trash2,
  Check,
} from "lucide-react";

interface HandoverItemTemplate {
  category: "REPOSITORY" | "DOCUMENTATION" | "DEPLOYMENT" | "CREDENTIALS" | "TESTS" | "IP_TRANSFER" | "CUSTOM";
  title: string;
  description: string;
  isRequired: boolean;
  enabled: boolean;
}

const DEFAULT_TEMPLATES: HandoverItemTemplate[] = [
  {
    category: "REPOSITORY",
    title: "Production Repository & Source Code Transfer",
    description: "Production branch link, GitHub/GitLab repository ownership transfer or release archive tag.",
    isRequired: true,
    enabled: true,
  },
  {
    category: "DOCUMENTATION",
    title: "System Architecture & API Documentation",
    description: "Comprehensive README, API endpoint specifications, data models, and component flowcharts.",
    isRequired: true,
    enabled: true,
  },
  {
    category: "DEPLOYMENT",
    title: "Deployment Runbook & Environment Setup",
    description: "Step-by-step production hosting runbook, sanitized .env.example, and build/deploy scripts.",
    isRequired: true,
    enabled: true,
  },
  {
    category: "CREDENTIALS",
    title: "Administrative Access & Third-Party Keys",
    description: "Verification that all administrative accounts, cloud services, and third-party webhook configs are transferred.",
    isRequired: true,
    enabled: true,
  },
  {
    category: "TESTS",
    title: "Test Suites & Quality Verification Report",
    description: "Automated test execution logs, coverage metrics, and confirmation that all test suites pass without regression.",
    isRequired: true,
    enabled: true,
  },
  {
    category: "IP_TRANSFER",
    title: "Intellectual Property (IP) Release Declaration",
    description: "Explicit sign-off confirming full copyright and intellectual property assignment to the client.",
    isRequired: true,
    enabled: true,
  },
];

interface ProjectHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (items: Array<{ title: string; description: string; category: any; isRequired: boolean }>) => Promise<void>;
  projectName?: string;
}

export default function ProjectHandoverModal({
  isOpen,
  onClose,
  onConfirm,
  projectName = "Active Project",
}: ProjectHandoverModalProps) {
  const [items, setItems] = useState<HandoverItemTemplate[]>(DEFAULT_TEMPLATES);
  const [customTitle, setCustomTitle] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleItem = (index: number) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const handleAddCustom = () => {
    if (!customTitle.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        category: "CUSTOM",
        title: customTitle.trim(),
        description: customDesc.trim() || "Custom project asset handover requirement",
        isRequired: true,
        enabled: true,
      },
    ]);
    setCustomTitle("");
    setCustomDesc("");
    setShowAddCustom(false);
  };

  const removeCustomItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    const selected = items
      .filter((i) => i.enabled)
      .map(({ title, description, category, isRequired }) => ({
        title,
        description,
        category,
        isRequired,
      }));

    if (selected.length === 0) return;

    try {
      setIsSubmitting(true);
      await onConfirm(selected);
      onClose();
    } catch {
      // Handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "REPOSITORY":
        return <GitBranch className="w-4 h-4 text-purple-600" />;
      case "DOCUMENTATION":
        return <FileText className="w-4 h-4 text-blue-600" />;
      case "DEPLOYMENT":
        return <Server className="w-4 h-4 text-emerald-600" />;
      case "CREDENTIALS":
        return <Key className="w-4 h-4 text-amber-600" />;
      case "TESTS":
        return <ShieldCheck className="w-4 h-4 text-cyan-600" />;
      case "IP_TRANSFER":
        return <Award className="w-4 h-4 text-rose-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-600" />;
    }
  };

  const enabledCount = items.filter((i) => i.enabled).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="font-heading text-lg font-bold text-slate-900">
                Initiate Project Handover Checklist
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-lg leading-relaxed">
              Select the documents, code repositories, credentials, and runbooks the freelancer must provide before final contract completion for <strong>{projectName}</strong>.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Checklist Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1 divide-y divide-slate-100">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-semibold text-slate-700">
              Checklist Requirements ({enabledCount} selected)
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Standard Professional Template
            </span>
          </div>

          <div className="space-y-2.5 pt-2">
            {items.map((item, idx) => (
              <div
                key={idx}
                onClick={() => toggleItem(idx)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  item.enabled
                    ? "bg-white border-slate-300 shadow-2xs"
                    : "bg-slate-50/60 border-slate-200 opacity-60"
                }`}
              >
                {/* Checkbox */}
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${
                    item.enabled
                      ? "bg-slate-900 border-slate-900 text-white"
                      : "bg-white border-slate-300"
                  }`}
                >
                  {item.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0">
                  {getCategoryIcon(item.category)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-heading text-xs font-bold text-slate-900 truncate">
                      {item.title}
                    </span>
                    {item.category === "CUSTOM" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCustomItem(idx);
                        }}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11.5px] text-slate-500 mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Add Custom Requirement Box */}
          <div className="pt-3">
            {!showAddCustom ? (
              <button
                type="button"
                onClick={() => setShowAddCustom(true)}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 text-slate-600 hover:text-slate-900 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 bg-slate-50/50"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom Document Requirement</span>
              </button>
            ) : (
              <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Custom Handover Requirement</span>
                  <button
                    type="button"
                    onClick={() => setShowAddCustom(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Raw Figma Export & Vector Assets"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
                <textarea
                  placeholder="Describe what specific files, links, or exports the freelancer should supply..."
                  rows={2}
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCustom(false)}
                    className="px-3 py-1 text-xs text-slate-500 hover:text-slate-800 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCustom}
                    disabled={!customTitle.trim()}
                    className="px-3 py-1 text-xs bg-slate-900 text-white rounded-lg font-semibold disabled:opacity-50"
                  >
                    Add to Checklist
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs text-slate-500 font-mono">
            {enabledCount} required items will be requested
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-2xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || enabledCount === 0}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Generating Checklist...</span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Send Handover Checklist</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

