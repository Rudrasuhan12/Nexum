"use client";

import React, { Suspense } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopHeader from "@/components/DashboardTopHeader";
import ClientFreelancersView from "@/components/client/ClientFreelancersView";

function FreelancerDiscoveryPageContent() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. Global Navigation Sidebar */}
      <DashboardSidebar
        currentRole="CLIENT"
        activeTab="freelancers"
        onTabChange={(tab) => {
          if (tab === "overview") router.push("/client/dashboard");
          else if (tab === "freelancers") router.push("/client/freelancers");
          else router.push(`/client/dashboard?tab=${tab}`);
        }}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopHeader
          roleLabel="Buyer Workspace"
          title="Find Freelancers"
          subtitle="Verified Talent & Explainable Match Scores"
        />

        <main className="p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6 flex-1">
          <ClientFreelancersView
            onOpenProjectWorkspace={(projectId) => {
              router.push(`/client/projects/${projectId}`);
            }}
          />
        </main>
      </div>
    </div>
  );
}

export default function FreelancerDiscoveryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-xs text-slate-500 font-medium">
          Loading talent directory...
        </div>
      }
    >
      <FreelancerDiscoveryPageContent />
    </Suspense>
  );
}
