"use client";

import React from "react";
import {
  Lock,
  ShieldCheck,
  GitBranch,
  RefreshCw,
  EyeOff,
  Scale,
} from "lucide-react";

const invariants = [
  {
    icon: Lock,
    title: "Dual SHA-256 Consensus",
    desc: "Both parties sign identical hash",
  },
  {
    icon: ShieldCheck,
    title: "PayPal Orders v2",
    desc: "Idempotent server-side capture",
  },
  {
    icon: GitBranch,
    title: "Section 14 Engine",
    desc: "Accepted milestones never rewritten",
  },
  {
    icon: RefreshCw,
    title: "Deterministic Recovery",
    desc: "Zero blind duplicate retries",
  },
  {
    icon: EyeOff,
    title: "Consent Firewall",
    desc: "Budget ceilings never leaked",
  },
  {
    icon: Scale,
    title: "OECD Compliance",
    desc: "Truthful cross-border settlement",
  },
];

export default function TrustTicker() {
  return (
    <div className="relative w-full border-y border-slate-200/80 bg-white py-8 overflow-hidden group">
      
      {/* Self-contained CSS animation to guarantee continuous 60fps motion */}
      <style>{`
        @keyframes continuousMarquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .marquee-track {
          display: flex;
          flex-shrink: 0;
          align-items: center;
          gap: 1rem;
          animation: continuousMarquee 26s linear infinite;
          will-change: transform;
        }
        .group:hover .marquee-track {
          animation-play-state: paused;
        }
      `}</style>

      {/* Editorial Header Tag */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-4 text-center">
        <span className="font-mono text-[11px] uppercase tracking-widest text-slate-400 font-medium">
          Architectural Invariants • Enforced by Code
        </span>
      </div>

      {/* 
        Marquee Stage with Left and Right Edge Fade Masks 
      */}
      <div className="relative flex w-full overflow-hidden select-none [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        
        {/* Track 1 */}
        <div className="marquee-track pr-4">
          {invariants.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={`t1-${index}`}
                className="flex items-center gap-3 rounded-full border border-slate-200/90 bg-white px-5 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition hover:border-slate-300 hover:shadow-md cursor-pointer shrink-0"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-heading text-xs font-bold text-slate-900 whitespace-nowrap">
                    {item.title}
                  </span>
                  <span className="text-slate-300 font-light">•</span>
                  <span className="font-sans text-xs text-slate-500 whitespace-nowrap">
                    {item.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Track 2 (Duplicates Track 1 for an uninterrupted infinite loop) */}
        <div className="marquee-track pr-4" aria-hidden="true">
          {invariants.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={`t2-${index}`}
                className="flex items-center gap-3 rounded-full border border-slate-200/90 bg-white px-5 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition hover:border-slate-300 hover:shadow-md cursor-pointer shrink-0"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-heading text-xs font-bold text-slate-900 whitespace-nowrap">
                    {item.title}
                  </span>
                  <span className="text-slate-300 font-light">•</span>
                  <span className="font-sans text-xs text-slate-500 whitespace-nowrap">
                    {item.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}