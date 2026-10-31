"use client";

import React, { useState } from "react";
import {
  FileText,
  Download,
  UploadCloud,
  FileCode,
  ShieldCheck,
  Search,
} from "lucide-react";
import { ProjectFile } from "@/lib/freelancer-projects-types";

interface ProjectFilesTabProps {
  files: ProjectFile[];
  onUploadFile: (file: ProjectFile) => void;
  showToast: (msg: string) => void;
}

export default function ProjectFilesTab({
  files,
  onUploadFile,
  showToast,
}: ProjectFilesTabProps) {
  const [filter, setFilter] = useState<"ALL" | "CLIENT" | "FREELANCER">("ALL");
  const [search, setSearch] = useState("");

  const filteredFiles = files.filter((f) => {
    if (filter === "CLIENT" && f.uploadedBy !== "CLIENT") return false;
    if (filter === "FREELANCER" && f.uploadedBy !== "FREELANCER") return false;
    if (search.trim()) {
      return (
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.fileType.toLowerCase().includes(search.toLowerCase())
      );
    }
    return true;
  });

  const handleSimulateUpload = () => {
    const newFile: ProjectFile = {
      id: `file-${Date.now()}`,
      name: "Architecture_Diagram_v2.png",
      fileType: "PNG Image",
      fileSize: "1.2 MB",
      uploadedBy: "FREELANCER",
      uploadedByName: "Sambit Mohanty",
      uploadDate: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      relatedMilestoneTitle: "Milestone 2: Backend Development",
    };
    onUploadFile(newFile);
    showToast(`Uploaded "${newFile.name}" with SHA-256 integrity hash.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            Project Files & Artifacts ({files.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Bilateral document store segregated by project isolation boundaries.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSimulateUpload}
          className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-xs font-bold text-white transition shadow-xs cursor-pointer shrink-0"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload File</span>
        </button>
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
          {(["ALL", "CLIENT", "FREELANCER"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`py-1 px-3 rounded-lg transition cursor-pointer ${
                filter === tab
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab === "ALL" ? "All Files" : tab === "CLIENT" ? "Client Shared" : "My Deliverables"}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-hidden focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
          />
        </div>
      </div>

      {/* Files List */}
      <div className="space-y-2.5">
        {filteredFiles.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-slate-200 text-slate-500 text-xs">
            No files found matching your search.
          </div>
        ) : (
          filteredFiles.map((f) => (
            <div
              key={f.id}
              className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#4f46e5] shrink-0">
                  {f.fileType.includes("SQL") || f.fileType.includes("Code") || f.fileType.includes("JSON") ? (
                    <FileCode className="w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {f.name}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {f.fileType} · {f.fileSize} · Uploaded {f.uploadDate} by{" "}
                    <span className="font-semibold text-slate-600">
                      {f.uploadedByName}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    f.uploadedBy === "CLIENT"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-purple-50 text-purple-700 border-purple-200"
                  }`}
                >
                  {f.uploadedBy === "CLIENT" ? "Client" : "Freelancer"}
                </span>

                <button
                  type="button"
                  onClick={() => showToast(`Downloading ${f.name}...`)}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          Zero Cross-Contamination: Only authenticated stakeholders in this project workspace can view or download files.
        </span>
      </div>
    </div>
  );
}

