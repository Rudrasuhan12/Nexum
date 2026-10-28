"use client";

import React, { useEffect, useRef, useState } from "react";
import { GitBranch, Shield, DollarSign, Lock } from "lucide-react";

export default function BentoProofGrid() {
  const cardsRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Bidirectional Viewport Observer (Tracks the cards directly)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // True when cards enter viewport, resets to false when scrolling away
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.15, // Must be 15% physically visible on screen
        rootMargin: "0px 0px -80px 0px", // Prevents early firing before you arrive
      }
    );

    if (cardsRef.current) observer.observe(cardsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="change-control"
      className="relative w-full bg-[#FAF9F6] py-20 sm:py-28 border-b border-slate-200/80 overflow-hidden"
    >
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        
        <div
          className="max-w-2xl mb-14"
          style={{
            transition: "opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1), transform 0.85s cubic-bezier(0.16, 1, 0.3, 1), filter 0.85s cubic-bezier(0.16, 1, 0.3, 1)",
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0px)" : "translateY(20px)",
            filter: isVisible ? "blur(0px)" : "blur(8px)",
          }}
        >
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 block">
            Protocol Invariants
          </span>
          <h2 className="font-heading text-3xl sm:text-5xl font-bold tracking-[-0.035em] text-slate-900 leading-[1.12]">
            Built for contractual discipline.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-500 font-normal leading-relaxed">
            Three deterministic safeguards that permanently eliminate scope drift, hidden checkout spreads, and private budget leakage.
          </p>
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          
          {/* CARD 1: SCOPE BRANCHING (Phase 1: 120ms delay)*/}
          <div
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-md hover:-translate-y-1"
            style={{
              transition: "opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1), transform 0.85s cubic-bezier(0.16, 1, 0.3, 1), filter 0.85s cubic-bezier(0.16, 1, 0.3, 1)",
              transitionDelay: isVisible ? "120ms" : "0ms",
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0px)" : "translateY(32px)",
              filter: isVisible ? "blur(0px)" : "blur(10px)",
            }}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 text-slate-400">
                <span className="font-mono text-[10px] tracking-wider uppercase font-medium">01 // Section 14</span>
                <GitBranch className="h-4 w-4 text-slate-600" />
              </div>

              <h3 className="font-heading text-lg font-bold text-slate-900 mt-4">
                Milestone-Aware Routing
              </h3>
              <p className="mt-1.5 text-xs text-slate-500 font-normal leading-relaxed">
                Scope additions branch into isolated follow-on milestones. Historical work is sealed and immutable.
              </p>

              <div className="mt-6 space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                  <div className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-slate-600" />
                    <span className="text-slate-800">M1: Architecture</span>
                  </div>
                  <span className="text-slate-500 text-[10px]">Locked • $1,200</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                  <span className="text-slate-800">M2: Storefront Core</span>
                  <span className="text-slate-500 text-[10px]">Active • $1,600</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-900 bg-slate-900 text-white">
                  <span className="font-medium">M4: Follow-on Fork</span>
                  <span className="text-[10px] text-slate-300">+$800 • +5 Days</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between font-mono text-[10px] text-slate-400">
              <span>Past Work Preserved</span>
              <span>Dual Sign-off</span>
            </div>
          </div>

          {/*CARD 2: PAYMENT READINESS (Phase 2: 260ms delay) */}
          <div
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-md hover:-translate-y-1"
            style={{
              transition: "opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1), transform 0.85s cubic-bezier(0.16, 1, 0.3, 1), filter 0.85s cubic-bezier(0.16, 1, 0.3, 1)",
              transitionDelay: isVisible ? "260ms" : "0ms",
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0px)" : "translateY(32px)",
              filter: isVisible ? "blur(0px)" : "blur(10px)",
            }}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 text-slate-400">
                <span className="font-mono text-[10px] tracking-wider uppercase font-medium">02 // Section 15.1</span>
                <DollarSign className="h-4 w-4 text-slate-600" />
              </div>

              <h3 className="font-heading text-lg font-bold text-slate-900 mt-4">
                Radical Fee Transparency
              </h3>
              <p className="mt-1.5 text-xs text-slate-500 font-normal leading-relaxed">
                Contract figures locked server-side before checkout. Every provider fee is explicitly disclosed.
              </p>

              <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 font-mono text-xs space-y-2.5">
                <div className="flex justify-between items-center text-[11px] pb-1.5 border-b border-slate-200/60">
                  <span className="text-slate-500">Contract Amount:</span>
                  <span className="font-bold text-slate-900">$1,200.00 USD</span>
                </div>

                <div className="flex justify-between items-center text-[11px] pb-1.5 border-b border-slate-200/60">
                  <span className="text-slate-500">Processing Fee:</span>
                  <span className="text-slate-700 font-medium">$34.80 USD</span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Net Recipient:</span>
                  <span className="font-bold text-slate-900">$1,165.20 USD</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between font-mono text-[10px] text-slate-400">
              <span>OECD Paper 167</span>
              <span>Zero Hidden Terms</span>
            </div>
          </div>

          {/* CARD 3: CONSENT FIREWALL (Phase 3: 400ms delay) */}
          <div
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-md hover:-translate-y-1"
            style={{
              transition: "opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1), transform 0.85s cubic-bezier(0.16, 1, 0.3, 1), filter 0.85s cubic-bezier(0.16, 1, 0.3, 1)",
              transitionDelay: isVisible ? "400ms" : "0ms",
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateY(0px)" : "translateY(32px)",
              filter: isVisible ? "blur(0px)" : "blur(10px)",
            }}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 text-slate-400">
                <span className="font-mono text-[10px] tracking-wider uppercase font-medium">03 // Protocol FR-03</span>
                <Shield className="h-4 w-4 text-slate-600" />
              </div>

              <h3 className="font-heading text-lg font-bold text-slate-900 mt-4">
                Consent-Aware Firewall
              </h3>
              <p className="mt-1.5 text-xs text-slate-500 font-normal leading-relaxed">
                Client maximum budgets and negotiation strategy are physically stripped before proposals leave the workspace.
              </p>

              <div className="mt-6 space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                  <span className="text-slate-500">Public Offer:</span>
                  <span className="font-bold text-slate-900">$4,000.00 USD</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                  <span className="text-slate-500">Private Ceiling:</span>
                  <span className="blur-[4px] select-none text-slate-400 font-bold">$5,500.00</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
                  <span className="text-slate-500">Internal Strategy:</span>
                  <span className="text-[10px] text-slate-400 font-sans italic">[Redacted on wire]</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between font-mono text-[10px] text-slate-400">
              <span>Strategy Protected</span>
              <span>100% Confidential</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}