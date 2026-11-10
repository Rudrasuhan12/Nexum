"use client";

import React from "react";

interface FormattedAiMessageProps {
  content: string;
  isUser?: boolean;
}

export default function FormattedAiMessage({ content, isUser = false }: FormattedAiMessageProps) {
  if (!content) return null;

  // If user message, render as clean natural text
  if (isUser) {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  // Split text by code blocks (```lang ... ```)
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 text-xs sm:text-[13px] leading-relaxed select-text">
      {parts.map((part, pIdx) => {
        if (part.startsWith("```")) {
          const match = part.match(/^```([a-zA-Z0-9_-]*)\n([\s\S]*?)```$/);
          const lang = match ? match[1] : "";
          const code = match ? match[2] : part.slice(3, -3);

          return (
            <div key={pIdx} className="my-2.5 rounded-xl overflow-hidden border border-slate-800 bg-[#0f172a] shadow-sm">
              {lang && (
                <div className="px-3 py-1 bg-slate-800 text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider border-b border-slate-700 flex justify-between items-center">
                  <span>{lang}</span>
                </div>
              )}
              <pre className="p-3 text-[11px] sm:text-xs font-mono text-emerald-400 overflow-x-auto leading-normal">
                <code>{code.trim()}</code>
              </pre>
            </div>
          );
        }

        // Process non-code lines
        const lines = part.split("\n");
        return (
          <div key={pIdx} className="space-y-1">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) {
                return <div key={lIdx} className="h-1" />;
              }

              // Divider
              if (trimmed === "---" || trimmed === "___" || trimmed.startsWith("────")) {
                return <hr key={lIdx} className="my-2 border-slate-200" />;
              }

              // Header lines (### or clean capitalized section headers)
              const isHeading = /^#{1,4}\s+/.test(trimmed) || /^[A-Z0-9\s&—:]{4,40}:$/.test(trimmed);
              if (isHeading) {
                const title = trimmed.replace(/^#{1,4}\s+/, "").replace(/\*\*/g, "");
                return (
                  <h4 key={lIdx} className="font-bold text-slate-900 text-xs sm:text-sm pt-2 pb-0.5 tracking-tight flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                    <span>{title}</span>
                  </h4>
                );
              }

              // Bullet points (starts with •, *, -)
              const isBullet = /^[•*-]\s+/.test(trimmed);
              if (isBullet) {
                const bulletText = trimmed.replace(/^[•*-]\s+/, "");
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-1.5">
                    <span className="text-indigo-600 font-bold shrink-0 mt-0.5">•</span>
                    <span className="flex-1">{renderInlineStyles(bulletText)}</span>
                  </div>
                );
              }

              // Numbered list items (1., 2., etc)
              const numMatch = trimmed.match(/^(\d+[\.\)])\s+(.*)/);
              if (numMatch) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-1.5">
                    <span className="text-indigo-600 font-bold shrink-0 text-[11px] mt-0.5">{numMatch[1]}</span>
                    <span className="flex-1">{renderInlineStyles(numMatch[2])}</span>
                  </div>
                );
              }

              return (
                <p key={lIdx} className="leading-relaxed">
                  {renderInlineStyles(trimmed)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function renderInlineStyles(text: string): React.ReactNode {
  // Parse inline **bold** and `code` spans cleanly without raw symbols
  const tokens = text.split(/(\*\*[^*]+?\*\*|`[^`]+?`)/g);

  return (
    <>
      {tokens.map((token, i) => {
        if (token.startsWith("**") && token.endsWith("**")) {
          return (
            <strong key={i} className="font-bold text-slate-900">
              {token.slice(2, -2)}
            </strong>
          );
        }
        if (token.startsWith("`") && token.endsWith("`")) {
          return (
            <code key={i} className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-indigo-700 border border-slate-200/80">
              {token.slice(1, -1)}
            </code>
          );
        }
        return token;
      })}
    </>
  );
}

