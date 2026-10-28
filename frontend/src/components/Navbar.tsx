"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import Logo from "@/components/Logo";

export default function Navbar() {
  const [isDark, setIsDark] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);

  // Automatically detects when the navbar floats over dark sections
  useEffect(() => {
    const handleScroll = () => {
      const darkSections = document.querySelectorAll('[data-navbar-theme="dark"]');
      const navbarMidpoint = 32; // 64px navbar height / 2

      let overDark = false;
      darkSections.forEach((sec) => {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= navbarMidpoint && rect.bottom >= navbarMidpoint) {
          overDark = true;
        }
      });

      setIsDark(overDark);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-colors duration-300 ease-out backdrop-blur-md ${
        isDark
          ? "border-b border-white/10 bg-[#07090E]/85 text-white"
          : "border-b border-slate-200/70 bg-white/90 text-slate-900"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-6 lg:px-10">
        
        {/* =========================================================
            LEFT GROUP: Logo + Navigation Links
           ========================================================= */}
        <div className="flex items-center gap-10">
          
          {/* Logo (Inverts to white in dark mode, normal with mix-blend in light mode) */}
          <Link href="/" className="flex items-center gap-3 shrink-0 ml-2 transition-transform hover:opacity-90">
            <Logo surface={isDark ? "dark" : "light"} />
            <span
              className={`font-heading text-[21px] font-bold tracking-[-0.03em] transition-colors duration-300 ${
                isDark ? "text-white" : "text-ink"
              }`}
            >
              nexum
            </span>
          </Link>

          {/* Navigation Links */}
          <nav
            className={`hidden lg:flex items-center gap-2 text-[14px] font-medium transition-colors duration-300 ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}
          >
            
            {/* 1. PLATFORM DROPDOWN */}
            <div
              className="relative"
              onMouseEnter={() => setPlatformOpen(true)}
              onMouseLeave={() => setPlatformOpen(false)}
            >
              <button
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  platformOpen
                    ? isDark ? "bg-white/10 text-white" : "bg-slate-100 text-slate-900"
                    : isDark ? "hover:text-white" : "hover:text-slate-900"
                }`}
              >
                <span>Platform</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    platformOpen ? "rotate-180" : ""
                  } ${isDark ? "text-slate-400" : "text-slate-400"}`}
                />
              </button>

              {platformOpen && (
                <div className="absolute left-0 top-full pt-1.5 z-50">
                  <div
                    className={`w-[560px] rounded-2xl border p-6 shadow-2xl grid grid-cols-12 gap-8 ${
                      isDark
                        ? "border-white/10 bg-[#0E1015] text-white"
                        : "border-slate-200/90 bg-white text-slate-900"
                    }`}
                  >
                    <div className="col-span-7 space-y-4">
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                        Core Systems
                      </span>

                      <div className="space-y-4">
                        <Link href="#workspace" className="group block">
                          <div className={`font-heading text-sm font-semibold group-hover:text-cobalt transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>
                            Dual AI Workspaces
                          </div>
                          <p className="text-xs text-slate-400 leading-snug mt-0.5">
                            Private workspaces for client and agency with shared consensus.
                          </p>
                        </Link>

                        <Link href="#change-control" className="group block">
                          <div className={`font-heading text-sm font-semibold group-hover:text-cobalt transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>
                            Section 14 Change Engine
                          </div>
                          <p className="text-xs text-slate-400 leading-snug mt-0.5">
                            Scope changes never rewrite completed milestone history.
                          </p>
                        </Link>

                        <Link href="#recovery" className="group block">
                          <div className={`font-heading text-sm font-semibold group-hover:text-cobalt transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>
                            Payment Recovery Engine
                          </div>
                          <p className="text-xs text-slate-400 leading-snug mt-0.5">
                            PayPal Orders v2 capture with zero blind duplicate retries.
                          </p>
                        </Link>
                      </div>
                    </div>

                    <div className="col-span-5 space-y-6">
                      <div>
                        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2.5">
                          Protocols
                        </span>
                        <ul className="space-y-2 text-xs font-medium text-slate-400">
                          <li><Link href="#consent" className="hover:text-white transition-colors">Consent-Aware Firewall</Link></li>
                          <li><Link href="#spec" className="hover:text-white transition-colors">PRD Testable Rules</Link></li>
                          <li><Link href="#protocol" className="hover:text-white transition-colors">SHA-256 Sign-off</Link></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. RESOURCES DROPDOWN */}
            <div
              className="relative"
              onMouseEnter={() => setResourcesOpen(true)}
              onMouseLeave={() => setResourcesOpen(false)}
            >
              <button
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  resourcesOpen
                    ? isDark ? "bg-white/10 text-white" : "bg-slate-100 text-slate-900"
                    : isDark ? "hover:text-white" : "hover:text-slate-900"
                }`}
              >
                <span>Resources</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    resourcesOpen ? "rotate-180" : ""
                  } ${isDark ? "text-slate-400" : "text-slate-400"}`}
                />
              </button>

              {resourcesOpen && (
                <div className="absolute left-0 top-full pt-1.5 z-50">
                  <div
                    className={`w-[580px] rounded-2xl border p-6 shadow-2xl grid grid-cols-12 gap-8 ${
                      isDark
                        ? "border-white/10 bg-[#0E1015] text-white"
                        : "border-slate-200/90 bg-white text-slate-900"
                    }`}
                  >
                    <div className="col-span-7 space-y-4">
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                        Support
                      </span>

                      <div className="space-y-4">
                        <Link href="#spec" className="group block">
                          <div className={`font-heading text-sm font-semibold group-hover:text-cobalt transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>
                            Help Center
                          </div>
                          <p className="text-xs text-slate-400 leading-snug mt-0.5">Learn about Nexum&apos;s features</p>
                        </Link>

                        <Link href="#spec" className="group block">
                          <div className={`font-heading text-sm font-semibold group-hover:text-cobalt transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>
                            Academy
                          </div>
                          <p className="text-xs text-slate-400 leading-snug mt-0.5">Essential Nexum, explained</p>
                        </Link>

                        <Link href="#protocol" className="group block">
                          <div className={`font-heading text-sm font-semibold group-hover:text-cobalt transition-colors ${isDark ? "text-white" : "text-slate-900"}`}>
                            Developer Docs
                          </div>
                          <p className="text-xs text-slate-400 leading-snug mt-0.5">Start building on Nexum</p>
                        </Link>
                      </div>
                    </div>

                    <div className="col-span-5 space-y-6">
                      <div>
                        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2.5">
                          Company
                        </span>
                        <ul className="space-y-2 text-xs font-medium text-slate-400">
                          <li><Link href="#changelog" className="hover:text-white transition-colors">Changelog</Link></li>
                          <li><Link href="#announcements" className="hover:text-white transition-colors">Announcements</Link></li>
                          <li><Link href="#blog" className="hover:text-white transition-colors">Engineering blog</Link></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Links */}
            <Link
              href="#developers"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                isDark ? "hover:text-white" : "hover:text-slate-900"
              }`}
            >
              Developers
            </Link>
            <Link
              href="#customers"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                isDark ? "hover:text-white" : "hover:text-slate-900"
              }`}
            >
              Customers
            </Link>
            <Link
              href="#pricing"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                isDark ? "hover:text-white" : "hover:text-slate-900"
              }`}
            >
              Pricing
            </Link>
          </nav>
        </div>

        {/* =========================================================
            RIGHT GROUP: Action Buttons (Dynamically Styled)
           ========================================================= */}
        <div className="flex items-center gap-2.5">
          <Link
            href="#signin"
            className={`inline-flex h-9 items-center justify-center rounded-lg border px-3.5 text-xs font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 ${
              isDark
                ? "border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-white/25"
                : "border-slate-200/90 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            Sign in
          </Link>

          <Link
            href="#launch"
            className={`inline-flex h-9 items-center justify-center rounded-lg px-4 text-xs font-semibold shadow-xs transition-all duration-300 ${
              isDark
                ? "bg-white text-slate-900 hover:bg-slate-100"
                : "bg-ink text-white hover:bg-ink-light"
            }`}
          >
            Start for free
          </Link>
        </div>

      </div>
    </header>
  );
}