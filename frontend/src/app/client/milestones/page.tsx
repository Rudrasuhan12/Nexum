"use client";

import React from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopHeader from "@/components/DashboardTopHeader";
import ClientMilestonesView from "@/components/client/ClientMilestonesView";

export default function DedicatedClientMilestonesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans selection:bg-[#4f46e5] selection:text-white">
      {/* 1. Left Navbar Sidebar */}
      <DashboardSidebar
        currentRole="CLIENT"
        activeTab="milestones"
        onTabChange={(tab) => {
          router.push(`/client/dashboard?tab=${tab}`);
        }}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopHeader />

        <main className="flex-1 px-4 sm:px-8 py-6 max-w-7xl w-full mx-auto space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-heading">
              Milestone Schedule & Deliverable Approvals
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Track deadlines, inspect test verification logs, and release pre-funded escrow payments under canonical dual consensus.
            </p>
          </div>

          <ClientMilestonesView
            onOpenProjectWorkspace={(projectId) => {
              router.push(`/client/projects/${projectId}?tab=milestones`);
            }}
          />
        </main>
      </div>
    </div>
  );
}

