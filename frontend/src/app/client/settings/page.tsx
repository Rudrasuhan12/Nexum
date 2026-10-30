"use client";

import React, { Suspense } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopHeader from "@/components/DashboardTopHeader";
import ClientSettingsView from "@/components/client/ClientSettingsView";
import { useAuth } from "@/context/AuthContext";
import { DEMO_USERS } from "@/lib/auth-types";

function ClientSettingsPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const client = user || DEMO_USERS.CLIENT;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. Global Navigation Sidebar */}
      <DashboardSidebar
        currentRole="CLIENT"
        activeTab="settings"
        onTabChange={(tab) => {
          if (tab === "overview") router.push("/client/dashboard");
          else if (tab === "settings") router.push("/client/settings");
          else router.push(`/client/dashboard?tab=${tab}`);
        }}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopHeader
          roleLabel="Buyer Workspace"
          title="Account & Workspace Settings"
          subtitle="Identity, Credentials, and Payment Rails"
        />

        <main className="p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-6 flex-1">
          <ClientSettingsView client={client} />
        </main>
      </div>
    </div>
  );
}

export default function ClientSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-xs text-slate-500 font-medium">
          Loading workspace settings...
        </div>
      }
    >
      <ClientSettingsPageContent />
    </Suspense>
  );
}

