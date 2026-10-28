"use client";

import React from "react";

export default function EditorialQuote() {
  return (
    <div className="relative w-full h-full min-h-[540px] lg:min-h-[660px] flex flex-col items-center justify-center bg-attio-dots px-6 py-20">
      
      <div className="relative mx-auto max-w-4xl text-center">
        {/* Editorial Testimonial Quote */}
        <blockquote className="font-heading text-3xl sm:text-5xl lg:text-[54px] font-medium tracking-[-0.035em] text-slate-900 leading-[1.18]">
          “When we locked our first milestone on Nexum, I instantly got the feeling{" "}
          <span className="text-slate-400 italic font-serif">this was</span> the next generation of agreements.”
        </blockquote>

        {/* Attribution */}
        <div className="mt-10 space-y-1">
          <div className="font-heading text-sm sm:text-base font-bold text-slate-900">
            Elena Rostova
          </div>
          <div className="font-sans text-xs sm:text-sm text-slate-500 font-medium">
            Head of Engineering • Horizon Labs
          </div>
        </div>
      </div>

    </div>
  );
}