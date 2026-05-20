import React from "react";
import { Play, Pause, Square, Layers, AlertCircle, Settings } from "lucide-react";

interface CaptureStatusIndicatorProps {
  isCapturing: boolean;
  isPaused: boolean;
  activeStudyTime: number; // in seconds
  screenshotCount: number;
  wordCount: number;
  pinnedWindowName: string;
  onPauseToggle: () => void;
  onEndSession: () => void;
  focusScore?: number;
  onOpenSettings?: () => void;
}

// Format duration from seconds to HH:MM:SS
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [
    h.toString().padStart(2, "0"),
    m.toString().padStart(2, "0"),
    s.toString().padStart(2, "0")
  ].join(":");
}

export default function CaptureStatusIndicator({
  isCapturing,
  isPaused,
  activeStudyTime,
  pinnedWindowName,
  onOpenSettings,
}: CaptureStatusIndicatorProps) {
  if (!isCapturing) return null;

  return (
    <div className="sticky top-0 z-30 w-full bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-18 flex items-center justify-between">
        {/* Pinned Window Information */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold italic shrink-0">
            NN
          </div>
          <div className="min-w-0">
            <h1 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">Pinned Window</h1>
            <p className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 truncate pr-4 mt-1" title={pinnedWindowName}>
              {pinnedWindowName || "Detecting study monitor..."}
            </p>
          </div>
        </div>

        {/* Action status and timer */}
        <div className="flex items-center gap-4 md:gap-6 shrink-0">
          <div className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full border ${
            isPaused
              ? "bg-amber-50/85 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400"
              : "bg-green-50/85 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900/40 dark:text-green-400"
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isPaused ? "bg-amber-500 animate-pulse" : "bg-green-500 animate-pulse"}`}></span>
            <span className="font-bold text-xs uppercase tracking-wider hidden sm:inline">
              {isPaused ? "Paused" : "Actively Capturing"}
            </span>
            <span className="font-bold text-xs uppercase tracking-wider sm:hidden">
              {isPaused ? "Paused" : "Capturing"}
            </span>
          </div>

          <div className="text-right">
            <span className="block text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest leading-none mb-1">Active Study Time</span>
            <span className="text-xl md:text-2xl font-mono font-bold leading-none tabular-nums text-slate-800 dark:text-slate-100">
              {formatDuration(activeStudyTime)}
            </span>
          </div>

          {onOpenSettings && (
            <button
              type="button"
              id="btn-active-header-settings"
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition ml-2"
              title="Application Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Embedded focused pause banner tip */}
      {isPaused && (
        <div className="bg-amber-50/75 dark:bg-amber-950/15 border-t border-amber-200/50 dark:border-amber-900/25 py-1.5 px-4 animate-fade-in">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-[11px] text-amber-700 dark:text-amber-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>
              Slide tracking paused. Return your desktop active focus to your course windows/PDF layout to auto-resume!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
