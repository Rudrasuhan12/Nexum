"use client";

import React, { useState } from "react";
import {
  Send,
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileCode,
  FileText,
  Sparkles,
  ArrowUp,
} from "lucide-react";
import { DemoUser } from "@/lib/auth-types";

interface FreelancerWorkspaceViewProps {
  freelancer: DemoUser;
  client: DemoUser;
  showToast: (msg: string) => void;
}

export default function FreelancerWorkspaceView({
  freelancer,
  client,
  showToast,
}: FreelancerWorkspaceViewProps) {
  const [githubPrUrl, setGithubPrUrl] = useState("https://github.com/proofloop/gateway/pull/42");
  const [loomDemoUrl, setLoomDemoUrl] = useState("https://www.loom.com/share/proofloop-milestone2-demo");
  const [submissionNotes, setSubmissionNotes] = useState(
    "All test criteria met: PayPal REST v2 order capture verified, SHA-256 signature validation passing with mock payloads, idempotency cache deduplicates within 30s window."
  );
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Array<{ id: string; sender: string; time: string; text: string; isAi?: boolean }>>([
    {
      id: "m1",
      sender: client.name,
      time: "10:15 AM",
      text: "Hey Sambit, checked the latest PR for Milestone 2. Running through test cases on our end now.",
    },
    {
      id: "m2",
      sender: "Nexum AI",
      time: "10:16 AM",
      text: "✨ Delivery receipt recorded for Pull Request #42. Both parties have verified Agreement v1.2.",
      isAi: true,
    },
    {
      id: "m3",
      sender: freelancer.name,
      time: "10:30 AM",
      text: "Thanks Alex! Let me know if you need any adjustments to the webhook deduplication timeout.",
    },
  ]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [
      ...prev,
      { id: `msg_${Date.now()}`, sender: freelancer.name, time: now, text: chatInput.trim() },
    ]);
    setChatInput("");
    showToast("Message delivered to client via Nexum AI mediation.");
  };

  const handleUpdateDeliverables = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Deliverables submission updated and hashed to state consensus ledger!");
  };

  return (
    <div className="space-y-8">
      {/* Workspace Header */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Active Contract Workspace
            </span>
            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Agreement
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Bilateral E-Commerce Payment Rails
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Client: {client.name} ({client.companyOrHandle}) · Target Completion: Nov 24, 2026
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-1 text-xs">
          <div className="flex items-center gap-1.5 font-mono text-indigo-700 font-bold">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>hash: 0x9f8c2b7e...</span>
          </div>
          <div className="text-[11px] text-slate-400">Escrow Value: $5,700.00 USD</div>
        </div>
      </section>

      {/* Deliverables Submission Station */}
      <section className="rounded-2xl border border-indigo-200/80 bg-white p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-700 uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
              <span>Milestone 2 Deliverables Station</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              PayPal REST v2 Orders Webhook Ingestion Engine ($1,500.00 USD)
            </h3>
          </div>

          <span className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-1.5 shrink-0">
            <Clock className="w-3.5 h-3.5" />
            <span>Awaiting Client Approval</span>
          </span>
        </div>

        {/* Deliverables Form */}
        <form onSubmit={handleUpdateDeliverables} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                GitHub Pull Request URL
              </label>
              <div className="relative">
                <FileCode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={githubPrUrl}
                  onChange={(e) => setGithubPrUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Loom Demo Video Walkthrough
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={loomDemoUrl}
                  onChange={(e) => setLoomDemoUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Deliverable Verification Notes & Test Results
            </label>
            <textarea
              rows={2}
              value={submissionNotes}
              onChange={(e) => setSubmissionNotes(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none leading-relaxed"
            />
          </div>

          {/* Test Criteria Verification */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Automated Test Criteria (Dual Consensus Checks)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>SHA-256 Signatures Passing</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>30s Idempotent Window Verified</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Orders v2 GET Fallback Working</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Update Submission & Log Consensus State</span>
            </button>
          </div>
        </form>
      </section>

      {/* Bilateral Project Chat */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Project Timeline & Messages</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Mediated by Nexum AI</span>
            </span>
          </div>
          <span className="text-xs text-slate-400">Client: {client.name}</span>
        </div>

        {/* Message Stream */}
        <div className="space-y-3 min-h-[180px] max-h-[300px] overflow-y-auto pr-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`p-3.5 rounded-2xl text-xs space-y-1 ${
                m.isAi
                  ? "bg-purple-50/70 border border-purple-200/70 text-purple-900"
                  : m.sender === freelancer.name
                  ? "bg-indigo-50/70 border border-indigo-200/70 text-indigo-950 ml-auto max-w-xl"
                  : "bg-slate-50 border border-slate-200/80 text-slate-800 mr-auto max-w-xl"
              }`}
            >
              <div className="flex items-center justify-between gap-4 font-bold text-[11px] text-slate-500">
                <span>{m.sender}</span>
                <span>{m.time}</span>
              </div>
              <p className="leading-relaxed">{m.text}</p>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSendChat} className="flex items-center gap-2 pt-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={`Message ${client.name}... (Nexum AI verifies scope & price guardrails)`}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center justify-center transition cursor-pointer shadow-xs shrink-0"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>
      </section>
    </div>
  );
}
