"use client";

import React from "react";

interface UnifiedLoadingWidgetProps {
  type?: "fullscreen" | "section" | "inline";
  message?: string;
  variant?: "indigo" | "emerald" | "rose" | "slate" | "white"; // ⭐️ Added "white"
}

export default function UnifiedLoadingWidget({
  type = "section",
  message = "Loading...",
  variant = "indigo",
}: UnifiedLoadingWidgetProps) {
  
  // Mapping variants to Tailwind classes
  const colors = {
    indigo: "border-indigo-600 text-indigo-600",
    emerald: "border-emerald-600 text-emerald-600",
    rose: "border-rose-600 text-rose-600",
    slate: "border-slate-600 text-slate-600",
    white: "border-white text-white", // ⭐️ Added white mapping
  };

  const spinnerBase = "animate-spin rounded-full border-t-transparent";
  
  // VIEW 1: FULLSCREEN OVERLAY
  if (type === "fullscreen") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className={`h-12 w-12 border-4 ${spinnerBase} ${colors[variant]}`}></div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">
            {message}
          </p>
        </div>
      </div>
    );
  }

  // VIEW 2: SECTION LOADING (Inside a card or page area)
  if (type === "section") {
    return (
      <div className="flex flex-col items-center justify-center p-12 w-full min-h-[200px]">
        <div className={`h-8 w-8 border-4 ${spinnerBase} ${colors[variant]}`}></div>
        {message && (
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {message}
          </p>
        )}
      </div>
    );
  }

  // VIEW 3: INLINE LOADING (Inside buttons)
  return (
    <div className="flex items-center justify-center gap-2">
      {/* 
          We use colors[variant] here now instead of hardcoded border-white 
          to allow for colored spinners inside white buttons if needed.
      */}
      <div className={`h-4 w-4 border-2 ${spinnerBase} ${colors[variant]}`}></div>
      {message && <span className="font-medium">{message}</span>}
    </div>
  );
}