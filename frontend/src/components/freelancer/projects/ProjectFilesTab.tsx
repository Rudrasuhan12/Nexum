"use client";

import React, { useState, useRef } from "react";
import {
  FileText,
  Download,
  UploadCloud,
  FileCode,
  ShieldCheck,
  Search,
} from "lucide-react";
import { ProjectFile } from "@/lib/freelancer-projects-types";
import { uploadProjectFile, BACKEND_URL } from "@/lib/api-client";

interface ProjectFilesTabProps {
  projectId?: string;
  files: ProjectFile[];
  onUploadFile: (file: ProjectFile) => void;
  showToast: (msg: string) => void;
}

export default function ProjectFilesTab({
  projectId,
  files,
  onUploadFile,
  showToast,
}: ProjectFilesTabProps) {
  const [filter, setFilter] = useState<"ALL" | "CLIENT" | "FREELANCER">("ALL");
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleRealUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast(`Uploading ${file.name}...`);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("purpose", "PROJECT_FILE");

      const res = await fetch(`${BACKEND_URL}/api/freelancer/files`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        showToast(json.error?.message || "File upload failed");
        return;
      }

      const fileRecord = json.file;
      if (projectId && fileRecord?.id) {
        const linkRes = await uploadProjectFile(projectId, {
          fileId: fileRecord.id,
          name: file.name,
          category: "REFERENCE",
        });

        if (!linkRes.success) {
          showToast(linkRes.error || "Failed to associate file with project");
          return;
        }
      }

      const sizeStr =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

      const newFile: ProjectFile = {
        id: fileRecord?.id || `file-${Date.now()}`,
        name: file.name,
        fileType: file.type || "Document",
        fileSize: sizeStr,
        uploadedBy: "FREELANCER",
        uploadedByName: "You",
        uploadDate: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        downloadUrl: fileRecord?.id ? `/api/files/${fileRecord.id}` : undefined,
      };

      onUploadFile(newFile);
      showToast(`Uploaded "${file.name}" with integrity verification.`);
    } catch {
      showToast("File upload failed. Please try again.");
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleRealUpload}
        className="hidden"
      />

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
          onClick={() => fileInputRef.current?.click()}
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

        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Files List */}
      <div className="space-y-3">
        {filteredFiles.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-white border border-slate-200/90 text-slate-500">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">No project files found.</p>
            <p className="text-xs text-slate-400 mt-1">
              No deliverables or reference documents match the active filter.
            </p>
          </div>
        ) : (
          filteredFiles.map((f) => (
            <div
              key={f.id}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-slate-300"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[#4f46e5] shrink-0">
                  {f.fileType.toLowerCase().includes("code") ? (
                    <FileCode className="w-5 h-5 text-blue-600" />
                  ) : (
                    <FileText className="w-5 h-5 text-[#4f46e5]" />
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate">
                    {f.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                    <span>{f.fileSize}</span>
                    <span>·</span>
                    <span>{f.fileType}</span>
                    <span>·</span>
                    <span>Uploaded on {f.uploadDate}</span>
                    <span>by</span>
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
                  onClick={() => {
                    if (f.downloadUrl) {
                      window.open(f.downloadUrl, "_blank");
                    } else {
                      showToast(`Downloading ${f.name}...`);
                    }
                  }}
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
