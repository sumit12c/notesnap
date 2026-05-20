import React from "react";
import { Clock, Play, BarChart2, Coffee, Flame, Percent } from "lucide-react";
import { formatDuration } from "./CaptureStatusIndicator";

interface SessionStatsPanelProps {
  activeStudyTime: number; // seconds
  totalSessionTime: number; // seconds
  screenshotCount: number;
  wordCount: number;
  lastCaptureTime: string | null;
  focusScore: number;
  streakMinutes: number;
  isCapturing: boolean;
}

export default function SessionStatsPanel({
  activeStudyTime,
  totalSessionTime,
  screenshotCount,
  wordCount,
  lastCaptureTime,
  focusScore,
  streakMinutes,
  isCapturing,
}: SessionStatsPanelProps) {
  // Compute percentages for SVG circular chart
  const idleTime = Math.max(0, totalSessionTime - activeStudyTime);
  const activePercent = totalSessionTime > 0 ? (activeStudyTime / totalSessionTime) * 100 : 0;
  const idlePercent = totalSessionTime > 0 ? (idleTime / totalSessionTime) * 100 : 0;

  // SVG parameters for radial progress
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (activePercent / 100) * circumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Core Numbers Panel */}
      <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
        {/* Active Study Time Card */}
        <div className="p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Active Study</span>
          </div>
          <span className="block text-xl sm:text-2xl font-bold font-mono text-slate-800 dark:text-slate-100 truncate">
            {formatDuration(activeStudyTime)}
          </span>
          <span className="block text-[11px] text-slate-400 mt-1">
            Excludes paused time
          </span>
        </div>

        {/* Total Session Time Card */}
        <div className="p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
            <Coffee className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Total Time</span>
          </div>
          <span className="block text-xl sm:text-2xl font-bold font-mono text-slate-800 dark:text-slate-100 truncate">
            {formatDuration(totalSessionTime)}
          </span>
          <span className="block text-[11px] text-slate-400 mt-1">
            Running session duration
          </span>
        </div>

        {/* Focus Score */}
        <div className="p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
            <Percent className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Focus Score</span>
          </div>
          <span className="block text-xl sm:text-2xl font-bold font-mono text-slate-800 dark:text-slate-100">
            {Math.round(focusScore)}%
          </span>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-purple-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, focusScore)}%` }}
            />
          </div>
        </div>

        {/* Screenshots Taken */}
        <div className="p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition">
          <span className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">
            Screenshots
          </span>
          <span className="block text-xl sm:text-2xl font-bold font-mono text-slate-800 dark:text-slate-100">
            {screenshotCount}
          </span>
          <span className="block text-[11px] text-slate-400 mt-1">
            OCR analyses analyzed
          </span>
        </div>

        {/* Words Accumulated */}
        <div className="p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition">
          <span className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">
            Words Extracted
          </span>
          <span className="block text-xl sm:text-2xl font-bold font-mono text-slate-800 dark:text-slate-100">
            {wordCount.toLocaleString()}
          </span>
          <span className="block text-[11px] text-slate-400 mt-1">
            Chronological vocabulary
          </span>
        </div>

        {/* Longest Focus Streak */}
        <div className="p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5 text-amber-500 mb-2 font-medium text-xs uppercase tracking-wider">
            <Flame className="w-4 h-4 fill-current text-amber-500" /> Continuous Focus
          </div>
          <span className="block text-xl sm:text-2xl font-bold font-mono text-slate-800 dark:text-slate-100">
            {streakMinutes} min
          </span>
          <span className="block text-[11px] text-slate-400 mt-1">
            Current streak without pauses
          </span>
        </div>
      </div>

      {/* 2. Visual Circular Analytics Chart */}
      <div className="p-5 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
          <BarChart2 className="w-4 h-4 text-blue-500" /> Focus Ratio Analytics
        </h3>

        {totalSessionTime === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-slate-400">
            <span className="text-sm">Start your capture session</span>
            <span className="text-[11px] mt-1">Visual ratios project here</span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* SVG Circular Ring Chart */}
            <div className="relative w-28 h-28">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Ring - Idle time */}
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="12"
                  fill="transparent"
                />
                {/* Foreground Ring - Active study */}
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  className="stroke-emerald-500"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              {/* Centered Percentage */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100 font-mono">
                  {Math.round(activePercent)}%
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-semibold">
                  Study
                </span>
              </div>
            </div>

            {/* Legends */}
            <div className="text-left space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                    Active Study Time
                  </span>
                  <span className="block text-[11px] text-slate-400 font-mono">
                    {formatDuration(activeStudyTime)} ({Math.round(activePercent)}%)
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700 mt-1 shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                    Idle / Paused Time
                  </span>
                  <span className="block text-[11px] text-slate-400 font-mono">
                    {formatDuration(idleTime)} ({Math.round(idlePercent)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Informative footer recommendation */}
        {isCapturing && (
          <p className="mt-4 text-[10px] text-slate-400 italic">
            {activePercent > 80 
              ? "🔥 Outstanding deep work streak! Maintain your rhythm." 
              : activePercent < 50 
                ? "💡 Return to your study window soon to maximize stats." 
                : "⚙️ Steady progress. Remember to take a break every hour!"}
          </p>
        )}
      </div>
    </div>
  );
}
